import logging

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import Settings
from app.models.user import User, UserRole
from app.repositories.user_repository import UserRepository
from app.utils.security import hash_password

logger = logging.getLogger(__name__)


async def seed_admin_if_missing(session: AsyncSession, settings: Settings) -> None:
    """Cria o primeiro admin se não existir nenhum (idempotente)."""
    if not settings.admin_email or not settings.admin_password:
        logger.warning("ADMIN_EMAIL/ADMIN_PASSWORD não definidos — seed de admin ignorado")
        return

    repo = UserRepository(session)
    if await repo.has_admin():
        return

    existing = await repo.get_by_email(settings.admin_email)
    if existing is not None:
        logger.warning("E-mail de admin já cadastrado com outro papel — seed ignorado")
        return

    user = User(
        name=settings.admin_name or "Administrador",
        email=settings.admin_email,
        password_hash=hash_password(settings.admin_password),
        role=UserRole.admin,
        is_active=True,
    )
    await repo.create(user)
    await session.commit()
    logger.info("Admin inicial criado: %s", settings.admin_email)
