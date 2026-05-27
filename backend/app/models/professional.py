import uuid

from sqlalchemy import ARRAY, Boolean, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDPrimaryKeyMixin
from app.models.associations import professional_services


class Professional(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "professionals"

    name: Mapped[str] = mapped_column(String(200), nullable=False, index=True)
    bio: Mapped[str | None] = mapped_column(Text, nullable=True)
    avatar_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    specialties: Mapped[list[str]] = mapped_column(
        ARRAY(String(100)),
        nullable=False,
        server_default="{}",
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False, index=True)
    is_publicly_visible: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
        index=True,
    )
    user_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    services: Mapped[list["Service"]] = relationship(  # noqa: F821
        secondary=professional_services,
        back_populates="professionals",
        lazy="selectin",
    )
    appointments: Mapped[list["Appointment"]] = relationship(  # noqa: F821
        back_populates="professional",
        lazy="selectin",
    )
    availabilities: Mapped[list["ProfessionalAvailability"]] = relationship(  # noqa: F821
        back_populates="professional",
        lazy="selectin",
        cascade="all, delete-orphan",
    )
    user: Mapped["User | None"] = relationship(back_populates="professional", lazy="selectin")  # noqa: F821
