import math
import uuid
from datetime import date, datetime, timezone
from decimal import Decimal, ROUND_HALF_UP

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import AppError, ForbiddenError, NotFoundError
from app.models.financial import FinancialAuditAction, FinancialEntityType
from app.models.inventory import (
    InventoryMovement,
    InventoryMovementType,
    Sale,
    SaleItem,
    SaleStatus,
)
from app.models.user import User, UserRole
from app.repositories.inventory_repository import InventoryRepository
from app.schemas.inventory import (
    SaleCreate,
    SaleItemResponse,
    SaleListResponse,
    SaleResponse,
    decimal_to_float,
)
from app.services.financial_service import FinancialService


class SalesService:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session
        self._repo = InventoryRepository(session)
        self._financial = FinancialService(session)

    async def create_sale(self, data: SaleCreate, current_user: User) -> SaleResponse:
        self._require_sale_access(current_user)
        if not data.items:
            raise AppError("Informe ao menos um item na venda")

        product_ids = [item.product_id for item in data.items]
        if len(product_ids) != len(set(product_ids)):
            raise AppError("Produto duplicado na venda. Agrupe a quantidade em um único item.")

        locked_products = []
        for item in data.items:
            product = await self._repo.get_product_by_id(item.product_id, for_update=True)
            if product is None:
                raise NotFoundError(f"Produto não encontrado: {item.product_id}")
            if not product.is_active:
                raise AppError(f"Produto '{product.name}' está inativo e não pode ser vendido")
            if product.stock_quantity < item.quantity:
                raise AppError(
                    f"Estoque insuficiente para '{product.name}'. "
                    f"Disponível: {product.stock_quantity}, solicitado: {item.quantity}."
                )
            locked_products.append((product, item))

        sale_items: list[SaleItem] = []
        total = Decimal("0")
        for product, item in locked_products:
            unit_price = self._quantize(product.sale_price)
            subtotal = self._quantize(unit_price * item.quantity)
            total += subtotal
            sale_items.append(
                SaleItem(
                    product_id=product.id,
                    quantity=item.quantity,
                    unit_price=unit_price,
                    subtotal=subtotal,
                )
            )

        sale = Sale(
            total_amount=self._quantize(total),
            status=SaleStatus.completed,
            created_by=current_user.id,
            items=sale_items,
        )
        created = await self._repo.create_sale(sale)

        for product, item in locked_products:
            previous = product.stock_quantity
            new_stock = previous - item.quantity
            product.stock_quantity = new_stock
            await self._repo.update_product(product)
            await self._repo.create_movement(
                InventoryMovement(
                    product_id=product.id,
                    movement_type=InventoryMovementType.out,
                    quantity=item.quantity,
                    previous_stock=previous,
                    new_stock=new_stock,
                    reason=f"Venda #{str(created.id)[:8]}",
                    created_by=current_user.id,
                    sale_id=created.id,
                )
            )

        await self._financial.record_product_sale(
            sale_id=created.id,
            amount=created.total_amount,
            description=f"Venda de produtos — {len(created.items)} item(ns)",
            entry_date=date.today(),
        )

        await self._financial.audit_inventory_action(
            action=FinancialAuditAction.sale_created,
            actor_id=current_user.id,
            entity_type=FinancialEntityType.sale,
            entity_id=created.id,
            metadata={
                "total_amount": decimal_to_float(created.total_amount),
                "items_count": len(created.items),
                "items": [
                    {
                        "product_id": str(i.product_id),
                        "quantity": i.quantity,
                        "subtotal": decimal_to_float(i.subtotal),
                    }
                    for i in created.items
                ],
            },
        )

        refreshed = await self._repo.get_sale_by_id(created.id)
        if refreshed is None:
            raise NotFoundError("Venda não encontrada")
        return self._sale_to_response(refreshed)

    async def cancel_sale(self, sale_id: uuid.UUID, current_user: User) -> SaleResponse:
        self._require_admin(current_user)
        sale = await self._repo.get_sale_by_id(sale_id, for_update=True)
        if sale is None:
            raise NotFoundError("Venda não encontrada")
        if sale.status == SaleStatus.cancelled:
            raise AppError("Esta venda já foi cancelada")

        for item in sale.items:
            product = await self._repo.get_product_by_id(item.product_id, for_update=True)
            if product is None:
                raise NotFoundError(f"Produto não encontrado: {item.product_id}")
            previous = product.stock_quantity
            new_stock = previous + item.quantity
            product.stock_quantity = new_stock
            await self._repo.update_product(product)
            await self._repo.create_movement(
                InventoryMovement(
                    product_id=product.id,
                    movement_type=InventoryMovementType.in_,
                    quantity=item.quantity,
                    previous_stock=previous,
                    new_stock=new_stock,
                    reason=f"Cancelamento venda #{str(sale.id)[:8]}",
                    created_by=current_user.id,
                    sale_id=sale.id,
                )
            )

        sale.status = SaleStatus.cancelled
        sale.cancelled_at = datetime.now(timezone.utc)
        sale.cancelled_by = current_user.id
        await self._session.flush()

        await self._financial.reverse_product_sale(
            sale_id=sale.id,
            amount=sale.total_amount,
            description=f"Estorno — venda cancelada #{str(sale.id)[:8]}",
            entry_date=date.today(),
        )

        await self._financial.audit_inventory_action(
            action=FinancialAuditAction.sale_cancelled,
            actor_id=current_user.id,
            entity_type=FinancialEntityType.sale,
            entity_id=sale.id,
            metadata={
                "total_amount": decimal_to_float(sale.total_amount),
                "items_count": len(sale.items),
            },
        )

        refreshed = await self._repo.get_sale_by_id(sale.id)
        if refreshed is None:
            raise NotFoundError("Venda não encontrada")
        return self._sale_to_response(refreshed)

    async def list_sales(
        self,
        *,
        page: int,
        page_size: int,
        status: SaleStatus | None,
        date_from: date | None,
        date_to: date | None,
        current_user: User,
    ) -> SaleListResponse:
        self._require_view_access(current_user)
        page = max(1, page)
        page_size = min(max(1, page_size), 100)
        items, total = await self._repo.list_sales(
            page=page,
            page_size=page_size,
            status=status,
            date_from=date_from,
            date_to=date_to,
        )
        pages = max(1, math.ceil(total / page_size)) if total else 1
        return SaleListResponse(
            items=[self._sale_to_response(s) for s in items],
            total=total,
            page=page,
            page_size=page_size,
            pages=pages,
        )

    @staticmethod
    def _sale_to_response(sale: Sale) -> SaleResponse:
        return SaleResponse(
            id=sale.id,
            total_amount=decimal_to_float(sale.total_amount),
            status=sale.status.value,
            created_by_name=sale.creator.name if sale.creator else None,
            created_at=sale.created_at,
            cancelled_at=sale.cancelled_at,
            items=[
                SaleItemResponse(
                    id=item.id,
                    product_id=item.product_id,
                    product_name=item.product.name if item.product else "—",
                    quantity=item.quantity,
                    unit_price=decimal_to_float(item.unit_price),
                    subtotal=decimal_to_float(item.subtotal),
                )
                for item in sale.items
            ],
        )

    @staticmethod
    def _quantize(value: Decimal) -> Decimal:
        return value.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

    @staticmethod
    def _require_admin(user: User) -> None:
        if user.role != UserRole.admin:
            raise ForbiddenError("Apenas administradores podem realizar esta operação")

    @staticmethod
    def _require_sale_access(user: User) -> None:
        if user.role not in (UserRole.admin, UserRole.barber):
            raise ForbiddenError("Acesso negado")

    @staticmethod
    def _require_view_access(user: User) -> None:
        if user.role not in (UserRole.admin, UserRole.barber):
            raise ForbiddenError("Acesso negado")
