import uuid
from datetime import time

from sqlalchemy import Boolean, ForeignKey, Integer, Time, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDPrimaryKeyMixin


class ProfessionalAvailability(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """Regra base de disponibilidade semanal do profissional."""

    __tablename__ = "professional_availabilities"
    __table_args__ = (
        UniqueConstraint(
            "professional_id",
            "weekday",
            "start_time",
            "end_time",
            name="uq_professional_availability_slot",
        ),
    )

    professional_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("professionals.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    weekday: Mapped[int] = mapped_column(Integer, nullable=False)
    start_time: Mapped[time] = mapped_column(Time, nullable=False)
    end_time: Mapped[time] = mapped_column(Time, nullable=False)
    active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    professional: Mapped["Professional"] = relationship(  # noqa: F821
        back_populates="availabilities",
        lazy="selectin",
    )
