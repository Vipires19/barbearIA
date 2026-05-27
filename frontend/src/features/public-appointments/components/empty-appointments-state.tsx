"use client";

import { CalendarSearch } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";

export function EmptyAppointmentsState() {
  return (
    <EmptyState
      icon={CalendarSearch}
      title="Nenhum agendamento encontrado"
      description="Confira o DDD e o número. Se acabou de agendar, aguarde alguns instantes e tente novamente."
    />
  );
}
