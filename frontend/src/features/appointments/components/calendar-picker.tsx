"use client";

import { Button } from "@/components/ui/button";
import { formatAppointmentDate, getNextDates, toISODate } from "@/features/appointments/utils/format";
import { cn } from "@/lib/utils";

type CalendarPickerProps = {
  value?: string;
  onChange: (date: string) => void;
  days?: number;
};

export function CalendarPicker({ value, onChange, days = 14 }: CalendarPickerProps) {
  const dates = getNextDates(days);

  return (
    <div className="flex max-w-full gap-2 overflow-x-auto overscroll-x-contain pb-2 [-webkit-overflow-scrolling:touch]">
      {dates.map((date) => {
        const iso = toISODate(date);
        const selected = value === iso;
        return (
          <Button
            key={iso}
            type="button"
            variant={selected ? "default" : "outline"}
            className={cn("h-auto min-w-24 shrink-0 flex-col gap-1 px-3 py-3", selected && "shadow")}
            onClick={() => onChange(iso)}
          >
            <span className="text-xs capitalize opacity-80">
              {new Intl.DateTimeFormat("pt-BR", { weekday: "short" }).format(date)}
            </span>
            <span className="text-sm font-semibold">{formatAppointmentDate(iso).replace(".", "")}</span>
          </Button>
        );
      })}
    </div>
  );
}
