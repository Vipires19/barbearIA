import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, Query, status

from app.core.deps import get_appointment_service
from app.schemas.public_appointment import (
    PublicAppointmentCancel,
    PublicAppointmentCreate,
    PublicAppointmentItem,
    PublicAppointmentListResponse,
    PublicAppointmentReschedule,
    PublicAppointmentScope,
)
from app.services.appointment_service import AppointmentService

router = APIRouter(prefix="/public/appointments", tags=["public-appointments"])


@router.post("", response_model=PublicAppointmentItem, status_code=status.HTTP_201_CREATED)
async def create_public_appointment(
    data: PublicAppointmentCreate,
    svc: Annotated[AppointmentService, Depends(get_appointment_service)],
) -> PublicAppointmentItem:
    return await svc.public_create(data)


@router.get("", response_model=PublicAppointmentListResponse)
async def list_public_appointments(
    svc: Annotated[AppointmentService, Depends(get_appointment_service)],
    phone: str = Query(..., min_length=8, max_length=30, description="Telefone do cliente (com DDD)"),
    scope: Annotated[
        PublicAppointmentScope,
        Query(description="Filtrar: all | upcoming | past"),
    ] = PublicAppointmentScope.all,
) -> PublicAppointmentListResponse:
    return await svc.public_list_by_phone(phone=phone, scope=scope)


@router.get("/{appointment_id}", response_model=PublicAppointmentItem)
async def get_public_appointment(
    appointment_id: uuid.UUID,
    svc: Annotated[AppointmentService, Depends(get_appointment_service)],
    phone: str = Query(..., min_length=8, max_length=30),
) -> PublicAppointmentItem:
    return await svc.public_get_by_phone(appointment_id, phone=phone)


@router.post("/{appointment_id}/cancel", response_model=PublicAppointmentItem)
async def cancel_public_appointment(
    appointment_id: uuid.UUID,
    data: PublicAppointmentCancel,
    svc: Annotated[AppointmentService, Depends(get_appointment_service)],
) -> PublicAppointmentItem:
    return await svc.public_cancel(appointment_id, data)


@router.post("/{appointment_id}/reschedule", response_model=PublicAppointmentItem)
async def reschedule_public_appointment(
    appointment_id: uuid.UUID,
    data: PublicAppointmentReschedule,
    svc: Annotated[AppointmentService, Depends(get_appointment_service)],
) -> PublicAppointmentItem:
    return await svc.public_reschedule(appointment_id, data)
