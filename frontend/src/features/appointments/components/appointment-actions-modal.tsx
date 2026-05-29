"use client";

import { useMemo } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { StatusBadge } from "@/features/appointments/components/status-badge";
import {
  useCancelAppointment,
  usePatchAppointment,
} from "@/features/appointments/hooks/use-appointments";
import type { Appointment } from "@/features/appointments/types/appointment.types";
import { getAppointmentServiceLabel } from "@/features/appointments/types/appointment.types";
import { formatTimeRange } from "@/features/appointments/utils/format";

type AppointmentActionsModalProps = {
  appointment: Appointment | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const FINAL_STATUSES = new Set(["completed", "cancelled", "no_show"]);

export function AppointmentActionsModal({ appointment, open, onOpenChange }: AppointmentActionsModalProps) {
  const patchMutation = usePatchAppointment();
  const cancelMutation = useCancelAppointment();

  const readonly = useMemo(
    () => (appointment ? FINAL_STATUSES.has(appointment.status) : false),
    [appointment],
  );

  const isPending = patchMutation.isPending || cancelMutation.isPending;

  const closeOnSuccess = () => onOpenChange(false);

  const markCompleted = () => {
    if (!appointment || readonly) return;
    patchMutation.mutate(
      { id: appointment.id, payload: { status: "completed" } },
      { onSuccess: closeOnSuccess },
    );
  };

  const markNoShow = () => {
    if (!appointment || readonly) return;
    patchMutation.mutate(
      { id: appointment.id, payload: { status: "no_show" } },
      { onSuccess: closeOnSuccess },
    );
  };

  const markCancelled = () => {
    if (!appointment || readonly) return;
    cancelMutation.mutate({ id: appointment.id }, { onSuccess: closeOnSuccess });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[min(90dvh,640px)] w-[calc(100vw-1.5rem)] max-w-sm gap-0 overflow-y-auto overflow-x-hidden p-0 sm:max-w-sm">
        <DialogHeader className="space-y-1 border-b px-4 py-4 pr-12 text-left">
          <DialogTitle>Atendimento</DialogTitle>
        </DialogHeader>

        {appointment ? (
          <div className="space-y-4 px-4 py-4 text-sm">
            <div className="flex items-start justify-between gap-3">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Cliente</p>
              <StatusBadge status={appointment.status} />
            </div>
            <p className="text-base font-semibold leading-tight">{appointment.client_name}</p>

            <div className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Serviços</p>
              <p className="leading-snug">{getAppointmentServiceLabel(appointment)}</p>
            </div>

            <div className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Horário</p>
              <p className="tabular-nums">
                {formatTimeRange(appointment.start_time, appointment.end_time)}
              </p>
            </div>
          </div>
        ) : null}

        <div className="flex flex-col gap-2 border-t px-4 py-4">
          <Button
            type="button"
            className="h-11 w-full"
            disabled={!appointment || readonly || isPending}
            onClick={markCompleted}
          >
            Marcar concluído
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-11 w-full"
            disabled={!appointment || readonly || isPending}
            onClick={markNoShow}
          >
            Marcar falta
          </Button>
          <Button
            type="button"
            variant="destructive"
            className="h-11 w-full"
            disabled={!appointment || readonly || isPending}
            onClick={markCancelled}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="h-10 w-full"
            disabled={isPending}
            onClick={() => onOpenChange(false)}
          >
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
