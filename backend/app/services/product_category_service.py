import uuid
from datetime import datetime, timezone

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import AppError, ForbiddenError, NotFoundError
from app.models.financial import FinancialAuditAction, FinancialAuditLog, FinancialEntityType
from app.models.inventory import ProductCategory
from app.models.user import User, UserRole
from app.repositories.financial_repository import FinancialRepository
from app.repositories.inventory_repository import InventoryRepository
from app.repositories.product_category_repository import ProductCategoryRepository
from app.schemas.inventory import decimal_to_float
from app.schemas.product_category import (
    CategoryAggregationsResponse,
    CategoryAggregationItem,
    ProductCategoryCreate,
    ProductCategoryListResponse,
    ProductCategoryResponse,
    ProductCategoryUpdate,
)


class ProductCategoryService:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session
        self._repo = ProductCategoryRepository(session)
        self._inventory_repo = InventoryRepository(session)
        self._financial_repo = FinancialRepository(session)

    async def list_categories(
        self,
        current_user: User,
        *,
        is_active: bool | None = None,
        include_counts: bool = True,
    ) -> ProductCategoryListResponse:
        self._require_view_access(current_user)
        categories = await self._repo.list_categories(is_active=is_active)
        items = []
        for category in categories:
            count = await self._repo.count_products(category.id) if include_counts else 0
            items.append(self._to_response(category, products_count=count))
        return ProductCategoryListResponse(items=items)

    async def create_category(
        self,
        data: ProductCategoryCreate,
        current_user: User,
    ) -> ProductCategoryResponse:
        self._require_admin(current_user)
        category = ProductCategory(
            name=data.name.strip(),
            description=data.description.strip() if data.description else None,
            color=data.color.strip(),
            is_active=data.is_active,
        )
        created = await self._repo.create(category)
        await self._audit(
            action=FinancialAuditAction.category_created,
            actor_id=current_user.id,
            entity_id=created.id,
            metadata={
                "name": created.name,
                "color": created.color,
                "is_active": created.is_active,
            },
        )
        return self._to_response(created, products_count=0)

    async def update_category(
        self,
        category_id: uuid.UUID,
        data: ProductCategoryUpdate,
        current_user: User,
    ) -> ProductCategoryResponse:
        self._require_admin(current_user)
        category = await self._get_or_404(category_id)
        was_active = category.is_active
        changes: dict = {}

        if data.name is not None:
            category.name = data.name.strip()
            changes["name"] = category.name
        if data.description is not None:
            category.description = data.description.strip() if data.description else None
            changes["description"] = category.description
        if data.color is not None:
            category.color = data.color.strip()
            changes["color"] = category.color
        if data.is_active is not None:
            category.is_active = data.is_active
            changes["is_active"] = category.is_active

        updated = await self._repo.update(category)
        count = await self._repo.count_products(updated.id)

        if changes:
            action = FinancialAuditAction.category_updated
            if was_active and data.is_active is False:
                action = FinancialAuditAction.category_deactivated
            elif not was_active and data.is_active is True:
                action = FinancialAuditAction.category_updated
            await self._audit(
                action=action,
                actor_id=current_user.id,
                entity_id=updated.id,
                metadata=changes,
            )

        return self._to_response(updated, products_count=count)

    async def deactivate_category(
        self,
        category_id: uuid.UUID,
        current_user: User,
    ) -> None:
        self._require_admin(current_user)
        category = await self._get_or_404(category_id)
        product_count = await self._repo.count_products(category_id)
        if product_count > 0:
            raise AppError(
                f"Esta categoria possui {product_count} produto(s) vinculado(s). "
                "Desative-a em vez de excluir, ou mova os produtos para outra categoria."
            )
        if not category.is_active:
            return
        category.is_active = False
        await self._repo.update(category)
        await self._audit(
            action=FinancialAuditAction.category_deactivated,
            actor_id=current_user.id,
            entity_id=category.id,
            metadata={"name": category.name},
        )

    async def get_aggregations(self, current_user: User) -> CategoryAggregationsResponse:
        self._require_view_access(current_user)
        period = await self._inventory_repo.get_open_period()
        period_start = period.started_at if period else datetime(1970, 1, 1, tzinfo=timezone.utc)
        rows = await self._repo.get_category_aggregations(period_start=period_start)
        return CategoryAggregationsResponse(
            items=[
                CategoryAggregationItem(
                    category_id=row["category_id"],
                    category_name=row["category_name"],
                    color=row["color"],
                    is_active=row["is_active"],
                    products_count=row["products_count"],
                    revenue=decimal_to_float(row["revenue"]),
                    quantity_sold=row["quantity_sold"],
                )
                for row in rows
            ],
            period_started_at=period.started_at if period else None,
        )

    async def get_active_category_or_404(self, category_id: uuid.UUID) -> ProductCategory:
        category = await self._repo.get_by_id(category_id)
        if category is None or not category.is_active:
            raise NotFoundError("Categoria não encontrada ou inativa")
        return category

    async def _get_or_404(self, category_id: uuid.UUID) -> ProductCategory:
        category = await self._repo.get_by_id(category_id)
        if category is None:
            raise NotFoundError("Categoria não encontrada")
        return category

    async def _audit(
        self,
        *,
        action: FinancialAuditAction,
        actor_id: uuid.UUID,
        entity_id: uuid.UUID,
        metadata: dict | None = None,
    ) -> None:
        log = FinancialAuditLog(
            action=action,
            actor_id=actor_id,
            entity_type=FinancialEntityType.product_category,
            entity_id=entity_id,
            metadata_json=metadata,
        )
        await self._financial_repo.create_audit_log(log)

    @staticmethod
    def _to_response(category: ProductCategory, *, products_count: int) -> ProductCategoryResponse:
        return ProductCategoryResponse(
            id=category.id,
            name=category.name,
            description=category.description,
            color=category.color,
            is_active=category.is_active,
            products_count=products_count,
            created_at=category.created_at,
            updated_at=category.updated_at,
        )

    @staticmethod
    def _require_admin(user: User) -> None:
        if user.role != UserRole.admin:
            raise ForbiddenError("Apenas administradores podem realizar esta operação")

    @staticmethod
    def _require_view_access(user: User) -> None:
        if user.role not in (UserRole.admin, UserRole.barber):
            raise ForbiddenError("Acesso negado")
