import math
import uuid
from datetime import date, datetime, timezone
from decimal import Decimal

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.financial import FinancialEntry, FinancialEntryType, FinancialPeriod, FinancialPeriodStatus
from app.models.inventory import (
    InventoryMovement,
    InventoryMovementType,
    Product,
    ProductCategory,
    Sale,
    SaleItem,
    SaleStatus,
)


class InventoryRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def list_products(
        self,
        *,
        page: int,
        page_size: int,
        search: str | None = None,
        is_active: bool | None = None,
        category_id: uuid.UUID | None = None,
    ) -> tuple[list[Product], int]:
        query = select(Product).options(selectinload(Product.category))
        count_query = select(func.count()).select_from(Product)

        if search:
            pattern = f"%{search.strip()}%"
            query = query.where(Product.name.ilike(pattern))
            count_query = count_query.where(Product.name.ilike(pattern))
        if is_active is not None:
            query = query.where(Product.is_active.is_(is_active))
            count_query = count_query.where(Product.is_active.is_(is_active))
        if category_id is not None:
            query = query.where(Product.category_id == category_id)
            count_query = count_query.where(Product.category_id == category_id)

        total = int((await self._session.execute(count_query)).scalar_one())
        result = await self._session.execute(
            query.order_by(Product.name.asc()).offset((page - 1) * page_size).limit(page_size)
        )
        return list(result.scalars().all()), total

    async def get_product_by_id(self, product_id: uuid.UUID, *, for_update: bool = False) -> Product | None:
        query = select(Product).options(selectinload(Product.category)).where(Product.id == product_id)
        if for_update:
            query = query.with_for_update()
        result = await self._session.execute(query)
        return result.scalar_one_or_none()

    async def create_product(self, product: Product) -> Product:
        self._session.add(product)
        await self._session.flush()
        await self._session.refresh(product)
        return product

    async def update_product(self, product: Product) -> Product:
        await self._session.flush()
        await self._session.refresh(product)
        return product

    async def count_products(self) -> int:
        result = await self._session.execute(select(func.count()).select_from(Product))
        return int(result.scalar_one())

    async def count_low_stock_products(self) -> int:
        result = await self._session.execute(
            select(func.count()).select_from(Product).where(
                Product.is_active.is_(True),
                Product.stock_quantity <= Product.minimum_stock,
            )
        )
        return int(result.scalar_one())

    async def list_low_stock_products(self, *, limit: int = 20) -> list[Product]:
        result = await self._session.execute(
            select(Product)
            .options(selectinload(Product.category))
            .where(
                Product.is_active.is_(True),
                Product.stock_quantity <= Product.minimum_stock,
            )
            .order_by(Product.stock_quantity.asc())
            .limit(limit)
        )
        return list(result.scalars().all())

    async def create_movement(self, movement: InventoryMovement) -> InventoryMovement:
        self._session.add(movement)
        await self._session.flush()
        await self._session.refresh(movement)
        return movement

    async def list_movements(
        self,
        *,
        page: int,
        page_size: int,
        product_id: uuid.UUID | None = None,
    ) -> tuple[list[InventoryMovement], int]:
        query = select(InventoryMovement).options(
            selectinload(InventoryMovement.product),
            selectinload(InventoryMovement.creator),
        )
        count_query = select(func.count()).select_from(InventoryMovement)

        if product_id is not None:
            query = query.where(InventoryMovement.product_id == product_id)
            count_query = count_query.where(InventoryMovement.product_id == product_id)

        total = int((await self._session.execute(count_query)).scalar_one())
        result = await self._session.execute(
            query.order_by(InventoryMovement.created_at.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        return list(result.scalars().all()), total

    async def create_sale(self, sale: Sale) -> Sale:
        self._session.add(sale)
        await self._session.flush()
        await self._session.refresh(sale)
        return sale

    async def get_sale_by_id(self, sale_id: uuid.UUID, *, for_update: bool = False) -> Sale | None:
        query = (
            select(Sale)
            .options(
                selectinload(Sale.items).selectinload(SaleItem.product),
                selectinload(Sale.creator),
            )
            .where(Sale.id == sale_id)
        )
        if for_update:
            query = query.with_for_update()
        result = await self._session.execute(query)
        return result.scalar_one_or_none()

    async def list_sales(
        self,
        *,
        page: int,
        page_size: int,
        status: SaleStatus | None = None,
        date_from: date | None = None,
        date_to: date | None = None,
    ) -> tuple[list[Sale], int]:
        query = select(Sale).options(
            selectinload(Sale.items).selectinload(SaleItem.product),
            selectinload(Sale.creator),
        )
        count_query = select(func.count()).select_from(Sale)

        if status is not None:
            query = query.where(Sale.status == status)
            count_query = count_query.where(Sale.status == status)
        if date_from is not None:
            query = query.where(func.date(Sale.created_at) >= date_from)
            count_query = count_query.where(func.date(Sale.created_at) >= date_from)
        if date_to is not None:
            query = query.where(func.date(Sale.created_at) <= date_to)
            count_query = count_query.where(func.date(Sale.created_at) <= date_to)

        total = int((await self._session.execute(count_query)).scalar_one())
        result = await self._session.execute(
            query.order_by(Sale.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
        )
        return list(result.scalars().all()), total

    async def count_sales_in_period(
        self,
        *,
        period_start: datetime,
        status: SaleStatus = SaleStatus.completed,
    ) -> int:
        result = await self._session.execute(
            select(func.count())
            .select_from(Sale)
            .where(
                Sale.status == status,
                Sale.created_at >= period_start,
            )
        )
        return int(result.scalar_one())

    async def sum_product_sales_revenue_in_period(self, period_id: uuid.UUID) -> Decimal:
        result = await self._session.execute(
            select(func.coalesce(func.sum(FinancialEntry.amount_snapshot), 0)).where(
                FinancialEntry.period_id == period_id,
                FinancialEntry.entry_type == FinancialEntryType.product_sale,
            )
        )
        return Decimal(str(result.scalar_one()))

    async def sum_service_revenue_in_period(self, period_id: uuid.UUID) -> Decimal:
        result = await self._session.execute(
            select(func.coalesce(func.sum(FinancialEntry.amount_snapshot), 0)).where(
                FinancialEntry.period_id == period_id,
                FinancialEntry.entry_type == FinancialEntryType.service_revenue,
            )
        )
        return Decimal(str(result.scalar_one()))

    async def get_open_period(self) -> FinancialPeriod | None:
        result = await self._session.execute(
            select(FinancialPeriod)
            .where(FinancialPeriod.status == FinancialPeriodStatus.open)
            .order_by(FinancialPeriod.started_at.desc())
            .limit(1)
        )
        return result.scalar_one_or_none()

    async def get_financial_entry_by_sale_id(self, sale_id: uuid.UUID) -> FinancialEntry | None:
        result = await self._session.execute(
            select(FinancialEntry).where(
                FinancialEntry.sale_id == sale_id,
                FinancialEntry.entry_type == FinancialEntryType.product_sale,
                FinancialEntry.amount_snapshot > 0,
            )
        )
        return result.scalar_one_or_none()

    async def get_reversal_entry_by_sale_id(self, sale_id: uuid.UUID) -> FinancialEntry | None:
        result = await self._session.execute(
            select(FinancialEntry).where(
                FinancialEntry.sale_id == sale_id,
                FinancialEntry.entry_type == FinancialEntryType.product_sale,
                FinancialEntry.amount_snapshot < 0,
            )
        )
        return result.scalar_one_or_none()

    @staticmethod
    def paginate(total: int, page: int, page_size: int) -> int:
        return max(1, math.ceil(total / page_size)) if total else 1
