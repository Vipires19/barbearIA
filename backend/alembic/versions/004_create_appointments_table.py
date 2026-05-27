"""create appointments table

Revision ID: 004
Revises: 003
Create Date: 2026-05-26

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects.postgresql import ENUM

revision: str = "004"
down_revision: Union[str, None] = "003"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

# Usar sqlalchemy.dialects.postgresql.ENUM com create_type=False: o tipo
# `sa.Enum(..., create_type=False)` vira PG ENUM com create_type=True no
# dialect impl, então os hooks _on_metadata_create e _on_table_create
# continuariam emitindo CREATE TYPE (duplicado). Com PG ENUM + create_type=False,
# os hooks não chamam create(); o tipo é criado uma vez abaixo com .create().
appointment_status = ENUM(
    "scheduled",
    "confirmed",
    "completed",
    "cancelled",
    "no_show",
    name="appointment_status",
    create_type=False,
)


def upgrade() -> None:
    appointment_status.create(op.get_bind(), checkfirst=True)
    op.create_table(
        "appointments",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("client_name", sa.String(length=200), nullable=False),
        sa.Column("client_phone", sa.String(length=30), nullable=False),
        sa.Column("client_email", sa.String(length=254), nullable=True),
        sa.Column("service_id", sa.UUID(), nullable=False),
        sa.Column("professional_id", sa.UUID(), nullable=False),
        sa.Column("appointment_date", sa.Date(), nullable=False),
        sa.Column("start_time", sa.Time(), nullable=False),
        sa.Column("end_time", sa.Time(), nullable=False),
        sa.Column("status", appointment_status, nullable=False, server_default="scheduled"),
        sa.Column("notes", sa.Text(), nullable=True),
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
        sa.ForeignKeyConstraint(["professional_id"], ["professionals.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["service_id"], ["services.id"], ondelete="RESTRICT"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_appointments_client_name"), "appointments", ["client_name"], unique=False)
    op.create_index(op.f("ix_appointments_client_phone"), "appointments", ["client_phone"], unique=False)
    op.create_index(op.f("ix_appointments_service_id"), "appointments", ["service_id"], unique=False)
    op.create_index(
        op.f("ix_appointments_professional_id"),
        "appointments",
        ["professional_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_appointments_appointment_date"),
        "appointments",
        ["appointment_date"],
        unique=False,
    )
    op.create_index(op.f("ix_appointments_status"), "appointments", ["status"], unique=False)
    op.create_index(
        "ix_appointments_professional_date_time",
        "appointments",
        ["professional_id", "appointment_date", "start_time", "end_time"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index("ix_appointments_professional_date_time", table_name="appointments")
    op.drop_index(op.f("ix_appointments_status"), table_name="appointments")
    op.drop_index(op.f("ix_appointments_appointment_date"), table_name="appointments")
    op.drop_index(op.f("ix_appointments_professional_id"), table_name="appointments")
    op.drop_index(op.f("ix_appointments_service_id"), table_name="appointments")
    op.drop_index(op.f("ix_appointments_client_phone"), table_name="appointments")
    op.drop_index(op.f("ix_appointments_client_name"), table_name="appointments")
    op.drop_table("appointments")
    appointment_status.drop(op.get_bind(), checkfirst=True)
