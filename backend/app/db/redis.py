from collections.abc import AsyncGenerator

import redis.asyncio as aioredis

from app.core.config import get_settings

_redis: aioredis.Redis | None = None


async def init_redis() -> None:
    global _redis
    settings = get_settings()
    _redis = aioredis.from_url(
        settings.redis_url,
        encoding="utf-8",
        decode_responses=True,
    )


async def close_redis() -> None:
    global _redis
    if _redis is not None:
        await _redis.aclose()
        _redis = None


async def get_redis() -> AsyncGenerator[aioredis.Redis, None]:
    if _redis is None:
        raise RuntimeError("Redis não inicializado")
    yield _redis
