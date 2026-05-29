import type { Appointment } from "@/features/appointments/types/appointment.types";
import type { WeekdayAvailability } from "@/features/availability/types/availability.types";

export type ScheduleBlock = {
  id: string;
  start_time: string;
  end_time: string;
  reason?: string | null;
};

export type DayTimelineItem =
  | {
      kind: "slot";
      start_time: string;
      end_time: string;
      status: "free" | "occupied" | "blocked";
      label: string;
      appointmentId?: string;
      blockId?: string;
    }
  | {
      kind: "break";
      start_time: string;
      end_time: string;
      label: string;
    };

const STEP = 15;

function toMinutes(value: string): number {
  const [h, m] = value.slice(0, 5).split(":").map(Number);
  return h * 60 + m;
}

function toTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function overlaps(start: number, end: number, otherStart: number, otherEnd: number): boolean {
  return start < otherEnd && end > otherStart;
}

export function buildDayTimeline(
  weekday: number,
  availabilities: WeekdayAvailability[],
  appointments: Appointment[],
  blocks: ScheduleBlock[],
): DayTimelineItem[] {
  const day = availabilities.find((d) => d.weekday === weekday);
  if (!day?.active || !day.blocks.length) {
    return [];
  }

  const windows = [...day.blocks]
    .map((b) => ({ start: toMinutes(b.start_time), end: toMinutes(b.end_time) }))
    .sort((a, b) => a.start - b.start);

  const aptRanges = appointments.map((a) => ({
    id: a.id,
    start: toMinutes(a.start_time),
    end: toMinutes(a.end_time),
    label: a.client_name,
  }));

  const blockRanges = blocks.map((b) => ({
    id: b.id,
    start: toMinutes(b.start_time),
    end: toMinutes(b.end_time),
    label: b.reason || "Bloqueado",
  }));

  const items: DayTimelineItem[] = [];

  windows.forEach((window, index) => {
    if (index > 0) {
      const prev = windows[index - 1];
      if (window.start > prev.end) {
        items.push({
          kind: "break",
          start_time: toTime(prev.end),
          end_time: toTime(window.start),
          label: "Pausa",
        });
      }
    }

    for (let cursor = window.start; cursor + STEP <= window.end; cursor += STEP) {
      const slotEnd = cursor + STEP;
      const start_time = toTime(cursor);
      const end_time = toTime(slotEnd);

      const apt = aptRanges.find((a) => overlaps(cursor, slotEnd, a.start, a.end));
      if (apt) {
        items.push({
          kind: "slot",
          start_time,
          end_time,
          status: "occupied",
          label: apt.label,
          appointmentId: apt.id,
        });
        continue;
      }

      const block = blockRanges.find((b) => overlaps(cursor, slotEnd, b.start, b.end));
      if (block) {
        items.push({
          kind: "slot",
          start_time,
          end_time,
          status: "blocked",
          label: block.label,
          blockId: block.id,
        });
        continue;
      }

      items.push({
        kind: "slot",
        start_time,
        end_time,
        status: "free",
        label: "Livre",
      });
    }
  });

  return items;
}
