import math
import uuid
from datetime import date, datetime, timezone
from decimal import Decimal, ROUND_HALF_UP

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import AppError, ForbiddenError, NotFoundError
from app.models.financial import (
    FinancialAuditAction,
    FinancialAuditLog,
    FinancialEntityType,
)
from app.models.inventory import InventoryMovement, InventoryMovementType, Product
from app.models.user import User, UserRole
from app.repositories.financial_repository import FinancialRepository
from app.repositories.inventory_repository import InventoryRepository
from app.repositories.product_category_repository import ProductCategoryRepository
from app.schemas.inventory import (
    InventoryDashboardResponse,
    InventoryMovementListResponse,
    InventoryMovementResponse,
    ProductCategoryBrief,
    ProductCreate,
    ProductListResponse,
    ProductResponse,
    ProductUpdate,
    StockUpdate,
    decimal_to_float,
)


class InventoryService:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session
        self._repo = InventoryRepository(session)
        self._financial_repo = FinancialRepository(session)
        self._category_repo = ProductCategoryRepository(session)

    async def list_products(
        self,
        *,
        page: int,
        page_size: int,
        search: str | None,
        is_active: bool | None,
        category_id: uuid.UUID | None,
        current_user: User,
    ) -> ProductListResponse:
        self._require_view_access(current_user)
        page = max(1, page)
        page_size = min(max(1, page_size), 100)
        items, total = await self._repo.list_products(
            page=page,
            page_size=page_size,
            search=search,
            is_active=is_active,
            category_id=category_id,
        )
        pages = self._repo.paginate(total, page, page_size)
        return ProductListResponse(
            items=[self._product_to_response(p) for p in items],
            total=total,
            page=page,
            page_size=page_size,
            pages=pages,
        )

    async def create_product(self, data: ProductCreate, current_user: User) -> ProductResponse:
        self._require_admin(current_user)
        await self._validate_active_category(data.category_id)
        product = Product(
            name=data.name.strip(),
            description=data.description.strip() if data.description else None,
            category_id=data.category_id,
            purchase_price=self._quantize(data.purchase_price),
            sale_price=self._quantize(data.sale_price),
            stock_quantity=data.stock_quantity,
            minimum_stock=data.minimum_stock,
            is_active=data.is_active,
        )
        created = await self._repo.create_product(product)
        created = await self._repo.get_product_by_id(created.id) or created
        if created.stock_quantity > 0:
            await self._repo.create_movement(
                InventoryMovement(
                    product_id=created.id,
                    movement_type=InventoryMovementType.in_,
                    quantity=created.stock_quantity,
                    previous_stock=0,
                    new_stock=created.stock_quantity,
                    reason="Estoque inicial",
                    created_by=current_user.id,
                )
            )
        await self._audit(
            action=FinancialAuditAction.product_created,
            actor_id=current_user.id,
            entity_type=FinancialEntityType.product,
            entity_id=created.id,
            metadata={
                "name": created.name,
                "category_id": str(created.category_id),
                "stock_quantity": created.stock_quantity,
                "sale_price": decimal_to_float(created.sale_price),
            },
        )
        return self._product_to_response(created)

    async def update_product(
        self,
        product_id: uuid.UUID,
        data: ProductUpdate,
        current_user: User,
    ) -> ProductResponse:
        self._require_admin(current_user)
        product = await self._get_product_or_404(product_id)
        changes: dict = {}
        if data.name is not None:
            product.name = data.name.strip()
            changes["name"] = product.name
        if data.description is not None:
            product.description = data.description.strip() if data.description else None
            changes["description"] = product.description
        if data.purchase_price is not None:
            product.purchase_price = self._quantize(data.purchase_price)
            changes["purchase_price"] = decimal_to_float(product.purchase_price)
        if data.sale_price is not None:
            product.sale_price = self._quantize(data.sale_price)
            changes["sale_price"] = decimal_to_float(product.sale_price)
        if data.minimum_stock is not None:
            product.minimum_stock = data.minimum_stock
            changes["minimum_stock"] = product.minimum_stock
        if data.is_active is not None:
            product.is_active = data.is_active
            changes["is_active"] = product.is_active
        if data.category_id is not None:
            await self._validate_active_category(data.category_id)
            product.category_id = data.category_id
            changes["category_id"] = str(data.category_id)
        updated = await self._repo.update_product(product)
        updated = await self._repo.get_product_by_id(updated.id) or updated
        await self._audit(
            action=FinancialAuditAction.product_updated,
            actor_id=current_user.id,
            entity_type=FinancialEntityType.product,
            entity_id=updated.id,
            metadata=changes,
        )
        return self._product_to_response(updated)

    async def update_stock(
        self,
        product_id: uuid.UUID,
        data: StockUpdate,
        current_user: User,
    ) -> ProductResponse:
        self._require_admin(current_user)
        product = await self._get_product_or_404(product_id, for_update=True)
        previous = product.stock_quantity
        movement_type = InventoryMovementType(data.movement_type.value)

        if movement_type == InventoryMovementType.adjustment:
            if data.new_quantity is None:
                raise AppError("Informe a nova quantidade para ajuste de estoque")
            new_stock = data.new_quantity
            delta = abs(new_stock - previous)
        elif movement_type == InventoryMovementType.in_:
            new_stock = previous + data.quantity
            delta = data.quantity
        else:
            new_stock = previous - data.quantity
            delta = data.quantity

        if new_stock < 0:
            raise AppError(
                f"Estoque insuficiente. Disponível: {previous} unidade(s), "
                f"solicitado: {data.quantity} unidade(s)."
            )

        product.stock_quantity = new_stock
        await self._repo.update_product(product)
        movement = await self._repo.create_movement(
            InventoryMovement(
                product_id=product.id,
                movement_type=movement_type,
                quantity=delta,
                previous_stock=previous,
                new_stock=new_stock,
                reason=data.reason.strip() if data.reason else None,
                created_by=current_user.id,
            )
        )
        await self._audit(
            action=FinancialAuditAction.stock_updated,
            actor_id=current_user.id,
            entity_type=FinancialEntityType.inventory_movement,
            entity_id=movement.id,
            metadata={
                "product_id": str(product.id),
                "product_name": product.name,
                "movement_type": movement_type.value,
                "previous_stock": previous,
                "new_stock": new_stock,
                "quantity": delta,
            },
        )
        return self._product_to_response(product)

    async def list_low_stock(self, current_user: User) -> list[ProductResponse]:
        self._require_view_access(current_user)
        products = await self._repo.list_low_stock_products(limit=50)
        return [self._product_to_response(p) for p in products]

    async def list_movements(
        self,
        *,
        page: int,
        page_size: int,
        product_id: uuid.UUID | None,
        current_user: User,
    ) -> InventoryMovementListResponse:
        self._require_view_access(current_user)
        page = max(1, page)
        page_size = min(max(1, page_size), 100)
        items, total = await self._repo.list_movements(page=page, page_size=page_size, product_id=product_id)
        pages = self._repo.paginate(total, page, page_size)
        return InventoryMovementListResponse(
            items=[self._movement_to_response(m) for m in items],
            total=total,
            page=page,
            page_size=page_size,
            pages=pages,
        )

    async def get_dashboard(self, current_user: User) -> InventoryDashboardResponse:
        self._require_view_access(current_user)
        period = await self._repo.get_open_period()
        products_count = await self._repo.count_products()
        low_stock_count = await self._repo.count_low_stock_products()

        period_sales_count = 0
        product_sales_revenue = Decimal("0")
        service_revenue = Decimal("0")
        period_started_at = None

        if period is not None:
            period_started_at = period.started_at
            period_sales_count = await self._repo.count_sales_in_period(period_start=period.started_at)
            product_sales_revenue = await self._repo.sum_product_sales_revenue_in_period(period.id)
            service_revenue = await self._repo.sum_service_revenue_in_period(period.id)

        total_revenue = product_sales_revenue + service_revenue
        return InventoryDashboardResponse(
            products_count=products_count,
            low_stock_count=low_stock_count,
            period_sales_count=period_sales_count,
            product_sales_revenue=decimal_to_float(product_sales_revenue),
            service_revenue=decimal_to_float(service_revenue),
            total_revenue=decimal_to_float(total_revenue),
            period_started_at=period_started_at,
        )

    async def _get_product_or_404(self, product_id: uuid.UUID, *, for_update: bool = False) -> Product:
        product = await self._repo.get_product_by_id(product_id, for_update=for_update)
        if product is None:
            raise NotFoundError("Produto não encontrado")
        return product

    async def _validate_active_category(self, category_id: uuid.UUID) -> None:
        category = await self._category_repo.get_by_id(category_id)
        if category is None or not category.is_active:
            raise NotFoundError("Categoria não encontrada ou inativa")

    async def _audit(
        self,
        *,
        action: FinancialAuditAction,
        actor_id: uuid.UUID,
        entity_type: FinancialEntityType,
        entity_id: uuid.UUID | None,
        metadata: dict | None = None,
    ) -> None:
        log = FinancialAuditLog(
            action=action,
            actor_id=actor_id,
            entity_type=entity_type,
            entity_id=entity_id,
            metadata_json=metadata,
        )
        await self._financial_repo.create_audit_log(log)

    @staticmethod
    def _product_to_response(product: Product) -> ProductResponse:
        is_low = product.is_active and product.stock_quantity <= product.minimum_stock
        category_brief = None
        if product.category:
            category_brief = ProductCategoryBrief(
                id=product.category.id,
                name=product.category.name,
                color=product.category.color,
            )
        return ProductResponse(
            id=product.id,
            name=product.name,
            description=product.description,
            category_id=product.category_id,
            category=category_brief,
            purchase_price=decimal_to_float(product.purchase_price),
            sale_price=decimal_to_float(product.sale_price),
            stock_quantity=product.stock_quantity,
            minimum_stock=product.minimum_stock,
            is_active=product.is_active,
            is_low_stock=is_low,
            created_at=product.created_at,
            updated_at=product.updated_at,
        )

    @staticmethod
    def _movement_to_response(movement: InventoryMovement) -> InventoryMovementResponse:
        return InventoryMovementResponse(
            id=movement.id,
            product_id=movement.product_id,
            product_name=movement.product.name if movement.product else "—",
            movement_type=movement.movement_type.value,
            quantity=movement.quantity,
            previous_stock=movement.previous_stock,
            new_stock=movement.new_stock,
            reason=movement.reason,
            created_by_name=movement.creator.name if movement.creator else None,
            sale_id=movement.sale_id,
            created_at=movement.created_at,
        )

    @staticmethod
    def _quantize(value: Decimal) -> Decimal:
        return value.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

    @staticmethod
    def _require_admin(user: User) -> None:
        if user.role != UserRole.admin:
            raise ForbiddenError("Apenas administradores podem realizar esta operação")

    @staticmethod
    def _require_view_access(user: User) -> None:
        if user.role not in (UserRole.admin, UserRole.barber):
            raise ForbiddenError("Acesso negado")
