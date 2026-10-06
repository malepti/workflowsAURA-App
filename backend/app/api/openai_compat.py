import json
import time
import math
import uuid
import httpx
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse, JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional, List, Any, Dict, Union
from pydantic import BaseModel, Field
from google import genai

from app.core.config import settings
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.all_models import User, CreditAccount, CreditLedgerEntry

router = APIRouter()

def resolve_ollama_model(model_name: str) -> str:
    m = model_name.lower()
    if "qwen" in m:
        return "qwen2.5-coder:32b"
    elif "llama" in m:
        return "llama3"
    elif "deepseek" in m:
        return "deepseek-r1:8b"
    return model_name


class MessageItem(BaseModel):
    role: str
    content: Union[str, List[Any]]

class ChatCompletionRequest(BaseModel):
    model: str = "qwen2.5-coder:32b"
    messages: List[MessageItem]
    stream: Optional[bool] = False
    temperature: Optional[float] = 0.7
    top_p: Optional[float] = 1.0
    max_tokens: Optional[int] = None

@router.get("/models")
async def list_openai_models():
    return {
        "object": "list",
        "data": [
            {
                "id": "qwen2.5-coder:32b",
                "object": "model",
                "created": 1700000000,
                "owned_by": "auraai-local"
            },
            {
                "id": "llama-3-3-70b",
                "object": "model",
                "created": 1700000000,
                "owned_by": "auraai-local"
            },
            {
                "id": "gemini-2.5-flash",
                "object": "model",
                "created": 1700000000,
                "owned_by": "google"
            }
        ]
    }

from app.core.cache import prompt_cache
from app.core.context_optimizer import context_optimizer

@router.post("/chat/completions")
async def create_chat_completion(
    request: ChatCompletionRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Convert messages list to prompt string
    prompt_content = ""
    for msg in request.messages:
        role = msg.role.capitalize()
        content = msg.content if isinstance(msg.content, str) else str(msg.content)
        prompt_content += f"{role}: {content}\n"

    # Check Semantic Cache for Instant 0-Cost Cache Hit
    cached_reply = await prompt_cache.get_cached_response(prompt_content, request.model)
    if cached_reply:
        created_ts = int(time.time())
        cmp_id = f"chatcmpl-cached-{uuid.uuid4().hex[:8]}"
        if request.stream:
            async def cache_stream():
                chunk_payload = {
                    "id": cmp_id,
                    "object": "chat.completion.chunk",
                    "created": created_ts,
                    "model": request.model,
                    "choices": [{"index": 0, "delta": {"content": f"⚡ [Instant Cache Hit • 0 Tokens Billed]\n\n{cached_reply}"}, "finish_reason": "stop"}]
                }
                yield f"data: {json.dumps(chunk_payload)}\n\n"
                yield "data: [DONE]\n\n"
            return StreamingResponse(cache_stream(), media_type="text/event-stream")
        else:
            return {
                "id": cmp_id,
                "object": "chat.completion",
                "created": created_ts,
                "model": request.model,
                "choices": [{
                    "index": 0,
                    "message": {"role": "assistant", "content": f"⚡ [Instant Cache Hit • 0 Tokens Billed]\n\n{cached_reply}"},
                    "finish_reason": "stop"
                }],
                "usage": {"prompt_tokens": 0, "completion_tokens": 0, "total_tokens": 0}
            }

    # 1. Fetch & Verify Credits
    result = await db.execute(select(CreditAccount).where(CreditAccount.user_id == current_user.id))
    credit_account = result.scalar_one_or_none()
    if not credit_account or credit_account.balance <= 0:
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail="Insufficient credits balance to complete request."
        )


    # Convert messages list to prompt string / history for LLM
    prompt_content = ""
    for msg in request.messages:
        role = msg.role.capitalize()
        content = msg.content if isinstance(msg.content, str) else str(msg.content)
        prompt_content += f"{role}: {content}\n"

    prompt_tokens = math.ceil(len(prompt_content) / 4) + 10
    created_timestamp = int(time.time())
    completion_id = f"chatcmpl-{uuid.uuid4().hex[:12]}"

    is_local_ollama = request.model in ["qwen2.5-coder:32b", "qwen-2-5-coder-32b", "llama-3-3-70b", "llama3", "deepseek-r1-distill"]

    if request.stream:
        async def stream_generator():
            full_response = ""
            try:
                if is_local_ollama:
                    ollama_model_tag = "qwen2.5-coder:32b" if "qwen" in request.model else "llama3"
                    async with httpx.AsyncClient() as client:
                        ollama_req = {
                            "model": ollama_model_tag,
                            "prompt": prompt_content,
                            "stream": True
                        }
                        async with client.stream('POST', f"{settings.OLLAMA_BASE_URL}/api/generate", json=ollama_req, timeout=60.0) as r:
                            if r.status_code != 200:
                                chunk_payload = {
                                    "id": completion_id,
                                    "object": "chat.completion.chunk",
                                    "created": created_timestamp,
                                    "model": request.model,
                                    "choices": [{"index": 0, "delta": {"content": f"[Error: Ollama returned status {r.status_code}]"}, "finish_reason": "error"}]
                                }
                                yield f"data: {json.dumps(chunk_payload)}\n\n"
                            else:
                                async for line in r.aiter_lines():
                                    if line:
                                        data = json.loads(line)
                                        chunk = data.get("response", "")
                                        full_response += chunk
                                        chunk_payload = {
                                            "id": completion_id,
                                            "object": "chat.completion.chunk",
                                            "created": created_timestamp,
                                            "model": request.model,
                                            "choices": [{"index": 0, "delta": {"content": chunk}, "finish_reason": None}]
                                        }
                                        yield f"data: {json.dumps(chunk_payload)}\n\n"
                elif request.model.startswith("gemini"):
                    if not settings.GEMINI_API_KEY:
                        chunk_payload = {
                            "id": completion_id,
                            "object": "chat.completion.chunk",
                            "created": created_timestamp,
                            "model": request.model,
                            "choices": [{"index": 0, "delta": {"content": "[Error: Server GEMINI_API_KEY not configured]"}, "finish_reason": "error"}]
                        }
                        yield f"data: {json.dumps(chunk_payload)}\n\n"
                    else:
                        client = genai.Client(api_key=settings.GEMINI_API_KEY)
                        response = await client.aio.models.generate_content_stream(
                            model=request.model,
                            contents=prompt_content,
                        )
                        async for chunk in response:
                            text = chunk.text or ""
                            full_response += text
                            chunk_payload = {
                                "id": completion_id,
                                "object": "chat.completion.chunk",
                                "created": created_timestamp,
                                "model": request.model,
                                "choices": [{"index": 0, "delta": {"content": text}, "finish_reason": None}]
                            }
                            yield f"data: {json.dumps(chunk_payload)}\n\n"
            except Exception as e:
                chunk_payload = {
                    "id": completion_id,
                    "object": "chat.completion.chunk",
                    "created": created_timestamp,
                    "model": request.model,
                    "choices": [{"index": 0, "delta": {"content": f"\n[Error: {str(e)}]"}, "finish_reason": "error"}]
                }
                yield f"data: {json.dumps(chunk_payload)}\n\n"

            # Final Chunk & Billing
            completion_tokens = math.ceil(len(full_response) / 4)
            total_tokens = prompt_tokens + completion_tokens
            credits_cost = max(0.01, (total_tokens / 1000000.0) * 250.0)

            credit_account.balance -= credits_cost
            db.add(CreditLedgerEntry(
                user_id=current_user.id,
                amount=-credits_cost,
                category="inference",
                model_id=request.model,
                balance_after=credit_account.balance,
                audit_reason=f"OpenAI API Completion ({total_tokens} tokens)"
            ))
            await db.commit()

            final_chunk = {
                "id": completion_id,
                "object": "chat.completion.chunk",
                "created": created_timestamp,
                "model": request.model,
                "choices": [{"index": 0, "delta": {}, "finish_reason": "stop"}]
            }
            yield f"data: {json.dumps(final_chunk)}\n\n"
            yield "data: [DONE]\n\n"

        return StreamingResponse(stream_generator(), media_type="text/event-stream")

    else:
        # Non-streaming call
        full_response = ""
        try:
            if is_local_ollama:
                ollama_model_tag = resolve_ollama_model(request.model)
                async with httpx.AsyncClient() as client:
                    resp = await client.post(
                        f"{settings.OLLAMA_BASE_URL}/api/generate",
                        json={"model": ollama_model_tag, "prompt": prompt_content, "stream": False},
                        timeout=60.0
                    )
                    if resp.status_code == 200:
                        full_response = resp.json().get("response", "")
                    elif resp.status_code == 404:
                        full_response = f"[Error: Ollama model '{ollama_model_tag}' not found. Please run 'ollama pull {ollama_model_tag}']"
                    else:
                        full_response = f"[Error: Ollama API status {resp.status_code}]"


            elif request.model.startswith("gemini") and settings.GEMINI_API_KEY:
                client = genai.Client(api_key=settings.GEMINI_API_KEY)
                resp = await client.aio.models.generate_content(
                    model=request.model,
                    contents=prompt_content
                )
                full_response = resp.text or ""
            else:
                full_response = f"Echo response for model {request.model}"
        except Exception as e:
            full_response = f"[Error: {str(e)}]"

        completion_tokens = math.ceil(len(full_response) / 4)
        total_tokens = prompt_tokens + completion_tokens
        credits_cost = max(0.01, (total_tokens / 1000000.0) * 250.0)

        credit_account.balance -= credits_cost
        db.add(CreditLedgerEntry(
            user_id=current_user.id,
            amount=-credits_cost,
            category="inference",
            model_id=request.model,
            balance_after=credit_account.balance,
            audit_reason=f"OpenAI API Completion ({total_tokens} tokens)"
        ))
        await db.commit()

        return {
            "id": completion_id,
            "object": "chat.completion",
            "created": created_timestamp,
            "model": request.model,
            "choices": [
                {
                    "index": 0,
                    "message": {
                        "role": "assistant",
                        "content": full_response
                    },
                    "finish_reason": "stop"
                }
            ],
            "usage": {
                "prompt_tokens": prompt_tokens,
                "completion_tokens": completion_tokens,
                "total_tokens": total_tokens
            }
        }
