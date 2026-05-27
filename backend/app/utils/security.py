import secrets
import uuid
from datetime import UTC, datetime, timedelta

import jwt
from passlib.context import CryptContext

from app.core.config import Settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def generate_temporary_password(length: int = 12) -> str:
    return secrets.token_urlsafe(length)[:length]


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(user_id: uuid.UUID, settings: Settings) -> str:
    expire = datetime.now(UTC) + timedelta(minutes=settings.access_token_expire_minutes)
    payload = {
        "sub": str(user_id),
        "type": "access",
        "exp": expire,
    }
    return jwt.encode(payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)


def create_refresh_token(user_id: uuid.UUID, settings: Settings) -> tuple[str, str, int]:
    jti = str(uuid.uuid4())
    expire = datetime.now(UTC) + timedelta(days=settings.refresh_token_expire_days)
    ttl_seconds = int(settings.refresh_token_expire_days * 24 * 60 * 60)
    payload = {
        "sub": str(user_id),
        "type": "refresh",
        "jti": jti,
        "exp": expire,
    }
    token = jwt.encode(
        payload,
        settings.jwt_refresh_secret_key,
        algorithm=settings.jwt_algorithm,
    )
    return token, jti, ttl_seconds


def decode_access_token(token: str, settings: Settings) -> uuid.UUID:
    payload = jwt.decode(
        token,
        settings.jwt_secret_key,
        algorithms=[settings.jwt_algorithm],
    )
    if payload.get("type") != "access":
        raise jwt.InvalidTokenError("Tipo de token inválido")
    return uuid.UUID(payload["sub"])


def decode_refresh_token(token: str, settings: Settings) -> tuple[uuid.UUID, str]:
    payload = jwt.decode(
        token,
        settings.jwt_refresh_secret_key,
        algorithms=[settings.jwt_algorithm],
    )
    if payload.get("type") != "refresh":
        raise jwt.InvalidTokenError("Tipo de token inválido")
    jti = payload.get("jti")
    if not jti:
        raise jwt.InvalidTokenError("JTI ausente")
    return uuid.UUID(payload["sub"]), jti
