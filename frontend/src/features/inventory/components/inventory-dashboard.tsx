"use client";

import { useState } from "react";

import { PageHeader } from "@/components/shared/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CategoriesPanel } from "@/features/inventory/components/categories-panel";
import { InventoryMovementsTable } from "@/features/inventory/components/inventory-movements-table";
import { InventoryOverview } from "@/features/inventory/components/inventory-overview";
import { LowStockWidget } from "@/features/inventory/components/low-stock-widget";
import { ProductsTable } from "@/features/inventory/components/products-table";
import { SalesPanel } from "@/features/inventory/components/sales-panel";
import { useInventoryDashboard } from "@/features/inventory/hooks/use-inventory";
import { useCurrentUser } from "@/hooks/use-current-user";

export function InventoryDashboardView() {
  const [tab, setTab] = useState("products");
  const { data, isLoading } = useInventoryDashboard();
  const { data: user } = useCurrentUser();
  const isAdmin = user?.role === "admin";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Estoque & Vendas"
        description="Controle de produtos, movimentações e vendas integrado ao financeiro."
      />

      <InventoryOverview data={data} loading={isLoading} />
      <LowStockWidget />

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="max-w-full flex-wrap h-auto">
          <TabsTrigger value="products">Produtos</TabsTrigger>
          {isAdmin ? <TabsTrigger value="categories">Categorias</TabsTrigger> : null}
          <TabsTrigger value="movements">Movimentações</TabsTrigger>
          <TabsTrigger value="sales">Vendas</TabsTrigger>
        </TabsList>

        <TabsContent value="products">
          <ProductsTable />
        </TabsContent>

        {isAdmin ? (
          <TabsContent value="categories">
            <CategoriesPanel />
          </TabsContent>
        ) : null}

        <TabsContent value="movements">
          <InventoryMovementsTable />
        </TabsContent>

        <TabsContent value="sales">
          <SalesPanel />
        </TabsContent>
      </Tabs>

      {isLoading ? <Skeleton className="h-0" /> : null}
    </div>
  );
}
