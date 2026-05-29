import uuid
from datetime import date, datetime
from decimal import Decimal
from enum import Enum

from pydantic import BaseModel, ConfigDict, Field


def decimal_to_float(value: Decimal | None) -> float:
    if value is None:
        return 0.0
    return float(value)


class ExpenseCategorySchema(str, Enum):
    RENT = "RENT"
    ENERGY = "ENERGY"
    WATER = "WATER"
    INTERNET = "INTERNET"
    SUPPLIES = "SUPPLIES"
    MAINTENANCE = "MAINTENANCE"
    TAXES = "TAXES"
    OTHER = "OTHER"


EXPENSE_CATEGORY_LABELS: dict[str, str] = {
    "RENT": "Aluguel",
    "ENERGY": "Energia",
    "WATER": "Água",
    "INTERNET": "Internet",
    "SUPPLIES": "Materiais",
    "MAINTENANCE": "Manutenção",
    "TAXES": "Impostos",
    "OTHER": "Outros",
}


class FinancialSettingsUpdate(BaseModel):
    reserve_percentage: Decimal = Field(ge=0, le=100)


class FinancialSettingsResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    reserve_percentage: float
    accumulated_reserve: float
    updated_at: datetime


class ExpenseCreate(BaseModel):
    description: str = Field(min_length=1, max_length=500)
    category: ExpenseCategorySchema
    amount: Decimal = Field(gt=0)
    expense_date: date


class ExpenseResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    period_id: uuid.UUID
    description: str
    category: str
    category_label: str
    amount: float
    expense_date: date
    created_at: datetime


class AdvanceCreate(BaseModel):
    professional_id: uuid.UUID
    amount: Decimal = Field(gt=0)
    notes: str | None = Field(default=None, max_length=2000)


class AdvanceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    period_id: uuid.UUID
    professional_id: uuid.UUID
    professional_name: str
    amount: float
    notes: str | None
    created_at: datetime


class DistributionSnapshot(BaseModel):
    professional_id: uuid.UUID
    professional_name: str
    participation_percentage: float
    gross_amount: float
    advances_deducted: float
    net_amount: float


class FinancialPeriodResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    status: str
    started_at: datetime
    closed_at: datetime | None
    total_revenue: float | None
    total_expenses: float | None
    operational_result: float | None
    reserve_applied: float | None
    distributable_amount: float | None
    reserve_percentage_snapshot: float | None
    accumulated_reserve_after: float | None
    distributions: list[DistributionSnapshot] = Field(default_factory=list)


class FinancialPeriodListResponse(BaseModel):
    items: list[FinancialPeriodResponse]
    total: int
    page: int
    page_size: int
    pages: int


class ProfessionalDistributionPreview(BaseModel):
    professional_id: uuid.UUID
    professional_name: str
    participation_percentage: float
    estimated_gross: float
    advances_in_period: float
    estimated_net: float


class FinancialDashboardResponse(BaseModel):
    current_period: FinancialPeriodResponse
    settings: FinancialSettingsResponse
    total_revenue: float
    total_expenses: float
    operational_result: float
    reserve_applied: float
    distributable_amount: float
    accumulated_reserve: float
    active_professionals_count: int
    expenses: list[ExpenseResponse]
    advances: list[AdvanceResponse]
    distribution_preview: list[ProfessionalDistributionPreview]


class ProfessionalWalletResponse(BaseModel):
    professional_id: uuid.UUID
    professional_name: str
    participation_percentage: float
    closed_participation_total: float
    closed_advances_total: float
    closed_net_total: float
    current_period_estimated_gross: float
    current_period_advances: float
    current_period_estimated_net: float
    estimated_balance: float


class ParticipationSummaryResponse(BaseModel):
    total_percentage: float
    active_professionals_count: int
    is_valid: bool
