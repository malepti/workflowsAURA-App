import json
import asyncio
import httpx
import time
import math
import uuid
import re
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

def is_high_intensity_decision(prompt: str) -> bool:
    """
    Evaluates whether a user prompt warrants Human-in-the-Loop clarification
    due to high question intensity, architectural trade-offs, or ambiguous technical choices,
    versus direct factual/coding answers.
    """
    prompt_trimmed = prompt.strip()
    prompt_lower = prompt_trimmed.lower()
    
    if prompt_lower.startswith("/hitl") or "\\hitl" in prompt_lower or "/hitl" in prompt_lower:
        return True
    
    high_intensity_patterns = [
        r"\b(architect|architecture|architectural)\b",
        r"\b(tech stack|technology stack)\b",
        r"\b(system design|design a system|design the system)\b",
        r"\b(which (should|to|database|framework|library|approach|pattern|stack))\b",
        r"\b(choose between|compare and recommend|recommend an? (architecture|approach|database|framework|stack))\b",
        r"\b(how (should|to) (we|i) (build|structure|architect|design|scale))\b",
        r"\b(trade-?offs? between)\b",
        r"\b(auth(entication)? system|auth(entication)? pattern|auth(entication)? flow|auth architecture)\b",
        r"\b(migration strategy|migrate from|migrating to)\b",
        r"\b(microservices? vs monolith|monolith vs microservices?)\b",
        r"\b(scaling strategy|high availability|fault tolerance)\b",
        r"\b(sql vs nosql|nosql vs sql|relational vs non-relational)\b",
        r"\b(state management (solution|approach|pattern|choice))\b",
        r"\b(event-driven|message queue|pub/?sub architecture)\b",
        r"\b(what('s| is) the best (way|architecture|stack|approach) to build)\b",
    ]
    return any(re.search(pat, prompt_lower) for pat in high_intensity_patterns)

@router.post("/stream")
async def stream_chat_response(
    request: ChatRequest,
    current_user: User = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db)
):
    # Check Semantic Cache for Instant 0-Credit Response (Bypass when attachments are uploaded)
    if not request.attachments:
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
        is_local_ollama = (
            request.modelId in ["qwen-2-5-coder-32b", "qwen2.5-coder:3b", "qwen2.5-coder:32b", "llama-3-3-70b", "deepseek-r1-distill"]
            or "qwen" in request.modelId.lower()
            or "ollama" in request.modelId.lower()
        )
        
        prompt_trimmed = request.prompt.strip()
        prompt_lower = prompt_trimmed.lower()
        is_chart_mode = (
            prompt_trimmed.startswith("/chart")
            or prompt_trimmed.startswith("\\chart")
            or "/chart" in prompt_lower
            or "\\chart" in prompt_lower
        )
        is_hitl_mode = (
            prompt_trimmed.startswith("/hitl")
            or prompt_trimmed.startswith("\\hitl")
            or "/hitl" in prompt_lower
            or "\\hitl" in prompt_lower
        )

        if is_chart_mode:
            system_instruction = (
                "System Instruction: You are an expert data visualization analyst and AI consultant.\n"
                "[CHART VISUALIZATION & ANALYSIS DIRECTIVE]:\n"
                "The user explicitly triggered chart visualization via the '/chart' command.\n"
                "You MUST format your answer with BOTH of the following components:\n\n"
                "1. FIRST, provide an interactive chart code block strictly using ```json_chart ... ```.\n"
                "The block must contain valid JSON with 'type' ('bar', 'line', 'area', or 'pie'), 'title', and 'data' (an array of data objects with a category string property such as 'name' and numerical properties for the metrics).\n"
                "Example format:\n"
                "```json_chart\n"
                "{\n"
                '  "type": "bar",\n'
                '  "title": "Comparative Metrics",\n'
                '  "data": [\n'
                '    {"name": "Jan", "sales": 4000, "profit": 2400},\n'
                '    {"name": "Feb", "sales": 3000, "profit": 1398},\n'
                '    {"name": "Mar", "sales": 2000, "profit": 9800}\n'
                "  ]\n"
                "}\n"
                "```\n\n"
                "2. SECOND, directly below the ```json_chart``` block, provide a clear, comprehensive written analysis and analytical explanation:\n"
                "- **Overview & Trend Analysis**: Explain the overall pattern and trajectory shown in the chart.\n"
                "- **Key Metric Breakdowns**: Highlight highest peaks, lowest valleys, percentage differences, and critical data points.\n"
                "- **Actionable Insights & Recommendations**: What decisions or conclusions should be drawn from this chart.\n"
                "Both the chart block and the written explanation are mandatory.\n\n"
            )
        else:
            # Autonomous Human-in-the-Loop & Software Engineering Assistant
            system_instruction = (
                "System Instruction: You are an expert AI software architect and technical co-pilot with autonomous Human-in-the-Loop (HITL) capability.\n"
                "You provide direct, high-quality, comprehensive answers to technical queries, with an intelligent policy for handling question intensity:\n\n"
                "[AUTONOMOUS HUMAN-IN-THE-LOOP (HITL) POLICY]:\n"
                "1. DIRECT / TRIVIAL / SPECIFIC CODE TASKS:\n"
                "   If the user asks a straightforward question, requests a specific function/code snippet, asks for an explanation, bug fix, or simple refactoring "
                "(e.g., 'What is a closure in JavaScript?', 'Write a Python function to sort a list of dicts', 'Fix this regex', 'Explain REST APIs'), "
                "   answer directly, completely, and immediately in standard markdown. DO NOT emit any hitl_question block.\n\n"
                "2. HIGH-INTENSITY / ARCHITECTURAL / AMBIGUOUS CHOICES:\n"
                "   If the user's prompt involves strategic architecture decisions, choosing between multiple competing technologies/frameworks, "
                "system design trade-offs, building complex systems (like auth, real-time messaging, scaling, data pipelines), or has high ambiguity where making assumptions could lead to the wrong path: "
                "   - FIRST, provide a concise preliminary analysis explaining the problem, context, and key trade-offs (1-2 short paragraphs).\n"
                "   - SECOND, conclude your response with a structured Human-in-the-Loop decision block strictly using the format below:\n"
                "```hitl_question\n"
                "{\n"
                '  "id": "hitl_' + uuid.uuid4().hex[:6] + '",\n'
                '  "prompt": "Clear, specific strategic question for the human operator (e.g., Which authentication architecture best fits your system?)",\n'
                '  "options": [\n'
                '    {"id": "opt_1", "label": "Option Title (Key Characteristic)", "description": "Brief explanation of pros/cons", "recommended": true},\n'
                '    {"id": "opt_2", "label": "Alternative Option Title", "description": "Brief explanation of pros/cons"}\n'
                '  ],\n'
                '  "allowCustomText": true,\n'
                '  "multiSelect": false\n'
                "}\n"
                "```\n"
                "   - Do NOT write the complete final implementation code yet; pause and allow the human operator to select an option or provide input.\n\n"
            )
            if is_hitl_mode:
                system_instruction += (
                    "[OVERRIDE: User explicitly triggered /hitl]: You MUST activate High-Intensity Human-in-the-Loop clarification for this prompt.\n\n"
                )
        
        # Live Web Search Grounding
        from app.services.web_search import should_trigger_search, perform_web_search
        needs_search = should_trigger_search(request.prompt, request.enableWebSearch)
        search_data = None
        if needs_search:
            search_data = await perform_web_search(request.prompt)
            if search_data:
                summary_text = search_data["summary_text"] if isinstance(search_data, dict) else str(search_data)
                system_instruction += (
                    f"\n\n[LIVE WEB SEARCH DATA RETRIEVED AT {time.strftime('%Y-%m-%d %H:%M:%S UTC')}]:\n"
                    f"{summary_text}\n\n"
                    "INSTRUCTION: Use the above live web search data to provide a detailed, accurate, and current response to the user's prompt. "
                    "Do NOT claim that you lack real-time access when search data is provided above.\n"
                )

        if search_data and isinstance(search_data, dict) and search_data.get("sources"):
            yield f"data: {json.dumps({'type': 'search_sources', 'sources': search_data['sources']})}\n\n"

        augmented_prompt = system_instruction + "User Prompt: " + request.prompt

        try:
            if is_local_ollama:
                # Actual LLM Connection to Ollama
                async with httpx.AsyncClient() as client:
                    target_model = "qwen2.5-coder:3b"
                    try:
                        tags_res = await client.get("http://127.0.0.1:11434/api/tags", timeout=3.0)
                        if tags_res.status_code == 200:
                            installed = [m.get("name") for m in tags_res.json().get("models", [])]
                            if "qwen2.5-coder:32b" in installed and ("32b" in request.modelId or "32" in request.modelId):
                                target_model = "qwen2.5-coder:32b"
                            elif "qwen2.5-coder:3b" in installed:
                                target_model = "qwen2.5-coder:3b"
                            elif "llama3" in installed:
                                target_model = "llama3"
                            elif installed:
                                target_model = installed[0]
                    except Exception as te:
                        print(f"Ollama tags resolution note: {te}")

                    ollama_req = {
                        "model": target_model,
                        "prompt": augmented_prompt,
                        "stream": True
                    }
                        
                    async with client.stream('POST', 'http://127.0.0.1:11434/api/generate', json=ollama_req, timeout=120.0) as r:
                        if r.status_code != 200:
                            yield f"data: {json.dumps({'type': 'chunk', 'content': f'\\n\\n[Error: Ollama returned status {r.status_code} for model {target_model}. Make sure Ollama is running!]'})}\n\n"
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

                    # Build multimodal payload if attachments are present
                    multimodal_contents = []
                    if request.attachments:
                        for att in request.attachments:
                            if isinstance(att, dict) and att.get("dataUrl"):
                                data_url = att["dataUrl"]
                                mime_type = att.get("type", "image/png")
                                try:
                                    if "," in data_url:
                                        header, base64_str = data_url.split(",", 1)
                                        if "image/" in header or "image/" in mime_type:
                                            import base64
                                            img_bytes = base64.b64decode(base64_str)
                                            from google.genai import types
                                            image_part = types.Part.from_bytes(
                                                data=img_bytes,
                                                mime_type=mime_type or "image/png"
                                            )
                                            multimodal_contents.append(image_part)
                                except Exception as ie:
                                    print(f"Attachment parsing note: {ie}")

                    multimodal_contents.append(augmented_prompt)

                    # Model tag resolution with fallback support
                    models_to_try = [request.modelId, "gemini-2.5-flash", "gemini-1.5-flash", "gemini-2.0-flash"]
                    gemini_success = False

                    for target_model in models_to_try:
                        if gemini_success:
                            break
                        try:
                            response = await client.aio.models.generate_content_stream(
                                model=target_model,
                                contents=multimodal_contents
                            )
                            async for chunk in response:
                                text = None
                                try:
                                    text = chunk.text
                                except Exception:
                                    pass

                                if text:
                                    full_response += text
                                    yield f"data: {json.dumps({'type': 'chunk', 'content': text})}\n\n"
                                    await asyncio.sleep(0.01)
                            gemini_success = True
                        except Exception as ge:
                            ge_str = str(ge).upper()
                            # If model tag error or 503 capacity error, try fallback model in list
                            if any(err_code in ge_str for err_code in ["404", "NOT_FOUND", "503", "UNAVAILABLE", "CAPACITY", "OVERLOADED", "RESOURCE_EXHAUSTED", "429"]):
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
                if is_chart_mode:
                    simulated_reply = (
                        "### 📊 Interactive Data Visualization\n\n"
                        "```json_chart\n"
                        "{\n"
                        '  "type": "bar",\n'
                        '  "title": "Performance & Trend Analysis",\n'
                        '  "data": [\n'
                        '    {"name": "Jan", "sales": 4200, "profit": 2100},\n'
                        '    {"name": "Feb", "sales": 5800, "profit": 2900},\n'
                        '    {"name": "Mar", "sales": 7400, "profit": 3950},\n'
                        '    {"name": "Apr", "sales": 8900, "profit": 4600},\n'
                        '    {"name": "May", "sales": 11200, "profit": 6100},\n'
                        '    {"name": "Jun", "sales": 13500, "profit": 7400}\n'
                        "  ]\n"
                        "}\n"
                        "```\n\n"
                        "### 📈 Comprehensive Chart Analysis & Key Insights\n\n"
                        "1. **Accelerated Growth Trajectory**: The visual trend shows robust month-over-month growth, scaling from 4,200 in January to 13,500 in June (**+221% overall growth**).\n"
                        "2. **Margin Expansion**: Profit increased steadily alongside sales, with net profit margin improving from 50.0% to 54.8% due to operational leverage and unit cost efficiencies.\n"
                        "3. **Key Takeaways & Recommendation**: The second quarter accounts for nearly two-thirds of total half-year revenue. Continuing focus on top-performing product segments will sustain this upward momentum."
                    )
                elif is_hitl_mode or is_high_intensity_decision(request.prompt):
                    prompt_l = request.prompt.lower()
                    if "auth" in prompt_l:
                        q_prompt = "Which authentication architecture best aligns with your security, token lifecycle, and user scale?"
                        q_opts = [
                            {"id": "opt_jwt", "label": "JWT in HttpOnly Cookies + Redis Token Denylist", "description": "Stateless horizontal scaling with instant server-side revocation capability", "recommended": True},
                            {"id": "opt_oauth", "label": "OAuth2 / OIDC Managed Identity (Auth0 / Supabase / Clerk)", "description": "Fastest time-to-market with social logins, MFA, and zero credential storage risk"},
                            {"id": "opt_session", "label": "Stateful Server Sessions (Redis / DB backed)", "description": "Enterprise-grade instant session termination and maximum security control"}
                        ]
                    elif any(db_kw in prompt_l for db_kw in ["data", "db", "sql", "mongo", "nosql", "postgres"]):
                        q_prompt = "Which database architecture best aligns with your workload and consistency requirements?"
                        q_opts = [
                            {"id": "opt_pg", "label": "PostgreSQL with JSONB & Connection Pooling", "description": "Rock-solid ACID relational integrity combined with semi-structured document flexibility", "recommended": True},
                            {"id": "opt_mongo", "label": "MongoDB / DocumentDB Clustered Store", "description": "Dynamic schema flexibility and distributed horizontal sharding for write-heavy data"},
                            {"id": "opt_hybrid", "label": "Polyglot Persistence (PostgreSQL OLTP + Redis Cache + ClickHouse)", "description": "Optimal segregation of high-speed transactional queries and analytical aggregations"}
                        ]
                    else:
                        q_prompt = "Which architecture pattern best aligns with your application requirements and scale?"
                        q_opts = [
                            {"id": "opt_fastapi", "label": "FastAPI + Async SQLAlchemy (High-throughput & Microservice-ready)", "description": "Production standard with automatic OpenAPI docs and non-blocking I/O", "recommended": True},
                            {"id": "opt_django", "label": "Django REST Framework (Batteries-included)", "description": "Integrated admin panel, ORM, and battle-tested authentication"},
                            {"id": "opt_serverless", "label": "Serverless Functions (Cloud Run / AWS Lambda)", "description": "Zero idle infrastructure cost, event-driven horizontal auto-scaling"}
                        ]

                    simulated_reply = (
                        "### 🧠 Human-in-the-Loop Architecture Assessment\n\n"
                        "To build an optimal solution tailored to your performance, scalability, and delivery timeline requirements, we need to choose the foundational architecture pattern.\n\n"
                        "```hitl_question\n"
                        + json.dumps({
                            "id": "hitl_" + uuid.uuid4().hex[:6],
                            "prompt": q_prompt,
                            "options": q_opts,
                            "allowCustomText": True,
                            "multiSelect": False
                        }, indent=2) +
                        "\n```\n\n"
                        "Please select your preferred path above or add custom notes to proceed."
                    )
                elif search_data:
                    summary_txt = search_data["summary_text"] if isinstance(search_data, dict) else str(search_data)
                    simulated_reply = (
                        f"### 🌐 Live Web Search Grounding\n\n"
                        f"Based on real-time web search data retrieved just now:\n\n"
                        f"{summary_txt}\n\n"
                        f"**Live Analysis**: The above live information was retrieved in real time to answer your prompt with up-to-date ground truth."
                    )
                else:
                    simulated_reply = f"This is a response generated by the {request.modelId} integration. In production, this branch uses `openai.AsyncOpenAI` or `google.generativeai` with your BYOK key."
                for word in simulated_reply.split(" "):
                    full_response += word + " "
                    yield f"data: {json.dumps({'type': 'chunk', 'content': word + ' '})}\n\n"
                    await asyncio.sleep(0.02)
                
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

        # Detect and emit structured HITL event if present in output
        hitl_match = re.search(r"```(?:hitl_question)?\s*(\{[\s\S]*?\"options\"[\s\S]*?\})\s*```", full_response)
        if hitl_match:
            try:
                question_obj = json.loads(hitl_match.group(1))
                yield f"data: {json.dumps({'type': 'hitl_request', 'question': question_obj})}\n\n"
            except Exception as he:
                print(f"HITL parse note: {he}")

        yield f"data: {json.dumps({'type': 'done', 'tokens': tokens_total})}\n\n"


    return StreamingResponse(event_generator(), media_type="text/event-stream")


class HITLResumeRequest(BaseModel):
    conversationId: str
    questionId: str
    selectedOptionIds: List[str]
    selectedOptionLabels: List[str]
    customText: Optional[str] = None
    modelId: str = "llama-3-3-70b"
    executionMode: str = "byok"


@router.post("/hitl-resume")
async def resume_hitl_stream(
    req: HITLResumeRequest,
    current_user: User = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db)
):
    selected_str = ", ".join(req.selectedOptionLabels) if req.selectedOptionLabels else "Option Confirmed"
    user_guidance = f"\nUser Custom Notes: \"{req.customText}\"" if req.customText else ""
    
    resumption_prompt = (
        f"[Human-in-the-Loop Decision Confirmed]:\n"
        f"The human supervisor reviewed your decision choices and selected: \"{selected_str}\".{user_guidance}\n\n"
        f"Proceed immediately with the complete, production-ready implementation and code adhering directly to this choice. Do not ask the question again."
    )

    chat_req = ChatRequest(
        prompt=resumption_prompt,
        conversationId=req.conversationId,
        modelId=req.modelId,
        executionMode=req.executionMode,
        enableWebSearch=False
    )
    return await stream_chat_response(chat_req, current_user, db)
