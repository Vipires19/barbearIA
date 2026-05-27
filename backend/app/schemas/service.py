import uuid
from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


class ServiceBase(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    description: str | None = Field(default=None, max_length=5000)
    price: Decimal = Field(gt=0, decimal_places=2, max_digits=10)
    duration_minutes: int = Field(ge=5, le=480, default=30)
    is_active: bool = True


class ServiceCreate(ServiceBase):
    pass


class ServiceUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = None
    price: Decimal | None = Field(default=None, gt=0, decimal_places=2, max_digits=10)
    duration_minutes: int | None = Field(default=None, ge=5, le=480)
    is_active: bool | None = None


class ServiceResponse(ServiceBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    image_url: str | None
    created_at: datetime
    updated_at: datetime


class ServiceListResponse(BaseModel):
    items: list[ServiceResponse]
    total: int
    page: int
    page_size: int
    pages: int
