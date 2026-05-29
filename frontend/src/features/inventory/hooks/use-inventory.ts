"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  cancelSale,
  createCategory,
  createProduct,
  createSale,
  deactivateCategory,
  fetchCategories,
  fetchCategoryAggregations,
  fetchInventoryDashboard,
  fetchInventoryMovements,
  fetchLowStockProducts,
  fetchProducts,
  fetchSales,
  updateCategory,
  updateProduct,
  updateProductStock,
} from "@/features/inventory/api/inventory.api";
import type {
  ProductCategoryCreatePayload,
  ProductCategoryUpdatePayload,
  ProductCreatePayload,
  ProductUpdatePayload,
  SaleCreatePayload,
  StockUpdatePayload,
} from "@/features/inventory/types/inventory.types";
import { financialKeys } from "@/features/financial/hooks/use-financial";
import { getApiErrorMessage } from "@/lib/api-client";

export const inventoryKeys = {
  all: ["inventory"] as const,
  dashboard: () => [...inventoryKeys.all, "dashboard"] as const,
  products: (page: number, search?: string, categoryId?: string) =>
    [...inventoryKeys.all, "products", page, search, categoryId] as const,
  categories: (activeOnly?: boolean) => [...inventoryKeys.all, "categories", activeOnly] as const,
  aggregations: () => [...inventoryKeys.all, "aggregations"] as const,
  lowStock: () => [...inventoryKeys.all, "low-stock"] as const,
  movements: (page: number) => [...inventoryKeys.all, "movements", page] as const,
  sales: (page: number) => [...inventoryKeys.all, "sales", page] as const,
};

export function useInventoryDashboard() {
  return useQuery({
    queryKey: inventoryKeys.dashboard(),
    queryFn: fetchInventoryDashboard,
  });
}

export function useProducts(page = 1, search?: string, categoryId?: string) {
  return useQuery({
    queryKey: inventoryKeys.products(page, search, categoryId),
    queryFn: () =>
      fetchProducts({
        page,
        page_size: 20,
        search: search || undefined,
        category_id: categoryId || undefined,
      }),
  });
}

export function useCategories(activeOnly?: boolean) {
  return useQuery({
    queryKey: inventoryKeys.categories(activeOnly),
    queryFn: () => fetchCategories({ is_active: activeOnly ? true : undefined }),
  });
}

export function useCategoryAggregations() {
  return useQuery({
    queryKey: inventoryKeys.aggregations(),
    queryFn: fetchCategoryAggregations,
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ProductCategoryCreatePayload) => createCategory(payload),
    onSuccess: () => {
      toast.success("Categoria criada");
      void queryClient.invalidateQueries({ queryKey: inventoryKeys.all });
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: ProductCategoryUpdatePayload }) =>
      updateCategory(id, payload),
    onSuccess: () => {
      toast.success("Categoria atualizada");
      void queryClient.invalidateQueries({ queryKey: inventoryKeys.all });
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });
}

export function useDeactivateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deactivateCategory(id),
    onSuccess: () => {
      toast.success("Categoria desativada");
      void queryClient.invalidateQueries({ queryKey: inventoryKeys.all });
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });
}

export function useLowStockProducts() {
  return useQuery({
    queryKey: inventoryKeys.lowStock(),
    queryFn: fetchLowStockProducts,
  });
}

export function useInventoryMovements(page = 1) {
  return useQuery({
    queryKey: inventoryKeys.movements(page),
    queryFn: () => fetchInventoryMovements({ page, page_size: 20 }),
  });
}

export function useSales(page = 1) {
  return useQuery({
    queryKey: inventoryKeys.sales(page),
    queryFn: () => fetchSales({ page, page_size: 20 }),
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ProductCreatePayload) => createProduct(payload),
    onSuccess: () => {
      toast.success("Produto cadastrado");
      void queryClient.invalidateQueries({ queryKey: inventoryKeys.all });
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: ProductUpdatePayload }) =>
      updateProduct(id, payload),
    onSuccess: () => {
      toast.success("Produto atualizado");
      void queryClient.invalidateQueries({ queryKey: inventoryKeys.all });
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });
}

export function useUpdateProductStock() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: StockUpdatePayload }) =>
      updateProductStock(id, payload),
    onSuccess: () => {
      toast.success("Estoque atualizado");
      void queryClient.invalidateQueries({ queryKey: inventoryKeys.all });
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });
}

export function useCreateSale() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: SaleCreatePayload) => createSale(payload),
    onSuccess: () => {
      toast.success("Venda registrada");
      void queryClient.invalidateQueries({ queryKey: inventoryKeys.all });
      void queryClient.invalidateQueries({ queryKey: financialKeys.all });
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });
}

export function useCancelSale() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => cancelSale(id),
    onSuccess: () => {
      toast.success("Venda cancelada");
      void queryClient.invalidateQueries({ queryKey: inventoryKeys.all });
      void queryClient.invalidateQueries({ queryKey: financialKeys.all });
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });
}
