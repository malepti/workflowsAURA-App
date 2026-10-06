import math
from typing import List, Dict, Any

class ContextOptimizer:
    """
    Context Trimming and Conversation Summarization engine.
    Compresses long conversation histories to save up to 80% of prompt tokens.
    """
    @staticmethod
    def estimate_tokens(text: str) -> int:
        if not text:
            return 0
        return math.ceil(len(text) / 4) + 2

    @classmethod
    def optimize_history(
        cls, 
        history: List[Dict[str, str]], 
        max_prompt_tokens: int = 1500
    ) -> List[Dict[str, str]]:
        if not history:
            return []

        total_tokens = sum(cls.estimate_tokens(m.get("content", "")) for m in history)
        
        # If token budget is safe, return full history
        if total_tokens <= max_prompt_tokens:
            return history

        # Context Trimming: Retain System Prompt + Last 4 Turns + Compact Summary of Older Turns
        system_prompts = [m for m in history if m.get("role") == "system"]
        user_asst_messages = [m for m in history if m.get("role") != "system"]

        # Keep last 4 messages intact
        recent_messages = user_asst_messages[-4:]
        older_messages = user_asst_messages[:-4]

        if not older_messages:
            return history

        # Generate a compact summary string for older turns
        summary_snippets = []
        for msg in older_messages:
            role = msg.get("role", "user").capitalize()
            content = msg.get("content", "")[:120]
            summary_snippets.append(f"{role}: {content}...")

        compact_summary = " [Previous Conversation Memory Summary: " + " | ".join(summary_snippets) + "]"

        summary_msg = {"role": "system", "content": compact_summary}

        optimized = system_prompts + [summary_msg] + recent_messages
        return optimized

context_optimizer = ContextOptimizer()
