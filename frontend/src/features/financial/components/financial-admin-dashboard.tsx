"use client";

import { useState } from "react";

import { PageHeader } from "@/components/shared/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdvancesPanel } from "@/features/financial/components/advances-panel";
import { ExpensesPanel } from "@/features/financial/components/expenses-panel";
import { FinancialOverview } from "@/features/financial/components/financial-overview";
import { PeriodClosePanel } from "@/features/financial/components/period-close-panel";
import { useFinancialDashboard } from "@/features/financial/hooks/use-financial";

export function FinancialAdminDashboard() {
  const [tab, setTab] = useState("overview");
  const { data, isLoading } = useFinancialDashboard();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Financeiro"
        description="Controle operacional, despesas, vales e fechamento de período."
      />

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="max-w-full flex-wrap h-auto">
          <TabsTrigger value="overview">Visão geral</TabsTrigger>
          <TabsTrigger value="expenses">Despesas</TabsTrigger>
          <TabsTrigger value="advances">Vales</TabsTrigger>
          <TabsTrigger value="close">Fechamento</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          {isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-28" />
              ))}
            </div>
          ) : (
            <FinancialOverview data={data} />
          )}
        </TabsContent>

        <TabsContent value="expenses">
          {isLoading ? <Skeleton className="h-48" /> : <ExpensesPanel expenses={data?.expenses ?? []} />}
        </TabsContent>

        <TabsContent value="advances">
          {isLoading ? <Skeleton className="h-48" /> : <AdvancesPanel advances={data?.advances ?? []} />}
        </TabsContent>

        <TabsContent value="close">
          {isLoading ? <Skeleton className="h-64" /> : <PeriodClosePanel dashboard={data} />}
        </TabsContent>
      </Tabs>
    </div>
  );
}
