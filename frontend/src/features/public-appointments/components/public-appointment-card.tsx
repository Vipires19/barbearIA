"use client";

import { CalendarClock, MoreHorizontal } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatAppointmentDateLong, formatTimeRange } from "@/features/appointments/utils/format";
import { AppointmentStatusBadge } from "@/features/public-appointments/components/appointment-status-badge";
import { CancelAppointmentDialog } from "@/features/public-appointments/components/cancel-appointment-dialog";
import { RescheduleAppointmentDialog } from "@/features/public-appointments/components/reschedule-appointment-dialog";
import type { PublicAppointment } from "@/features/public-appointments/types/public-appointment.types";
import { getPublicServiceLabel } from "@/features/public-appointments/types/public-appointment.types";

type PublicAppointmentCardProps = {
  appointment: PublicAppointment;
  phone: string;
};

export function PublicAppointmentCard({ appointment, phone }: PublicAppointmentCardProps) {
  const [cancelOpen, setCancelOpen] = useState(false);
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const canModify = appointment.status === "scheduled" || appointment.status === "confirmed";

  return (
    <>
      <Card className="overflow-hidden border-border/60 bg-card/90 shadow-sm">
        <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0 pb-2">
          <div className="min-w-0 flex-1">
            <CardTitle className="text-base font-semibold leading-snug">
              {getPublicServiceLabel(appointment)}
            </CardTitle>
            <p className="mt-1 truncate text-sm text-muted-foreground">{appointment.professional.name}</p>
            <p className="mt-1 text-xs text-muted-foreground">{appointment.client_display_name}</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <AppointmentStatusBadge status={appointment.status} />
            {canModify ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Ações">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setRescheduleOpen(true)}>Reagendar</DropdownMenuItem>
                  <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setCancelOpen(true)}>
                    Cancelar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : null}
          </div>
        </CardHeader>
        <CardContent className="space-y-2 pb-4">
          <div className="flex items-start gap-2 text-sm">
            <CalendarClock className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
            <div className="min-w-0">
              <p className="font-medium">{formatAppointmentDateLong(appointment.appointment_date)}</p>
              <p className="text-muted-foreground">{formatTimeRange(appointment.start_time, appointment.end_time)}</p>
              <p className="text-xs text-muted-foreground">
                Duração: {appointment.total_duration_minutes} min
              </p>
            </div>
          </div>
          {canModify ? (
            <div className="flex flex-wrap gap-2 pt-2">
              <Button type="button" size="sm" variant="outline" className="flex-1 sm:flex-none" onClick={() => setRescheduleOpen(true)}>
                Reagendar
              </Button>
              <Button
                type="button"
                size="sm"
                variant="destructive"
                className="flex-1 sm:flex-none"
                onClick={() => setCancelOpen(true)}
              >
                Cancelar
              </Button>
            </div>
          ) : null}
        </CardContent>
      </Card>
      <CancelAppointmentDialog
        appointment={cancelOpen ? appointment : null}
        phone={phone}
        open={cancelOpen}
        onOpenChange={setCancelOpen}
      />
      <RescheduleAppointmentDialog
        appointment={rescheduleOpen ? appointment : null}
        phone={phone}
        open={rescheduleOpen}
        onOpenChange={setRescheduleOpen}
      />
    </>
  );
}
