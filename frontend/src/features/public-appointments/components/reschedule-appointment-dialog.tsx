"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAvailableSlots } from "@/features/appointments/hooks/use-appointments";
import { toISODate } from "@/features/appointments/utils/format";
import { useReschedulePublicAppointment } from "@/features/public-appointments/hooks/use-public-appointments";
import type { PublicAppointment } from "@/features/public-appointments/types/public-appointment.types";

type RescheduleAppointmentDialogProps = {
  appointment: PublicAppointment | null;
  phone: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function RescheduleAppointmentDialog({
  appointment,
  phone,
  open,
  onOpenChange,
}: RescheduleAppointmentDialogProps) {
  const [date, setDate] = useState(toISODate(new Date()));
  const [selectedStart, setSelectedStart] = useState<string | null>(null);
  const slotsQuery = useAvailableSlots(
    open && appointment ? appointment.professional_id : undefined,
    open && appointment ? appointment.service_ids : undefined,
    open && appointment ? date : undefined,
  );
  const mutation = useReschedulePublicAppointment();

  useEffect(() => {
    if (!appointment) return;
    setDate(appointment.appointment_date);
    setSelectedStart(appointment.start_time);
  }, [appointment]);

  useEffect(() => {
    setSelectedStart(null);
  }, [date]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Reagendar</DialogTitle>
          <DialogDescription>Escolha uma nova data e um horário disponível.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="re-date">Data</Label>
            <Input
              id="re-date"
              type="date"
              min={toISODate(new Date())}
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium">Horários</p>
            {slotsQuery.isLoading ? (
              <p className="text-sm text-muted-foreground">Carregando horários...</p>
            ) : slotsQuery.data?.slots.length ? (
              <div className="grid max-h-48 grid-cols-3 gap-2 overflow-y-auto sm:grid-cols-4">
                {slotsQuery.data.slots.map((slot) => (
                  <Button
                    key={slot.start_time}
                    type="button"
                    size="sm"
                    variant={selectedStart === slot.start_time ? "default" : "outline"}
                    className="min-w-0 shrink truncate text-xs"
                    onClick={() => setSelectedStart(slot.start_time)}
                  >
                    {slot.start_time}
                  </Button>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Sem horários nesta data.</p>
            )}
          </div>
        </div>
        <DialogFooter className="gap-2 sm:justify-end">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={mutation.isPending}>
            Fechar
          </Button>
          <Button
            type="button"
            disabled={!appointment || !selectedStart || mutation.isPending}
            onClick={() => {
              if (!appointment || !selectedStart) return;
              mutation.mutate(
                {
                  id: appointment.id,
                  payload: {
                    phone,
                    appointment_date: date,
                    start_time: selectedStart,
                    professional_id: appointment.professional_id,
                  },
                },
                { onSuccess: () => onOpenChange(false) },
              );
            }}
          >
            {mutation.isPending ? "Salvando..." : "Confirmar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
