"use client";

import {
  ArrowDownCircle,
  ArrowUpCircle,
  Banknote,
  PiggyBank,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { KpiCard } from "@/features/financial/components/kpi-card";
import type { FinancialDashboard } from "@/features/financial/types/financial.types";
import { formatCurrency, formatDateTime, formatPeriodStatus } from "@/features/financial/utils/format";

type FinancialOverviewProps = {
  data?: FinancialDashboard;
  loading?: boolean;
};

export function FinancialOverview({ data, loading }: FinancialOverviewProps) {
  return (
    <div className="space-y-6">
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="text-base">Período atual</CardTitle>
          <CardDescription>
            {loading ? (
              <Skeleton className="h-4 w-48" />
            ) : data ? (
              <>
                {formatPeriodStatus(data.current_period.status)} — iniciado em{" "}
                {formatDateTime(data.current_period.started_at)}
              </>
            ) : null}
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard title="Receitas" value={data?.total_revenue ?? 0} icon={ArrowUpCircle} variant="positive" loading={loading} />
        <KpiCard title="Despesas" value={data?.total_expenses ?? 0} icon={ArrowDownCircle} variant="negative" loading={loading} />
        <KpiCard title="Resultado operacional" value={data?.operational_result ?? 0} icon={TrendingUp} loading={loading} />
        <KpiCard title="Valor distribuível" value={data?.distributable_amount ?? 0} icon={Banknote} loading={loading} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <KpiCard title="Reserva acumulada" value={data?.accumulated_reserve ?? 0} icon={PiggyBank} variant="muted" loading={loading} />
        <KpiCard
          title="Reserva do período"
          value={data?.reserve_applied ?? 0}
          icon={PiggyBank}
          loading={loading}
        />
        <KpiCard
          title="Profissionais ativos"
          value={data?.active_professionals_count ?? 0}
          icon={Users}
          loading={loading}
          format="number"
        />
      </div>

      {!loading && data && data.distribution_preview.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Wallet className="h-4 w-4" aria-hidden />
              Prévia de distribuição
            </CardTitle>
            <CardDescription>Estimativa com base no período aberto (antes do fechamento).</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-2 pr-4 font-medium">Profissional</th>
                    <th className="pb-2 pr-4 font-medium">Participação</th>
                    <th className="pb-2 pr-4 font-medium">Bruto</th>
                    <th className="pb-2 pr-4 font-medium">Vales</th>
                    <th className="pb-2 font-medium">Líquido</th>
                  </tr>
                </thead>
                <tbody>
                  {data.distribution_preview.map((row) => (
                    <tr key={row.professional_id} className="border-b border-border/50">
                      <td className="py-3 pr-4">{row.professional_name}</td>
                      <td className="py-3 pr-4 tabular-nums">{row.participation_percentage}%</td>
                      <td className="py-3 pr-4 tabular-nums">{formatCurrency(row.estimated_gross)}</td>
                      <td className="py-3 pr-4 tabular-nums text-red-400">
                        {formatCurrency(row.advances_in_period)}
                      </td>
                      <td className="py-3 tabular-nums font-medium">{formatCurrency(row.estimated_net)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
