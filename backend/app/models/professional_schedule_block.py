import uuid
from datetime import date, time

from sqlalchemy import Date, ForeignKey, String, Time
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDPrimaryKeyMixin


class ProfessionalScheduleBlock(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """Bloqueio pontual de horário em um dia específico (não altera a grade semanal)."""

    __tablename__ = "professional_schedule_blocks"

    professional_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("professionals.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    block_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    start_time: Mapped[time] = mapped_column(Time, nullable=False)
    end_time: Mapped[time] = mapped_column(Time, nullable=False)
    reason: Mapped[str | None] = mapped_column(String(200), nullable=True)

    professional: Mapped["Professional"] = relationship(  # noqa: F821
        back_populates="schedule_blocks",
        lazy="selectin",
    )
