import redis.asyncio as redis
from app.core.config import settings

_memory_store = {}

class ResilientRedisClient:
    def __init__(self, redis_url: str):
        self.redis_url = redis_url
        self._client = None
        try:
            self._client = redis.from_url(redis_url, decode_responses=True, socket_timeout=3.0)
        except Exception as e:
            print(f"Redis init fallback: {e}")

    async def set(self, key: str, value: str, ex: int = 86400):
        try:
            if self._client:
                return await self._client.set(key, value, ex=ex)
        except Exception as e:
            print(f"Redis set fallback: {e}")
        _memory_store[key] = value

    async def get(self, key: str):
        try:
            if self._client:
                val = await self._client.get(key)
                if val is not None:
                    return val
        except Exception as e:
            print(f"Redis get fallback: {e}")
        return _memory_store.get(key)

    async def delete(self, key: str):
        try:
            if self._client:
                await self._client.delete(key)
        except Exception:
            pass
        _memory_store.pop(key, None)

    async def expire(self, key: str, seconds: int):
        try:
            if self._client:
                await self._client.expire(key, seconds)
        except Exception:
            pass

redis_client = ResilientRedisClient(settings.REDIS_URL)

