from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
import asyncio
import json
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.config import settings
from app.api.auth import router as auth_router
from app.api.deps import get_current_user
from app.models.all_models import User, CreditAccount
from app.core.database import get_db
from app.api.sync import router as sync_router
from app.api.chat import router as chat_router
from app.api.code import router as code_router
from app.api.developer_keys import router as developer_keys_router
from app.api.openai_compat import router as openai_compat_router
from app.api.langflow_proxy import router as langflow_router
from pydantic import BaseModel
from typing import Optional, List, Any

class ChatRequest(BaseModel):
    prompt: str
    modelId: str = "llama-3-3-70b"
    executionMode: str = "byok"
    enableWebSearch: bool = False
    attachments: Optional[List[Any]] = None

app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0",
    docs_url="/api/docs",
    openapi_url="/api/openapi.json"
)

@app.on_event("startup")
async def on_startup():
    from app.core.database import engine, Base
    from app.models import all_models
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)




# CORS setup for React Vite frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(sync_router, prefix="/api/v1", tags=["sync"])
app.include_router(chat_router, prefix="/api/v1/chat", tags=["chat"])
app.include_router(code_router, prefix="/api/v1/code", tags=["code"])
app.include_router(developer_keys_router, prefix="/api/v1/developer-keys", tags=["developer-keys"])
app.include_router(langflow_router, prefix="/api/v1/langflow", tags=["langflow-proxy"])
app.include_router(openai_compat_router, prefix="/v1", tags=["openai-compat"])
app.include_router(openai_compat_router, prefix="/api/v1/openai", tags=["openai-compat-alt"])


@app.get("/api/v1/health")
async def health_check():
    return {
        "status": "online",
        "service": "AuraAI FastAPI Platform",
        "version": "1.0.0",
        "ollama_inference": "ready"
    }

@app.get("/api/v1/models")
async def list_models():
    return [
        {"id": "gemini-2.5-flash", "name": "Gemini 2.5 Flash", "provider": "google", "credits": 2},
        {"id": "qwen2.5-coder:3b", "name": "Qwen 2.5 Coder", "provider": "ollama", "credits": 3, "is_local": True},
        {"id": "gpt-4o", "name": "GPT-4o", "provider": "openai", "credits": 4},
        {"id": "llama-3-3-70b", "name": "Llama 3.3 70B", "provider": "ollama", "credits": 3, "is_local": True},
        {"id": "deepseek-r1-distill", "name": "DeepSeek R1", "provider": "ollama", "credits": 3, "is_local": True}
    ]

@app.get("/api/v1/credits/balance")
async def get_credit_balance(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(CreditAccount).where(CreditAccount.user_id == current_user.id))
    credit_account = result.scalar_one_or_none()
    balance = credit_account.balance if credit_account else 0
    
    return {
        "balance": balance, 
        "monthly_quota": 250, 
        "user": current_user.full_name,
        "email": current_user.email
    }
