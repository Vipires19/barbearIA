"""etapa6b: availability, appointment items, professional refactor

Revision ID: 007
Revises: 006
Create Date: 2026-05-27

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "007"
down_revision: Union[str, None] = "006"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "professionals",
        sa.Column("is_publicly_visible", sa.Boolean(), nullable=False, server_default=sa.text("false")),
    )
    op.create_index(
        op.f("ix_professionals_is_publicly_visible"),
        "professionals",
        ["is_publicly_visible"],
        unique=False,
    )

    op.create_table(
        "professional_availabilities",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("professional_id", sa.UUID(), nullable=False),
        sa.Column("weekday", sa.Integer(), nullable=False),
        sa.Column("start_time", sa.Time(), nullable=False),
        sa.Column("end_time", sa.Time(), nullable=False),
        sa.Column("active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
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
        sa.ForeignKeyConstraint(["professional_id"], ["professionals.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "professional_id",
            "weekday",
            "start_time",
            "end_time",
            name="uq_professional_availability_slot",
        ),
    )
    op.create_index(
        op.f("ix_professional_availabilities_professional_id"),
        "professional_availabilities",
        ["professional_id"],
        unique=False,
    )

    op.execute(
        """
        INSERT INTO professional_availabilities (
            id, professional_id, weekday, start_time, end_time, active, created_at, updated_at
        )
        SELECT
            gen_random_uuid(),
            p.id,
            d.day,
            p.start_hour,
            p.end_hour,
            true,
            now(),
            now()
        FROM professionals p
        CROSS JOIN LATERAL unnest(p.work_days) AS d(day)
        WHERE cardinality(p.work_days) > 0
        """
    )

    op.drop_column("professionals", "work_days")
    op.drop_column("professionals", "start_hour")
    op.drop_column("professionals", "end_hour")

    op.add_column("appointments", sa.Column("total_duration_minutes", sa.Integer(), nullable=True))
    op.add_column(
        "appointments",
        sa.Column("total_price", sa.Numeric(precision=10, scale=2), nullable=True),
    )

    op.create_table(
        "appointment_items",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("appointment_id", sa.UUID(), nullable=False),
        sa.Column("service_id", sa.UUID(), nullable=False),
        sa.Column("duration_minutes", sa.Integer(), nullable=False),
        sa.Column("price", sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column("position", sa.Integer(), nullable=False, server_default="0"),
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
        sa.ForeignKeyConstraint(["appointment_id"], ["appointments.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["service_id"], ["services.id"], ondelete="RESTRICT"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_appointment_items_appointment_id"),
        "appointment_items",
        ["appointment_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_appointment_items_service_id"),
        "appointment_items",
        ["service_id"],
        unique=False,
    )

    op.execute(
        """
        INSERT INTO appointment_items (
            id, appointment_id, service_id, duration_minutes, price, position, created_at, updated_at
        )
        SELECT
            gen_random_uuid(),
            a.id,
            a.service_id,
            s.duration_minutes,
            s.price,
            0,
            now(),
            now()
        FROM appointments a
        JOIN services s ON s.id = a.service_id
        """
    )

    op.execute(
        """
        UPDATE appointments a
        SET
            total_duration_minutes = s.duration_minutes,
            total_price = s.price
        FROM services s
        WHERE s.id = a.service_id
        """
    )

    op.alter_column("appointments", "total_duration_minutes", nullable=False)
    op.alter_column("appointments", "total_price", nullable=False)

    op.drop_index(op.f("ix_appointments_service_id"), table_name="appointments")
    op.drop_constraint("appointments_service_id_fkey", "appointments", type_="foreignkey")
    op.drop_column("appointments", "service_id")


def downgrade() -> None:
    op.add_column("appointments", sa.Column("service_id", sa.UUID(), nullable=True))
    op.execute(
        """
        UPDATE appointments a
        SET service_id = (
            SELECT ai.service_id
            FROM appointment_items ai
            WHERE ai.appointment_id = a.id
            ORDER BY ai.position
            LIMIT 1
        )
        """
    )
    op.alter_column("appointments", "service_id", nullable=False)
    op.create_foreign_key(
        "appointments_service_id_fkey",
        "appointments",
        "services",
        ["service_id"],
        ["id"],
        ondelete="RESTRICT",
    )
    op.create_index(op.f("ix_appointments_service_id"), "appointments", ["service_id"], unique=False)

    op.drop_column("appointments", "total_price")
    op.drop_column("appointments", "total_duration_minutes")
    op.drop_table("appointment_items")

    op.add_column(
        "professionals",
        sa.Column("work_days", postgresql.ARRAY(sa.Integer()), nullable=False, server_default="{}"),
    )
    op.add_column(
        "professionals",
        sa.Column("start_hour", sa.Time(), nullable=False, server_default="09:00:00"),
    )
    op.add_column(
        "professionals",
        sa.Column("end_hour", sa.Time(), nullable=False, server_default="18:00:00"),
    )

    op.execute(
        """
        UPDATE professionals p
        SET
            work_days = COALESCE(
                (
                    SELECT array_agg(DISTINCT pa.weekday ORDER BY pa.weekday)
                    FROM professional_availabilities pa
                    WHERE pa.professional_id = p.id AND pa.active = true
                ),
                '{}'::integer[]
            ),
            start_hour = COALESCE(
                (SELECT MIN(pa.start_time) FROM professional_availabilities pa WHERE pa.professional_id = p.id),
                '09:00:00'::time
            ),
            end_hour = COALESCE(
                (SELECT MAX(pa.end_time) FROM professional_availabilities pa WHERE pa.professional_id = p.id),
                '18:00:00'::time
            )
        """
    )

    op.drop_table("professional_availabilities")
    op.drop_index(op.f("ix_professionals_is_publicly_visible"), table_name="professionals")
    op.drop_column("professionals", "is_publicly_visible")
