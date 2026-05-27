import uuid
from decimal import Decimal

from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.service import Service


class ServiceRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def get_by_id(self, service_id: uuid.UUID) -> Service | None:
        return await self._session.get(Service, service_id)

    async def list_services(
        self,
        *,
        page: int = 1,
        page_size: int = 20,
        search: str | None = None,
        is_active: bool | None = None,
    ) -> tuple[list[Service], int]:
        stmt = select(Service)
        count_stmt = select(func.count()).select_from(Service)

        if is_active is not None:
            stmt = stmt.where(Service.is_active == is_active)
            count_stmt = count_stmt.where(Service.is_active == is_active)

        if search:
            term = f"%{search.strip()}%"
            condition = or_(
                Service.name.ilike(term),
                Service.description.ilike(term),
            )
            stmt = stmt.where(condition)
            count_stmt = count_stmt.where(condition)

        stmt = stmt.order_by(Service.name.asc())
        offset = (page - 1) * page_size
        stmt = stmt.offset(offset).limit(page_size)

        total_result = await self._session.execute(count_stmt)
        total = total_result.scalar_one()

        result = await self._session.execute(stmt)
        items = list(result.scalars().all())
        return items, total

    async def create(
        self,
        *,
        name: str,
        description: str | None,
        price: Decimal,
        duration_minutes: int,
        is_active: bool,
        image_url: str | None = None,
    ) -> Service:
        service = Service(
            name=name,
            description=description,
            price=price,
            duration_minutes=duration_minutes,
            image_url=image_url,
            is_active=is_active,
        )
        self._session.add(service)
        await self._session.flush()
        await self._session.refresh(service)
        return service

    async def update(self, service: Service, **fields: object) -> Service:
        for key, value in fields.items():
            if value is not None:
                setattr(service, key, value)
        await self._session.flush()
        await self._session.refresh(service)
        return service

    async def delete(self, service: Service) -> None:
        await self._session.delete(service)
        await self._session.flush()
