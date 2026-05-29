import uuid
from datetime import date

from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.schemas.professional import parse_time_str


class ScheduleBlockCreate(BaseModel):
    block_date: date
    start_time: str = Field(pattern=r"^([01]\d|2[0-3]):([0-5]\d)$")
    end_time: str = Field(pattern=r"^([01]\d|2[0-3]):([0-5]\d)$")
    reason: str | None = Field(default=None, max_length=200)

    @model_validator(mode="after")
    def validate_range(self) -> "ScheduleBlockCreate":
        if parse_time_str(self.start_time) >= parse_time_str(self.end_time):
            raise ValueError("start_time deve ser anterior a end_time")
        return self


class ScheduleBlockResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    professional_id: uuid.UUID
    block_date: date
    start_time: str
    end_time: str
    reason: str | None
