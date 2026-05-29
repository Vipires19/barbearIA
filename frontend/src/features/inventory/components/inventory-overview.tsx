"use client";

import { Package, ShoppingCart, TrendingUp, AlertTriangle } from "lucide-react";

import { KpiCard } from "@/features/financial/components/kpi-card";
import type { InventoryDashboard } from "@/features/inventory/types/inventory.types";

type InventoryOverviewProps = {
  data?: InventoryDashboard;
  loading?: boolean;
};

export function InventoryOverview({ data, loading }: InventoryOverviewProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <KpiCard
        title="Produtos cadastrados"
        value={data?.products_count ?? 0}
        icon={Package}
        format="number"
        loading={loading}
        variant="muted"
      />
      <KpiCard
        title="Estoque baixo"
        value={data?.low_stock_count ?? 0}
        icon={AlertTriangle}
        format="number"
        loading={loading}
        variant={data && data.low_stock_count > 0 ? "negative" : "muted"}
      />
      <KpiCard
        title="Vendas do período"
        value={data?.period_sales_count ?? 0}
        icon={ShoppingCart}
        format="number"
        loading={loading}
      />
      <KpiCard
        title="Receita de vendas"
        value={data?.product_sales_revenue ?? 0}
        icon={TrendingUp}
        loading={loading}
        variant="positive"
      />
      <KpiCard
        title="Receita de serviços"
        value={data?.service_revenue ?? 0}
        icon={TrendingUp}
        loading={loading}
        variant="positive"
      />
      <KpiCard
        title="Receita total"
        value={data?.total_revenue ?? 0}
        icon={TrendingUp}
        loading={loading}
        variant="positive"
      />
    </div>
  );
}
