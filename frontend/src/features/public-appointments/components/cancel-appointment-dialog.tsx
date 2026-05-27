"use client";

import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { useCancelPublicAppointment } from "@/features/public-appointments/hooks/use-public-appointments";
import type { PublicAppointment } from "@/features/public-appointments/types/public-appointment.types";
import { getPublicServiceLabel } from "@/features/public-appointments/types/public-appointment.types";

type CancelAppointmentDialogProps = {
  appointment: PublicAppointment | null;
  phone: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function CancelAppointmentDialog({
  appointment,
  phone,
  open,
  onOpenChange,
}: CancelAppointmentDialogProps) {
  const mutation = useCancelPublicAppointment();

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Cancelar agendamento"
      description={
        appointment
          ? `Cancelar ${getPublicServiceLabel(appointment)} em ${appointment.appointment_date} às ${appointment.start_time}?`
          : ""
      }
      confirmLabel="Cancelar agendamento"
      variant="destructive"
      isLoading={mutation.isPending}
      onConfirm={() => {
        if (!appointment) return;
        mutation.mutate(
          { id: appointment.id, payload: { phone } },
          { onSuccess: () => onOpenChange(false) },
        );
      }}
    />
  );
}
