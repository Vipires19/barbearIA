"use client";

import { AlertCircle } from "lucide-react";

import type { WeekdayAvailability } from "@/features/availability/types/availability.types";
import { isAvailabilityConfigured } from "@/features/availability/utils/defaults";

type AvailabilitySetupBannerProps = {
  data?: WeekdayAvailability[];
};

export function AvailabilitySetupBanner({ data }: AvailabilitySetupBannerProps) {
  if (!data || isAvailabilityConfigured(data)) {
    return null;
  }

  return (
    <div
      role="status"
      className="flex gap-3 rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm"
    >
      <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden />
      <div>
        <p className="font-medium text-foreground">Horários ainda não configurados</p>
        <p className="mt-1 text-muted-foreground">
          Sem disponibilidade salva, o booking não mostra horários. Ajuste os dias abaixo e clique em{" "}
          <strong className="font-medium text-foreground">Salvar disponibilidade</strong>.
        </p>
      </div>
    </div>
  );
}
