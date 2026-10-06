import hashlib
import time
import json
from typing import Optional, Dict, Any
from app.core.redis_client import redis_client

class SemanticResponseCache:
    """
    In-memory and Redis prompt cache.
    Returns cached LLM completions with 0 credit/token cost for repeated or identical queries.
    """
    def __init__(self):
        self._local_cache: Dict[str, Dict[str, Any]] = {}

    def _hash_prompt(self, prompt: str, model_id: str) -> str:
        normalized = prompt.strip().lower()
        key = f"{model_id}:{normalized}"
        return hashlib.sha256(key.encode('utf-8')).hexdigest()

    async def get_cached_response(self, prompt: str, model_id: str) -> Optional[str]:
        cache_key = self._hash_prompt(prompt, model_id)
        
        # 1. Check local memory cache
        if cache_key in self._local_cache:
            entry = self._local_cache[cache_key]
            if time.time() - entry["timestamp"] < 86400: # 24h TTL
                return entry["response"]

        # 2. Check Redis
        try:
            val = await redis_client.get(f"prompt_cache:{cache_key}")
            if val:
                data = json.loads(val)
                return data.get("response")
        except Exception:
            pass

        return None

    async def set_cached_response(self, prompt: str, model_id: str, response: str):
        if not prompt or not response or len(response) < 5:
            return

        cache_key = self._hash_prompt(prompt, model_id)
        payload = {
            "response": response,
            "timestamp": time.time(),
            "model_id": model_id
        }

        # 1. Save in local cache
        self._local_cache[cache_key] = payload

        # 2. Save in Redis (TTL = 7 days)
        try:
            await redis_client.set(
                f"prompt_cache:{cache_key}",
                json.dumps(payload),
                ex=60 * 60 * 24 * 7
            )
        except Exception:
            pass

prompt_cache = SemanticResponseCache()
