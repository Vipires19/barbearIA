import uuid
from typing import Annotated

import jwt
import redis.asyncio as aioredis
from fastapi import Depends
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import Settings, get_settings
from app.core.exceptions import UnauthorizedError
from app.core.rbac import require_internal_user
from app.db.redis import get_redis
from app.db.session import get_db
from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.services.appointment_service import AppointmentService
from app.services.auth_service import AuthService
from app.services.professional_service import ProfessionalService
from app.services.service_service import ServiceService
from app.services.user_service import UserService
from app.utils.security import decode_access_token

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")
oauth2_scheme_optional = OAuth2PasswordBearer(
    tokenUrl="/api/v1/auth/login",
    auto_error=False,
)


async def get_auth_service(
    session: Annotated[AsyncSession, Depends(get_db)],
    redis: Annotated[aioredis.Redis, Depends(get_redis)],
    settings: Annotated[Settings, Depends(get_settings)],
) -> AuthService:
    return AuthService(session, redis, settings)


async def get_user_service(
    session: Annotated[AsyncSession, Depends(get_db)],
) -> UserService:
    return UserService(session)


async def get_current_user(
    token: Annotated[str, Depends(oauth2_scheme)],
    session: Annotated[AsyncSession, Depends(get_db)],
    settings: Annotated[Settings, Depends(get_settings)],
) -> User:
    return await _resolve_user(token, session, settings)


async def get_current_user_optional(
    token: Annotated[str | None, Depends(oauth2_scheme_optional)],
    session: Annotated[AsyncSession, Depends(get_db)],
    settings: Annotated[Settings, Depends(get_settings)],
) -> User | None:
    if not token:
        return None
    try:
        return await _resolve_user(token, session, settings)
    except UnauthorizedError:
        return None


async def get_service_service(
    session: Annotated[AsyncSession, Depends(get_db)],
    settings: Annotated[Settings, Depends(get_settings)],
) -> ServiceService:
    return ServiceService(session, settings)


async def get_professional_service(
    session: Annotated[AsyncSession, Depends(get_db)],
    settings: Annotated[Settings, Depends(get_settings)],
) -> ProfessionalService:
    return ProfessionalService(session, settings)


async def get_appointment_service(
    session: Annotated[AsyncSession, Depends(get_db)],
) -> AppointmentService:
    return AppointmentService(session)


async def _resolve_user(
    token: str,
    session: AsyncSession,
    settings: Settings,
) -> User:
    try:
        user_id = decode_access_token(token, settings)
    except jwt.PyJWTError as exc:
        raise UnauthorizedError("Token inválido ou expirado") from exc

    user = await UserRepository(session).get_by_id(user_id)
    if user is None or not user.is_active:
        raise UnauthorizedError("Usuário inválido ou inativo")
    require_internal_user(user)
    return user
