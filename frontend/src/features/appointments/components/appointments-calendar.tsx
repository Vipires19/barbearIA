"use client";

import { CalendarDays } from "lucide-react";
import { useMemo, useState } from "react";

import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { AppointmentCard } from "@/features/appointments/components/appointment-card";
import { AppointmentActionsModal } from "@/features/appointments/components/appointment-actions-modal";
import { CalendarPicker } from "@/features/appointments/components/calendar-picker";
import { LoadingSkeleton } from "@/features/appointments/components/loading-skeleton";
import { useAppointmentsList } from "@/features/appointments/hooks/use-appointments";
import { toISODate } from "@/features/appointments/utils/format";

type AppointmentsCalendarProps = {
  embedded?: boolean;
};

export function AppointmentsCalendar({ embedded = false }: AppointmentsCalendarProps) {
  const [selectedDate, setSelectedDate] = useState(toISODate(new Date()));
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null);
  const params = useMemo(
    () => ({
      page: 1,
      page_size: 50,
      date_from: selectedDate,
      date_to: selectedDate,
    }),
    [selectedDate],
  );
  const { data, isLoading, isFetching } = useAppointmentsList(params);
  const selectedAppointment = data?.items.find((item) => item.id === selectedAppointmentId) ?? null;

  return (
    <div className={embedded ? "space-y-4" : "space-y-6"}>
      {!embedded ? (
        <PageHeader
          title="Agenda"
          description="Visualização simples e operacional dos atendimentos por dia."
        />
      ) : null}
      <CalendarPicker value={selectedDate} onChange={setSelectedDate} days={21} />

      {isLoading ? (
        <LoadingSkeleton />
      ) : !data?.items.length ? (
        <EmptyState
          icon={CalendarDays}
          title="Dia livre"
          description="Nenhum atendimento agendado para esta data."
        />
      ) : (
        <div className={isFetching ? "grid gap-3 opacity-60 transition-opacity" : "grid gap-3"}>
          {data.items
            .slice()
            .sort((a, b) => a.start_time.localeCompare(b.start_time))
            .map((appointment) => (
              <AppointmentCard
                key={appointment.id}
                appointment={appointment}
                onClick={() => setSelectedAppointmentId(appointment.id)}
              />
            ))}
        </div>
      )}
      <AppointmentActionsModal
        appointment={selectedAppointment}
        open={Boolean(selectedAppointment)}
        onOpenChange={(open) => {
          if (!open) setSelectedAppointmentId(null);
        }}
      />
    </div>
  );
}
