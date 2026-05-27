from typing import Annotated

from fastapi import APIRouter, Depends

from app.core.deps import get_current_user, get_user_service
from app.models.user import User
from app.schemas.user import UserResponse
from app.services.user_service import UserService

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=UserResponse)
async def get_me(
    current_user: Annotated[User, Depends(get_current_user)],
    service: Annotated[UserService, Depends(get_user_service)],
) -> UserResponse:
    return await service.get_me(current_user.id)
