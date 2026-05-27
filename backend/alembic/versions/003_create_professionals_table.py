"""create professionals table

Revision ID: 003
Revises: 002
Create Date: 2026-05-21

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "003"
down_revision: Union[str, None] = "002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "professionals",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("name", sa.String(length=200), nullable=False),
        sa.Column("bio", sa.Text(), nullable=True),
        sa.Column("avatar_url", sa.String(length=500), nullable=True),
        sa.Column(
            "specialties",
            postgresql.ARRAY(sa.String(length=100)),
            nullable=False,
            server_default="{}",
        ),
        sa.Column(
            "work_days",
            postgresql.ARRAY(sa.Integer()),
            nullable=False,
            server_default="{}",
        ),
        sa.Column("start_hour", sa.Time(), nullable=False, server_default="09:00:00"),
        sa.Column("end_hour", sa.Time(), nullable=False, server_default="18:00:00"),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_professionals_name"), "professionals", ["name"], unique=False)
    op.create_index(op.f("ix_professionals_is_active"), "professionals", ["is_active"], unique=False)

    op.create_table(
        "professional_services",
        sa.Column("professional_id", sa.UUID(), nullable=False),
        sa.Column("service_id", sa.UUID(), nullable=False),
        sa.ForeignKeyConstraint(["professional_id"], ["professionals.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["service_id"], ["services.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("professional_id", "service_id"),
    )


def downgrade() -> None:
    op.drop_table("professional_services")
    op.drop_index(op.f("ix_professionals_is_active"), table_name="professionals")
    op.drop_index(op.f("ix_professionals_name"), table_name="professionals")
    op.drop_table("professionals")
