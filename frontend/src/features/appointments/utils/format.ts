import type { AppointmentStatus } from "@/features/appointments/types/appointment.types";

export const statusLabels: Record<AppointmentStatus, string> = {
  scheduled: "Agendado",
  confirmed: "Confirmado",
  completed: "Concluído",
  cancelled: "Cancelado",
  no_show: "Falta",
};

export function formatAppointmentDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  }).format(new Date(`${value}T12:00:00`));
}

export function formatAppointmentDateLong(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(`${value}T12:00:00`));
}

export function formatTimeRange(start: string, end: string) {
  return `${start} - ${end}`;
}

export function toISODate(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function getNextDates(count = 14) {
  return Array.from({ length: count }, (_, index) => addDays(new Date(), index));
}
