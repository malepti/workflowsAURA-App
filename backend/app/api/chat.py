import json
import asyncio
import httpx
import time
import math
import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional, List, Any
from pydantic import BaseModel
from google import genai

from app.core.config import settings
from app.core.database import get_db
from app.api.deps import get_current_user_optional
from app.models.all_models import User, Conversation, Message, CreditAccount, CreditLedgerEntry, EncryptedApiKey

router = APIRouter()

class ChatRequest(BaseModel):
    prompt: str
    conversationId: str
    modelId: str = "llama-3-3-70b"
    executionMode: str = "byok"
    enableWebSearch: bool = False
    attachments: Optional[List[Any]] = None

from app.core.cache import prompt_cache
from app.core.context_optimizer import context_optimizer
from app.core.router import model_router

@router.post("/stream")
async def stream_chat_response(
    request: ChatRequest,
    current_user: User = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db)
):
    # Check Semantic Cache for Instant 0-Credit Response
    cached_reply = await prompt_cache.get_cached_response(request.prompt, request.modelId)
    if cached_reply:
        async def cache_generator():
            yield f"data: {json.dumps({'type': 'start', 'model': request.modelId, 'mode': request.executionMode, 'cacheHit': True})}\n\n"
            yield f"data: {json.dumps({'type': 'chunk', 'content': '⚡ [Instant Response Cache Hit • 0 Tokens/Credits Billed]\n\n'})}\n\n"
            for word in cached_reply.split(" "):
                yield f"data: {json.dumps({'type': 'chunk', 'content': word + ' '})}\n\n"
                await asyncio.sleep(0.01)
            yield f"data: {json.dumps({'type': 'done', 'tokens': 0})}\n\n"
        return StreamingResponse(cache_generator(), media_type="text/event-stream")

    # 1. Fetch / Validate Credits
    result = await db.execute(select(CreditAccount).where(CreditAccount.user_id == current_user.id))
    credit_account = result.scalar_one_or_none()
    if not credit_account:
        raise HTTPException(status_code=400, detail="Credit account not found")

    if request.executionMode == "platform_managed" and credit_account.balance <= 0:
        raise HTTPException(status_code=402, detail="Insufficient credits")


    # 2. Ensure Conversation Exists
    result = await db.execute(select(Conversation).where(Conversation.id == request.conversationId))
    conversation = result.scalar_one_or_none()
    if not conversation:
        conversation = Conversation(
            id=request.conversationId,
            user_id=current_user.id,
            title=request.prompt[:36] + "..." if len(request.prompt) > 36 else request.prompt,
            model_id=request.modelId,
            execution_mode=request.executionMode
        )
        db.add(conversation)
        await db.commit()

    # 3. Save User Message
    user_msg = Message(
        conversation_id=conversation.id,
        role="user",
        content=request.prompt,
        model_used=request.modelId,
        execution_mode=request.executionMode,
        tokens_prompt=math.ceil(len(request.prompt) / 4) + 12
    )
    db.add(user_msg)
    await db.commit()

    async def event_generator():
        yield f"data: {json.dumps({'type': 'start', 'model': request.modelId, 'mode': request.executionMode})}\n\n"
        
        full_response = ""
        is_local_ollama = request.modelId in ["qwen-2-5-coder-32b", "llama-3-3-70b", "deepseek-r1-distill"]
        
        system_instruction = (
            "System Instruction: You are an expert AI coding assistant. "
            "If the user asks you to write code, you MUST write it in the programming language they specify. "
            "If they DO NOT specify a language (and it is not obvious from context), you MUST KEEP THE HUMAN IN THE LOOP "
            "by asking them which language they prefer (e.g., Python, Java, C++, TypeScript) before generating any code. "
            "Do not assume a language if it's ambiguous.\n"
            "HOWEVER, if the user explicitly asks to generate a chart or graph (e.g., bar chart, line chart, pie chart, scatter plot, area chart), DO NOT ask for a programming language. "
            "Instead, you MUST output a raw JSON block surrounded by ```json_chart ... ``` containing the chart data to be rendered inline. "
            'The JSON object MUST have a "type" (one of: "bar", "line", "pie", "scatter", "area") and "data" (an array of objects). '
            'Example:\n```json_chart\n{"type": "bar", "data": [{"name": "2000s", "population": 6000000000}, {"name": "2010s", "population": 7000000000}]}\n```\n\n'
        )
        
        # Live Web Search Grounding
        from app.services.web_search import should_trigger_search, perform_web_search
        needs_search = should_trigger_search(request.prompt, request.enableWebSearch)
        if needs_search:
            search_results = await perform_web_search(request.prompt)
            if search_results:
                system_instruction += (
                    f"\n\n[LIVE WEB SEARCH DATA RETRIEVED AT {time.strftime('%Y-%m-%d %H:%M:%S UTC')}]:\n"
                    f"{search_results}\n\n"
                    "INSTRUCTION: Use the above live web search data to provide a detailed, accurate response to the user's prompt. "
                    "Do NOT claim that you lack real-time access when search data is provided above.\n"
                )

        augmented_prompt = system_instruction + "User Prompt: " + request.prompt

        try:
            if is_local_ollama:
                # Actual LLM Connection to Ollama
                async with httpx.AsyncClient() as client:
                    ollama_req = {
                        "model": request.modelId.replace("llama-3-3-70b", "llama3"), # Map UI id to ollama model tag
                        "prompt": augmented_prompt,
                        "stream": True
                    }
                    if request.modelId == "qwen-2-5-coder-32b":
                        ollama_req["model"] = "qwen2.5-coder:32b"
                        
                    async with client.stream('POST', 'http://127.0.0.1:11434/api/generate', json=ollama_req, timeout=30.0) as r:
                        if r.status_code != 200:
                            yield f"data: {json.dumps({'type': 'chunk', 'content': f'\\n\\n[Error: Ollama API returned status {r.status_code}. Make sure Ollama is running!]'})}\n\n"
                        else:
                            async for line in r.aiter_lines():
                                if line:
                                    data = json.loads(line)
                                    chunk = data.get("response", "")
                                    full_response += chunk
                                    yield f"data: {json.dumps({'type': 'chunk', 'content': chunk})}\n\n"
                                    await asyncio.sleep(0.01)
            elif request.modelId.startswith("gemini"):
                # 1. Check if user saved a BYOK key in database
                user_key = None
                if current_user and current_user.id != "guest_user_default":
                    try:
                        key_res = await db.execute(
                            select(EncryptedApiKey).where(
                                EncryptedApiKey.user_id == current_user.id,
                                EncryptedApiKey.provider.ilike("%gemini%")
                            )
                        )
                        key_obj = key_res.scalar_one_or_none()
                        if key_obj and key_obj.encrypted_key:
                            from app.core.security import decrypt_key
                            user_key = decrypt_key(key_obj.encrypted_key)
                    except Exception as ke:
                        print(f"BYOK Key decryption note: {ke}")

                active_gemini_key = user_key or settings.GEMINI_API_KEY

                if not active_gemini_key:
                    error_msg = "🔑 [Gemini API Key Required]: Please add your Gemini API Key in the 'API Keys (BYOK)' manager tab to start chatting with Gemini models."
                    yield f"data: {json.dumps({'type': 'chunk', 'content': error_msg})}\n\n"
                    full_response += error_msg
                else:
                    client = genai.Client(api_key=active_gemini_key)
                    from google.genai import types
                    config = None
                    if needs_search:
                        config = types.GenerateContentConfig(tools=[{"google_search": {}}])

                    # Model tag resolution with fallback support
                    models_to_try = [request.modelId, "gemini-2.5-flash", "gemini-1.5-flash", "gemini-2.0-flash"]
                    gemini_success = False

                    for target_model in models_to_try:
                        if gemini_success:
                            break
                        try:
                            response = await client.aio.models.generate_content_stream(
                                model=target_model,
                                contents=augmented_prompt,
                                config=config
                            )
                            async for chunk in response:
                                text = chunk.text
                                if text:
                                    full_response += text
                                    yield f"data: {json.dumps({'type': 'chunk', 'content': text})}\n\n"
                                    await asyncio.sleep(0.01)
                            gemini_success = True
                        except Exception as ge:
                            # If model tag error, try fallback model in list
                            if "404" in str(ge) or "NOT_FOUND" in str(ge):
                                continue
                            else:
                                err_str = f"\n\n[Gemini API Error]: {str(ge)}"
                                yield f"data: {json.dumps({'type': 'chunk', 'content': err_str})}\n\n"
                                full_response += err_str
                                gemini_success = True

                    if not gemini_success:
                        err_str = "\n\n[Gemini Error]: All Gemini model tags were unavailable. Please verify API key permissions."
                        yield f"data: {json.dumps({'type': 'chunk', 'content': err_str})}\n\n"
                        full_response += err_str
            else:
                # Simulated connection for other Cloud APIs (OpenAI)
                yield f"data: {json.dumps({'type': 'chunk', 'content': f'Simulating connection to {request.modelId} API...\\n\\n'})}\n\n"
                await asyncio.sleep(0.5)
                simulated_reply = f"This is a response generated by the {request.modelId} integration. In production, this branch uses `openai.AsyncOpenAI` or `google.generativeai` with your BYOK key."
                for word in simulated_reply.split(" "):
                    full_response += word + " "
                    yield f"data: {json.dumps({'type': 'chunk', 'content': word + ' '})}\n\n"
                    await asyncio.sleep(0.05)
                
        except httpx.ConnectError:
            yield f"data: {json.dumps({'type': 'chunk', 'content': f'\\n\\n[Connection Error]: Could not connect to local Ollama on port 11434. Please start the Ollama server to use {request.modelId}.'})}\n\n"
            full_response += "[Connection Error]"
        except Exception as e:
            yield f"data: {json.dumps({'type': 'chunk', 'content': f'\\n\\n[Error]: {str(e)}'})}\n\n"
            full_response += f"[Error]: {str(e)}"

        # 4. Save Assistant Message
        tokens_completion = math.ceil(len(full_response) / 4)
        tokens_total = user_msg.tokens_prompt + tokens_completion
        
        # Calculate Cost
        # E.g. 250 credits per 1M tokens for the chosen model.
        credits_cost = 0
        if request.executionMode == "platform_managed":
            # For simplicity, assuming all models cost 250 credits per 1M tokens right now
            credits_cost = (tokens_total / 1000000.0) * 250.0
            if credits_cost < 0.01:
                credits_cost = 0.01
        
        asst_msg = Message(
            conversation_id=conversation.id,
            role="assistant",
            content=full_response,
            model_used=request.modelId,
            execution_mode=request.executionMode,
            tokens_prompt=user_msg.tokens_prompt,
            tokens_completion=tokens_completion,
            credits_consumed=credits_cost
        )
        db.add(asst_msg)
        
        # 5. Deduct Credits securely
        if credits_cost > 0 and credit_account is not None:
            raw_bal = getattr(credit_account, "balance", 0)
            current_bal = float(raw_bal or 0) - credits_cost
            setattr(credit_account, "balance", current_bal)
            ledger = CreditLedgerEntry(
                id=str(uuid.uuid4()),
                user_id=str(current_user.id),
                amount=-credits_cost,
                category="inference",
                model_id=request.modelId,
                balance_after=current_bal,
                audit_reason=f"Chat inference ({tokens_total} tokens)"
            )
            db.add(ledger)
            
        await db.commit()
        
        # Save to Semantic Prompt Cache for 0-Credit future hits
        if full_response and not full_response.startswith("[Error"):
            await prompt_cache.set_cached_response(request.prompt, request.modelId, full_response)

        yield f"data: {json.dumps({'type': 'done', 'tokens': tokens_total})}\n\n"


    return StreamingResponse(event_generator(), media_type="text/event-stream")
