import uuid
from datetime import date, datetime
from decimal import Decimal
from enum import Enum

from pydantic import BaseModel, ConfigDict, Field


def decimal_to_float(value: Decimal | None) -> float:
    if value is None:
        return 0.0
    return float(value)


class InventoryMovementTypeSchema(str, Enum):
    IN = "IN"
    OUT = "OUT"
    ADJUSTMENT = "ADJUSTMENT"


class SaleStatusSchema(str, Enum):
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"


class ProductCreate(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    description: str | None = Field(default=None, max_length=2000)
    category_id: uuid.UUID
    purchase_price: Decimal = Field(ge=0)
    sale_price: Decimal = Field(gt=0)
    stock_quantity: int = Field(default=0, ge=0)
    minimum_stock: int = Field(default=0, ge=0)
    is_active: bool = True


class ProductUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = Field(default=None, max_length=2000)
    category_id: uuid.UUID | None = None
    purchase_price: Decimal | None = Field(default=None, ge=0)
    sale_price: Decimal | None = Field(default=None, gt=0)
    minimum_stock: int | None = Field(default=None, ge=0)
    is_active: bool | None = None


class StockUpdate(BaseModel):
    movement_type: InventoryMovementTypeSchema
    quantity: int = Field(gt=0)
    reason: str | None = Field(default=None, max_length=500)
    new_quantity: int | None = Field(default=None, ge=0)


class ProductCategoryBrief(BaseModel):
    id: uuid.UUID
    name: str
    color: str


class ProductResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    description: str | None
    category_id: uuid.UUID
    category: ProductCategoryBrief | None = None
    purchase_price: float
    sale_price: float
    stock_quantity: int
    minimum_stock: int
    is_active: bool
    is_low_stock: bool
    created_at: datetime
    updated_at: datetime


class ProductListResponse(BaseModel):
    items: list[ProductResponse]
    total: int
    page: int
    page_size: int
    pages: int


class InventoryMovementResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    product_id: uuid.UUID
    product_name: str
    movement_type: str
    quantity: int
    previous_stock: int
    new_stock: int
    reason: str | None
    created_by_name: str | None
    sale_id: uuid.UUID | None
    created_at: datetime


class InventoryMovementListResponse(BaseModel):
    items: list[InventoryMovementResponse]
    total: int
    page: int
    page_size: int
    pages: int


class SaleItemCreate(BaseModel):
    product_id: uuid.UUID
    quantity: int = Field(gt=0)


class SaleCreate(BaseModel):
    items: list[SaleItemCreate] = Field(min_length=1)


class SaleItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    product_id: uuid.UUID
    product_name: str
    quantity: int
    unit_price: float
    subtotal: float


class SaleResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    total_amount: float
    status: str
    created_by_name: str | None
    created_at: datetime
    cancelled_at: datetime | None
    items: list[SaleItemResponse]


class SaleListResponse(BaseModel):
    items: list[SaleResponse]
    total: int
    page: int
    page_size: int
    pages: int


class InventoryDashboardResponse(BaseModel):
    products_count: int
    low_stock_count: int
    period_sales_count: int
    product_sales_revenue: float
    service_revenue: float
    total_revenue: float
    period_started_at: datetime | None
