"use client";

import { Wallet, ArrowDownCircle, Banknote, TrendingUp } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { KpiCard } from "@/features/financial/components/kpi-card";
import { useMyWallet } from "@/features/financial/hooks/use-financial";
import { formatCurrency } from "@/features/financial/utils/format";

export function ProfessionalWalletView() {
  const { data, isLoading } = useMyWallet();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full" />
        <div className="grid gap-4 sm:grid-cols-2">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Wallet className="h-4 w-4" aria-hidden />
            Carteira — {data.professional_name}
          </CardTitle>
          <CardDescription>
            Participação cadastrada: {data.participation_percentage}% · Saldo estimado atual
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-semibold tabular-nums">{formatCurrency(data.estimated_balance)}</p>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <KpiCard
          title="Participação (fechada)"
          value={data.closed_participation_total}
          icon={TrendingUp}
          variant="positive"
        />
        <KpiCard title="Vales (fechados)" value={data.closed_advances_total} icon={ArrowDownCircle} variant="negative" />
        <KpiCard title="Líquido (fechado)" value={data.closed_net_total} icon={Banknote} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Período aberto (estimativa)</CardTitle>
          <CardDescription>Valores ainda sujeitos a alteração até o fechamento.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <p className="text-sm text-muted-foreground">Participação estimada</p>
              <p className="text-lg font-medium tabular-nums">
                {formatCurrency(data.current_period_estimated_gross)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Vales no período</p>
              <p className="text-lg font-medium tabular-nums text-red-400">
                {formatCurrency(data.current_period_advances)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Líquido estimado</p>
              <p className="text-lg font-medium tabular-nums">
                {formatCurrency(data.current_period_estimated_net)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
