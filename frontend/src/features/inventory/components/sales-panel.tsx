"use client";

import { Plus, ShoppingCart, XCircle } from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { CreateSaleModal } from "@/features/inventory/components/create-sale-modal";
import { useCancelSale, useSales } from "@/features/inventory/hooks/use-inventory";
import { SALE_STATUS_LABELS } from "@/features/inventory/types/inventory.types";
import { formatCurrency, formatDateTime } from "@/features/inventory/utils/format";
import { useCurrentUser } from "@/hooks/use-current-user";

export function SalesPanel() {
  const { data: user } = useCurrentUser();
  const isAdmin = user?.role === "admin";
  const { data, isLoading } = useSales();
  const cancelMutation = useCancelSale();
  const [createOpen, setCreateOpen] = useState(false);

  const handleCancel = async (saleId: string) => {
    if (!window.confirm("Cancelar esta venda? O estoque será reposto e a receita estornada.")) return;
    await cancelMutation.mutateAsync(saleId);
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle className="text-base">Vendas</CardTitle>
            <CardDescription>Registro operacional de vendas de produtos.</CardDescription>
          </div>
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nova venda
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-48 w-full" />
          ) : !data?.items.length ? (
            <EmptyState
              icon={ShoppingCart}
              title="Nenhuma venda"
              description="Registre vendas para gerar receita automaticamente."
            />
          ) : (
            <div className="space-y-4">
              {data.items.map((sale) => (
                <div key={sale.id} className="rounded-xl border border-border/60 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium tabular-nums">{formatCurrency(sale.total_amount)}</p>
                        <Badge variant={sale.status === "COMPLETED" ? "secondary" : "outline"}>
                          {SALE_STATUS_LABELS[sale.status]}
                        </Badge>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {formatDateTime(sale.created_at)}
                        {sale.created_by_name ? ` · ${sale.created_by_name}` : ""}
                      </p>
                    </div>
                    {isAdmin && sale.status === "COMPLETED" ? (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={cancelMutation.isPending}
                        onClick={() => void handleCancel(sale.id)}
                      >
                        <XCircle className="mr-2 h-4 w-4" />
                        Cancelar
                      </Button>
                    ) : null}
                  </div>
                  <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
                    {sale.items.map((item) => (
                      <li key={item.id} className="flex justify-between gap-2">
                        <span>
                          {item.product_name} × {item.quantity}
                        </span>
                        <span className="tabular-nums">{formatCurrency(item.subtotal)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      <CreateSaleModal open={createOpen} onOpenChange={setCreateOpen} />
    </>
  );
}
