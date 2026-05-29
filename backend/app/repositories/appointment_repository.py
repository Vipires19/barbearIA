import uuid
from datetime import date, datetime, time

from sqlalchemy import and_, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.appointment import Appointment, AppointmentStatus
from app.models.appointment_item import AppointmentItem
from app.models.professional import Professional
from app.models.professional_availability import ProfessionalAvailability
from app.models.professional_schedule_block import ProfessionalScheduleBlock
from app.models.service import Service

BLOCKING_STATUSES = (AppointmentStatus.scheduled, AppointmentStatus.confirmed)


class AppointmentRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    def _appointment_options(self):
        return (
            selectinload(Appointment.items).selectinload(AppointmentItem.service),
            selectinload(Appointment.professional),
        )

    async def get_by_id(self, appointment_id: uuid.UUID) -> Appointment | None:
        stmt = (
            select(Appointment)
            .where(Appointment.id == appointment_id)
            .options(*self._appointment_options())
        )
        result = await self._session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_services(self, service_ids: list[uuid.UUID]) -> list[Service]:
        if not service_ids:
            return []
        stmt = select(Service).where(Service.id.in_(service_ids))
        result = await self._session.execute(stmt)
        return list(result.scalars().all())

    async def get_professional(self, professional_id: uuid.UUID) -> Professional | None:
        stmt = (
            select(Professional)
            .where(Professional.id == professional_id)
            .options(
                selectinload(Professional.services),
                selectinload(Professional.availabilities),
            )
        )
        result = await self._session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_professional_by_user_id(self, user_id: uuid.UUID) -> Professional | None:
        stmt = (
            select(Professional)
            .where(Professional.user_id == user_id)
            .options(
                selectinload(Professional.services),
                selectinload(Professional.availabilities),
            )
        )
        result = await self._session.execute(stmt)
        return result.scalar_one_or_none()

    def _phone_digits_match_column(self, normalized_digits: str):
        normalized = func.regexp_replace(Appointment.client_phone, r"[^0-9]", "", "g")
        return normalized == normalized_digits

    async def list_public_by_phone(
        self,
        *,
        normalized_phone: str,
        scope: str | None = None,
        limit: int = 100,
    ) -> list[Appointment]:
        stmt = (
            select(Appointment)
            .where(self._phone_digits_match_column(normalized_phone))
            .options(*self._appointment_options())
        )
        today = date.today()
        now_t = datetime.now().time()
        if scope == "upcoming":
            stmt = stmt.where(
                Appointment.status.in_(BLOCKING_STATUSES),
                or_(
                    Appointment.appointment_date > today,
                    and_(Appointment.appointment_date == today, Appointment.start_time > now_t),
                ),
            )
        elif scope == "past":
            stmt = stmt.where(
                or_(
                    Appointment.status.not_in(BLOCKING_STATUSES),
                    Appointment.appointment_date < today,
                    and_(Appointment.appointment_date == today, Appointment.start_time <= now_t),
                ),
            )
        stmt = stmt.order_by(Appointment.appointment_date.asc(), Appointment.start_time.asc()).limit(
            min(max(limit, 1), 100),
        )
        result = await self._session.execute(stmt)
        return list(result.scalars().unique().all())

    async def get_by_id_for_public(
        self,
        appointment_id: uuid.UUID,
        *,
        normalized_phone: str,
    ) -> Appointment | None:
        stmt = (
            select(Appointment)
            .where(
                Appointment.id == appointment_id,
                self._phone_digits_match_column(normalized_phone),
            )
            .options(*self._appointment_options())
        )
        result = await self._session.execute(stmt)
        return result.scalar_one_or_none()

    async def list_appointments(
        self,
        *,
        page: int = 1,
        page_size: int = 20,
        search: str | None = None,
        status: AppointmentStatus | None = None,
        professional_id: uuid.UUID | None = None,
        service_id: uuid.UUID | None = None,
        date_from: date | None = None,
        date_to: date | None = None,
    ) -> tuple[list[Appointment], int]:
        stmt = select(Appointment).options(*self._appointment_options())
        count_stmt = select(func.count()).select_from(Appointment)

        filters = []
        if status is not None:
            filters.append(Appointment.status == status)
        if professional_id is not None:
            filters.append(Appointment.professional_id == professional_id)
        if service_id is not None:
            filters.append(Appointment.items.any(AppointmentItem.service_id == service_id))
        if date_from is not None:
            filters.append(Appointment.appointment_date >= date_from)
        if date_to is not None:
            filters.append(Appointment.appointment_date <= date_to)
        if search:
            term = f"%{search.strip()}%"
            filters.append(
                or_(
                    Appointment.client_name.ilike(term),
                    Appointment.client_phone.ilike(term),
                    Appointment.client_email.ilike(term),
                )
            )

        if filters:
            condition = and_(*filters)
            stmt = stmt.where(condition)
            count_stmt = count_stmt.where(condition)

        stmt = stmt.order_by(Appointment.appointment_date.desc(), Appointment.start_time.desc())
        stmt = stmt.offset((page - 1) * page_size).limit(page_size)

        total_result = await self._session.execute(count_stmt)
        total = total_result.scalar_one()

        result = await self._session.execute(stmt)
        return list(result.scalars().unique().all()), total

    async def list_day_blocking_appointments(
        self,
        *,
        professional_id: uuid.UUID,
        appointment_date: date,
        exclude_id: uuid.UUID | None = None,
    ) -> list[Appointment]:
        stmt = select(Appointment).where(
            Appointment.professional_id == professional_id,
            Appointment.appointment_date == appointment_date,
            Appointment.status.in_(BLOCKING_STATUSES),
        )
        if exclude_id is not None:
            stmt = stmt.where(Appointment.id != exclude_id)
        stmt = stmt.order_by(Appointment.start_time.asc())
        result = await self._session.execute(stmt)
        return list(result.scalars().all())

    async def list_schedule_blocks_for_day(
        self,
        *,
        professional_id: uuid.UUID,
        block_date: date,
    ) -> list[ProfessionalScheduleBlock]:
        stmt = select(ProfessionalScheduleBlock).where(
            ProfessionalScheduleBlock.professional_id == professional_id,
            ProfessionalScheduleBlock.block_date == block_date,
        )
        result = await self._session.execute(stmt)
        return list(result.scalars().all())

    async def has_schedule_block_conflict(
        self,
        *,
        professional_id: uuid.UUID,
        block_date: date,
        start_time: time,
        end_time: time,
    ) -> bool:
        stmt = select(func.count()).select_from(ProfessionalScheduleBlock).where(
            ProfessionalScheduleBlock.professional_id == professional_id,
            ProfessionalScheduleBlock.block_date == block_date,
            ProfessionalScheduleBlock.start_time < end_time,
            ProfessionalScheduleBlock.end_time > start_time,
        )
        result = await self._session.execute(stmt)
        return result.scalar_one() > 0

    async def list_active_availabilities_for_weekday(
        self,
        professional_id: uuid.UUID,
        weekday: int,
    ) -> list[ProfessionalAvailability]:
        stmt = select(ProfessionalAvailability).where(
            ProfessionalAvailability.professional_id == professional_id,
            ProfessionalAvailability.weekday == weekday,
            ProfessionalAvailability.active.is_(True),
        )
        result = await self._session.execute(stmt)
        return list(result.scalars().all())

    async def has_conflict(
        self,
        *,
        professional_id: uuid.UUID,
        appointment_date: date,
        start_time: time,
        end_time: time,
        exclude_id: uuid.UUID | None = None,
    ) -> bool:
        stmt = select(func.count()).select_from(Appointment).where(
            Appointment.professional_id == professional_id,
            Appointment.appointment_date == appointment_date,
            Appointment.status.in_(BLOCKING_STATUSES),
            Appointment.start_time < end_time,
            Appointment.end_time > start_time,
        )
        if exclude_id is not None:
            stmt = stmt.where(Appointment.id != exclude_id)
        result = await self._session.execute(stmt)
        return result.scalar_one() > 0

    async def create(self, appointment: Appointment) -> Appointment:
        self._session.add(appointment)
        await self._session.flush()
        await self._session.refresh(appointment, attribute_names=["items", "professional"])
        return appointment

    async def update(self, appointment: Appointment, **fields: object) -> Appointment:
        for key, value in fields.items():
            if value is not None:
                setattr(appointment, key, value)
        await self._session.flush()
        await self._session.refresh(appointment, attribute_names=["items", "professional"])
        return appointment
