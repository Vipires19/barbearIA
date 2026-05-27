import uuid

from datetime import date

from enum import Enum



from pydantic import BaseModel, ConfigDict, EmailStr, Field, model_validator



from app.models.appointment import AppointmentStatus





class PublicAppointmentScope(str, Enum):

    all = "all"

    upcoming = "upcoming"

    past = "past"





class PublicServiceSummary(BaseModel):

    name: str

    duration_minutes: int





class PublicAppointmentServiceItem(BaseModel):

    name: str

    duration_minutes: int





class PublicProfessionalSummary(BaseModel):

    model_config = ConfigDict(from_attributes=True)



    name: str





class PublicAppointmentItem(BaseModel):

    """Resposta pública: sem e-mail, sem notas."""



    id: uuid.UUID

    service_ids: list[uuid.UUID]

    professional_id: uuid.UUID

    client_display_name: str

    services: list[PublicAppointmentServiceItem]

    professional: PublicProfessionalSummary

    appointment_date: date

    start_time: str

    end_time: str

    total_duration_minutes: int

    status: AppointmentStatus



    @property

    def service_id(self) -> uuid.UUID | None:

        return self.service_ids[0] if self.service_ids else None





class PublicAppointmentListResponse(BaseModel):

    items: list[PublicAppointmentItem]

    upcoming: list[PublicAppointmentItem]

    past: list[PublicAppointmentItem]





class PublicAppointmentCreate(BaseModel):

    client_name: str = Field(min_length=1, max_length=200)

    client_phone: str = Field(min_length=8, max_length=30)

    client_email: EmailStr | None = None

    professional_id: uuid.UUID

    appointment_date: date

    start_time: str = Field(pattern=r"^([01]\d|2[0-3]):([0-5]\d)$")

    service_ids: list[uuid.UUID] = Field(min_length=1, max_length=10)

    notes: str | None = Field(default=None, max_length=5000)



    @model_validator(mode="before")

    @classmethod

    def legacy_service_id(cls, data: object) -> object:

        if isinstance(data, dict) and "service_id" in data and "service_ids" not in data:

            data = {**data, "service_ids": [data["service_id"]]}

        return data





class PublicAppointmentCancel(BaseModel):

    phone: str = Field(min_length=8, max_length=30)

    notes: str | None = Field(default=None, max_length=5000)





class PublicAppointmentReschedule(BaseModel):

    phone: str = Field(min_length=8, max_length=30)

    appointment_date: date

    start_time: str = Field(pattern=r"^([01]\d|2[0-3]):([0-5]\d)$")

    professional_id: uuid.UUID | None = None

