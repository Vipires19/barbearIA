"""financial hardening: single open period, reserve snapshot rename

Revision ID: 011
Revises: 010
Create Date: 2026-05-29

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "011"
down_revision: Union[str, None] = "010"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    connection = op.get_bind()
    open_rows = connection.execute(
        sa.text(
            """
            SELECT id FROM financial_periods
            WHERE status = 'OPEN'
            ORDER BY started_at DESC
            """
        )
    ).fetchall()
    if len(open_rows) > 1:
        keep_id = open_rows[0].id
        connection.execute(
            sa.text(
                """
                UPDATE financial_periods
                SET status = 'CLOSED', closed_at = NOW()
                WHERE status = 'OPEN' AND id != :keep_id
                """
            ),
            {"keep_id": keep_id},
        )

    op.alter_column(
        "financial_periods",
        "reserve_percentage_applied",
        new_column_name="reserve_percentage_snapshot",
        existing_type=sa.Numeric(precision=5, scale=2),
        existing_nullable=True,
    )

    op.create_index(
        "uq_financial_periods_single_open",
        "financial_periods",
        ["status"],
        unique=True,
        postgresql_where=sa.text("status = 'OPEN'"),
    )


def downgrade() -> None:
    op.drop_index("uq_financial_periods_single_open", table_name="financial_periods")
    op.alter_column(
        "financial_periods",
        "reserve_percentage_snapshot",
        new_column_name="reserve_percentage_applied",
        existing_type=sa.Numeric(precision=5, scale=2),
        existing_nullable=True,
    )
