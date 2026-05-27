import uuid
from decimal import Decimal

from sqlalchemy import ForeignKey, Integer, Numeric
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDPrimaryKeyMixin


class AppointmentItem(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "appointment_items"

    appointment_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("appointments.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    service_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("services.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    duration_minutes: Mapped[int] = mapped_column(Integer, nullable=False)
    price: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    position: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    appointment: Mapped["Appointment"] = relationship(back_populates="items", lazy="selectin")  # noqa: F821
    service: Mapped["Service"] = relationship(lazy="selectin")  # noqa: F821
