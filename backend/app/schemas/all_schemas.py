from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

# Auth & User schemas
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str

class UserResponse(BaseModel):
    id: str
    email: str
    full_name: str
    role: str
    plan: Optional[str] = "free"
    avatar_url: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

# Chat & Message schemas
class MessageInput(BaseModel):
    conversation_id: Optional[str] = None
    prompt: str
    model_id: str
    execution_mode: str = "byok" # 'byok' or 'platform_managed'
    attachments: Optional[List[Dict[str, Any]]] = []

class MessageOutput(BaseModel):
    id: str
    role: str
    content: str
    timestamp: str
    model_used: Optional[str] = None
    execution_mode: Optional[str] = None
    credits_consumed: int = 0
    tokens: Optional[Dict[str, int]] = None

# Model Registry
class ModelCreate(BaseModel):
    id: str
    name: str
    provider_id: str
    description: str
    context_window: str
    credits_per_request: int
    is_local: bool = False
    is_online: bool = True
    capabilities: Dict[str, bool]

# API Key
class ApiKeyAddRequest(BaseModel):
    provider: str
    raw_key: str
    display_name: Optional[str] = None

class ApiKeyResponse(BaseModel):
    id: str
    provider: str
    display_name: Optional[str] = None
    key_masked: str
    is_active: bool
    is_valid: bool
    last_tested_at: Optional[datetime]

# Credits & Subscriptions
class TopUpRequest(BaseModel):
    credits: int
    price_usd: float

class AdminCreditAdjustment(BaseModel):
    user_email: str
    amount: int
    reason: str
