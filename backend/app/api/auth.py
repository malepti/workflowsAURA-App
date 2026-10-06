import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
import secrets

from app.core.database import get_db
from app.core.redis_client import redis_client
from app.core.security import get_password_hash, verify_password
from app.models.all_models import User, CreditAccount
from app.schemas.all_schemas import UserCreate, UserResponse

router = APIRouter()

class LoginRequest(BaseModel):
    email: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"

@router.post("/signup", response_model=UserResponse)
async def signup(user_in: UserCreate, db: AsyncSession = Depends(get_db)):
    try:
        # Check if user exists
        result = await db.execute(select(User).where(User.email == user_in.email))
        if result.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="Email already registered")
            
        hashed_pw = get_password_hash(user_in.password[:72])
        
        user_id = str(uuid.uuid4())
        # Create User
        new_user = User(
            id=user_id,
            email=user_in.email,
            hashed_password=hashed_pw,
            full_name=user_in.full_name,
            role="user"
        )
        db.add(new_user)
        
        # Give initial free credits
        credits_account = CreditAccount(
            id=str(uuid.uuid4()),
            user_id=user_id,
            balance=250
        )
        db.add(credits_account)
        
        await db.commit()
        await db.refresh(new_user)
        
        return new_user
    except HTTPException:
        raise
    except Exception as e:
        print(f"Signup exception: {e}")
        raise HTTPException(status_code=500, detail=f"Signup error: {str(e)}")



@router.post("/login", response_model=TokenResponse)
async def login(credentials: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == credentials.email))
    user = result.scalar_one_or_none()
    
    if user is None or not user.hashed_password:
        raise HTTPException(status_code=401, detail="Invalid email or password")
        
    if not verify_password(credentials.password, str(user.hashed_password)):
        raise HTTPException(status_code=401, detail="Invalid email or password")
        
    # Generate Session Token
    token = secrets.token_urlsafe(32)
    session_key = f"session:{token}"
    
    # Save to Redis (valid for 7 days)
    await redis_client.set(session_key, str(user.id), ex=60 * 60 * 24 * 7)
    
    return TokenResponse(access_token=token)

@router.post("/logout")
async def logout(authorization: str = Depends(lambda req: req.headers.get("Authorization", ""))):
    if authorization and authorization.startswith("Bearer "):
        token = authorization.replace("Bearer ", "")
        await redis_client.delete(f"session:{token}")
    return {"message": "Logged out successfully"}
