"""financial architecture hardening

Revision ID: 010
Revises: 009
Create Date: 2026-05-29

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects.postgresql import ENUM, JSONB

revision: str = "010"
down_revision: Union[str, None] = "009"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

expense_category = ENUM(
    "RENT",
    "ENERGY",
    "WATER",
    "INTERNET",
    "SUPPLIES",
    "MAINTENANCE",
    "TAXES",
    "OTHER",
    name="expense_category",
    create_type=False,
)
financial_audit_action = ENUM(
    "EXPENSE_CREATED",
    "ADVANCE_CREATED",
    "SETTINGS_UPDATED",
    "PERIOD_CLOSED",
    "RESERVE_UPDATED",
    name="financial_audit_action",
    create_type=False,
)
financial_entity_type = ENUM(
    "EXPENSE",
    "ADVANCE",
    "FINANCIAL_SETTINGS",
    "FINANCIAL_PERIOD",
    "RESERVE_HISTORY",
    name="financial_entity_type",
    create_type=False,
)

LEGACY_CATEGORY_MAP = {
    "aluguel": "RENT",
    "energia": "ENERGY",
    "agua": "WATER",
    "água": "WATER",
    "internet": "INTERNET",
    "materiais": "SUPPLIES",
    "manutencao": "MAINTENANCE",
    "manutenção": "MAINTENANCE",
    "impostos": "TAXES",
    "outros": "OTHER",
}


def upgrade() -> None:
    op.execute(
        """
        DO $$ BEGIN
            ALTER TYPE financial_entry_type ADD VALUE 'PRODUCT_SALE';
        EXCEPTION WHEN duplicate_object THEN NULL;
        END $$;
        """
    )
    op.execute(
        """
        DO $$ BEGIN
            ALTER TYPE financial_entry_type ADD VALUE 'MANUAL_REVENUE';
        EXCEPTION WHEN duplicate_object THEN NULL;
        END $$;
        """
    )

    op.add_column(
        "financial_entries",
        sa.Column("amount_snapshot", sa.Numeric(precision=12, scale=2), nullable=True),
    )
    op.execute("UPDATE financial_entries SET amount_snapshot = amount")
    op.alter_column("financial_entries", "amount_snapshot", nullable=False)

    expense_category.create(op.get_bind(), checkfirst=True)
    op.add_column(
        "expenses",
        sa.Column("category_enum", expense_category, nullable=True),
    )
    connection = op.get_bind()
    rows = connection.execute(sa.text("SELECT id, category FROM expenses")).fetchall()
    for row in rows:
        raw = (row.category or "").strip().lower()
        mapped = LEGACY_CATEGORY_MAP.get(raw, "OTHER")
        connection.execute(
            sa.text("UPDATE expenses SET category_enum = :cat WHERE id = :id"),
            {"cat": mapped, "id": row.id},
        )
    op.drop_index(op.f("ix_expenses_category"), table_name="expenses")
    op.drop_column("expenses", "category")
    op.alter_column("expenses", "category_enum", new_column_name="category", nullable=False)
    op.create_index(op.f("ix_expenses_category"), "expenses", ["category"], unique=False)

    op.create_table(
        "reserve_history",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("period_id", sa.UUID(), nullable=False),
        sa.Column("amount", sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column("previous_balance", sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column("new_balance", sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["period_id"], ["financial_periods.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_reserve_history_period_id"), "reserve_history", ["period_id"], unique=False)

    financial_audit_action.create(op.get_bind(), checkfirst=True)
    financial_entity_type.create(op.get_bind(), checkfirst=True)
    op.create_table(
        "financial_audit_logs",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("action", financial_audit_action, nullable=False),
        sa.Column("actor_id", sa.UUID(), nullable=True),
        sa.Column("entity_type", financial_entity_type, nullable=False),
        sa.Column("entity_id", sa.UUID(), nullable=True),
        sa.Column("metadata", JSONB(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["actor_id"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_financial_audit_logs_action"), "financial_audit_logs", ["action"], unique=False)
    op.create_index(op.f("ix_financial_audit_logs_actor_id"), "financial_audit_logs", ["actor_id"], unique=False)
    op.create_index(
        op.f("ix_financial_audit_logs_entity_type"),
        "financial_audit_logs",
        ["entity_type"],
        unique=False,
    )
    op.create_index(op.f("ix_financial_audit_logs_entity_id"), "financial_audit_logs", ["entity_id"], unique=False)
    op.create_index(
        op.f("ix_financial_audit_logs_created_at"),
        "financial_audit_logs",
        ["created_at"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_financial_audit_logs_created_at"), table_name="financial_audit_logs")
    op.drop_index(op.f("ix_financial_audit_logs_entity_id"), table_name="financial_audit_logs")
    op.drop_index(op.f("ix_financial_audit_logs_entity_type"), table_name="financial_audit_logs")
    op.drop_index(op.f("ix_financial_audit_logs_actor_id"), table_name="financial_audit_logs")
    op.drop_index(op.f("ix_financial_audit_logs_action"), table_name="financial_audit_logs")
    op.drop_table("financial_audit_logs")

    op.drop_index(op.f("ix_reserve_history_period_id"), table_name="reserve_history")
    op.drop_table("reserve_history")

    op.add_column("expenses", sa.Column("category_legacy", sa.String(length=100), nullable=True))
    connection = op.get_bind()
    rows = connection.execute(sa.text("SELECT id, category::text FROM expenses")).fetchall()
    reverse_map = {
        "RENT": "aluguel",
        "ENERGY": "energia",
        "WATER": "agua",
        "INTERNET": "internet",
        "SUPPLIES": "materiais",
        "MAINTENANCE": "manutencao",
        "TAXES": "impostos",
        "OTHER": "outros",
    }
    for row in rows:
        connection.execute(
            sa.text("UPDATE expenses SET category_legacy = :cat WHERE id = :id"),
            {"cat": reverse_map.get(row[1], "outros"), "id": row.id},
        )
    op.drop_index(op.f("ix_expenses_category"), table_name="expenses")
    op.drop_column("expenses", "category")
    op.alter_column("expenses", "category_legacy", new_column_name="category", nullable=False)
    op.create_index(op.f("ix_expenses_category"), "expenses", ["category"], unique=False)
    expense_category.drop(op.get_bind(), checkfirst=True)

    op.drop_column("financial_entries", "amount_snapshot")

    financial_entity_type.drop(op.get_bind(), checkfirst=True)
    financial_audit_action.drop(op.get_bind(), checkfirst=True)
