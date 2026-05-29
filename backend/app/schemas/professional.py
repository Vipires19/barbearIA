import re

import uuid

from datetime import datetime, time



from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator, model_validator



_TIME_RE = re.compile(r"^([01]\d|2[0-3]):([0-5]\d)$")





def parse_time_str(value: str) -> time:

    if not _TIME_RE.match(value):

        raise ValueError("Horário inválido. Use HH:MM (ex: 09:00)")

    hour, minute = map(int, value.split(":"))

    return time(hour, minute)





def format_time(t: time) -> str:

    return t.strftime("%H:%M")





class ServiceSummary(BaseModel):

    model_config = ConfigDict(from_attributes=True)



    id: uuid.UUID

    name: str





class ProfessionalAvailabilityBase(BaseModel):

    weekday: int = Field(ge=0, le=6)

    start_time: str = Field(pattern=r"^([01]\d|2[0-3]):([0-5]\d)$")

    end_time: str = Field(pattern=r"^([01]\d|2[0-3]):([0-5]\d)$")

    active: bool = True



    @model_validator(mode="after")

    def validate_range(self) -> "ProfessionalAvailabilityBase":

        if parse_time_str(self.start_time) >= parse_time_str(self.end_time):

            raise ValueError("start_time deve ser anterior a end_time")

        return self





class ProfessionalAvailabilityCreate(ProfessionalAvailabilityBase):

    pass





class ProfessionalAvailabilityUpdate(BaseModel):

    weekday: int | None = Field(default=None, ge=0, le=6)

    start_time: str | None = Field(default=None, pattern=r"^([01]\d|2[0-3]):([0-5]\d)$")

    end_time: str | None = Field(default=None, pattern=r"^([01]\d|2[0-3]):([0-5]\d)$")

    active: bool | None = None





class ProfessionalAvailabilityResponse(BaseModel):

    model_config = ConfigDict(from_attributes=True)



    id: uuid.UUID

    professional_id: uuid.UUID

    weekday: int

    start_time: str

    end_time: str

    active: bool





class AvailabilityTimeBlock(BaseModel):

    start_time: str = Field(pattern=r"^([01]\d|2[0-3]):([0-5]\d)$")

    end_time: str = Field(pattern=r"^([01]\d|2[0-3]):([0-5]\d)$")



    @model_validator(mode="after")

    def validate_range(self) -> "AvailabilityTimeBlock":

        if parse_time_str(self.start_time) >= parse_time_str(self.end_time):

            raise ValueError("start_time deve ser anterior a end_time")

        return self





class WeekdayAvailabilityInput(BaseModel):

    weekday: int = Field(ge=0, le=6)

    active: bool = True

    blocks: list[AvailabilityTimeBlock] = Field(default_factory=list)



    @model_validator(mode="after")

    def validate_day(self) -> "WeekdayAvailabilityInput":

        if self.active and not self.blocks:

            raise ValueError("Informe ao menos um bloco de horário para dias ativos")

        if not self.active:

            return self

        times = [(parse_time_str(b.start_time), parse_time_str(b.end_time)) for b in self.blocks]

        ordered = sorted(times, key=lambda t: t[0])

        for i in range(1, len(ordered)):

            if ordered[i][0] < ordered[i - 1][1]:

                raise ValueError("Blocos de horário não podem se sobrepor no mesmo dia")

        return self





class WeekdayAvailabilityResponse(BaseModel):

    weekday: int = Field(ge=0, le=6)

    active: bool

    blocks: list[AvailabilityTimeBlock] = Field(default_factory=list)





class ProfessionalCreate(BaseModel):

    """Onboarding admin: dados básicos + acesso + controle operacional."""



    name: str = Field(min_length=1, max_length=200)

    login_email: EmailStr

    login_password: str | None = Field(default=None, min_length=6, max_length=128)

    is_active: bool = True





class ProfessionalAdminUpdate(BaseModel):

    name: str | None = Field(default=None, min_length=1, max_length=200)

    is_active: bool | None = None





class ProfessionalProfileUpdate(BaseModel):

    bio: str | None = Field(default=None, max_length=5000)

    specialties: list[str] | None = None

    service_ids: list[uuid.UUID] | None = None

    is_publicly_visible: bool | None = None



    @field_validator("specialties")

    @classmethod

    def validate_specialties(cls, v: list[str] | None) -> list[str] | None:

        if v is None:

            return v

        return [s.strip() for s in v if s.strip()][:20]





class ProfessionalResetPassword(BaseModel):

    new_password: str = Field(min_length=6, max_length=128)





class ProfessionalAccessCreate(BaseModel):

    email: EmailStr

    password: str = Field(min_length=6, max_length=128)





class ProfessionalAccessUpdate(BaseModel):

    email: EmailStr | None = None

    is_active: bool | None = None





class ProfessionalResponse(BaseModel):

    model_config = ConfigDict(from_attributes=True)



    id: uuid.UUID

    name: str

    bio: str | None

    avatar_url: str | None

    specialties: list[str]

    is_active: bool

    is_publicly_visible: bool

    user_id: uuid.UUID | None = None

    login_email: str | None = None

    login_is_active: bool | None = None

    services: list[ServiceSummary] = Field(default_factory=list)

    availabilities: list[ProfessionalAvailabilityResponse] = Field(default_factory=list)

    created_at: datetime

    updated_at: datetime





class ProfessionalCreateResponse(ProfessionalResponse):

    temporary_password: str | None = None





class ProfessionalListResponse(BaseModel):

    items: list[ProfessionalResponse]

    total: int

    page: int

    page_size: int

    pages: int

