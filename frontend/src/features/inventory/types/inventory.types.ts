export type InventoryMovementType = "IN" | "OUT" | "ADJUSTMENT";
export type SaleStatus = "COMPLETED" | "CANCELLED";

export type ProductCategoryBrief = {
  id: string;
  name: string;
  color: string;
};

export type ProductCategory = {
  id: string;
  name: string;
  description: string | null;
  color: string;
  is_active: boolean;
  products_count: number;
  created_at: string;
  updated_at: string;
};

export type ProductCategoryListResponse = {
  items: ProductCategory[];
};

export type CategoryAggregation = {
  category_id: string;
  category_name: string;
  color: string;
  is_active: boolean;
  products_count: number;
  revenue: number;
  quantity_sold: number;
};

export type CategoryAggregationsResponse = {
  items: CategoryAggregation[];
  period_started_at: string | null;
};

export type Product = {
  id: string;
  name: string;
  description: string | null;
  category_id: string;
  category: ProductCategoryBrief | null;
  purchase_price: number;
  sale_price: number;
  stock_quantity: number;
  minimum_stock: number;
  is_active: boolean;
  is_low_stock: boolean;
  created_at: string;
  updated_at: string;
};

export type ProductListResponse = {
  items: Product[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
};

export type InventoryMovement = {
  id: string;
  product_id: string;
  product_name: string;
  movement_type: InventoryMovementType;
  quantity: number;
  previous_stock: number;
  new_stock: number;
  reason: string | null;
  created_by_name: string | null;
  sale_id: string | null;
  created_at: string;
};

export type InventoryMovementListResponse = {
  items: InventoryMovement[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
};

export type SaleItem = {
  id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
};

export type Sale = {
  id: string;
  total_amount: number;
  status: SaleStatus;
  created_by_name: string | null;
  created_at: string;
  cancelled_at: string | null;
  items: SaleItem[];
};

export type SaleListResponse = {
  items: Sale[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
};

export type InventoryDashboard = {
  products_count: number;
  low_stock_count: number;
  period_sales_count: number;
  product_sales_revenue: number;
  service_revenue: number;
  total_revenue: number;
  period_started_at: string | null;
};

export type ProductCategoryCreatePayload = {
  name: string;
  description?: string | null;
  color?: string;
  is_active?: boolean;
};

export type ProductCategoryUpdatePayload = {
  name?: string;
  description?: string | null;
  color?: string;
  is_active?: boolean;
};

export type ProductCreatePayload = {
  name: string;
  description?: string | null;
  category_id: string;
  purchase_price: number;
  sale_price: number;
  stock_quantity?: number;
  minimum_stock?: number;
  is_active?: boolean;
};

export type ProductUpdatePayload = {
  name?: string;
  description?: string | null;
  category_id?: string;
  purchase_price?: number;
  sale_price?: number;
  minimum_stock?: number;
  is_active?: boolean;
};

export type StockUpdatePayload = {
  movement_type: InventoryMovementType;
  quantity: number;
  reason?: string | null;
  new_quantity?: number;
};

export type SaleItemCreatePayload = {
  product_id: string;
  quantity: number;
};

export type SaleCreatePayload = {
  items: SaleItemCreatePayload[];
};

export const MOVEMENT_TYPE_LABELS: Record<InventoryMovementType, string> = {
  IN: "Entrada",
  OUT: "Saída",
  ADJUSTMENT: "Ajuste",
};

export const SALE_STATUS_LABELS: Record<SaleStatus, string> = {
  COMPLETED: "Concluída",
  CANCELLED: "Cancelada",
};
