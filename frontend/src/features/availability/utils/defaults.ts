import type { AvailabilityFormValues } from "@/features/availability/schemas/availability.schema";
import type { WeekdayAvailability } from "@/features/availability/types/availability.types";

export function normalizeTimeValue(value: string): string {
  const match = value.trim().match(/^(\d{2}):(\d{2})/);
  if (!match) return value.trim();
  return `${match[1]}:${match[2]}`;
}

export function isAvailabilityConfigured(data: WeekdayAvailability[]): boolean {
  return data.some((day) => day.active && day.blocks.length > 0);
}

export const WEEKDAY_FULL_LABELS = [
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
  "Domingo",
] as const;

export function createDefaultFormValues(): AvailabilityFormValues {
  return {
    days: Array.from({ length: 7 }, (_, weekday) => ({
      weekday,
      active: weekday < 5,
      blocks: weekday < 5 ? [{ start_time: "09:00", end_time: "18:00" }] : [],
    })),
  };
}

export function apiToFormValues(data: WeekdayAvailability[]): AvailabilityFormValues {
  const sorted = [...data].sort((a, b) => a.weekday - b.weekday);
  if (sorted.length !== 7) {
    return createDefaultFormValues();
  }
  const hasAnyActive = sorted.some((d) => d.active);
  if (!hasAnyActive) {
    return createDefaultFormValues();
  }
  return {
    days: sorted.map((day) => ({
      weekday: day.weekday,
      active: day.active,
      blocks: day.active && day.blocks.length > 0
        ? day.blocks.map((b) => ({ start_time: b.start_time, end_time: b.end_time }))
        : day.active
          ? [{ start_time: "09:00", end_time: "18:00" }]
          : [],
    })),
  };
}

export function formToApiPayload(values: AvailabilityFormValues): WeekdayAvailability[] {
  return values.days.map((day) => ({
    weekday: day.weekday,
    active: day.active,
    blocks: day.active
      ? day.blocks.map((b) => ({
          start_time: normalizeTimeValue(b.start_time),
          end_time: normalizeTimeValue(b.end_time),
        }))
      : [],
  }));
}
