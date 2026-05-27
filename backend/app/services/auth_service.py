import uuid

import jwt
import redis.asyncio as aioredis
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import Settings
from app.core.exceptions import UnauthorizedError
from app.core.rbac import require_internal_user
from app.repositories.user_repository import UserRepository
from app.schemas.auth import LoginRequest, TokenResponse
from app.utils.security import (
    create_access_token,
    create_refresh_token,
    decode_refresh_token,
    verify_password,
)


class AuthService:
    def __init__(
        self,
        session: AsyncSession,
        redis: aioredis.Redis,
        settings: Settings,
    ) -> None:
        self._settings = settings
        self._redis = redis
        self._users = UserRepository(session)

    async def login(self, data: LoginRequest) -> TokenResponse:
        user = await self._users.get_by_email(data.email)
        if user is None or not verify_password(data.password, user.password_hash):
            raise UnauthorizedError("Credenciais inválidas")
        if not user.is_active:
            raise UnauthorizedError("Usuário inativo")
        require_internal_user(user)
        return await self._issue_tokens(user.id)

    async def refresh(self, refresh_token: str) -> TokenResponse:
        try:
            user_id, jti = decode_refresh_token(refresh_token, self._settings)
        except jwt.PyJWTError as exc:
            raise UnauthorizedError("Refresh token inválido") from exc

        key = self._refresh_key(user_id, jti)
        stored = await self._redis.get(key)
        if stored is None:
            raise UnauthorizedError("Refresh token revogado ou expirado")

        user = await self._users.get_by_id(user_id)
        if user is None or not user.is_active:
            raise UnauthorizedError("Usuário inválido")
        require_internal_user(user)

        await self._redis.delete(key)
        return await self._issue_tokens(user.id)

    async def _issue_tokens(self, user_id: uuid.UUID) -> TokenResponse:
        access = create_access_token(user_id, self._settings)
        refresh, jti, ttl = create_refresh_token(user_id, self._settings)
        await self._redis.set(self._refresh_key(user_id, jti), str(user_id), ex=ttl)
        return TokenResponse(access_token=access, refresh_token=refresh)

    def _refresh_key(self, user_id: uuid.UUID, jti: str) -> str:
        return f"refresh:{user_id}:{jti}"
