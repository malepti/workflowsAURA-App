from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
import asyncio
import json
from app.core.config import settings

app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0",
    docs_url="/api/docs",
    openapi_url="/api/openapi.json"
)

# CORS setup for React Vite frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/v1/health")
async def health_check():
    return {
        "status": "online",
        "service": "AuraAI FastAPI Platform",
        "version": "1.0.0",
        "ollama_inference": "ready"
    }

@app.post("/api/v1/chat/stream")
async def stream_chat_response(prompt: str, model_id: str = "llama-3-3-70b", execution_mode: str = "byok"):
    """
    Server-Sent Events (SSE) streaming endpoint for AI responses.
    Demonstrates provider adapter routing to OpenAI, Gemini, Claude, or local Ollama.
    """
    async def event_generator():
        yield f"data: {json.dumps({'type': 'start', 'model': model_id, 'mode': execution_mode})}\n\n"
        chunks = [
            f"Analyzing request with **{model_id}** via {execution_mode}...\n\n",
            "AuraAI multi-provider adapter layer has routed your prompt successfully.\n",
            "1. **Execution isolation**: Enforced on server.\n",
            "2. **Ledger balance**: Reconciled.\n\n",
            "Here is your generated response stream."
        ]
        for c in chunks:
            await asyncio.sleep(0.08)
            yield f"data: {json.dumps({'type': 'chunk', 'content': c})}\n\n"
        yield f"data: {json.dumps({'type': 'done', 'tokens': 85})}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")

@app.get("/api/v1/models")
async def list_models():
    return [
        {"id": "gemini-2.5-flash", "name": "Gemini 2.5 Flash", "provider": "google", "credits": 2},
        {"id": "gpt-4o", "name": "GPT-4o", "provider": "openai", "credits": 4},
        {"id": "llama-3-3-70b", "name": "Llama 3.3 70B", "provider": "ollama", "credits": 3, "is_local": True},
        {"id": "deepseek-r1-distill", "name": "DeepSeek R1", "provider": "ollama", "credits": 3, "is_local": True}
    ]

@app.get("/api/v1/credits/balance")
async def get_credit_balance():
    return {"balance": 250, "monthly_quota": 250, "user": "Rupasree Kamineni"}
