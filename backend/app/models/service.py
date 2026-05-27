from decimal import Decimal



from sqlalchemy import Boolean, Integer, Numeric, String, Text

from sqlalchemy.orm import Mapped, mapped_column, relationship



from app.db.base import Base, TimestampMixin, UUIDPrimaryKeyMixin

from app.models.associations import professional_services





class Service(UUIDPrimaryKeyMixin, TimestampMixin, Base):

    __tablename__ = "services"



    name: Mapped[str] = mapped_column(String(200), nullable=False, index=True)

    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    price: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)

    duration_minutes: Mapped[int] = mapped_column(Integer, nullable=False, default=30)

    image_url: Mapped[str | None] = mapped_column(String(500), nullable=True)

    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False, index=True)



    professionals: Mapped[list["Professional"]] = relationship(  # noqa: F821

        secondary=professional_services,

        back_populates="services",

        lazy="selectin",

    )

