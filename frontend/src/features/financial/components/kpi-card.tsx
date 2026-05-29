"use client";

import type { LucideIcon } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/features/financial/utils/format";
import { cn } from "@/lib/utils";

type KpiCardProps = {
  title: string;
  value: number;
  icon: LucideIcon;
  variant?: "default" | "positive" | "negative" | "muted";
  loading?: boolean;
  format?: "currency" | "number";
};

export function KpiCard({
  title,
  value,
  icon: Icon,
  variant = "default",
  loading,
  format = "currency",
}: KpiCardProps) {
  const valueClass =
    variant === "positive"
      ? "text-emerald-400"
      : variant === "negative"
        ? "text-red-400"
        : variant === "muted"
          ? "text-muted-foreground"
          : "text-foreground";

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" aria-hidden />
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-28" />
        ) : (
          <p className={cn("text-2xl font-semibold tabular-nums", valueClass)}>
            {format === "number" ? value : formatCurrency(value)}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
