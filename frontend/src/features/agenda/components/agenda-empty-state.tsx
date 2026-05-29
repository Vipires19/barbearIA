"use client";

import { CalendarDays } from "lucide-react";

import { Button } from "@/components/ui/button";

type AgendaEmptyStateProps = {
  onOpenAgenda: () => void;
};

export function AgendaEmptyState({ onOpenAgenda }: AgendaEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed bg-muted/20 px-6 py-14 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
        <CalendarDays className="h-7 w-7 text-primary" aria-hidden />
      </div>
      <h2 className="text-xl font-semibold tracking-tight">Sua agenda está fechada</h2>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        Configure seus horários de atendimento para começar a receber agendamentos online.
      </p>
      <Button type="button" size="lg" className="mt-8 w-full max-w-xs" onClick={onOpenAgenda}>
        Abrir agenda
      </Button>
    </div>
  );
}
