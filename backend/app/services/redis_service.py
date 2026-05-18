import json
import logging
from typing import Optional, Any, List, Dict
import redis.asyncio as aioredis
from app.core.config import settings

logger = logging.getLogger(__name__)


class RedisService:
    """Redis service for caching, session memory, and rate limiting."""

    def __init__(self):
        self._client: Optional[aioredis.Redis] = None

    async def connect(self):
        try:
            self._client = aioredis.from_url(
                settings.REDIS_URL,
                encoding="utf-8",
                decode_responses=True,
            )
            await self._client.ping()
            logger.info("Redis connected successfully")
        except Exception as e:
            logger.warning(f"Redis connection failed: {e}. Running without cache.")
            self._client = None

    async def disconnect(self):
        if self._client:
            await self._client.close()

    @property
    def is_connected(self) -> bool:
        return self._client is not None

    # ---- Generic Cache ----

    async def set(self, key: str, value: Any, ttl: int = 3600) -> bool:
        if not self._client:
            return False
        try:
            serialized = json.dumps(value) if not isinstance(value, str) else value
            await self._client.setex(key, ttl, serialized)
            return True
        except Exception as e:
            logger.error(f"Redis SET error: {e}")
            return False

    async def get(self, key: str) -> Optional[Any]:
        if not self._client:
            return None
        try:
            value = await self._client.get(key)
            if value is None:
                return None
            try:
                return json.loads(value)
            except (json.JSONDecodeError, TypeError):
                return value
        except Exception as e:
            logger.error(f"Redis GET error: {e}")
            return None

    async def delete(self, key: str) -> bool:
        if not self._client:
            return False
        try:
            await self._client.delete(key)
            return True
        except Exception as e:
            logger.error(f"Redis DELETE error: {e}")
            return False

    async def exists(self, key: str) -> bool:
        if not self._client:
            return False
        try:
            return bool(await self._client.exists(key))
        except Exception:
            return False

    # ---- Conversation Memory ----

    def _memory_key(self, conversation_id: int) -> str:
        return f"conv_memory:{conversation_id}"

    async def save_conversation_memory(
        self, conversation_id: int, messages: List[Dict], ttl: int = 7200
    ) -> bool:
        key = self._memory_key(conversation_id)
        return await self.set(key, messages, ttl)

    async def get_conversation_memory(self, conversation_id: int) -> Optional[List[Dict]]:
        key = self._memory_key(conversation_id)
        return await self.get(key)

    async def clear_conversation_memory(self, conversation_id: int) -> bool:
        key = self._memory_key(conversation_id)
        return await self.delete(key)

    # ---- Rate Limiting ----

    async def check_rate_limit(self, user_id: int, limit: int = 100, period: int = 60) -> bool:
        """Returns True if request is allowed, False if rate limited."""
        if not self._client:
            return True  # Allow if Redis unavailable
        key = f"rate_limit:{user_id}"
        try:
            current = await self._client.get(key)
            if current is None:
                await self._client.setex(key, period, 1)
                return True
            if int(current) >= limit:
                return False
            await self._client.incr(key)
            return True
        except Exception as e:
            logger.error(f"Rate limit check error: {e}")
            return True

    # ---- Response Cache ----

    async def cache_response(self, cache_key: str, response: str, ttl: int = 1800) -> bool:
        key = f"response_cache:{cache_key}"
        return await self.set(key, response, ttl)

    async def get_cached_response(self, cache_key: str) -> Optional[str]:
        key = f"response_cache:{cache_key}"
        return await self.get(key)

    # ---- User Session ----

    async def save_user_session(self, user_id: int, data: Dict, ttl: int = 86400) -> bool:
        key = f"user_session:{user_id}"
        return await self.set(key, data, ttl)

    async def get_user_session(self, user_id: int) -> Optional[Dict]:
        key = f"user_session:{user_id}"
        return await self.get(key)

    async def invalidate_user_session(self, user_id: int) -> bool:
        key = f"user_session:{user_id}"
        return await self.delete(key)


# Singleton instance
redis_service = RedisService()
