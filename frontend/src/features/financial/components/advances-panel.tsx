"use client";

import { Banknote, Plus } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { AdvanceFormModal } from "@/features/financial/components/advance-form-modal";
import type { Advance } from "@/features/financial/types/financial.types";
import { formatCurrency, formatDateTime } from "@/features/financial/utils/format";

type AdvancesPanelProps = {
  advances: Advance[];
};

export function AdvancesPanel({ advances }: AdvancesPanelProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle className="text-base">Vales</CardTitle>
            <CardDescription>Retiradas antecipadas descontadas na distribuição.</CardDescription>
          </div>
          <Button size="sm" onClick={() => setOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Novo vale
          </Button>
        </CardHeader>
        <CardContent>
          {advances.length === 0 ? (
            <EmptyState
              icon={Banknote}
              title="Nenhum vale"
              description="Registre vales para descontar do profissional no fechamento."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-2 pr-4 font-medium">Profissional</th>
                    <th className="pb-2 pr-4 font-medium">Valor</th>
                    <th className="pb-2 pr-4 font-medium">Observação</th>
                    <th className="pb-2 font-medium">Registrado em</th>
                  </tr>
                </thead>
                <tbody>
                  {advances.map((advance) => (
                    <tr key={advance.id} className="border-b border-border/50">
                      <td className="py-3 pr-4">{advance.professional_name}</td>
                      <td className="py-3 pr-4 tabular-nums text-red-400">{formatCurrency(advance.amount)}</td>
                      <td className="py-3 pr-4 text-muted-foreground">{advance.notes ?? "—"}</td>
                      <td className="py-3">{formatDateTime(advance.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
      <AdvanceFormModal open={open} onOpenChange={setOpen} />
    </>
  );
}
