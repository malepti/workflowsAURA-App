from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.all_models import User, Conversation, EncryptedApiKey, CreditLedgerEntry, CreditAccount, GeneratedImage, DeveloperApiKey

router = APIRouter()

@router.get("/sync")
async def sync_app_state(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Fetch User Credit Balance
    result = await db.execute(select(CreditAccount).where(CreditAccount.user_id == current_user.id))
    credit_account = result.scalar_one_or_none()
    balance = credit_account.balance if credit_account else 0

    # Fetch User Conversations with Messages
    result = await db.execute(
        select(Conversation)
        .options(selectinload(Conversation.messages))
        .where(Conversation.user_id == current_user.id)
    )
    conversations = result.scalars().all()
    
    # Fetch User API Keys
    result = await db.execute(select(EncryptedApiKey).where(EncryptedApiKey.user_id == current_user.id))
    api_keys = result.scalars().all()
    
    # Fetch Developer API Keys
    result = await db.execute(select(DeveloperApiKey).where(DeveloperApiKey.user_id == current_user.id))
    dev_keys = result.scalars().all()

    # Fetch Credit Ledger
    result = await db.execute(select(CreditLedgerEntry).where(CreditLedgerEntry.user_id == current_user.id))
    transactions = result.scalars().all()


    # Hardcoded Platform Models (Could be moved to DB later)
    models = [
        {
            "id": "gemini-2.5-flash",
            "name": "Gemini 2.5 Flash",
            "provider": "google",
            "providerName": "Google Gemini",
            "description": "Ultra-fast multimodal model with 1M context window.",
            "contextWindow": "1M tokens",
            "creditsPerRequest": 250,
            "estimatedCostUsd": 0.0004,
            "isLocal": False,
            "isOnline": True,
            "status": "active",
            "capabilities": {"code": True, "vision": True, "reasoning": True, "webSearch": True, "functionCalling": True},
            "allowedPlans": ["free", "plus", "pro", "enterprise"],
            "latencyMs": 140,
            "badge": "Recommended"
        },
        {
            "id": "qwen2.5-coder:32b",
            "name": "Qwen 2.5 Coder 32B",
            "provider": "ollama",
            "providerName": "Local NVLink Cluster",
            "description": "State-of-the-art open-source coding model running locally.",
            "contextWindow": "32k tokens",
            "creditsPerRequest": 250,
            "estimatedCostUsd": 0.00,
            "isLocal": True,
            "isOnline": True,
            "status": "active",
            "capabilities": {"code": True, "vision": False, "reasoning": True, "webSearch": False, "functionCalling": True},
            "allowedPlans": ["free", "plus", "pro", "enterprise"],
            "latencyMs": 90,
            "badge": "Fastest"
        }
    ]

    return {
        "user": {
            "id": current_user.id,
            "name": current_user.full_name,
            "email": current_user.email,
            "avatarUrl": current_user.avatar_url or "https://ui-avatars.com/api/?name=" + current_user.full_name,
            "role": current_user.role,
            "plan": "free",
            "totalCredits": balance,
            "monthlyCreditQuota": 250
        },
        "models": models,
        "conversations": [
            {
                "id": c.id,
                "title": c.title,
                "modelId": c.model_id,
                "executionMode": c.execution_mode,
                "isPinned": c.is_pinned,
                "isArchived": c.is_archived,
                "category": "today",
                "updatedAt": c.updated_at.isoformat(),
                "messages": [
                    {
                        "id": m.id,
                        "role": m.role,
                        "content": m.content,
                        "timestamp": m.created_at.strftime("%I:%M %p"),
                        "modelUsed": m.model_used,
                        "executionMode": m.execution_mode,
                        "creditsConsumed": m.credits_consumed,
                        "tokensUsed": {
                            "prompt": m.tokens_prompt,
                            "completion": m.tokens_completion,
                            "total": m.tokens_prompt + m.tokens_completion
                        }
                    } for m in sorted(c.messages, key=lambda x: x.created_at)
                ]
            } for c in conversations
        ],
        "apiKeys": [
            {
                "id": k.id,
                "provider": k.provider_id,
                "displayName": k.display_name,
                "keyMasked": k.key_masked,
                "isActive": k.is_active,
                "isValid": k.is_valid
            } for k in api_keys
        ],
        "developerApiKeys": [
            {
                "id": k.id,
                "name": k.name,
                "keyMasked": k.key_masked,
                "isActive": k.is_active,
                "createdAt": k.created_at.isoformat(),
                "lastUsedAt": k.last_used_at.isoformat() if k.last_used_at else None
            } for k in dev_keys
        ],

        "creditTransactions": [
            {
                "id": t.id,
                "amount": t.amount,
                "category": t.category or "inference",
                "modelId": t.model_id or "qwen2.5-coder:32b",
                "description": t.audit_reason or f"Credit adjustment ({t.category})",
                "auditReason": t.audit_reason,
                "balanceAfter": round(t.balance_after, 4) if t.balance_after is not None else 0.0,
                "timestamp": t.created_at.strftime("%b %d, %Y %I:%M %p"),
                "status": "completed"
            } for t in transactions
        ]
    }



from pydantic import BaseModel

class DeductRequest(BaseModel):
    amount: float
    description: str
    modelId: str = "image-generation"

@router.post("/credits/deduct")
async def deduct_credits_api(
    request: DeductRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(CreditAccount).where(CreditAccount.user_id == current_user.id))
    credit_account = result.scalar_one_or_none()
    
    if not credit_account or credit_account.balance < request.amount:
        return {"success": False, "error": "Insufficient credits"}
        
    credit_account.balance -= request.amount
    
    ledger = CreditLedgerEntry(
        user_id=current_user.id,
        amount=-request.amount,
        category="image_gen" if "Image" in request.description else "inference",
        model_id=request.modelId,
        balance_after=credit_account.balance,
        audit_reason=request.description
    )
    db.add(ledger)
    await db.commit()
    
    return {"success": True, "newBalance": credit_account.balance}

class ImageSaveRequest(BaseModel):
    id: str
    url: str
    prompt: str
    aspectRatio: str

@router.post("/images")
async def save_generated_image(
    request: ImageSaveRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    new_image = GeneratedImage(
        id=request.id,
        user_id=current_user.id,
        url=request.url,
        prompt=request.prompt,
        aspect_ratio=request.aspectRatio
    )
    db.add(new_image)
    await db.commit()
    return {"success": True}

@router.get("/images")
async def get_generated_images(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(GeneratedImage)
        .where(GeneratedImage.user_id == current_user.id)
        .order_by(GeneratedImage.created_at.desc())
    )
    images = result.scalars().all()
    return [
        {
            "id": img.id,
            "url": img.url,
            "prompt": img.prompt,
            "aspectRatio": img.aspect_ratio,
            "timestamp": img.created_at.isoformat()
        } for img in images
    ]

