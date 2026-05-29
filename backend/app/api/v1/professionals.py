import uuid

from datetime import date as date_type

from typing import Annotated
import logging



from fastapi import APIRouter, Depends, File, Query, UploadFile, status



from app.core.deps import (

    get_appointment_service,

    get_current_user,

    get_current_user_optional,

    get_professional_service,

)

from app.models.user import User

from app.schemas.appointment import AvailableSlotsResponse

from app.schemas.professional import (

    ProfessionalAccessCreate,

    ProfessionalAccessUpdate,

    ProfessionalAdminUpdate,

    ProfessionalAvailabilityCreate,

    ProfessionalAvailabilityResponse,

    ProfessionalAvailabilityUpdate,

    ProfessionalCreate,

    ProfessionalCreateResponse,

    ProfessionalListResponse,

    ProfessionalProfileUpdate,

    ProfessionalResetPassword,

    ProfessionalResponse,

    WeekdayAvailabilityInput,

    WeekdayAvailabilityResponse,

)

from app.schemas.schedule_block import ScheduleBlockCreate, ScheduleBlockResponse

from app.services.appointment_service import AppointmentService

from app.services.professional_service import ProfessionalService



router = APIRouter(prefix="/professionals", tags=["professionals"])
logger = logging.getLogger(__name__)





@router.get("", response_model=ProfessionalListResponse)

async def list_professionals(

    svc: Annotated[ProfessionalService, Depends(get_professional_service)],

    current_user: Annotated[User | None, Depends(get_current_user_optional)],

    page: int = Query(1, ge=1),

    page_size: int = Query(20, ge=1, le=100),

    search: str | None = Query(None, max_length=200),

    is_active: bool | None = Query(None),

    service_id: uuid.UUID | None = Query(None),

) -> ProfessionalListResponse:

    return await svc.list_professionals(

        page=page,

        page_size=page_size,

        search=search,

        is_active=is_active,

        service_id=service_id,

        current_user=current_user,

    )





@router.get("/me/profile", response_model=ProfessionalResponse)

async def get_my_profile(

    svc: Annotated[ProfessionalService, Depends(get_professional_service)],

    current_user: Annotated[User, Depends(get_current_user)],

) -> ProfessionalResponse:

    return await svc.get_my_profile(current_user)





@router.patch("/me/profile", response_model=ProfessionalResponse)

async def update_my_profile(

    data: ProfessionalProfileUpdate,

    svc: Annotated[ProfessionalService, Depends(get_professional_service)],

    current_user: Annotated[User, Depends(get_current_user)],

) -> ProfessionalResponse:

    return await svc.update_my_profile(data, current_user)





@router.post("/me/avatar", response_model=ProfessionalResponse)

async def upload_my_avatar(

    svc: Annotated[ProfessionalService, Depends(get_professional_service)],

    current_user: Annotated[User, Depends(get_current_user)],

    file: UploadFile = File(...),

) -> ProfessionalResponse:

    return await svc.upload_my_avatar(file, current_user)





@router.get("/me/availabilities", response_model=list[WeekdayAvailabilityResponse])

async def get_my_availabilities(

    svc: Annotated[ProfessionalService, Depends(get_professional_service)],

    current_user: Annotated[User, Depends(get_current_user)],

) -> list[WeekdayAvailabilityResponse]:

    return await svc.get_my_grouped_availabilities(current_user)





@router.put("/me/availabilities", response_model=list[WeekdayAvailabilityResponse])

async def replace_my_availabilities(

    data: list[WeekdayAvailabilityInput],

    svc: Annotated[ProfessionalService, Depends(get_professional_service)],

    current_user: Annotated[User, Depends(get_current_user)],

) -> list[WeekdayAvailabilityResponse]:

    return await svc.replace_my_grouped_availabilities(data, current_user)





@router.get("/me/schedule-blocks", response_model=list[ScheduleBlockResponse])

async def list_my_schedule_blocks(

    svc: Annotated[ProfessionalService, Depends(get_professional_service)],

    current_user: Annotated[User, Depends(get_current_user)],

    block_date: date_type = Query(..., alias="date"),

) -> list[ScheduleBlockResponse]:

    return await svc.list_my_schedule_blocks(block_date, current_user)





@router.post("/me/schedule-blocks", response_model=ScheduleBlockResponse, status_code=status.HTTP_201_CREATED)

async def create_my_schedule_block(

    data: ScheduleBlockCreate,

    svc: Annotated[ProfessionalService, Depends(get_professional_service)],

    current_user: Annotated[User, Depends(get_current_user)],

) -> ScheduleBlockResponse:

    return await svc.create_my_schedule_block(data, current_user)





@router.delete("/me/schedule-blocks/{block_id}", status_code=status.HTTP_204_NO_CONTENT)

async def delete_my_schedule_block(

    block_id: uuid.UUID,

    svc: Annotated[ProfessionalService, Depends(get_professional_service)],

    current_user: Annotated[User, Depends(get_current_user)],

) -> None:

    await svc.delete_my_schedule_block(block_id, current_user)





@router.get("/{professional_id}/schedule-blocks", response_model=list[ScheduleBlockResponse])

async def list_schedule_blocks(

    professional_id: uuid.UUID,

    svc: Annotated[ProfessionalService, Depends(get_professional_service)],

    current_user: Annotated[User, Depends(get_current_user)],

    block_date: date_type = Query(..., alias="date"),

) -> list[ScheduleBlockResponse]:

    return await svc.list_schedule_blocks(professional_id, block_date, current_user)





@router.post(

    "/{professional_id}/schedule-blocks",

    response_model=ScheduleBlockResponse,

    status_code=status.HTTP_201_CREATED,

)

async def create_schedule_block(

    professional_id: uuid.UUID,

    data: ScheduleBlockCreate,

    svc: Annotated[ProfessionalService, Depends(get_professional_service)],

    current_user: Annotated[User, Depends(get_current_user)],

) -> ScheduleBlockResponse:

    return await svc.create_schedule_block(professional_id, data, current_user)





@router.delete("/{professional_id}/schedule-blocks/{block_id}", status_code=status.HTTP_204_NO_CONTENT)

async def delete_schedule_block(

    professional_id: uuid.UUID,

    block_id: uuid.UUID,

    svc: Annotated[ProfessionalService, Depends(get_professional_service)],

    current_user: Annotated[User, Depends(get_current_user)],

) -> None:

    await svc.delete_schedule_block(professional_id, block_id, current_user)





@router.post("", response_model=ProfessionalCreateResponse, status_code=status.HTTP_201_CREATED)

async def create_professional(

    data: ProfessionalCreate,

    svc: Annotated[ProfessionalService, Depends(get_professional_service)],

    current_user: Annotated[User, Depends(get_current_user)],

) -> ProfessionalCreateResponse:

    return await svc.create(data, current_user)





@router.post("/{professional_id}/access", response_model=ProfessionalResponse, status_code=status.HTTP_201_CREATED)

async def create_professional_access(

    professional_id: uuid.UUID,

    data: ProfessionalAccessCreate,

    svc: Annotated[ProfessionalService, Depends(get_professional_service)],

    current_user: Annotated[User, Depends(get_current_user)],

) -> ProfessionalResponse:

    return await svc.create_access(professional_id, data, current_user)





@router.patch("/{professional_id}/access", response_model=ProfessionalResponse)

async def update_professional_access(

    professional_id: uuid.UUID,

    data: ProfessionalAccessUpdate,

    svc: Annotated[ProfessionalService, Depends(get_professional_service)],

    current_user: Annotated[User, Depends(get_current_user)],

) -> ProfessionalResponse:

    return await svc.update_access(professional_id, data, current_user)





@router.delete("/{professional_id}/access", response_model=ProfessionalResponse)

async def delete_professional_access(

    professional_id: uuid.UUID,

    svc: Annotated[ProfessionalService, Depends(get_professional_service)],

    current_user: Annotated[User, Depends(get_current_user)],

) -> ProfessionalResponse:

    return await svc.delete_access(professional_id, current_user)





@router.post("/{professional_id}/reset-password", response_model=ProfessionalResponse)

async def reset_professional_password(

    professional_id: uuid.UUID,

    data: ProfessionalResetPassword,

    svc: Annotated[ProfessionalService, Depends(get_professional_service)],

    current_user: Annotated[User, Depends(get_current_user)],

) -> ProfessionalResponse:

    return await svc.reset_access_password(professional_id, data, current_user)





@router.get("/{professional_id}/available-slots", response_model=AvailableSlotsResponse)

async def list_available_slots(

    professional_id: uuid.UUID,

    svc: Annotated[AppointmentService, Depends(get_appointment_service)],

    service_id: uuid.UUID | None = Query(None),

    service_ids: list[uuid.UUID] | None = Query(None),
    service_ids_legacy: list[uuid.UUID] | None = Query(None, alias="service_ids[]"),

    appointment_date: date_type = Query(..., alias="date"),

) -> AvailableSlotsResponse:

    ids = service_ids or service_ids_legacy or ([] if service_id is None else [service_id])
    logger.info(
        "available-slots params service_id=%s service_ids=%s service_ids_legacy=%s resolved=%s",
        service_id,
        service_ids,
        service_ids_legacy,
        ids,
    )

    if not ids:

        from app.core.exceptions import AppError



        raise AppError("Informe service_id ou service_ids", status_code=400)

    response = await svc.list_available_slots(

        professional_id=professional_id,

        service_ids=ids,

        appointment_date=appointment_date,

    )
    logger.info(
        "available-slots computed professional_id=%s duration=%s slots=%s",
        professional_id,
        response.duration_minutes,
        len(response.slots),
    )
    return response





@router.get("/{professional_id}/availabilities", response_model=list[WeekdayAvailabilityResponse])

async def list_availabilities(

    professional_id: uuid.UUID,

    svc: Annotated[ProfessionalService, Depends(get_professional_service)],

    current_user: Annotated[User, Depends(get_current_user)],

) -> list[WeekdayAvailabilityResponse]:

    return await svc.get_grouped_availabilities(professional_id, current_user)





@router.put("/{professional_id}/availabilities", response_model=list[WeekdayAvailabilityResponse])

async def replace_availabilities(

    professional_id: uuid.UUID,

    data: list[WeekdayAvailabilityInput],

    svc: Annotated[ProfessionalService, Depends(get_professional_service)],

    current_user: Annotated[User, Depends(get_current_user)],

) -> list[WeekdayAvailabilityResponse]:

    return await svc.replace_grouped_availabilities(professional_id, data, current_user)





@router.post(

    "/{professional_id}/availabilities",

    response_model=ProfessionalAvailabilityResponse,

    status_code=status.HTTP_201_CREATED,

)

async def create_availability(

    professional_id: uuid.UUID,

    data: ProfessionalAvailabilityCreate,

    svc: Annotated[ProfessionalService, Depends(get_professional_service)],

    current_user: Annotated[User, Depends(get_current_user)],

) -> ProfessionalAvailabilityResponse:

    return await svc.create_availability(professional_id, data, current_user)





@router.patch(

    "/{professional_id}/availabilities/{availability_id}",

    response_model=ProfessionalAvailabilityResponse,

)

async def update_availability(

    professional_id: uuid.UUID,

    availability_id: uuid.UUID,

    data: ProfessionalAvailabilityUpdate,

    svc: Annotated[ProfessionalService, Depends(get_professional_service)],

    current_user: Annotated[User, Depends(get_current_user)],

) -> ProfessionalAvailabilityResponse:

    return await svc.update_availability(professional_id, availability_id, data, current_user)





@router.delete("/{professional_id}/availabilities/{availability_id}", status_code=status.HTTP_204_NO_CONTENT)

async def delete_availability(

    professional_id: uuid.UUID,

    availability_id: uuid.UUID,

    svc: Annotated[ProfessionalService, Depends(get_professional_service)],

    current_user: Annotated[User, Depends(get_current_user)],

) -> None:

    await svc.delete_availability(professional_id, availability_id, current_user)





@router.get("/{professional_id}", response_model=ProfessionalResponse)

async def get_professional(

    professional_id: uuid.UUID,

    svc: Annotated[ProfessionalService, Depends(get_professional_service)],

    current_user: Annotated[User | None, Depends(get_current_user_optional)],

) -> ProfessionalResponse:

    return await svc.get_by_id(professional_id, current_user)





@router.patch("/{professional_id}", response_model=ProfessionalResponse)

async def update_professional(

    professional_id: uuid.UUID,

    data: ProfessionalAdminUpdate,

    svc: Annotated[ProfessionalService, Depends(get_professional_service)],

    current_user: Annotated[User, Depends(get_current_user)],

) -> ProfessionalResponse:

    return await svc.update_admin(professional_id, data, current_user)





@router.patch("/{professional_id}/profile", response_model=ProfessionalResponse)

async def update_professional_profile(

    professional_id: uuid.UUID,

    data: ProfessionalProfileUpdate,

    svc: Annotated[ProfessionalService, Depends(get_professional_service)],

    current_user: Annotated[User, Depends(get_current_user)],

) -> ProfessionalResponse:

    return await svc.update_profile(professional_id, data, current_user)





@router.delete("/{professional_id}", status_code=status.HTTP_204_NO_CONTENT)

async def delete_professional(

    professional_id: uuid.UUID,

    svc: Annotated[ProfessionalService, Depends(get_professional_service)],

    current_user: Annotated[User, Depends(get_current_user)],

) -> None:

    await svc.delete(professional_id, current_user)





@router.post("/{professional_id}/avatar", response_model=ProfessionalResponse)

async def upload_professional_avatar(

    professional_id: uuid.UUID,

    svc: Annotated[ProfessionalService, Depends(get_professional_service)],

    current_user: Annotated[User, Depends(get_current_user)],

    file: UploadFile = File(...),

) -> ProfessionalResponse:

    return await svc.upload_avatar(professional_id, file, current_user)

