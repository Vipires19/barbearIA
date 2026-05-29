import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, Query, status

from app.core.deps import get_current_user, get_financial_service
from app.models.user import User
from app.schemas.financial import (
    AdvanceCreate,
    AdvanceResponse,
    ExpenseCreate,
    ExpenseResponse,
    FinancialDashboardResponse,
    FinancialPeriodListResponse,
    FinancialPeriodResponse,
    FinancialSettingsResponse,
    FinancialSettingsUpdate,
    ParticipationSummaryResponse,
    ProfessionalWalletResponse,
)
from app.services.financial_service import FinancialService

router = APIRouter(prefix="/financial", tags=["financial"])


@router.get("/dashboard", response_model=FinancialDashboardResponse)
async def get_financial_dashboard(
    svc: Annotated[FinancialService, Depends(get_financial_service)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> FinancialDashboardResponse:
    return await svc.get_dashboard(current_user)


@router.get("/periods", response_model=FinancialPeriodListResponse)
async def list_financial_periods(
    svc: Annotated[FinancialService, Depends(get_financial_service)],
    current_user: Annotated[User, Depends(get_current_user)],
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
) -> FinancialPeriodListResponse:
    return await svc.list_periods(page=page, page_size=page_size, current_user=current_user)


@router.get("/participation-summary", response_model=ParticipationSummaryResponse)
async def get_participation_summary(
    svc: Annotated[FinancialService, Depends(get_financial_service)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> ParticipationSummaryResponse:
    return await svc.get_participation_summary(current_user)


@router.get("/my-wallet", response_model=ProfessionalWalletResponse)
async def get_my_wallet(
    svc: Annotated[FinancialService, Depends(get_financial_service)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> ProfessionalWalletResponse:
    return await svc.get_my_wallet(current_user)


@router.post("/expenses", response_model=ExpenseResponse, status_code=status.HTTP_201_CREATED)
async def create_expense(
    data: ExpenseCreate,
    svc: Annotated[FinancialService, Depends(get_financial_service)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> ExpenseResponse:
    return await svc.create_expense(data, current_user)


@router.post("/advances", response_model=AdvanceResponse, status_code=status.HTTP_201_CREATED)
async def create_advance(
    data: AdvanceCreate,
    svc: Annotated[FinancialService, Depends(get_financial_service)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> AdvanceResponse:
    return await svc.create_advance(data, current_user)


@router.post("/periods/close", response_model=FinancialPeriodResponse)
async def close_financial_period(
    svc: Annotated[FinancialService, Depends(get_financial_service)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> FinancialPeriodResponse:
    return await svc.close_period(current_user)


@router.patch("/settings", response_model=FinancialSettingsResponse)
async def update_financial_settings(
    data: FinancialSettingsUpdate,
    svc: Annotated[FinancialService, Depends(get_financial_service)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> FinancialSettingsResponse:
    return await svc.update_settings(data, current_user)
