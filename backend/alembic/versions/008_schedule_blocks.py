"""schedule blocks for day-specific time off

Revision ID: 008
Revises: 007
Create Date: 2026-05-27

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "008"
down_revision: Union[str, None] = "007"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "professional_schedule_blocks",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("professional_id", sa.UUID(), nullable=False),
        sa.Column("block_date", sa.Date(), nullable=False),
        sa.Column("start_time", sa.Time(), nullable=False),
        sa.Column("end_time", sa.Time(), nullable=False),
        sa.Column("reason", sa.String(length=200), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["professional_id"], ["professionals.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_professional_schedule_blocks_professional_id"),
        "professional_schedule_blocks",
        ["professional_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_professional_schedule_blocks_block_date"),
        "professional_schedule_blocks",
        ["block_date"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_professional_schedule_blocks_block_date"), table_name="professional_schedule_blocks")
    op.drop_index(
        op.f("ix_professional_schedule_blocks_professional_id"),
        table_name="professional_schedule_blocks",
    )
    op.drop_table("professional_schedule_blocks")
