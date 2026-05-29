import uuid
from datetime import datetime, timezone
from decimal import Decimal

from sqlalchemy.exc import IntegrityError
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.exceptions import ConflictError
from app.models.financial import (
    Advance,
    Expense,
    FinancialAuditLog,
    FinancialEntry,
    FinancialPeriod,
    FinancialPeriodStatus,
    FinancialSettings,
    ProfitDistribution,
    ReserveHistory,
    REVENUE_ENTRY_TYPES,
)
from app.models.professional import Professional


class FinancialRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def get_settings(self) -> FinancialSettings | None:
        result = await self._session.execute(select(FinancialSettings).limit(1))
        return result.scalar_one_or_none()

    async def create_default_settings(self) -> FinancialSettings:
        settings = FinancialSettings(reserve_percentage=Decimal("0"), accumulated_reserve=Decimal("0"))
        self._session.add(settings)
        await self._session.flush()
        await self._session.refresh(settings)
        return settings

    async def update_settings(self, settings: FinancialSettings, **fields) -> FinancialSettings:
        for key, value in fields.items():
            if value is not None:
                setattr(settings, key, value)
        await self._session.flush()
        await self._session.refresh(settings)
        return settings

    async def get_open_period(self) -> FinancialPeriod | None:
        result = await self._session.execute(
            select(FinancialPeriod)
            .where(FinancialPeriod.status == FinancialPeriodStatus.open)
            .order_by(FinancialPeriod.started_at.desc())
            .limit(1)
        )
        return result.scalar_one_or_none()

    async def create_period(self) -> FinancialPeriod:
        existing = await self.get_open_period()
        if existing is not None:
            raise ConflictError("Já existe um período financeiro aberto")
        period = FinancialPeriod(
            status=FinancialPeriodStatus.open,
            started_at=datetime.now(timezone.utc),
        )
        self._session.add(period)
        try:
            await self._session.flush()
        except IntegrityError as exc:
            raise ConflictError("Já existe um período financeiro aberto") from exc
        await self._session.refresh(period)
        return period

    async def get_period_by_id(self, period_id: uuid.UUID) -> FinancialPeriod | None:
        result = await self._session.execute(
            select(FinancialPeriod)
            .options(
                selectinload(FinancialPeriod.entries),
                selectinload(FinancialPeriod.expenses),
                selectinload(FinancialPeriod.advances),
                selectinload(FinancialPeriod.distributions),
                selectinload(FinancialPeriod.reserve_history),
            )
            .where(FinancialPeriod.id == period_id)
        )
        return result.scalar_one_or_none()

    async def list_periods(self, *, page: int, page_size: int) -> tuple[list[FinancialPeriod], int]:
        count_result = await self._session.execute(select(func.count()).select_from(FinancialPeriod))
        total = int(count_result.scalar_one())
        result = await self._session.execute(
            select(FinancialPeriod)
            .options(selectinload(FinancialPeriod.distributions))
            .order_by(FinancialPeriod.started_at.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        return list(result.scalars().all()), total

    async def close_period(self, period: FinancialPeriod, **fields) -> FinancialPeriod:
        for key, value in fields.items():
            setattr(period, key, value)
        await self._session.flush()
        await self._session.refresh(period)
        return period

    async def get_entry_by_appointment_id(self, appointment_id: uuid.UUID) -> FinancialEntry | None:
        result = await self._session.execute(
            select(FinancialEntry).where(FinancialEntry.appointment_id == appointment_id)
        )
        return result.scalar_one_or_none()

    async def create_entry(self, entry: FinancialEntry) -> FinancialEntry:
        self._session.add(entry)
        await self._session.flush()
        await self._session.refresh(entry)
        return entry

    async def sum_revenue_for_period(self, period_id: uuid.UUID) -> Decimal:
        result = await self._session.execute(
            select(func.coalesce(func.sum(FinancialEntry.amount_snapshot), 0)).where(
                FinancialEntry.period_id == period_id,
                FinancialEntry.entry_type.in_(REVENUE_ENTRY_TYPES),
            )
        )
        return Decimal(str(result.scalar_one()))

    async def sum_expenses_for_period(self, period_id: uuid.UUID) -> Decimal:
        result = await self._session.execute(
            select(func.coalesce(func.sum(Expense.amount), 0)).where(Expense.period_id == period_id)
        )
        return Decimal(str(result.scalar_one()))

    async def sum_advances_for_period(self, period_id: uuid.UUID) -> Decimal:
        result = await self._session.execute(
            select(func.coalesce(func.sum(Advance.amount), 0)).where(Advance.period_id == period_id)
        )
        return Decimal(str(result.scalar_one()))

    async def sum_advances_for_professional_in_period(
        self,
        period_id: uuid.UUID,
        professional_id: uuid.UUID,
    ) -> Decimal:
        result = await self._session.execute(
            select(func.coalesce(func.sum(Advance.amount), 0)).where(
                Advance.period_id == period_id,
                Advance.professional_id == professional_id,
            )
        )
        return Decimal(str(result.scalar_one()))

    async def create_expense(self, expense: Expense) -> Expense:
        self._session.add(expense)
        await self._session.flush()
        await self._session.refresh(expense)
        return expense

    async def list_expenses_for_period(self, period_id: uuid.UUID) -> list[Expense]:
        result = await self._session.execute(
            select(Expense)
            .where(Expense.period_id == period_id)
            .order_by(Expense.expense_date.desc(), Expense.created_at.desc())
        )
        return list(result.scalars().all())

    async def create_advance(self, advance: Advance) -> Advance:
        self._session.add(advance)
        await self._session.flush()
        await self._session.refresh(advance, attribute_names=["professional"])
        return advance

    async def list_advances_for_period(self, period_id: uuid.UUID) -> list[Advance]:
        result = await self._session.execute(
            select(Advance)
            .options(selectinload(Advance.professional))
            .where(Advance.period_id == period_id)
            .order_by(Advance.created_at.desc())
        )
        return list(result.scalars().all())

    async def list_distribution_professionals(self) -> list[Professional]:
        result = await self._session.execute(
            select(Professional)
            .where(
                Professional.is_active.is_(True),
                Professional.active_for_distribution.is_(True),
            )
            .order_by(Professional.name)
        )
        return list(result.scalars().all())

    async def create_distribution(self, distribution: ProfitDistribution) -> ProfitDistribution:
        self._session.add(distribution)
        await self._session.flush()
        await self._session.refresh(distribution)
        return distribution

    async def create_reserve_history(self, record: ReserveHistory) -> ReserveHistory:
        self._session.add(record)
        await self._session.flush()
        await self._session.refresh(record)
        return record

    async def create_audit_log(self, log: FinancialAuditLog) -> FinancialAuditLog:
        self._session.add(log)
        await self._session.flush()
        await self._session.refresh(log)
        return log

    async def sum_closed_net_for_professional(self, professional_id: uuid.UUID) -> Decimal:
        result = await self._session.execute(
            select(func.coalesce(func.sum(ProfitDistribution.net_amount), 0)).where(
                ProfitDistribution.professional_id == professional_id
            )
        )
        return Decimal(str(result.scalar_one()))

    async def sum_closed_gross_for_professional(self, professional_id: uuid.UUID) -> Decimal:
        result = await self._session.execute(
            select(func.coalesce(func.sum(ProfitDistribution.gross_amount), 0)).where(
                ProfitDistribution.professional_id == professional_id
            )
        )
        return Decimal(str(result.scalar_one()))

    async def sum_closed_advances_for_professional(self, professional_id: uuid.UUID) -> Decimal:
        result = await self._session.execute(
            select(func.coalesce(func.sum(ProfitDistribution.advances_deducted), 0)).where(
                ProfitDistribution.professional_id == professional_id
            )
        )
        return Decimal(str(result.scalar_one()))

    async def get_professional_by_user_id(self, user_id: uuid.UUID) -> Professional | None:
        result = await self._session.execute(select(Professional).where(Professional.user_id == user_id))
        return result.scalar_one_or_none()
