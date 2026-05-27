"use client";

import { Check, MoreHorizontal, RefreshCcw, Search, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { SearchInput } from "@/components/shared/search-input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AppointmentMobileCard } from "@/features/appointments/components/appointment-mobile-card";
import { AppointmentTable } from "@/features/appointments/components/appointment-table";
import { LoadingSkeleton } from "@/features/appointments/components/loading-skeleton";
import {
  useAppointmentsList,
  useCancelAppointment,
  usePatchAppointment,
  useRescheduleAppointment,
} from "@/features/appointments/hooks/use-appointments";
import type {
  Appointment,
  AppointmentStatus,
} from "@/features/appointments/types/appointment.types";
import { statusLabels, toISODate } from "@/features/appointments/utils/format";
import { useDebouncedValue } from "@/features/services/hooks/use-debounced-value";

const PAGE_SIZE = 10;
const statusFilters: Array<"all" | AppointmentStatus> = [
  "all",
  "scheduled",
  "confirmed",
  "completed",
  "cancelled",
  "no_show",
];

export function AppointmentsAdminList() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<"all" | AppointmentStatus>("all");
  const [cancelTarget, setCancelTarget] = useState<Appointment | null>(null);
  const [rescheduleTarget, setRescheduleTarget] = useState<Appointment | null>(null);

  const debouncedSearch = useDebouncedValue(search);
  const params = useMemo(
    () => ({
      page,
      page_size: PAGE_SIZE,
      search: debouncedSearch || undefined,
      status: status === "all" ? undefined : status,
    }),
    [debouncedSearch, page, status],
  );

  const { data, isLoading, isFetching } = useAppointmentsList(params);
  const patchMutation = usePatchAppointment();
  const cancelMutation = useCancelAppointment();

  const actions = (appointment: Appointment) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          disabled={appointment.status === "confirmed"}
          onClick={() =>
            patchMutation.mutate({ id: appointment.id, payload: { status: "confirmed" } })
          }
        >
          <Check className="mr-2 h-4 w-4" />
          Confirmar
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setRescheduleTarget(appointment)}>
          <RefreshCcw className="mr-2 h-4 w-4" />
          Reagendar
        </DropdownMenuItem>
        <DropdownMenuItem
          className="text-destructive focus:text-destructive"
          onClick={() => setCancelTarget(appointment)}
        >
          <X className="mr-2 h-4 w-4" />
          Cancelar
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <>
      <PageHeader
        title="Agendamentos"
        description="Acompanhe, confirme, cancele e reagende atendimentos."
      />

      <div className="mb-6 flex flex-col gap-3">
        <SearchInput
          value={search}
          onChange={(value) => {
            setSearch(value);
            setPage(1);
          }}
          placeholder="Buscar por cliente, telefone ou e-mail..."
        />
        <div className="flex gap-2 overflow-x-auto pb-1">
          {statusFilters.map((item) => (
            <Button
              key={item}
              variant={status === item ? "default" : "outline"}
              size="sm"
              className="shrink-0"
              onClick={() => {
                setStatus(item);
                setPage(1);
              }}
            >
              {item === "all" ? "Todos" : statusLabels[item]}
            </Button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <LoadingSkeleton />
      ) : !data?.items.length ? (
        <EmptyState
          icon={Search}
          title="Nenhum agendamento encontrado"
          description="Tente ajustar a busca ou os filtros de status."
        />
      ) : (
        <div className={isFetching ? "space-y-3 opacity-60 transition-opacity" : "space-y-3"}>
          <AppointmentTable data={data.items} renderActions={actions} />
          <div className="space-y-3 md:hidden">
            {data.items.map((appointment) => (
              <AppointmentMobileCard
                key={appointment.id}
                appointment={appointment}
                actions={
                  <>
                    <DropdownMenuItem
                      disabled={appointment.status === "confirmed"}
                      onClick={() =>
                        patchMutation.mutate({
                          id: appointment.id,
                          payload: { status: "confirmed" },
                        })
                      }
                    >
                      Confirmar
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setRescheduleTarget(appointment)}>
                      Reagendar
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={() => setCancelTarget(appointment)}
                    >
                      Cancelar
                    </DropdownMenuItem>
                  </>
                }
              />
            ))}
          </div>
          <div className="flex items-center justify-between gap-3 pt-2 text-sm text-muted-foreground">
            <span>
              Página {data.page} de {data.pages} · {data.total} registros
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={data.page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={data.page >= data.pages}
                onClick={() => setPage((p) => p + 1)}
              >
                Próxima
              </Button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(cancelTarget)}
        onOpenChange={(open) => !open && setCancelTarget(null)}
        title="Cancelar agendamento"
        description={
          cancelTarget
            ? `Cancelar o atendimento de ${cancelTarget.client_name}? Esta ação libera o horário.`
            : ""
        }
        confirmLabel="Cancelar agendamento"
        variant="destructive"
        isLoading={cancelMutation.isPending}
        onConfirm={() => {
          if (cancelTarget) {
            cancelMutation.mutate(
              { id: cancelTarget.id },
              { onSuccess: () => setCancelTarget(null) },
            );
          }
        }}
      />

      <RescheduleDialog
        appointment={rescheduleTarget}
        open={Boolean(rescheduleTarget)}
        onOpenChange={(open) => !open && setRescheduleTarget(null)}
      />
    </>
  );
}

function RescheduleDialog({
  appointment,
  open,
  onOpenChange,
}: {
  appointment: Appointment | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [date, setDate] = useState(toISODate(new Date()));
  const [time, setTime] = useState("09:00");
  const mutation = useRescheduleAppointment();

  useEffect(() => {
    if (!appointment) return;
    setDate(appointment.appointment_date);
    setTime(appointment.start_time);
  }, [appointment]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reagendar atendimento</DialogTitle>
          <DialogDescription>Informe a nova data e horário para o agendamento.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="space-y-2">
            <Label htmlFor="reschedule-date">Data</Label>
            <Input
              id="reschedule-date"
              type="date"
              min={toISODate(new Date())}
              value={date}
              onChange={(event) => setDate(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="reschedule-time">Horário</Label>
            <Input
              id="reschedule-time"
              type="time"
              value={time}
              onChange={(event) => setTime(event.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={mutation.isPending}>
            Fechar
          </Button>
          <Button
            disabled={!appointment || mutation.isPending}
            onClick={() => {
              if (!appointment) return;
              mutation.mutate(
                { id: appointment.id, payload: { appointment_date: date, start_time: time } },
                { onSuccess: () => onOpenChange(false) },
              );
            }}
          >
            {mutation.isPending ? "Salvando..." : "Reagendar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
