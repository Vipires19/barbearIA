"use client";

import { CalendarDays, Clock, Scissors, User } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/features/appointments/components/status-badge";
import type { Appointment } from "@/features/appointments/types/appointment.types";
import { getAppointmentServiceLabel } from "@/features/appointments/types/appointment.types";
import {
  formatAppointmentDateLong,
  formatTimeRange,
} from "@/features/appointments/utils/format";

type AppointmentCardProps = {
  appointment: Appointment;
  onClick?: () => void;
};

export function AppointmentCard({ appointment, onClick }: AppointmentCardProps) {
  return (
    <Card className="cursor-pointer border-border/60 bg-card/90" onClick={onClick}>
      <CardContent className="space-y-4 p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate font-semibold">{appointment.client_name}</p>
            <p className="text-sm text-muted-foreground">{appointment.client_phone}</p>
          </div>
          <StatusBadge status={appointment.status} />
        </div>

        <div className="grid gap-2 text-sm text-muted-foreground">
          <span className="flex items-center gap-2">
            <Scissors className="h-4 w-4" />
            {getAppointmentServiceLabel(appointment)}
          </span>
          <span className="flex items-center gap-2">
            <User className="h-4 w-4" />
            {appointment.professional.name}
          </span>
          <span className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4" />
            {formatAppointmentDateLong(appointment.appointment_date)}
          </span>
          <span className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            {formatTimeRange(appointment.start_time, appointment.end_time)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
