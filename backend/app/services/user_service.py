import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundError, UnauthorizedError
from app.core.rbac import is_internal_user
from app.repositories.user_repository import UserRepository
from app.schemas.user import UserResponse


class UserService:
    def __init__(self, session: AsyncSession) -> None:
        self._users = UserRepository(session)

    async def get_me(self, user_id: uuid.UUID) -> UserResponse:
        user = await self._users.get_by_id(user_id)
        if user is None:
            raise NotFoundError("Usuário não encontrado")
        if not is_internal_user(user):
            raise UnauthorizedError("Acesso restrito a usuários internos")
        return UserResponse.model_validate(user)
