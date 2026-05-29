import uuid
from datetime import date
from typing import Annotated

from fastapi import APIRouter, Depends, Query, status

from app.core.deps import (
    get_current_user,
    get_inventory_service,
    get_product_category_service,
    get_sales_service,
)
from app.models.inventory import SaleStatus
from app.models.user import User
from app.schemas.inventory import (
    InventoryDashboardResponse,
    InventoryMovementListResponse,
    ProductCreate,
    ProductListResponse,
    ProductResponse,
    ProductUpdate,
    SaleCreate,
    SaleListResponse,
    SaleResponse,
    StockUpdate,
)
from app.schemas.product_category import (
    CategoryAggregationsResponse,
    ProductCategoryCreate,
    ProductCategoryListResponse,
    ProductCategoryResponse,
    ProductCategoryUpdate,
)
from app.services.inventory_service import InventoryService
from app.services.product_category_service import ProductCategoryService
from app.services.sales_service import SalesService

router = APIRouter(prefix="/inventory", tags=["inventory"])
categories_router = APIRouter(prefix="/categories", tags=["inventory-categories"])


@router.get("/dashboard", response_model=InventoryDashboardResponse)
async def get_inventory_dashboard(
    svc: Annotated[InventoryService, Depends(get_inventory_service)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> InventoryDashboardResponse:
    return await svc.get_dashboard(current_user)


@router.get("/products", response_model=ProductListResponse)
async def list_products(
    svc: Annotated[InventoryService, Depends(get_inventory_service)],
    current_user: Annotated[User, Depends(get_current_user)],
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: str | None = Query(None, max_length=200),
    is_active: bool | None = Query(None),
    category_id: uuid.UUID | None = Query(None),
) -> ProductListResponse:
    return await svc.list_products(
        page=page,
        page_size=page_size,
        search=search,
        is_active=is_active,
        category_id=category_id,
        current_user=current_user,
    )


@router.get("/low-stock", response_model=list[ProductResponse])
async def list_low_stock_products(
    svc: Annotated[InventoryService, Depends(get_inventory_service)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> list[ProductResponse]:
    return await svc.list_low_stock(current_user)


@router.get("/movements", response_model=InventoryMovementListResponse)
async def list_inventory_movements(
    svc: Annotated[InventoryService, Depends(get_inventory_service)],
    current_user: Annotated[User, Depends(get_current_user)],
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    product_id: uuid.UUID | None = Query(None),
) -> InventoryMovementListResponse:
    return await svc.list_movements(
        page=page,
        page_size=page_size,
        product_id=product_id,
        current_user=current_user,
    )


@router.get("/sales", response_model=SaleListResponse)
async def list_sales(
    svc: Annotated[SalesService, Depends(get_sales_service)],
    current_user: Annotated[User, Depends(get_current_user)],
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status_filter: str | None = Query(None, alias="status"),
    date_from: date | None = Query(None),
    date_to: date | None = Query(None),
) -> SaleListResponse:
    sale_status = SaleStatus(status_filter) if status_filter else None
    return await svc.list_sales(
        page=page,
        page_size=page_size,
        status=sale_status,
        date_from=date_from,
        date_to=date_to,
        current_user=current_user,
    )


@router.post("/products", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
async def create_product(
    data: ProductCreate,
    svc: Annotated[InventoryService, Depends(get_inventory_service)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> ProductResponse:
    return await svc.create_product(data, current_user)


@router.patch("/products/{product_id}", response_model=ProductResponse)
async def update_product(
    product_id: uuid.UUID,
    data: ProductUpdate,
    svc: Annotated[InventoryService, Depends(get_inventory_service)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> ProductResponse:
    return await svc.update_product(product_id, data, current_user)


@router.post("/products/{product_id}/stock", response_model=ProductResponse)
async def update_product_stock(
    product_id: uuid.UUID,
    data: StockUpdate,
    svc: Annotated[InventoryService, Depends(get_inventory_service)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> ProductResponse:
    return await svc.update_stock(product_id, data, current_user)


@router.post("/sales", response_model=SaleResponse, status_code=status.HTTP_201_CREATED)
async def create_sale(
    data: SaleCreate,
    svc: Annotated[SalesService, Depends(get_sales_service)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> SaleResponse:
    return await svc.create_sale(data, current_user)


@router.patch("/sales/{sale_id}/cancel", response_model=SaleResponse)
async def cancel_sale(
    sale_id: uuid.UUID,
    svc: Annotated[SalesService, Depends(get_sales_service)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> SaleResponse:
    return await svc.cancel_sale(sale_id, current_user)


@categories_router.get("/aggregations", response_model=CategoryAggregationsResponse)
async def get_category_aggregations(
    svc: Annotated[ProductCategoryService, Depends(get_product_category_service)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> CategoryAggregationsResponse:
    return await svc.get_aggregations(current_user)


@categories_router.get("", response_model=ProductCategoryListResponse)
async def list_categories(
    svc: Annotated[ProductCategoryService, Depends(get_product_category_service)],
    current_user: Annotated[User, Depends(get_current_user)],
    is_active: bool | None = Query(None),
) -> ProductCategoryListResponse:
    return await svc.list_categories(current_user, is_active=is_active)


@categories_router.post("", response_model=ProductCategoryResponse, status_code=status.HTTP_201_CREATED)
async def create_category(
    data: ProductCategoryCreate,
    svc: Annotated[ProductCategoryService, Depends(get_product_category_service)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> ProductCategoryResponse:
    return await svc.create_category(data, current_user)


@categories_router.patch("/{category_id}", response_model=ProductCategoryResponse)
async def update_category(
    category_id: uuid.UUID,
    data: ProductCategoryUpdate,
    svc: Annotated[ProductCategoryService, Depends(get_product_category_service)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> ProductCategoryResponse:
    return await svc.update_category(category_id, data, current_user)


@categories_router.delete("/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
async def deactivate_category(
    category_id: uuid.UUID,
    svc: Annotated[ProductCategoryService, Depends(get_product_category_service)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> None:
    await svc.deactivate_category(category_id, current_user)


router.include_router(categories_router)
