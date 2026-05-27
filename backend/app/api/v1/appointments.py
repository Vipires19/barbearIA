import uuid
from datetime import date
from typing import Annotated

from fastapi import APIRouter, Depends, Query, status

from app.core.deps import get_appointment_service, get_current_user
from app.models.appointment import AppointmentStatus
from app.models.user import User
from app.schemas.appointment import (
    AppointmentCancel,
    AppointmentCreate,
    AppointmentFilters,
    AppointmentListResponse,
    AppointmentResponse,
    AppointmentReschedule,
    AppointmentUpdate,
)
from app.services.appointment_service import AppointmentService

router = APIRouter(prefix="/appointments", tags=["appointments"])


@router.get("", response_model=AppointmentListResponse)
async def list_appointments(
    svc: Annotated[AppointmentService, Depends(get_appointment_service)],
    current_user: Annotated[User, Depends(get_current_user)],
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: str | None = Query(None, max_length=200),
    status_filter: AppointmentStatus | None = Query(None, alias="status"),
    professional_id: uuid.UUID | None = Query(None),
    service_id: uuid.UUID | None = Query(None),
    date_from: date | None = Query(None),
    date_to: date | None = Query(None),
) -> AppointmentListResponse:
    filters = AppointmentFilters(
        page=page,
        page_size=page_size,
        search=search,
        status=status_filter,
        professional_id=professional_id,
        service_id=service_id,
        date_from=date_from,
        date_to=date_to,
    )
    return await svc.list_appointments(filters, current_user)


@router.get("/{appointment_id}", response_model=AppointmentResponse)
async def get_appointment(
    appointment_id: uuid.UUID,
    svc: Annotated[AppointmentService, Depends(get_appointment_service)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> AppointmentResponse:
    return await svc.get_by_id(appointment_id, current_user)


@router.post("", response_model=AppointmentResponse, status_code=status.HTTP_201_CREATED)
async def create_appointment(
    data: AppointmentCreate,
    svc: Annotated[AppointmentService, Depends(get_appointment_service)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> AppointmentResponse:
    return await svc.create(data, current_user)


@router.patch("/{appointment_id}", response_model=AppointmentResponse)
async def update_appointment(
    appointment_id: uuid.UUID,
    data: AppointmentUpdate,
    svc: Annotated[AppointmentService, Depends(get_appointment_service)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> AppointmentResponse:
    return await svc.update(appointment_id, data, current_user)


@router.post("/{appointment_id}/cancel", response_model=AppointmentResponse)
async def cancel_appointment(
    appointment_id: uuid.UUID,
    data: AppointmentCancel,
    svc: Annotated[AppointmentService, Depends(get_appointment_service)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> AppointmentResponse:
    return await svc.cancel(appointment_id, data, current_user)


@router.post("/{appointment_id}/reschedule", response_model=AppointmentResponse)
async def reschedule_appointment(
    appointment_id: uuid.UUID,
    data: AppointmentReschedule,
    svc: Annotated[AppointmentService, Depends(get_appointment_service)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> AppointmentResponse:
    return await svc.reschedule(appointment_id, data, current_user)
