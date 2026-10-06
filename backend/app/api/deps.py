import uuid
from fastapi import Depends, HTTPException, status, Header
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional
from datetime import datetime
from app.core.database import get_db
from app.core.redis_client import redis_client
from app.models.all_models import User, DeveloperApiKey, CreditAccount

async def get_current_user(
    authorization: Optional[str] = Header(None),
    x_api_key: Optional[str] = Header(None, alias="x-api-key"),
    db: AsyncSession = Depends(get_db)
) -> User:
    token = None
    if authorization and authorization.startswith("Bearer "):
        token = authorization.replace("Bearer ", "").strip()
    elif x_api_key:
        token = x_api_key.strip()

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid authentication token"
        )
    
    if token.startswith("sk-aura-"):
        # Authenticate via Developer API Key
        result = await db.execute(
            select(DeveloperApiKey).where(
                DeveloperApiKey.api_key == token,
                DeveloperApiKey.is_active == True
            )
        )
        dev_key = result.scalar_one_or_none()
        if not dev_key:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or revoked AuraAI Developer API key"
            )
        
        dev_key.last_used_at = datetime.utcnow()
        await db.commit()

        user_result = await db.execute(select(User).where(User.id == dev_key.user_id))
        user = user_result.scalar_one_or_none()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User associated with API key not found"
            )
        return user

    # Authenticate via Session token (Redis)
    session_key = f"session:{token}"
    user_id = await redis_client.get(session_key)
    
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session expired or invalid token"
        )
    
    await redis_client.expire(session_key, 60 * 60 * 24)

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
        
    return user

async def get_current_user_optional(
    authorization: Optional[str] = Header(None),
    x_api_key: Optional[str] = Header(None, alias="x-api-key"),
    db: AsyncSession = Depends(get_db)
) -> User:
    try:
        return await get_current_user(authorization, x_api_key, db)
    except Exception:
        # Fallback to default guest user
        result = await db.execute(select(User).where(User.id == "guest_user_default"))
        guest = result.scalar_one_or_none()
        if not guest:
            guest = User(
                id="guest_user_default",
                email="guest@auraai.dev",
                full_name="Guest User",
                role="user"
            )
            db.add(guest)
            credits_account = CreditAccount(
                id=str(uuid.uuid4()),
                user_id="guest_user_default",
                balance=1000.0
            )
            db.add(credits_account)
            await db.commit()
            await db.refresh(guest)
        return guest

