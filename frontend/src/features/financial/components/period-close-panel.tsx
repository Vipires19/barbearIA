"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Lock } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  financialSettingsSchema,
  type FinancialSettingsFormValues,
} from "@/features/financial/schemas/financial.schema";
import {
  useCloseFinancialPeriod,
  useFinancialPeriods,
  useUpdateFinancialSettings,
} from "@/features/financial/hooks/use-financial";
import type { FinancialDashboard } from "@/features/financial/types/financial.types";
import { formatCurrency, formatDateTime, formatPeriodStatus } from "@/features/financial/utils/format";

type PeriodClosePanelProps = {
  dashboard?: FinancialDashboard;
};

export function PeriodClosePanel({ dashboard }: PeriodClosePanelProps) {
  const [confirmClose, setConfirmClose] = useState(false);
  const closeMutation = useCloseFinancialPeriod();
  const settingsMutation = useUpdateFinancialSettings();
  const { data: periodsData } = useFinancialPeriods(1);

  const form = useForm<FinancialSettingsFormValues>({
    resolver: zodResolver(financialSettingsSchema),
    values: {
      reserve_percentage: dashboard?.settings.reserve_percentage ?? 0,
    },
  });

  const handleSettingsSubmit = (values: FinancialSettingsFormValues) => {
    settingsMutation.mutate(values);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Reserva de caixa</CardTitle>
          <CardDescription>
            Percentual retido do resultado operacional a cada fechamento. Acumulado atual:{" "}
            {formatCurrency(dashboard?.accumulated_reserve ?? 0)}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSettingsSubmit)} className="flex flex-col gap-4 sm:flex-row sm:items-end">
              <FormField
                control={form.control}
                name="reserve_percentage"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>Percentual de reserva (%)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" min="0" max="100" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" variant="secondary" disabled={settingsMutation.isPending}>
                {settingsMutation.isPending ? "Salvando..." : "Salvar configuração"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card className="border-amber-500/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Lock className="h-4 w-4 text-amber-400" aria-hidden />
            Fechar período
          </CardTitle>
          <CardDescription>
            Gera um snapshot imutável com receitas, despesas, reserva e distribuição por profissional.
            Um novo período será aberto automaticamente.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {dashboard ? (
            <div className="grid gap-3 rounded-xl border p-4 text-sm sm:grid-cols-2">
              <div>
                <p className="text-muted-foreground">Resultado operacional</p>
                <p className="font-medium tabular-nums">{formatCurrency(dashboard.operational_result)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Reserva a aplicar</p>
                <p className="font-medium tabular-nums">{formatCurrency(dashboard.reserve_applied)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Valor distribuível</p>
                <p className="font-medium tabular-nums">{formatCurrency(dashboard.distributable_amount)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Profissionais na distribuição</p>
                <p className="font-medium">{dashboard.active_professionals_count}</p>
              </div>
            </div>
          ) : null}
          <Button variant="destructive" onClick={() => setConfirmClose(true)} disabled={closeMutation.isPending}>
            Fechar período atual
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Histórico de períodos</CardTitle>
        </CardHeader>
        <CardContent>
          {(periodsData?.items ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum período registrado ainda.</p>
          ) : (
            <div className="space-y-4">
              {(periodsData?.items ?? []).map((period) => (
                <div key={period.id} className="rounded-xl border p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-medium">{formatPeriodStatus(period.status)}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDateTime(period.started_at)}
                        {period.closed_at ? ` → ${formatDateTime(period.closed_at)}` : ""}
                      </p>
                    </div>
                    {period.operational_result != null ? (
                      <p className="text-sm tabular-nums">
                        Resultado: {formatCurrency(period.operational_result)}
                      </p>
                    ) : null}
                  </div>
                  {period.distributions.length > 0 ? (
                    <div className="mt-3 overflow-x-auto">
                      <table className="w-full min-w-[520px] text-sm">
                        <thead>
                          <tr className="border-b text-left text-muted-foreground">
                            <th className="pb-2 pr-4 font-medium">Profissional</th>
                            <th className="pb-2 pr-4 font-medium">Bruto</th>
                            <th className="pb-2 pr-4 font-medium">Vales</th>
                            <th className="pb-2 font-medium">Líquido</th>
                          </tr>
                        </thead>
                        <tbody>
                          {period.distributions.map((row) => (
                            <tr key={row.professional_id} className="border-b border-border/50">
                              <td className="py-2 pr-4">{row.professional_name}</td>
                              <td className="py-2 pr-4 tabular-nums">{formatCurrency(row.gross_amount)}</td>
                              <td className="py-2 pr-4 tabular-nums text-red-400">
                                {formatCurrency(row.advances_deducted)}
                              </td>
                              <td className="py-2 tabular-nums">{formatCurrency(row.net_amount)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={confirmClose}
        onOpenChange={setConfirmClose}
        title="Fechar período financeiro"
        description="Esta ação congela os valores do período atual. Deseja continuar?"
        confirmLabel="Fechar período"
        variant="destructive"
        isLoading={closeMutation.isPending}
        onConfirm={() => {
          closeMutation.mutate(undefined, { onSuccess: () => setConfirmClose(false) });
        }}
      />
    </div>
  );
}
