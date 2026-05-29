"use client";

import { Search } from "lucide-react";
import { useMemo, useState } from "react";

import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { SearchInput } from "@/components/shared/search-input";
import { Button } from "@/components/ui/button";
import { AppointmentActionsModal } from "@/features/appointments/components/appointment-actions-modal";
import { AppointmentMobileCard } from "@/features/appointments/components/appointment-mobile-card";
import { AppointmentTable } from "@/features/appointments/components/appointment-table";
import { LoadingSkeleton } from "@/features/appointments/components/loading-skeleton";
import {
  useAppointmentsList,
} from "@/features/appointments/hooks/use-appointments";
import type {
  Appointment,
  AppointmentStatus,
} from "@/features/appointments/types/appointment.types";
import { statusLabels } from "@/features/appointments/utils/format";
import { useDebouncedValue } from "@/features/services/hooks/use-debounced-value";

const PAGE_SIZE = 10;
const statusFilters: Array<"all" | AppointmentStatus> = [
  "all",
  "scheduled",
  "completed",
  "cancelled",
  "no_show",
];

export function AppointmentsAdminList() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<"all" | AppointmentStatus>("all");
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

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
          <AppointmentTable data={data.items} onRowClick={setSelectedAppointment} />
          <div className="space-y-3 md:hidden">
            {data.items.map((appointment) => (
              <AppointmentMobileCard
                key={appointment.id}
                appointment={appointment}
                onClick={() => setSelectedAppointment(appointment)}
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
      <AppointmentActionsModal
        appointment={selectedAppointment}
        open={Boolean(selectedAppointment)}
        onOpenChange={(open) => !open && setSelectedAppointment(null)}
      />
    </>
  );
}
