"use client";

import { AlertTriangle } from "lucide-react";
import Link from "next/link";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useLowStockProducts } from "@/features/inventory/hooks/use-inventory";

export function LowStockWidget() {
  const { data, isLoading } = useLowStockProducts();

  if (isLoading) {
    return <Skeleton className="h-24 w-full" />;
  }

  const count = data?.length ?? 0;

  if (count === 0) {
    return null;
  }

  return (
    <Card className="border-amber-500/30 bg-amber-500/5">
      <CardHeader className="flex flex-row items-start gap-3 pb-2">
        <AlertTriangle className="h-5 w-5 shrink-0 text-amber-400" aria-hidden />
        <div>
          <CardTitle className="text-base">Estoque baixo</CardTitle>
          <CardDescription>
            {count} produto{count !== 1 ? "s" : ""} abaixo do mínimo
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <ul className="space-y-1 text-sm">
          {data?.slice(0, 5).map((product) => (
            <li key={product.id} className="flex justify-between gap-2">
              <span>{product.name}</span>
              <span className="tabular-nums text-amber-400">
                {product.stock_quantity}/{product.minimum_stock}
              </span>
            </li>
          ))}
        </ul>
        {count > 5 ? (
          <p className="mt-2 text-xs text-muted-foreground">
            <Link href="/dashboard/inventory" className="underline hover:text-foreground">
              Ver todos no estoque
            </Link>
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
