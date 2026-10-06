import secrets
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.all_models import User, DeveloperApiKey

router = APIRouter()

class DeveloperKeyCreate(BaseModel):
    name: str

class DeveloperKeyResponse(BaseModel):
    id: str
    name: str
    apiKey: Optional[str] = None
    keyMasked: str
    isActive: bool
    createdAt: str
    lastUsedAt: Optional[str] = None

@router.get("", response_model=List[DeveloperKeyResponse])
async def list_developer_keys(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(DeveloperApiKey)
        .where(DeveloperApiKey.user_id == current_user.id)
        .order_by(DeveloperApiKey.created_at.desc())
    )
    keys = result.scalars().all()
    return [
        DeveloperKeyResponse(
            id=k.id,
            name=k.name,
            keyMasked=k.key_masked,
            isActive=k.is_active,
            createdAt=k.created_at.isoformat(),
            lastUsedAt=k.last_used_at.isoformat() if k.last_used_at else None
        ) for k in keys
    ]

@router.post("", response_model=DeveloperKeyResponse)
async def create_developer_key(
    key_in: DeveloperKeyCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    raw_key = f"sk-aura-{secrets.token_hex(20)}"
    masked = f"sk-aura-...{raw_key[-4:]}"

    new_key = DeveloperApiKey(
        user_id=current_user.id,
        name=key_in.name,
        api_key=raw_key,
        key_masked=masked,
        is_active=True
    )
    db.add(new_key)
    await db.commit()
    await db.refresh(new_key)

    return DeveloperKeyResponse(
        id=new_key.id,
        name=new_key.name,
        apiKey=raw_key,
        keyMasked=new_key.key_masked,
        isActive=new_key.is_active,
        createdAt=new_key.created_at.isoformat(),
        lastUsedAt=None
    )

@router.delete("/{key_id}")
async def revoke_developer_key(
    key_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(DeveloperApiKey).where(
            DeveloperApiKey.id == key_id,
            DeveloperApiKey.user_id == current_user.id
        )
    )
    key_obj = result.scalar_one_or_none()
    if not key_obj:
        raise HTTPException(status_code=404, detail="Key not found")

    await db.delete(key_obj)
    await db.commit()
    return {"success": True, "message": "Key revoked successfully"}
