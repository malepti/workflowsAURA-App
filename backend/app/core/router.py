import re
from typing import Dict, Any

class IntelligentModelRouter:
    """
    Query Classifier & Multi-Model Router.
    Routes simple queries to fast local Ollama models and complex tasks to heavy models to optimize cost.
    """
    @staticmethod
    def classify_and_route(prompt: str, current_model: str) -> Dict[str, Any]:
        p_low = prompt.lower().strip()

        # Check for explicit slash command or brief request
        is_brief = "/brief" in p_low or "short" in p_low or "quick" in p_low
        is_code = "/code" in p_low or "python" in p_low or "function" in p_low or "class " in p_low or "def " in p_low or "const " in p_low

        # If model is set to 'auto' or user wants cost optimization
        recommended_model = current_model
        reason = "User Selected Model"

        if current_model == "auto" or current_model == "smart-router":
            if is_code or len(prompt) > 300:
                recommended_model = "qwen2.5-coder:32b"
                reason = "Routed to Local Qwen 2.5 Coder for high-performance coding"
            elif len(prompt) < 100 or is_brief:
                recommended_model = "qwen2.5-coder:32b"
                reason = "Routed to Local Model for ultra-fast response & zero credit cost"
            else:
                recommended_model = "gemini-2.5-flash"
                reason = "Routed to Gemini 2.5 Flash for multimodal reasoning"

        return {
            "recommendedModel": recommended_model,
            "routingReason": reason,
            "isLocal": "qwen" in recommended_model or "llama" in recommended_model,
            "isBrief": is_brief
        }

model_router = IntelligentModelRouter()
