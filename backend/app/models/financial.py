import enum
import uuid
from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import (
    Date,
    DateTime,
    ForeignKey,
    Numeric,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import ENUM, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDPrimaryKeyMixin


def _enum_values(enum_class: type[enum.Enum]) -> list[str]:
    return [member.value for member in enum_class]


class FinancialPeriodStatus(str, enum.Enum):
    open = "OPEN"
    closed = "CLOSED"


class FinancialEntryType(str, enum.Enum):
    service_revenue = "SERVICE_REVENUE"
    product_sale = "PRODUCT_SALE"
    manual_revenue = "MANUAL_REVENUE"


REVENUE_ENTRY_TYPES = (
    FinancialEntryType.service_revenue,
    FinancialEntryType.product_sale,
    FinancialEntryType.manual_revenue,
)


class ExpenseCategory(str, enum.Enum):
    rent = "RENT"
    energy = "ENERGY"
    water = "WATER"
    internet = "INTERNET"
    supplies = "SUPPLIES"
    maintenance = "MAINTENANCE"
    taxes = "TAXES"
    other = "OTHER"


EXPENSE_CATEGORY_LABELS: dict[ExpenseCategory, str] = {
    ExpenseCategory.rent: "Aluguel",
    ExpenseCategory.energy: "Energia",
    ExpenseCategory.water: "Água",
    ExpenseCategory.internet: "Internet",
    ExpenseCategory.supplies: "Materiais",
    ExpenseCategory.maintenance: "Manutenção",
    ExpenseCategory.taxes: "Impostos",
    ExpenseCategory.other: "Outros",
}


class FinancialAuditAction(str, enum.Enum):
    expense_created = "EXPENSE_CREATED"
    advance_created = "ADVANCE_CREATED"
    settings_updated = "SETTINGS_UPDATED"
    period_closed = "PERIOD_CLOSED"
    reserve_updated = "RESERVE_UPDATED"
    product_created = "PRODUCT_CREATED"
    product_updated = "PRODUCT_UPDATED"
    stock_updated = "STOCK_UPDATED"
    sale_created = "SALE_CREATED"
    sale_cancelled = "SALE_CANCELLED"
    category_created = "CATEGORY_CREATED"
    category_updated = "CATEGORY_UPDATED"
    category_deactivated = "CATEGORY_DEACTIVATED"


class FinancialEntityType(str, enum.Enum):
    expense = "EXPENSE"
    advance = "ADVANCE"
    financial_settings = "FINANCIAL_SETTINGS"
    financial_period = "FINANCIAL_PERIOD"
    reserve_history = "RESERVE_HISTORY"
    product = "PRODUCT"
    sale = "SALE"
    inventory_movement = "INVENTORY_MOVEMENT"
    product_category = "PRODUCT_CATEGORY"


class FinancialSettings(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "financial_settings"

    reserve_percentage: Mapped[Decimal] = mapped_column(
        Numeric(5, 2),
        nullable=False,
        server_default="0",
    )
    accumulated_reserve: Mapped[Decimal] = mapped_column(
        Numeric(12, 2),
        nullable=False,
        server_default="0",
    )


class FinancialPeriod(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "financial_periods"

    status: Mapped[FinancialPeriodStatus] = mapped_column(
        ENUM(
            FinancialPeriodStatus,
            name="financial_period_status",
            create_type=False,
            values_callable=_enum_values,
        ),
        nullable=False,
        default=FinancialPeriodStatus.open,
        index=True,
    )
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    closed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    total_revenue: Mapped[Decimal | None] = mapped_column(Numeric(12, 2), nullable=True)
    total_expenses: Mapped[Decimal | None] = mapped_column(Numeric(12, 2), nullable=True)
    operational_result: Mapped[Decimal | None] = mapped_column(Numeric(12, 2), nullable=True)
    reserve_applied: Mapped[Decimal | None] = mapped_column(Numeric(12, 2), nullable=True)
    distributable_amount: Mapped[Decimal | None] = mapped_column(Numeric(12, 2), nullable=True)
    reserve_percentage_snapshot: Mapped[Decimal | None] = mapped_column(Numeric(5, 2), nullable=True)
    accumulated_reserve_after: Mapped[Decimal | None] = mapped_column(Numeric(12, 2), nullable=True)

    entries: Mapped[list["FinancialEntry"]] = relationship(
        back_populates="period",
        lazy="selectin",
    )
    expenses: Mapped[list["Expense"]] = relationship(
        back_populates="period",
        lazy="selectin",
    )
    advances: Mapped[list["Advance"]] = relationship(
        back_populates="period",
        lazy="selectin",
    )
    distributions: Mapped[list["ProfitDistribution"]] = relationship(
        back_populates="period",
        lazy="selectin",
    )
    reserve_history: Mapped[list["ReserveHistory"]] = relationship(
        back_populates="period",
        lazy="selectin",
    )


class FinancialEntry(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "financial_entries"
    __table_args__ = (
        UniqueConstraint("appointment_id", name="uq_financial_entries_appointment_id"),
    )

    period_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("financial_periods.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    entry_type: Mapped[FinancialEntryType] = mapped_column(
        ENUM(
            FinancialEntryType,
            name="financial_entry_type",
            create_type=False,
            values_callable=_enum_values,
        ),
        nullable=False,
    )
    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    amount_snapshot: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    appointment_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("appointments.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    professional_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("professionals.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )
    sale_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("sales.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    description: Mapped[str | None] = mapped_column(String(500), nullable=True)
    entry_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)

    period: Mapped["FinancialPeriod"] = relationship(back_populates="entries")
    appointment: Mapped["Appointment | None"] = relationship(lazy="selectin")  # noqa: F821
    professional: Mapped["Professional | None"] = relationship(lazy="selectin")  # noqa: F821
    sale: Mapped["Sale | None"] = relationship(lazy="selectin")  # noqa: F821


class Expense(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "expenses"

    period_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("financial_periods.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    description: Mapped[str] = mapped_column(String(500), nullable=False)
    category: Mapped[ExpenseCategory] = mapped_column(
        ENUM(
            ExpenseCategory,
            name="expense_category",
            create_type=False,
            values_callable=_enum_values,
        ),
        nullable=False,
        index=True,
    )
    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    expense_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)

    period: Mapped["FinancialPeriod"] = relationship(back_populates="expenses")


class Advance(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "advances"

    period_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("financial_periods.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    professional_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("professionals.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    period: Mapped["FinancialPeriod"] = relationship(back_populates="advances")
    professional: Mapped["Professional"] = relationship(lazy="selectin")  # noqa: F821


class ProfitDistribution(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "profit_distributions"
    __table_args__ = (
        UniqueConstraint("period_id", "professional_id", name="uq_profit_distributions_period_professional"),
    )

    period_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("financial_periods.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    professional_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("professionals.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    professional_name: Mapped[str] = mapped_column(String(200), nullable=False)
    participation_percentage: Mapped[Decimal] = mapped_column(Numeric(5, 2), nullable=False)
    gross_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    advances_deducted: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    net_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)

    period: Mapped["FinancialPeriod"] = relationship(back_populates="distributions")
    professional: Mapped["Professional"] = relationship(lazy="selectin")  # noqa: F821


class ReserveHistory(UUIDPrimaryKeyMixin, Base):
    __tablename__ = "reserve_history"

    period_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("financial_periods.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    previous_balance: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    new_balance: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    period: Mapped["FinancialPeriod"] = relationship(back_populates="reserve_history")


class FinancialAuditLog(UUIDPrimaryKeyMixin, Base):
    __tablename__ = "financial_audit_logs"

    action: Mapped[FinancialAuditAction] = mapped_column(
        ENUM(
            FinancialAuditAction,
            name="financial_audit_action",
            create_type=False,
            values_callable=_enum_values,
        ),
        nullable=False,
        index=True,
    )
    actor_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    entity_type: Mapped[FinancialEntityType] = mapped_column(
        ENUM(
            FinancialEntityType,
            name="financial_entity_type",
            create_type=False,
            values_callable=_enum_values,
        ),
        nullable=False,
        index=True,
    )
    entity_id: Mapped[uuid.UUID | None] = mapped_column(nullable=True, index=True)
    metadata_json: Mapped[dict | None] = mapped_column("metadata", JSONB, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
        index=True,
    )

    actor: Mapped["User | None"] = relationship(lazy="selectin")  # noqa: F821
