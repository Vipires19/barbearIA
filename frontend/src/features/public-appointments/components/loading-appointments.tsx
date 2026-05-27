"use client";

import { Skeleton } from "@/components/ui/skeleton";

export function LoadingAppointments() {
  return (
    <div className="grid gap-3" aria-busy="true" aria-label="Carregando agendamentos">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-28 w-full rounded-xl" />
      ))}
    </div>
  );
}
