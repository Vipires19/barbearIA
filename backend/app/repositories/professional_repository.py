import uuid



from sqlalchemy import delete, func, or_, select

from sqlalchemy.ext.asyncio import AsyncSession

from sqlalchemy.orm import selectinload



from datetime import date

from app.models.professional import Professional

from app.models.professional_availability import ProfessionalAvailability

from app.models.professional_schedule_block import ProfessionalScheduleBlock

from app.models.service import Service

from app.schemas.professional import parse_time_str





class ProfessionalRepository:

    def __init__(self, session: AsyncSession) -> None:

        self._session = session



    def _base_stmt(self):

        return select(Professional).options(

            selectinload(Professional.services),

            selectinload(Professional.user),

            selectinload(Professional.availabilities),

        )



    async def get_by_id(self, professional_id: uuid.UUID) -> Professional | None:

        stmt = self._base_stmt().where(Professional.id == professional_id)

        result = await self._session.execute(stmt)

        return result.scalar_one_or_none()



    async def get_by_user_id(self, user_id: uuid.UUID) -> Professional | None:

        stmt = self._base_stmt().where(Professional.user_id == user_id)

        result = await self._session.execute(stmt)

        return result.scalar_one_or_none()



    async def list_professionals(

        self,

        *,

        page: int = 1,

        page_size: int = 20,

        search: str | None = None,

        is_active: bool | None = None,

        is_publicly_visible: bool | None = None,

        service_id: uuid.UUID | None = None,

    ) -> tuple[list[Professional], int]:

        stmt = self._base_stmt()

        count_stmt = select(func.count()).select_from(Professional)



        if is_active is not None:

            stmt = stmt.where(Professional.is_active == is_active)

            count_stmt = count_stmt.where(Professional.is_active == is_active)



        if is_publicly_visible is not None:

            stmt = stmt.where(Professional.is_publicly_visible == is_publicly_visible)

            count_stmt = count_stmt.where(Professional.is_publicly_visible == is_publicly_visible)



        if search:

            term = f"%{search.strip()}%"

            condition = or_(

                Professional.name.ilike(term),

                Professional.bio.ilike(term),

            )

            stmt = stmt.where(condition)

            count_stmt = count_stmt.where(condition)



        if service_id is not None:

            stmt = stmt.where(Professional.services.any(Service.id == service_id))

            count_stmt = count_stmt.where(Professional.services.any(Service.id == service_id))



        stmt = stmt.order_by(Professional.name.asc())

        offset = (page - 1) * page_size

        stmt = stmt.offset(offset).limit(page_size)



        total_result = await self._session.execute(count_stmt)

        total = total_result.scalar_one()



        result = await self._session.execute(stmt)

        return list(result.scalars().unique().all()), total



    async def get_services_by_ids(self, service_ids: list[uuid.UUID]) -> list[Service]:

        if not service_ids:

            return []

        stmt = select(Service).where(Service.id.in_(service_ids))

        result = await self._session.execute(stmt)

        return list(result.scalars().all())



    async def create(

        self,

        *,

        name: str,

        is_active: bool,

        user_id: uuid.UUID | None = None,

    ) -> Professional:

        professional = Professional(

            name=name,

            is_active=is_active,

            is_publicly_visible=False,

            user_id=user_id,

        )

        self._session.add(professional)

        await self._session.flush()

        await self._session.refresh(professional, attribute_names=["services", "user", "availabilities"])

        return professional



    async def update(self, professional: Professional, **fields: object) -> Professional:

        services = fields.pop("services", None)

        for key, value in fields.items():

            if value is not None or key in ("bio", "avatar_url", "user_id"):

                setattr(professional, key, value)

        if services is not None:

            professional.services = services

        await self._session.flush()

        stmt = (
            self._base_stmt()
            .where(Professional.id == professional.id)
            .execution_options(populate_existing=True)
        )
        result = await self._session.execute(stmt)
        reloaded = result.scalar_one_or_none()

        return reloaded if reloaded is not None else professional



    async def clear_user_link(self, professional: Professional) -> Professional:

        professional.user_id = None

        await self._session.flush()

        await self._session.refresh(professional, attribute_names=["services", "user", "availabilities"])

        return professional



    async def delete(self, professional: Professional) -> None:

        await self._session.delete(professional)

        await self._session.flush()



    async def list_availabilities(self, professional_id: uuid.UUID) -> list[ProfessionalAvailability]:

        stmt = (

            select(ProfessionalAvailability)

            .where(ProfessionalAvailability.professional_id == professional_id)

            .order_by(ProfessionalAvailability.weekday, ProfessionalAvailability.start_time)

        )

        result = await self._session.execute(stmt)

        return list(result.scalars().all())



    async def get_availability_by_id(

        self,

        availability_id: uuid.UUID,

        professional_id: uuid.UUID,

    ) -> ProfessionalAvailability | None:

        stmt = select(ProfessionalAvailability).where(

            ProfessionalAvailability.id == availability_id,

            ProfessionalAvailability.professional_id == professional_id,

        )

        result = await self._session.execute(stmt)

        return result.scalar_one_or_none()



    async def create_availability(

        self,

        *,

        professional_id: uuid.UUID,

        weekday: int,

        start_time: str,

        end_time: str,

        active: bool,

    ) -> ProfessionalAvailability:

        row = ProfessionalAvailability(

            professional_id=professional_id,

            weekday=weekday,

            start_time=parse_time_str(start_time),

            end_time=parse_time_str(end_time),

            active=active,

        )

        self._session.add(row)

        await self._session.flush()

        return row



    async def update_availability(self, row: ProfessionalAvailability, **fields: object) -> ProfessionalAvailability:

        for key, value in fields.items():

            if value is None:

                continue

            if key in ("start_time", "end_time"):

                setattr(row, key, parse_time_str(value))

            else:

                setattr(row, key, value)

        await self._session.flush()

        return row



    async def delete_availability(self, row: ProfessionalAvailability) -> None:

        await self._session.delete(row)

        await self._session.flush()



    async def replace_availabilities(

        self,

        professional_id: uuid.UUID,

        *,

        entries: list[dict[str, object]],

    ) -> list[ProfessionalAvailability]:
        await self._session.execute(
            delete(ProfessionalAvailability).where(
                ProfessionalAvailability.professional_id == professional_id
            )
        )
        await self._session.flush()

        created: list[ProfessionalAvailability] = []

        for entry in entries:

            row = ProfessionalAvailability(

                professional_id=professional_id,

                weekday=int(entry["weekday"]),

                start_time=parse_time_str(str(entry["start_time"])),

                end_time=parse_time_str(str(entry["end_time"])),

                active=bool(entry["active"]),

            )

            self._session.add(row)

            created.append(row)

        await self._session.flush()

        return sorted(created, key=lambda r: (r.weekday, r.start_time))



    async def list_schedule_blocks_for_date(

        self,

        professional_id: uuid.UUID,

        block_date: date,

    ) -> list[ProfessionalScheduleBlock]:

        stmt = (

            select(ProfessionalScheduleBlock)

            .where(

                ProfessionalScheduleBlock.professional_id == professional_id,

                ProfessionalScheduleBlock.block_date == block_date,

            )

            .order_by(ProfessionalScheduleBlock.start_time)

        )

        result = await self._session.execute(stmt)

        return list(result.scalars().all())



    async def get_schedule_block_by_id(

        self,

        block_id: uuid.UUID,

        professional_id: uuid.UUID,

    ) -> ProfessionalScheduleBlock | None:

        stmt = select(ProfessionalScheduleBlock).where(

            ProfessionalScheduleBlock.id == block_id,

            ProfessionalScheduleBlock.professional_id == professional_id,

        )

        result = await self._session.execute(stmt)

        return result.scalar_one_or_none()



    async def create_schedule_block(

        self,

        *,

        professional_id: uuid.UUID,

        block_date: date,

        start_time: str,

        end_time: str,

        reason: str | None,

    ) -> ProfessionalScheduleBlock:

        row = ProfessionalScheduleBlock(

            professional_id=professional_id,

            block_date=block_date,

            start_time=parse_time_str(start_time),

            end_time=parse_time_str(end_time),

            reason=reason.strip() if reason else None,

        )

        self._session.add(row)

        await self._session.flush()

        return row



    async def delete_schedule_block(self, row: ProfessionalScheduleBlock) -> None:

        await self._session.delete(row)

        await self._session.flush()

