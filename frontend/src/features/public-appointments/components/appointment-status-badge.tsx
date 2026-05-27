"use client";

import { Badge } from "@/components/ui/badge";
import type { AppointmentStatus } from "@/features/appointments/types/appointment.types";
import { statusLabels } from "@/features/appointments/utils/format";

const variants: Record<AppointmentStatus, "default" | "secondary" | "outline" | "destructive"> = {
  scheduled: "secondary",
  confirmed: "default",
  completed: "outline",
  cancelled: "destructive",
  no_show: "destructive",
};

export function AppointmentStatusBadge({ status }: { status: AppointmentStatus }) {
  return <Badge variant={variants[status]}>{statusLabels[status]}</Badge>;
}
