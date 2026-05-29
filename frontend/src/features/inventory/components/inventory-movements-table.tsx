"use client";

import { ArrowLeftRight } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useInventoryMovements } from "@/features/inventory/hooks/use-inventory";
import { formatDateTime, formatMovementType } from "@/features/inventory/utils/format";

export function InventoryMovementsTable() {
  const { data, isLoading } = useInventoryMovements();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Movimentações</CardTitle>
        <CardDescription>Histórico de entradas, saídas e ajustes de estoque.</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-48 w-full" />
        ) : !data?.items.length ? (
          <EmptyState
            icon={ArrowLeftRight}
            title="Nenhuma movimentação"
            description="As movimentações aparecerão aqui."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-2 pr-4 font-medium">Data</th>
                  <th className="pb-2 pr-4 font-medium">Produto</th>
                  <th className="pb-2 pr-4 font-medium">Tipo</th>
                  <th className="pb-2 pr-4 font-medium">Qtd</th>
                  <th className="pb-2 pr-4 font-medium">Anterior</th>
                  <th className="pb-2 pr-4 font-medium">Novo</th>
                  <th className="pb-2 font-medium">Motivo</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((movement) => (
                  <tr key={movement.id} className="border-b border-border/50">
                    <td className="py-3 pr-4 whitespace-nowrap">{formatDateTime(movement.created_at)}</td>
                    <td className="py-3 pr-4">{movement.product_name}</td>
                    <td className="py-3 pr-4">{formatMovementType(movement.movement_type)}</td>
                    <td className="py-3 pr-4 tabular-nums">{movement.quantity}</td>
                    <td className="py-3 pr-4 tabular-nums">{movement.previous_stock}</td>
                    <td className="py-3 pr-4 tabular-nums">{movement.new_stock}</td>
                    <td className="py-3 text-muted-foreground">{movement.reason ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
