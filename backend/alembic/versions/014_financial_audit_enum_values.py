"""extend financial_audit_action and financial_entity_type enums

Revision ID: 014
Revises: 013
Create Date: 2026-05-29

Garante valores de auditoria do módulo inventory/categories no PostgreSQL.
Idempotente: seguro se 012/013 já tiverem aplicado os mesmos ADD VALUE.

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "014"
down_revision: Union[str, None] = "013"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

AUDIT_ACTIONS = (
    "PRODUCT_CREATED",
    "PRODUCT_UPDATED",
    "STOCK_UPDATED",
    "SALE_CREATED",
    "SALE_CANCELLED",
    "CATEGORY_CREATED",
    "CATEGORY_UPDATED",
    "CATEGORY_DEACTIVATED",
)

ENTITY_TYPES = (
    "PRODUCT",
    "SALE",
    "INVENTORY_MOVEMENT",
    "PRODUCT_CATEGORY",
)


def _add_enum_value(connection, enum_name: str, value: str) -> None:
    connection.execute(
        sa.text(
            f"""
            DO $$ BEGIN
                ALTER TYPE {enum_name} ADD VALUE '{value}';
            EXCEPTION
                WHEN duplicate_object THEN NULL;
            END $$;
            """
        )
    )


def upgrade() -> None:
    connection = op.get_bind()
    for action in AUDIT_ACTIONS:
        _add_enum_value(connection, "financial_audit_action", action)
    for entity in ENTITY_TYPES:
        _add_enum_value(connection, "financial_entity_type", entity)


def downgrade() -> None:
    # PostgreSQL não suporta remover valores de ENUM de forma segura.
    pass
