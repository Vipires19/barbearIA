"""financial module base tables

Revision ID: 009
Revises: 008
Create Date: 2026-05-29

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects.postgresql import ENUM

revision: str = "009"
down_revision: Union[str, None] = "008"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

# create_type=False: tipo criado uma vez via .create(); evita CREATE TYPE duplicado no create_table
financial_period_status = ENUM(
    "OPEN",
    "CLOSED",
    name="financial_period_status",
    create_type=False,
)
financial_entry_type = ENUM(
    "SERVICE_REVENUE",
    name="financial_entry_type",
    create_type=False,
)


def upgrade() -> None:
    op.add_column(
        "professionals",
        sa.Column("participation_percentage", sa.Numeric(precision=5, scale=2), server_default="0", nullable=False),
    )
    op.add_column(
        "professionals",
        sa.Column("active_for_distribution", sa.Boolean(), server_default=sa.text("false"), nullable=False),
    )
    op.create_index(
        op.f("ix_professionals_active_for_distribution"),
        "professionals",
        ["active_for_distribution"],
        unique=False,
    )

    op.create_table(
        "financial_settings",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("reserve_percentage", sa.Numeric(precision=5, scale=2), server_default="0", nullable=False),
        sa.Column("accumulated_reserve", sa.Numeric(precision=12, scale=2), server_default="0", nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )

    financial_period_status.create(op.get_bind(), checkfirst=True)
    op.create_table(
        "financial_periods",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("status", financial_period_status, nullable=False),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("closed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("total_revenue", sa.Numeric(precision=12, scale=2), nullable=True),
        sa.Column("total_expenses", sa.Numeric(precision=12, scale=2), nullable=True),
        sa.Column("operational_result", sa.Numeric(precision=12, scale=2), nullable=True),
        sa.Column("reserve_applied", sa.Numeric(precision=12, scale=2), nullable=True),
        sa.Column("distributable_amount", sa.Numeric(precision=12, scale=2), nullable=True),
        sa.Column("reserve_percentage_applied", sa.Numeric(precision=5, scale=2), nullable=True),
        sa.Column("accumulated_reserve_after", sa.Numeric(precision=12, scale=2), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_financial_periods_status"), "financial_periods", ["status"], unique=False)

    financial_entry_type.create(op.get_bind(), checkfirst=True)
    op.create_table(
        "financial_entries",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("period_id", sa.UUID(), nullable=False),
        sa.Column("entry_type", financial_entry_type, nullable=False),
        sa.Column("amount", sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column("appointment_id", sa.UUID(), nullable=True),
        sa.Column("professional_id", sa.UUID(), nullable=False),
        sa.Column("description", sa.String(length=500), nullable=True),
        sa.Column("entry_date", sa.Date(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["appointment_id"], ["appointments.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["period_id"], ["financial_periods.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["professional_id"], ["professionals.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("appointment_id", name="uq_financial_entries_appointment_id"),
    )
    op.create_index(op.f("ix_financial_entries_period_id"), "financial_entries", ["period_id"], unique=False)
    op.create_index(op.f("ix_financial_entries_appointment_id"), "financial_entries", ["appointment_id"], unique=False)
    op.create_index(op.f("ix_financial_entries_professional_id"), "financial_entries", ["professional_id"], unique=False)
    op.create_index(op.f("ix_financial_entries_entry_date"), "financial_entries", ["entry_date"], unique=False)

    op.create_table(
        "expenses",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("period_id", sa.UUID(), nullable=False),
        sa.Column("description", sa.String(length=500), nullable=False),
        sa.Column("category", sa.String(length=100), nullable=False),
        sa.Column("amount", sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column("expense_date", sa.Date(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["period_id"], ["financial_periods.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_expenses_period_id"), "expenses", ["period_id"], unique=False)
    op.create_index(op.f("ix_expenses_category"), "expenses", ["category"], unique=False)
    op.create_index(op.f("ix_expenses_expense_date"), "expenses", ["expense_date"], unique=False)

    op.create_table(
        "advances",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("period_id", sa.UUID(), nullable=False),
        sa.Column("professional_id", sa.UUID(), nullable=False),
        sa.Column("amount", sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["period_id"], ["financial_periods.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["professional_id"], ["professionals.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_advances_period_id"), "advances", ["period_id"], unique=False)
    op.create_index(op.f("ix_advances_professional_id"), "advances", ["professional_id"], unique=False)

    op.create_table(
        "profit_distributions",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("period_id", sa.UUID(), nullable=False),
        sa.Column("professional_id", sa.UUID(), nullable=False),
        sa.Column("professional_name", sa.String(length=200), nullable=False),
        sa.Column("participation_percentage", sa.Numeric(precision=5, scale=2), nullable=False),
        sa.Column("gross_amount", sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column("advances_deducted", sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column("net_amount", sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["period_id"], ["financial_periods.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["professional_id"], ["professionals.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("period_id", "professional_id", name="uq_profit_distributions_period_professional"),
    )
    op.create_index(op.f("ix_profit_distributions_period_id"), "profit_distributions", ["period_id"], unique=False)
    op.create_index(op.f("ix_profit_distributions_professional_id"), "profit_distributions", ["professional_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_profit_distributions_professional_id"), table_name="profit_distributions")
    op.drop_index(op.f("ix_profit_distributions_period_id"), table_name="profit_distributions")
    op.drop_table("profit_distributions")

    op.drop_index(op.f("ix_advances_professional_id"), table_name="advances")
    op.drop_index(op.f("ix_advances_period_id"), table_name="advances")
    op.drop_table("advances")

    op.drop_index(op.f("ix_expenses_expense_date"), table_name="expenses")
    op.drop_index(op.f("ix_expenses_category"), table_name="expenses")
    op.drop_index(op.f("ix_expenses_period_id"), table_name="expenses")
    op.drop_table("expenses")

    op.drop_index(op.f("ix_financial_entries_entry_date"), table_name="financial_entries")
    op.drop_index(op.f("ix_financial_entries_professional_id"), table_name="financial_entries")
    op.drop_index(op.f("ix_financial_entries_appointment_id"), table_name="financial_entries")
    op.drop_index(op.f("ix_financial_entries_period_id"), table_name="financial_entries")
    op.drop_table("financial_entries")

    op.drop_index(op.f("ix_financial_periods_status"), table_name="financial_periods")
    op.drop_table("financial_periods")

    op.drop_table("financial_settings")

    op.drop_index(op.f("ix_professionals_active_for_distribution"), table_name="professionals")
    op.drop_column("professionals", "active_for_distribution")
    op.drop_column("professionals", "participation_percentage")

    financial_entry_type.drop(op.get_bind(), checkfirst=True)
    financial_period_status.drop(op.get_bind(), checkfirst=True)
