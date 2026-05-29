import { apiClient } from "@/lib/api-client";
import type {
  CategoryAggregationsResponse,
  InventoryDashboard,
  InventoryMovementListResponse,
  Product,
  ProductCategory,
  ProductCategoryCreatePayload,
  ProductCategoryListResponse,
  ProductCategoryUpdatePayload,
  ProductCreatePayload,
  ProductListResponse,
  ProductUpdatePayload,
  Sale,
  SaleCreatePayload,
  SaleListResponse,
  StockUpdatePayload,
} from "@/features/inventory/types/inventory.types";

const BASE = "/api/v1/inventory";

export async function fetchInventoryDashboard(): Promise<InventoryDashboard> {
  const { data } = await apiClient.get<InventoryDashboard>(`${BASE}/dashboard`);
  return data;
}

export async function fetchProducts(params?: {
  page?: number;
  page_size?: number;
  search?: string;
  is_active?: boolean;
  category_id?: string;
}): Promise<ProductListResponse> {
  const { data } = await apiClient.get<ProductListResponse>(`${BASE}/products`, { params });
  return data;
}

export async function fetchCategories(params?: {
  is_active?: boolean;
}): Promise<ProductCategoryListResponse> {
  const { data } = await apiClient.get<ProductCategoryListResponse>(`${BASE}/categories`, { params });
  return data;
}

export async function fetchCategoryAggregations(): Promise<CategoryAggregationsResponse> {
  const { data } = await apiClient.get<CategoryAggregationsResponse>(`${BASE}/categories/aggregations`);
  return data;
}

export async function createCategory(payload: ProductCategoryCreatePayload): Promise<ProductCategory> {
  const { data } = await apiClient.post<ProductCategory>(`${BASE}/categories`, payload);
  return data;
}

export async function updateCategory(
  id: string,
  payload: ProductCategoryUpdatePayload,
): Promise<ProductCategory> {
  const { data } = await apiClient.patch<ProductCategory>(`${BASE}/categories/${id}`, payload);
  return data;
}

export async function deactivateCategory(id: string): Promise<void> {
  await apiClient.delete(`${BASE}/categories/${id}`);
}

export async function fetchLowStockProducts(): Promise<Product[]> {
  const { data } = await apiClient.get<Product[]>(`${BASE}/low-stock`);
  return data;
}

export async function fetchInventoryMovements(params?: {
  page?: number;
  page_size?: number;
  product_id?: string;
}): Promise<InventoryMovementListResponse> {
  const { data } = await apiClient.get<InventoryMovementListResponse>(`${BASE}/movements`, { params });
  return data;
}

export async function fetchSales(params?: {
  page?: number;
  page_size?: number;
  status?: string;
}): Promise<SaleListResponse> {
  const { data } = await apiClient.get<SaleListResponse>(`${BASE}/sales`, { params });
  return data;
}

export async function createProduct(payload: ProductCreatePayload): Promise<Product> {
  const { data } = await apiClient.post<Product>(`${BASE}/products`, payload);
  return data;
}

export async function updateProduct(id: string, payload: ProductUpdatePayload): Promise<Product> {
  const { data } = await apiClient.patch<Product>(`${BASE}/products/${id}`, payload);
  return data;
}

export async function updateProductStock(id: string, payload: StockUpdatePayload): Promise<Product> {
  const { data } = await apiClient.post<Product>(`${BASE}/products/${id}/stock`, payload);
  return data;
}

export async function createSale(payload: SaleCreatePayload): Promise<Sale> {
  const { data } = await apiClient.post<Sale>(`${BASE}/sales`, payload);
  return data;
}

export async function cancelSale(id: string): Promise<Sale> {
  const { data } = await apiClient.patch<Sale>(`${BASE}/sales/${id}/cancel`);
  return data;
}
