import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class ProductCategoryCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    description: str | None = Field(default=None, max_length=500)
    color: str = Field(default="#6366f1", min_length=4, max_length=7)
    is_active: bool = True


class ProductCategoryUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=100)
    description: str | None = Field(default=None, max_length=500)
    color: str | None = Field(default=None, min_length=4, max_length=7)
    is_active: bool | None = None


class ProductCategoryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    description: str | None
    color: str
    is_active: bool
    products_count: int = 0
    created_at: datetime
    updated_at: datetime


class ProductCategoryListResponse(BaseModel):
    items: list[ProductCategoryResponse]


class CategoryAggregationItem(BaseModel):
    category_id: uuid.UUID
    category_name: str
    color: str
    is_active: bool
    products_count: int
    revenue: float
    quantity_sold: int


class CategoryAggregationsResponse(BaseModel):
    items: list[CategoryAggregationItem]
    period_started_at: datetime | None
