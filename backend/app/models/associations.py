from sqlalchemy import Column, ForeignKey, Table
from sqlalchemy.dialects.postgresql import UUID

from app.db.base import Base

professional_services = Table(
    "professional_services",
    Base.metadata,
    Column(
        "professional_id",
        UUID(as_uuid=True),
        ForeignKey("professionals.id", ondelete="CASCADE"),
        primary_key=True,
    ),
    Column(
        "service_id",
        UUID(as_uuid=True),
        ForeignKey("services.id", ondelete="CASCADE"),
        primary_key=True,
    ),
)
