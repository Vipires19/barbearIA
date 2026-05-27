import enum
import uuid
from datetime import date, time
from decimal import Decimal

from sqlalchemy import Date, ForeignKey, Integer, Numeric, String, Text, Time
from sqlalchemy.dialects.postgresql import ENUM, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDPrimaryKeyMixin


class AppointmentStatus(str, enum.Enum):
    scheduled = "scheduled"
    confirmed = "confirmed"
    completed = "completed"
    cancelled = "cancelled"
    no_show = "no_show"


class Appointment(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """Sessão de atendimento (pode incluir múltiplos serviços via items)."""

    __tablename__ = "appointments"

    client_name: Mapped[str] = mapped_column(String(200), nullable=False, index=True)
    client_phone: Mapped[str] = mapped_column(String(30), nullable=False, index=True)
    client_email: Mapped[str | None] = mapped_column(String(254), nullable=True)
    professional_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("professionals.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    appointment_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    start_time: Mapped[time] = mapped_column(Time, nullable=False)
    end_time: Mapped[time] = mapped_column(Time, nullable=False)
    total_duration_minutes: Mapped[int] = mapped_column(Integer, nullable=False)
    total_price: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    status: Mapped[AppointmentStatus] = mapped_column(
        ENUM(
            AppointmentStatus,
            name="appointment_status",
            create_type=False,
        ),
        nullable=False,
        default=AppointmentStatus.scheduled,
        index=True,
    )
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    items: Mapped[list["AppointmentItem"]] = relationship(  # noqa: F821
        back_populates="appointment",
        lazy="selectin",
        order_by="AppointmentItem.position",
        cascade="all, delete-orphan",
    )
    professional: Mapped["Professional"] = relationship(  # noqa: F821
        back_populates="appointments",
        lazy="selectin",
    )
