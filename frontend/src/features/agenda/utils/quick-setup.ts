import type { WeekdayAvailabilityPayload } from "@/features/availability/types/availability.types";

export type QuickAgendaSetup = {
  activeWeekdays: number[];
  startTime: string;
  endTime: string;
  breakEnabled: boolean;
  breakStart: string;
  breakEnd: string;
};

export const DEFAULT_QUICK_SETUP: QuickAgendaSetup = {
  activeWeekdays: [0, 1, 2, 3, 4],
  startTime: "09:00",
  endTime: "18:00",
  breakEnabled: true,
  breakStart: "13:00",
  breakEnd: "14:00",
};

export function quickSetupToPayload(setup: QuickAgendaSetup): WeekdayAvailabilityPayload {
  return Array.from({ length: 7 }, (_, weekday) => {
    const active = setup.activeWeekdays.includes(weekday);
    if (!active) {
      return { weekday, active: false, blocks: [] };
    }
    const blocks =
      setup.breakEnabled &&
      setup.breakStart < setup.breakEnd &&
      setup.breakStart > setup.startTime &&
      setup.breakEnd < setup.endTime
        ? [
            { start_time: setup.startTime, end_time: setup.breakStart },
            { start_time: setup.breakEnd, end_time: setup.endTime },
          ]
        : [{ start_time: setup.startTime, end_time: setup.endTime }];
    return { weekday, active: true, blocks };
  });
}
