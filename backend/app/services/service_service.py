import math
import uuid

from fastapi import UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import Settings
from app.core.exceptions import ForbiddenError, NotFoundError
from app.models.service import Service
from app.models.user import User, UserRole
from app.repositories.service_repository import ServiceRepository
from app.schemas.service import (
    ServiceCreate,
    ServiceListResponse,
    ServiceResponse,
    ServiceUpdate,
)
from app.utils.file_storage import FileStorageService


class ServiceService:
    def __init__(self, session: AsyncSession, settings: Settings) -> None:
        self._repo = ServiceRepository(session)
        self._storage = FileStorageService(settings)
        self._settings = settings

    async def list_services(
        self,
        *,
        page: int = 1,
        page_size: int = 20,
        search: str | None = None,
        is_active: bool | None = None,
        current_user: User | None = None,
    ) -> ServiceListResponse:
        page = max(1, page)
        page_size = min(max(1, page_size), 100)

        effective_active = is_active
        if current_user is None:
            effective_active = True
        elif is_active is None and current_user.role in (UserRole.admin, UserRole.barber):
            effective_active = None

        items, total = await self._repo.list_services(
            page=page,
            page_size=page_size,
            search=search,
            is_active=effective_active,
        )
        pages = max(1, math.ceil(total / page_size)) if total else 1
        return ServiceListResponse(
            items=[ServiceResponse.model_validate(s) for s in items],
            total=total,
            page=page,
            page_size=page_size,
            pages=pages,
        )

    async def get_by_id(
        self,
        service_id: uuid.UUID,
        current_user: User | None = None,
    ) -> ServiceResponse:
        service = await self._repo.get_by_id(service_id)
        if service is None:
            raise NotFoundError("Serviço não encontrado")
        if not service.is_active and not self._can_manage(current_user):
            raise NotFoundError("Serviço não encontrado")
        return ServiceResponse.model_validate(service)

    async def create(self, data: ServiceCreate, current_user: User) -> ServiceResponse:
        self._require_manage(current_user)
        service = await self._repo.create(
            name=data.name,
            description=data.description,
            price=data.price,
            duration_minutes=data.duration_minutes,
            is_active=data.is_active,
        )
        return ServiceResponse.model_validate(service)

    async def update(
        self,
        service_id: uuid.UUID,
        data: ServiceUpdate,
        current_user: User,
    ) -> ServiceResponse:
        self._require_manage(current_user)
        service = await self._get_or_404(service_id)
        update_data = data.model_dump(exclude_unset=True)
        updated = await self._repo.update(service, **update_data)
        return ServiceResponse.model_validate(updated)

    async def delete(self, service_id: uuid.UUID, current_user: User) -> None:
        self._require_manage(current_user)
        service = await self._get_or_404(service_id)
        self._storage.delete_by_url(service.image_url)
        await self._repo.delete(service)

    async def upload_image(
        self,
        service_id: uuid.UUID,
        file: UploadFile,
        current_user: User,
    ) -> ServiceResponse:
        self._require_manage(current_user)
        service = await self._get_or_404(service_id)
        if service.image_url:
            self._storage.delete_by_url(service.image_url)
        image_url = await self._storage.save_service_image(file)
        updated = await self._repo.update(service, image_url=image_url)
        return ServiceResponse.model_validate(updated)

    async def _get_or_404(self, service_id: uuid.UUID) -> Service:
        service = await self._repo.get_by_id(service_id)
        if service is None:
            raise NotFoundError("Serviço não encontrado")
        return service

    @staticmethod
    def _can_manage(user: User | None) -> bool:
        return user is not None and user.role in (UserRole.admin, UserRole.barber)

    @staticmethod
    def _require_manage(user: User) -> None:
        if user.role not in (UserRole.admin, UserRole.barber):
            raise ForbiddenError("Sem permissão para gerenciar serviços")
