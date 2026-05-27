import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, File, Query, UploadFile, status

from app.core.deps import (
    get_current_user,
    get_current_user_optional,
    get_service_service,
)
from app.models.user import User
from app.schemas.service import (
    ServiceCreate,
    ServiceListResponse,
    ServiceResponse,
    ServiceUpdate,
)
from app.services.service_service import ServiceService

router = APIRouter(prefix="/services", tags=["services"])


@router.get("", response_model=ServiceListResponse)
async def list_services(
    service: Annotated[ServiceService, Depends(get_service_service)],
    current_user: Annotated[User | None, Depends(get_current_user_optional)],
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: str | None = Query(None, max_length=200),
    is_active: bool | None = Query(None),
) -> ServiceListResponse:
    return await service.list_services(
        page=page,
        page_size=page_size,
        search=search,
        is_active=is_active,
        current_user=current_user,
    )


@router.get("/{service_id}", response_model=ServiceResponse)
async def get_service(
    service_id: uuid.UUID,
    svc: Annotated[ServiceService, Depends(get_service_service)],
    current_user: Annotated[User | None, Depends(get_current_user_optional)],
) -> ServiceResponse:
    return await svc.get_by_id(service_id, current_user)


@router.post("", response_model=ServiceResponse, status_code=status.HTTP_201_CREATED)
async def create_service(
    data: ServiceCreate,
    svc: Annotated[ServiceService, Depends(get_service_service)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> ServiceResponse:
    return await svc.create(data, current_user)


@router.patch("/{service_id}", response_model=ServiceResponse)
async def update_service(
    service_id: uuid.UUID,
    data: ServiceUpdate,
    svc: Annotated[ServiceService, Depends(get_service_service)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> ServiceResponse:
    return await svc.update(service_id, data, current_user)


@router.delete("/{service_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_service(
    service_id: uuid.UUID,
    svc: Annotated[ServiceService, Depends(get_service_service)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> None:
    await svc.delete(service_id, current_user)


@router.post("/{service_id}/image", response_model=ServiceResponse)
async def upload_service_image(
    service_id: uuid.UUID,
    svc: Annotated[ServiceService, Depends(get_service_service)],
    current_user: Annotated[User, Depends(get_current_user)],
    file: UploadFile = File(...),
) -> ServiceResponse:
    return await svc.upload_image(service_id, file, current_user)
