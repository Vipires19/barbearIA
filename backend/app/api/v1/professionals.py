import uuid

from datetime import date

from typing import Annotated



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

)

from app.services.appointment_service import AppointmentService

from app.services.professional_service import ProfessionalService



router = APIRouter(prefix="/professionals", tags=["professionals"])





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

    appointment_date: date = Query(..., alias="date"),

) -> AvailableSlotsResponse:

    ids = service_ids or ([] if service_id is None else [service_id])

    if not ids:

        from app.core.exceptions import AppError



        raise AppError("Informe service_id ou service_ids", status_code=400)

    return await svc.list_available_slots(

        professional_id=professional_id,

        service_ids=ids,

        appointment_date=appointment_date,

    )





@router.get("/{professional_id}/availabilities", response_model=list[ProfessionalAvailabilityResponse])

async def list_availabilities(

    professional_id: uuid.UUID,

    svc: Annotated[ProfessionalService, Depends(get_professional_service)],

    current_user: Annotated[User, Depends(get_current_user)],

) -> list[ProfessionalAvailabilityResponse]:

    return await svc.list_availabilities(professional_id, current_user)





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

