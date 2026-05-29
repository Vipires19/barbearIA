import uuid
from decimal import Decimal

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.inventory import Product, ProductCategory, Sale, SaleItem, SaleStatus


class ProductCategoryRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def list_categories(
        self,
        *,
        is_active: bool | None = None,
    ) -> list[ProductCategory]:
        query = select(ProductCategory).order_by(ProductCategory.name.asc())
        if is_active is not None:
            query = query.where(ProductCategory.is_active.is_(is_active))
        result = await self._session.execute(query)
        return list(result.scalars().all())

    async def get_by_id(self, category_id: uuid.UUID) -> ProductCategory | None:
        result = await self._session.execute(
            select(ProductCategory).where(ProductCategory.id == category_id)
        )
        return result.scalar_one_or_none()

    async def create(self, category: ProductCategory) -> ProductCategory:
        self._session.add(category)
        await self._session.flush()
        await self._session.refresh(category)
        return category

    async def update(self, category: ProductCategory) -> ProductCategory:
        await self._session.flush()
        await self._session.refresh(category)
        return category

    async def count_products(self, category_id: uuid.UUID) -> int:
        result = await self._session.execute(
            select(func.count()).select_from(Product).where(Product.category_id == category_id)
        )
        return int(result.scalar_one())

    async def get_category_aggregations(
        self,
        *,
        period_start,
    ) -> list[dict]:
        """Revenue, quantity sold and product count per category (open period sales)."""
        product_count_subq = (
            select(
                Product.category_id.label("category_id"),
                func.count(Product.id).label("products_count"),
            )
            .group_by(Product.category_id)
            .subquery()
        )

        sales_subq = (
            select(
                Product.category_id.label("category_id"),
                func.coalesce(func.sum(SaleItem.subtotal), 0).label("revenue"),
                func.coalesce(func.sum(SaleItem.quantity), 0).label("quantity_sold"),
            )
            .join(SaleItem, SaleItem.product_id == Product.id)
            .join(Sale, Sale.id == SaleItem.sale_id)
            .where(
                Sale.status == SaleStatus.completed,
                Sale.created_at >= period_start,
            )
            .group_by(Product.category_id)
            .subquery()
        )

        result = await self._session.execute(
            select(
                ProductCategory.id,
                ProductCategory.name,
                ProductCategory.color,
                ProductCategory.is_active,
                func.coalesce(product_count_subq.c.products_count, 0).label("products_count"),
                func.coalesce(sales_subq.c.revenue, 0).label("revenue"),
                func.coalesce(sales_subq.c.quantity_sold, 0).label("quantity_sold"),
            )
            .outerjoin(product_count_subq, product_count_subq.c.category_id == ProductCategory.id)
            .outerjoin(sales_subq, sales_subq.c.category_id == ProductCategory.id)
            .order_by(ProductCategory.name.asc())
        )

        rows = []
        for row in result.all():
            rows.append(
                {
                    "category_id": row.id,
                    "category_name": row.name,
                    "color": row.color,
                    "is_active": row.is_active,
                    "products_count": int(row.products_count),
                    "revenue": Decimal(str(row.revenue)),
                    "quantity_sold": int(row.quantity_sold),
                }
            )
        return rows
