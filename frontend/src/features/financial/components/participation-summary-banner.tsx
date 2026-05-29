"use client";

import { AlertTriangle, CheckCircle2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useParticipationSummary } from "@/features/financial/hooks/use-financial";

export function ParticipationSummaryBanner() {
  const { data, isLoading } = useParticipationSummary();

  if (isLoading) {
    return <Skeleton className="h-16 w-full" />;
  }

  if (!data) return null;

  const total = data.total_percentage;
  const isValid = data.is_valid;

  return (
    <Card className={isValid ? "border-emerald-500/30 bg-emerald-500/5" : "border-amber-500/40 bg-amber-500/5"}>
      <CardContent className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          {isValid ? (
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" aria-hidden />
          ) : (
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" aria-hidden />
          )}
          <div>
            <p className="text-sm font-medium">Participação total ativa</p>
            <p className="text-sm text-muted-foreground">
              {data.active_professionals_count} profissional(is) ativo(s) para distribuição
            </p>
            {!isValid ? (
              <p className="mt-1 text-sm text-amber-400">
                A soma das participações ativas deve totalizar 100%.
              </p>
            ) : null}
          </div>
        </div>
        <Badge
          variant={isValid ? "secondary" : "destructive"}
          className="w-fit shrink-0 text-base tabular-nums"
        >
          {total}%
        </Badge>
      </CardContent>
    </Card>
  );
}
