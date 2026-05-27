import uuid
from datetime import date, datetime, time
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator, model_validator

from app.models.appointment import AppointmentStatus
from app.schemas.professional import format_time, parse_time_str


class AppointmentItemSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    service_id: uuid.UUID
    service_name: str
    duration_minutes: int
    price: float
    position: int


class AppointmentProfessionalSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    avatar_url: str | None


class AppointmentBase(BaseModel):
    client_name: str = Field(min_length=1, max_length=200)
    client_phone: str = Field(min_length=8, max_length=30)
    client_email: EmailStr | None = None
    professional_id: uuid.UUID
    appointment_date: date
    start_time: str = Field(pattern=r"^([01]\d|2[0-3]):([0-5]\d)$")
    service_ids: list[uuid.UUID] = Field(min_length=1, max_length=10)
    notes: str | None = Field(default=None, max_length=5000)

    @field_validator("service_ids")
    @classmethod
    def unique_services(cls, v: list[uuid.UUID]) -> list[uuid.UUID]:
        if len(v) != len(set(v)):
            raise ValueError("Serviços duplicados não são permitidos")
        return v


class AppointmentCreate(AppointmentBase):
    @model_validator(mode="before")
    @classmethod
    def legacy_service_id(cls, data: object) -> object:
        if isinstance(data, dict) and "service_id" in data and "service_ids" not in data:
            data = {**data, "service_ids": [data["service_id"]]}
        return data


class AppointmentUpdate(BaseModel):
    client_name: str | None = Field(default=None, min_length=1, max_length=200)
    client_phone: str | None = Field(default=None, min_length=8, max_length=30)
    client_email: EmailStr | None = None
    status: AppointmentStatus | None = None
    notes: str | None = Field(default=None, max_length=5000)


class AppointmentCancel(BaseModel):
    notes: str | None = Field(default=None, max_length=5000)


class AppointmentReschedule(BaseModel):
    appointment_date: date
    start_time: str = Field(pattern=r"^([01]\d|2[0-3]):([0-5]\d)$")
    professional_id: uuid.UUID | None = None


class AppointmentResponse(BaseModel):
    id: uuid.UUID
    client_name: str
    client_phone: str
    client_email: str | None
    professional_id: uuid.UUID
    appointment_date: date
    start_time: str
    end_time: str
    total_duration_minutes: int
    total_price: float
    status: AppointmentStatus
    notes: str | None
    items: list[AppointmentItemSummary]
    professional: AppointmentProfessionalSummary
    created_at: datetime
    updated_at: datetime

    @property
    def service_id(self) -> uuid.UUID | None:
        """Compatibilidade: primeiro serviço da sessão."""
        return self.items[0].service_id if self.items else None


class AppointmentListResponse(BaseModel):
    items: list[AppointmentResponse]
    total: int
    page: int
    page_size: int
    pages: int


class AppointmentFilters(BaseModel):
    page: int = 1
    page_size: int = 20
    search: str | None = None
    status: AppointmentStatus | None = None
    professional_id: uuid.UUID | None = None
    service_id: uuid.UUID | None = None
    date_from: date | None = None
    date_to: date | None = None


class AvailableSlot(BaseModel):
    start_time: str
    end_time: str
    available: bool = True


class AvailableSlotsResponse(BaseModel):
    professional_id: uuid.UUID
    service_ids: list[uuid.UUID]
    date: date
    duration_minutes: int
    slots: list[AvailableSlot]


def normalize_time(value: str) -> time:
    return parse_time_str(value)


def serialize_time(value: time) -> str:
    return format_time(value)


def decimal_to_float(value: Decimal) -> float:
    return float(value)
