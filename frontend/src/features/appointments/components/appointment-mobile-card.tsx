"use client";

import { MoreHorizontal } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { StatusBadge } from "@/features/appointments/components/status-badge";
import type { Appointment } from "@/features/appointments/types/appointment.types";
import { getAppointmentServiceLabel } from "@/features/appointments/types/appointment.types";
import { formatAppointmentDate, formatTimeRange } from "@/features/appointments/utils/format";

type AppointmentMobileCardProps = {
  appointment: Appointment;
  actions?: ReactNode;
};

export function AppointmentMobileCard({ appointment, actions }: AppointmentMobileCardProps) {
  return (
    <Card className="md:hidden">
      <CardContent className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate font-semibold">{appointment.client_name}</p>
            <p className="text-sm text-muted-foreground">{getAppointmentServiceLabel(appointment)}</p>
          </div>
          {actions ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">{actions}</DropdownMenuContent>
            </DropdownMenu>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <span>{formatAppointmentDate(appointment.appointment_date)}</span>
          <span>{formatTimeRange(appointment.start_time, appointment.end_time)}</span>
          <span>{appointment.professional.name}</span>
        </div>
        <StatusBadge status={appointment.status} />
      </CardContent>
    </Card>
  );
}
