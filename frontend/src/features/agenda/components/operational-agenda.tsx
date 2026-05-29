"use client";

import { Settings2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { AgendaEmptyState } from "@/features/agenda/components/agenda-empty-state";
import { BlockTimeModal } from "@/features/agenda/components/block-time-modal";
import { DayScheduleList } from "@/features/agenda/components/day-schedule-list";
import { OpenAgendaModal } from "@/features/agenda/components/open-agenda-modal";
import {
  useCreateScheduleBlock,
  useDeleteScheduleBlock,
  useScheduleBlocks,
} from "@/features/agenda/hooks/use-schedule-blocks";
import { buildDayTimeline } from "@/features/agenda/utils/build-day-timeline";
import { AppointmentActionsModal } from "@/features/appointments/components/appointment-actions-modal";
import { CalendarPicker } from "@/features/appointments/components/calendar-picker";
import type { Appointment } from "@/features/appointments/types/appointment.types";
import { useAppointmentsList } from "@/features/appointments/hooks/use-appointments";
import { toISODate } from "@/features/appointments/utils/format";
import {
  useMyAvailabilities,
  useProfessionalAvailabilities,
  useSaveMyAvailabilities,
  useSaveProfessionalAvailabilities,
} from "@/features/availability/hooks/use-availability";
import { isAvailabilityConfigured } from "@/features/availability/utils/defaults";
import { useMyProfile, useProfessionalsList } from "@/features/professionals/hooks/use-professionals";
import { useAuthStore } from "@/store/auth-store";

function addMinutes(time: string, minutes: number): string {
  const [h, m] = time.split(":").map(Number);
  const total = h * 60 + m + minutes;
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

export function OperationalAgenda() {
  const role = useAuthStore((s) => s.user?.role);
  const isAdmin = role === "admin";
  const myProfileQuery = useMyProfile();
  const hasOwnProfessional = Boolean(myProfileQuery.data?.id);
  const isGlobalAdminView = isAdmin && !myProfileQuery.isLoading && !hasOwnProfessional;

  const { data: professionalsData, isLoading: loadingPros } = useProfessionalsList({
    page: 1,
    page_size: 100,
    is_active: true,
  }, isGlobalAdminView);
  const professionals = professionalsData?.items ?? [];
  const [professionalId, setProfessionalId] = useState("");

  useEffect(() => {
    if (isGlobalAdminView && !professionalId && professionals.length > 0) {
      setProfessionalId(professionals[0].id);
    }
  }, [isGlobalAdminView, professionalId, professionals]);

  const myAvailQuery = useMyAvailabilities(hasOwnProfessional);
  const proAvailQuery = useProfessionalAvailabilities(isGlobalAdminView ? professionalId : undefined);
  const availabilities = isGlobalAdminView ? proAvailQuery.data : myAvailQuery.data;
  const availLoading = myProfileQuery.isLoading || (isGlobalAdminView ? proAvailQuery.isLoading : myAvailQuery.isLoading);

  const saveMy = useSaveMyAvailabilities();
  const savePro = useSaveProfessionalAvailabilities(professionalId);

  const [openSetup, setOpenSetup] = useState(false);
  const [selectedDate, setSelectedDate] = useState(toISODate(new Date()));
  const [blockModal, setBlockModal] = useState<{ start: string; end: string } | null>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

  const configured = availabilities ? isAvailabilityConfigured(availabilities) : false;

  const weekday = useMemo(() => new Date(`${selectedDate}T12:00:00`).getDay(), [selectedDate]);
  const pythonWeekday = weekday === 0 ? 6 : weekday - 1;

  const appointmentsQuery = useAppointmentsList({
    page: 1,
    page_size: 100,
    date_from: selectedDate,
    date_to: selectedDate,
    ...(isGlobalAdminView && professionalId ? { professional_id: professionalId } : {}),
  });

  const blockProfessionalId = isGlobalAdminView ? professionalId : undefined;
  const blocksQuery = useScheduleBlocks(selectedDate, configured, blockProfessionalId);
  const createBlock = useCreateScheduleBlock(blockProfessionalId);
  const deleteBlock = useDeleteScheduleBlock(selectedDate, blockProfessionalId);

  const activeAppointments = useMemo(
    () =>
      (appointmentsQuery.data?.items ?? []).filter((a) =>
        ["scheduled", "confirmed"].includes(a.status),
      ),
    [appointmentsQuery.data?.items],
  );

  const timeline = useMemo(() => {
    if (!availabilities) return [];
    return buildDayTimeline(
      pythonWeekday,
      availabilities,
      activeAppointments,
      (blocksQuery.data ?? []).map((b) => ({
        id: b.id,
        start_time: b.start_time,
        end_time: b.end_time,
        reason: b.reason,
      })),
    );
  }, [availabilities, pythonWeekday, activeAppointments, blocksQuery.data]);

  const handleSaveAgenda = (payload: Parameters<typeof saveMy.mutate>[0]) => {
    const onDone = () => setOpenSetup(false);
    if (isGlobalAdminView && professionalId) {
      savePro.mutate(payload, { onSuccess: onDone });
    } else {
      saveMy.mutate(payload, { onSuccess: onDone });
    }
  };

  const isSaving = saveMy.isPending || savePro.isPending;

  if (myProfileQuery.isLoading || (isGlobalAdminView && loadingPros)) {
    return <Skeleton className="h-64 w-full" />;
  }

  if (isGlobalAdminView && !professionals.length) {
    return (
      <p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
        Cadastre um profissional para configurar a agenda.
      </p>
    );
  }

  const openAppointment = (appointmentId: string) => {
    const found = appointmentsQuery.data?.items.find((a) => a.id === appointmentId) ?? null;
    setSelectedAppointment(found);
  };

  return (
    <div className="min-w-0 space-y-6 overflow-x-hidden pb-4">
      <PageHeader
        title="Agenda"
        description={
          configured
            ? "Veja horários livres e ocupados. Toque em um horário livre para bloquear."
            : "Abra sua agenda para começar a receber agendamentos."
        }
      />

      {isGlobalAdminView ? (
        <div className="max-w-md space-y-2">
          <Label htmlFor="agenda-professional">Profissional</Label>
          <select
            id="agenda-professional"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={professionalId}
            onChange={(e) => setProfessionalId(e.target.value)}
          >
            {professionals.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      {availLoading ? (
        <Skeleton className="h-48 w-full" />
      ) : !configured ? (
        <AgendaEmptyState onOpenAgenda={() => setOpenSetup(true)} />
      ) : (
        <>
          <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0 max-w-full overflow-x-auto">
              <CalendarPicker value={selectedDate} onChange={setSelectedDate} days={14} />
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="shrink-0 self-start sm:self-center"
              onClick={() => setOpenSetup(true)}
            >
              <Settings2 className="h-4 w-4" aria-hidden />
              Ajustar horários
            </Button>
          </div>

          {appointmentsQuery.isLoading || blocksQuery.isLoading ? (
            <Skeleton className="h-40 w-full" />
          ) : (
            <DayScheduleList
              items={timeline}
              onBlockSlot={(start) =>
                setBlockModal({ start, end: addMinutes(start, 60) })
              }
              onUnblock={(blockId) => deleteBlock.mutate(blockId)}
              onAppointmentClick={openAppointment}
            />
          )}

          <BlockTimeModal
            open={Boolean(blockModal)}
            onOpenChange={(open) => !open && setBlockModal(null)}
            date={selectedDate}
            defaultStart={blockModal?.start}
            defaultEnd={blockModal?.end}
            isSaving={createBlock.isPending}
            onSave={(payload) => {
              createBlock.mutate(payload, {
                onSuccess: () => setBlockModal(null),
              });
            }}
          />
        </>
      )}

      <OpenAgendaModal
        open={openSetup}
        onOpenChange={setOpenSetup}
        onSave={handleSaveAgenda}
        isSaving={isSaving}
      />

      <AppointmentActionsModal
        appointment={selectedAppointment}
        open={Boolean(selectedAppointment)}
        onOpenChange={(open) => {
          if (!open) setSelectedAppointment(null);
        }}
      />
    </div>
  );
}
