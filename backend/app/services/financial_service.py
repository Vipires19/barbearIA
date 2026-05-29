import math
import uuid
from datetime import date, datetime, timezone
from decimal import Decimal, ROUND_HALF_UP

from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import AppError, ConflictError, ForbiddenError, NotFoundError
from app.models.appointment import Appointment
from app.models.financial import (
    Advance,
    Expense,
    ExpenseCategory,
    FinancialAuditAction,
    FinancialAuditLog,
    FinancialEntityType,
    FinancialEntry,
    FinancialEntryType,
    FinancialPeriod,
    FinancialPeriodStatus,
    ProfitDistribution,
    ReserveHistory,
)
from app.models.professional import Professional
from app.models.user import User, UserRole
from app.repositories.financial_repository import FinancialRepository
from app.schemas.financial import (
    EXPENSE_CATEGORY_LABELS as SCHEMA_CATEGORY_LABELS,
    AdvanceCreate,
    AdvanceResponse,
    DistributionSnapshot,
    ExpenseCreate,
    ExpenseResponse,
    FinancialDashboardResponse,
    FinancialPeriodListResponse,
    FinancialPeriodResponse,
    FinancialSettingsResponse,
    FinancialSettingsUpdate,
    ParticipationSummaryResponse,
    ProfessionalDistributionPreview,
    ProfessionalWalletResponse,
    decimal_to_float,
)


class FinancialService:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session
        self._repo = FinancialRepository(session)

    async def get_dashboard(self, current_user: User) -> FinancialDashboardResponse:
        self._require_admin(current_user)
        period = await self._ensure_open_period()
        settings = await self._get_or_create_settings()
        totals = await self._calculate_period_totals(period.id, settings.reserve_percentage)
        professionals = await self._repo.list_distribution_professionals()
        advances = await self._repo.list_advances_for_period(period.id)
        expenses = await self._repo.list_expenses_for_period(period.id)
        preview = await self._build_distribution_preview(
            period_id=period.id,
            distributable=totals["distributable"],
            professionals=professionals,
        )
        return FinancialDashboardResponse(
            current_period=self._period_to_response(period),
            settings=self._settings_to_response(settings),
            total_revenue=decimal_to_float(totals["revenue"]),
            total_expenses=decimal_to_float(totals["expenses"]),
            operational_result=decimal_to_float(totals["operational"]),
            reserve_applied=decimal_to_float(totals["reserve"]),
            distributable_amount=decimal_to_float(totals["distributable"]),
            accumulated_reserve=decimal_to_float(settings.accumulated_reserve),
            active_professionals_count=len(professionals),
            expenses=[self._expense_to_response(e) for e in expenses],
            advances=[self._advance_to_response(a) for a in advances],
            distribution_preview=preview,
        )

    async def list_periods(
        self,
        *,
        page: int,
        page_size: int,
        current_user: User,
    ) -> FinancialPeriodListResponse:
        self._require_admin(current_user)
        page = max(1, page)
        page_size = min(max(1, page_size), 100)
        items, total = await self._repo.list_periods(page=page, page_size=page_size)
        pages = max(1, math.ceil(total / page_size)) if total else 1
        return FinancialPeriodListResponse(
            items=[self._period_to_response(p, include_distributions=True) for p in items],
            total=total,
            page=page,
            page_size=page_size,
            pages=pages,
        )

    async def get_participation_summary(self, current_user: User) -> ParticipationSummaryResponse:
        self._require_admin(current_user)
        professionals = await self._repo.list_distribution_professionals()
        total = sum(p.participation_percentage for p in professionals)
        total = total.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        return ParticipationSummaryResponse(
            total_percentage=decimal_to_float(total),
            active_professionals_count=len(professionals),
            is_valid=total == Decimal("100.00"),
        )

    async def get_my_wallet(self, current_user: User) -> ProfessionalWalletResponse:
        professional = await self._resolve_wallet_professional(current_user)
        settings = await self._get_or_create_settings()
        period = await self._ensure_open_period()
        totals = await self._calculate_period_totals(period.id, settings.reserve_percentage)
        preview = await self._build_distribution_preview(
            period_id=period.id,
            distributable=totals["distributable"],
            professionals=[professional] if professional.active_for_distribution else [],
        )
        current_preview = next(
            (p for p in preview if p.professional_id == professional.id),
            None,
        )
        closed_net = await self._repo.sum_closed_net_for_professional(professional.id)
        closed_gross = await self._repo.sum_closed_gross_for_professional(professional.id)
        closed_advances = await self._repo.sum_closed_advances_for_professional(professional.id)
        current_gross = Decimal(str(current_preview.estimated_gross)) if current_preview else Decimal("0")
        current_advances = await self._repo.sum_advances_for_professional_in_period(period.id, professional.id)
        current_net = Decimal(str(current_preview.estimated_net)) if current_preview else Decimal("0")
        estimated_balance = closed_net + current_net
        return ProfessionalWalletResponse(
            professional_id=professional.id,
            professional_name=professional.name,
            participation_percentage=decimal_to_float(professional.participation_percentage),
            closed_participation_total=decimal_to_float(closed_gross),
            closed_advances_total=decimal_to_float(closed_advances),
            closed_net_total=decimal_to_float(closed_net),
            current_period_estimated_gross=decimal_to_float(current_gross),
            current_period_advances=decimal_to_float(current_advances),
            current_period_estimated_net=decimal_to_float(current_net),
            estimated_balance=decimal_to_float(estimated_balance),
        )

    async def create_expense(self, data: ExpenseCreate, current_user: User) -> ExpenseResponse:
        self._require_admin(current_user)
        period = await self._ensure_open_period()
        category = ExpenseCategory(data.category.value)
        expense = Expense(
            period_id=period.id,
            description=data.description.strip(),
            category=category,
            amount=self._quantize(data.amount),
            expense_date=data.expense_date,
        )
        created = await self._repo.create_expense(expense)
        await self._audit(
            action=FinancialAuditAction.expense_created,
            actor_id=current_user.id,
            entity_type=FinancialEntityType.expense,
            entity_id=created.id,
            metadata={
                "period_id": str(period.id),
                "description": created.description,
                "category": created.category.value,
                "amount": decimal_to_float(created.amount),
                "expense_date": created.expense_date.isoformat(),
            },
        )
        return self._expense_to_response(created)

    async def create_advance(self, data: AdvanceCreate, current_user: User) -> AdvanceResponse:
        self._require_admin(current_user)
        period = await self._ensure_open_period()
        prof = await self._get_professional_or_404(data.professional_id)
        advance = Advance(
            period_id=period.id,
            professional_id=prof.id,
            amount=self._quantize(data.amount),
            notes=data.notes.strip() if data.notes else None,
        )
        created = await self._repo.create_advance(advance)
        await self._audit(
            action=FinancialAuditAction.advance_created,
            actor_id=current_user.id,
            entity_type=FinancialEntityType.advance,
            entity_id=created.id,
            metadata={
                "professional_id": str(prof.id),
                "amount": decimal_to_float(created.amount),
            },
        )
        return self._advance_to_response(created)

    async def update_settings(self, data: FinancialSettingsUpdate, current_user: User) -> FinancialSettingsResponse:
        self._require_admin(current_user)
        settings = await self._get_or_create_settings()
        previous_percentage = settings.reserve_percentage
        updated = await self._repo.update_settings(
            settings,
            reserve_percentage=self._quantize(data.reserve_percentage),
        )
        await self._audit(
            action=FinancialAuditAction.settings_updated,
            actor_id=current_user.id,
            entity_type=FinancialEntityType.financial_settings,
            entity_id=updated.id,
            metadata={
                "old_reserve_percentage": decimal_to_float(previous_percentage),
                "new_reserve_percentage": decimal_to_float(updated.reserve_percentage),
            },
        )
        return self._settings_to_response(updated)

    async def close_period(self, current_user: User) -> FinancialPeriodResponse:
        self._require_admin(current_user)
        period = await self._ensure_open_period()
        settings = await self._get_or_create_settings()
        totals = await self._calculate_period_totals(period.id, settings.reserve_percentage)
        professionals = await self._repo.list_distribution_professionals()
        self._validate_participation_percentages(professionals)
        distributions = await self._build_distribution_records(
            period_id=period.id,
            distributable=totals["distributable"],
            professionals=professionals,
        )
        for record in distributions:
            await self._repo.create_distribution(record)

        previous_balance = settings.accumulated_reserve
        new_balance = previous_balance + totals["reserve"]
        await self._repo.update_settings(settings, accumulated_reserve=new_balance)

        reserve_record = ReserveHistory(
            period_id=period.id,
            amount=totals["reserve"],
            previous_balance=previous_balance,
            new_balance=new_balance,
        )
        created_reserve = await self._repo.create_reserve_history(reserve_record)
        await self._audit(
            action=FinancialAuditAction.reserve_updated,
            actor_id=current_user.id,
            entity_type=FinancialEntityType.reserve_history,
            entity_id=created_reserve.id,
            metadata={
                "period_id": str(period.id),
                "amount": decimal_to_float(totals["reserve"]),
                "previous_balance": decimal_to_float(previous_balance),
                "new_balance": decimal_to_float(new_balance),
            },
        )

        reserve_snapshot = settings.reserve_percentage
        closed = await self._repo.close_period(
            period,
            status=FinancialPeriodStatus.closed,
            closed_at=datetime.now(timezone.utc),
            total_revenue=totals["revenue"],
            total_expenses=totals["expenses"],
            operational_result=totals["operational"],
            reserve_applied=totals["reserve"],
            distributable_amount=totals["distributable"],
            reserve_percentage_snapshot=reserve_snapshot,
            accumulated_reserve_after=new_balance,
        )
        await self._audit(
            action=FinancialAuditAction.period_closed,
            actor_id=current_user.id,
            entity_type=FinancialEntityType.financial_period,
            entity_id=closed.id,
            metadata={
                "period_id": str(closed.id),
                "operational_result": decimal_to_float(totals["operational"]),
                "reserve_amount": decimal_to_float(totals["reserve"]),
                "distributed_amount": decimal_to_float(totals["distributable"]),
            },
        )
        await self._create_open_period_safe()
        refreshed = await self._repo.get_period_by_id(closed.id)
        if refreshed is None:
            raise NotFoundError("Período financeiro não encontrado")
        return self._period_to_response(refreshed, include_distributions=True)

    async def record_service_revenue(self, appointment: Appointment) -> FinancialEntry | None:
        existing = await self._repo.get_entry_by_appointment_id(appointment.id)
        if existing is not None:
            return existing
        period = await self._ensure_open_period()
        snapshot = self._quantize(appointment.total_price)
        entry = FinancialEntry(
            period_id=period.id,
            entry_type=FinancialEntryType.service_revenue,
            amount=snapshot,
            amount_snapshot=snapshot,
            appointment_id=appointment.id,
            professional_id=appointment.professional_id,
            description=f"Receita — {appointment.client_name}",
            entry_date=appointment.appointment_date,
        )
        try:
            return await self._repo.create_entry(entry)
        except IntegrityError:
            existing = await self._repo.get_entry_by_appointment_id(appointment.id)
            return existing

    async def record_product_sale(
        self,
        *,
        sale_id: uuid.UUID,
        amount: Decimal,
        description: str,
        entry_date: date,
    ) -> FinancialEntry:
        period = await self._ensure_open_period()
        snapshot = self._quantize(amount)
        entry = FinancialEntry(
            period_id=period.id,
            entry_type=FinancialEntryType.product_sale,
            amount=snapshot,
            amount_snapshot=snapshot,
            sale_id=sale_id,
            professional_id=None,
            description=description,
            entry_date=entry_date,
        )
        return await self._repo.create_entry(entry)

    async def reverse_product_sale(
        self,
        *,
        sale_id: uuid.UUID,
        amount: Decimal,
        description: str,
        entry_date: date,
    ) -> FinancialEntry:
        period = await self._ensure_open_period()
        snapshot = self._quantize(amount)
        reversal = self._quantize(-snapshot)
        entry = FinancialEntry(
            period_id=period.id,
            entry_type=FinancialEntryType.product_sale,
            amount=reversal,
            amount_snapshot=reversal,
            sale_id=sale_id,
            professional_id=None,
            description=description,
            entry_date=entry_date,
        )
        return await self._repo.create_entry(entry)

    async def audit_inventory_action(
        self,
        *,
        action: FinancialAuditAction,
        actor_id: uuid.UUID,
        entity_type: FinancialEntityType,
        entity_id: uuid.UUID | None,
        metadata: dict | None = None,
    ) -> None:
        await self._audit(
            action=action,
            actor_id=actor_id,
            entity_type=entity_type,
            entity_id=entity_id,
            metadata=metadata,
        )

    async def _audit(
        self,
        *,
        action: FinancialAuditAction,
        actor_id: uuid.UUID,
        entity_type: FinancialEntityType,
        entity_id: uuid.UUID | None,
        metadata: dict | None = None,
    ) -> None:
        log = FinancialAuditLog(
            action=action,
            actor_id=actor_id,
            entity_type=entity_type,
            entity_id=entity_id,
            metadata_json=metadata,
        )
        await self._repo.create_audit_log(log)

    async def _ensure_open_period(self) -> FinancialPeriod:
        period = await self._repo.get_open_period()
        if period is not None:
            return period
        return await self._create_open_period_safe()

    async def _create_open_period_safe(self) -> FinancialPeriod:
        try:
            return await self._repo.create_period()
        except ConflictError:
            period = await self._repo.get_open_period()
            if period is None:
                raise
            return period

    async def _get_or_create_settings(self):
        settings = await self._repo.get_settings()
        if settings is None:
            return await self._repo.create_default_settings()
        return settings

    async def _calculate_period_totals(
        self,
        period_id: uuid.UUID,
        reserve_percentage: Decimal,
    ) -> dict[str, Decimal]:
        revenue = await self._repo.sum_revenue_for_period(period_id)
        expenses = await self._repo.sum_expenses_for_period(period_id)
        operational = revenue - expenses
        reserve = Decimal("0")
        if operational > 0:
            reserve = self._quantize(operational * reserve_percentage / Decimal("100"))
        distributable = operational - reserve
        return {
            "revenue": revenue,
            "expenses": expenses,
            "operational": operational,
            "reserve": reserve,
            "distributable": distributable,
        }

    async def _build_distribution_preview(
        self,
        *,
        period_id: uuid.UUID,
        distributable: Decimal,
        professionals: list[Professional],
    ) -> list[ProfessionalDistributionPreview]:
        preview: list[ProfessionalDistributionPreview] = []
        for professional in professionals:
            gross = self._quantize(distributable * professional.participation_percentage / Decimal("100"))
            advances = await self._repo.sum_advances_for_professional_in_period(period_id, professional.id)
            net = gross - advances
            preview.append(
                ProfessionalDistributionPreview(
                    professional_id=professional.id,
                    professional_name=professional.name,
                    participation_percentage=decimal_to_float(professional.participation_percentage),
                    estimated_gross=decimal_to_float(gross),
                    advances_in_period=decimal_to_float(advances),
                    estimated_net=decimal_to_float(net),
                )
            )
        return preview

    async def _build_distribution_records(
        self,
        *,
        period_id: uuid.UUID,
        distributable: Decimal,
        professionals: list[Professional],
    ) -> list[ProfitDistribution]:
        records: list[ProfitDistribution] = []
        for professional in professionals:
            gross = self._quantize(distributable * professional.participation_percentage / Decimal("100"))
            advances = await self._repo.sum_advances_for_professional_in_period(period_id, professional.id)
            net = gross - advances
            records.append(
                ProfitDistribution(
                    period_id=period_id,
                    professional_id=professional.id,
                    professional_name=professional.name,
                    participation_percentage=professional.participation_percentage,
                    gross_amount=gross,
                    advances_deducted=advances,
                    net_amount=net,
                )
            )
        return records

    async def _resolve_wallet_professional(self, current_user: User) -> Professional:
        if current_user.role == UserRole.admin:
            raise ForbiddenError("Admin deve usar o dashboard financeiro")
        professional = await self._repo.get_professional_by_user_id(current_user.id)
        if professional is None or not professional.is_active:
            raise ForbiddenError("Profissional não vinculado ao usuário")
        return professional

    async def _get_professional_or_404(self, professional_id: uuid.UUID) -> Professional:
        from app.repositories.professional_repository import ProfessionalRepository

        professional = await ProfessionalRepository(self._session).get_by_id(professional_id)
        if professional is None or not professional.is_active:
            raise NotFoundError("Profissional não encontrado")
        return professional

    @staticmethod
    def _validate_participation_percentages(professionals: list[Professional]) -> None:
        if not professionals:
            raise AppError(
                "Nenhum profissional ativo para distribuição. "
                "Ative profissionais em Profissionais → Participação financeira.",
                status_code=400,
            )
        total = sum(p.participation_percentage for p in professionals)
        total = total.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        if total != Decimal("100.00"):
            names = ", ".join(f"{p.name} ({p.participation_percentage}%)" for p in professionals)
            raise AppError(
                "A soma das participações dos profissionais ativos deve ser exatamente 100%. "
                f"Total atual: {total}%. Profissionais: {names}. "
                "Ajuste os percentuais em Profissionais antes de fechar o período.",
                status_code=400,
            )

    @staticmethod
    def _quantize(value: Decimal) -> Decimal:
        return value.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

    @staticmethod
    def _require_admin(user: User) -> None:
        if user.role != UserRole.admin:
            raise ForbiddenError("Apenas administradores podem acessar esta operação")

    @staticmethod
    def _period_to_response(
        period: FinancialPeriod,
        *,
        include_distributions: bool = False,
    ) -> FinancialPeriodResponse:
        distributions: list[DistributionSnapshot] = []
        if include_distributions and period.distributions:
            distributions = [
                DistributionSnapshot(
                    professional_id=d.professional_id,
                    professional_name=d.professional_name,
                    participation_percentage=decimal_to_float(d.participation_percentage),
                    gross_amount=decimal_to_float(d.gross_amount),
                    advances_deducted=decimal_to_float(d.advances_deducted),
                    net_amount=decimal_to_float(d.net_amount),
                )
                for d in period.distributions
            ]
        return FinancialPeriodResponse(
            id=period.id,
            status=period.status.value,
            started_at=period.started_at,
            closed_at=period.closed_at,
            total_revenue=decimal_to_float(period.total_revenue) if period.total_revenue is not None else None,
            total_expenses=decimal_to_float(period.total_expenses) if period.total_expenses is not None else None,
            operational_result=decimal_to_float(period.operational_result)
            if period.operational_result is not None
            else None,
            reserve_applied=decimal_to_float(period.reserve_applied) if period.reserve_applied is not None else None,
            distributable_amount=decimal_to_float(period.distributable_amount)
            if period.distributable_amount is not None
            else None,
            reserve_percentage_snapshot=decimal_to_float(period.reserve_percentage_snapshot)
            if period.reserve_percentage_snapshot is not None
            else None,
            accumulated_reserve_after=decimal_to_float(period.accumulated_reserve_after)
            if period.accumulated_reserve_after is not None
            else None,
            distributions=distributions,
        )

    @staticmethod
    def _settings_to_response(settings) -> FinancialSettingsResponse:
        return FinancialSettingsResponse(
            id=settings.id,
            reserve_percentage=decimal_to_float(settings.reserve_percentage),
            accumulated_reserve=decimal_to_float(settings.accumulated_reserve),
            updated_at=settings.updated_at,
        )

    @staticmethod
    def _expense_to_response(expense: Expense) -> ExpenseResponse:
        category_value = expense.category.value if isinstance(expense.category, ExpenseCategory) else str(expense.category)
        return ExpenseResponse(
            id=expense.id,
            period_id=expense.period_id,
            description=expense.description,
            category=category_value,
            category_label=SCHEMA_CATEGORY_LABELS.get(category_value, category_value),
            amount=decimal_to_float(expense.amount),
            expense_date=expense.expense_date,
            created_at=expense.created_at,
        )

    @staticmethod
    def _advance_to_response(advance: Advance) -> AdvanceResponse:
        return AdvanceResponse(
            id=advance.id,
            period_id=advance.period_id,
            professional_id=advance.professional_id,
            professional_name=advance.professional.name if advance.professional else "—",
            amount=decimal_to_float(advance.amount),
            notes=advance.notes,
            created_at=advance.created_at,
        )
