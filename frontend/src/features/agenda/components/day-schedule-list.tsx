"use client";

import { Ban, Clock } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { DayTimelineItem } from "@/features/agenda/utils/build-day-timeline";
import { cn } from "@/lib/utils";

type DayScheduleListProps = {
  items: DayTimelineItem[];
  onBlockSlot?: (start: string, end: string) => void;
  onUnblock?: (blockId: string) => void;
  onAppointmentClick?: (appointmentId: string) => void;
};

const statusStyles = {
  free: "border-emerald-500/30 bg-emerald-500/5",
  occupied: "border-blue-500/30 bg-blue-500/5",
  blocked: "border-amber-500/40 bg-amber-500/10",
} as const;

export function DayScheduleList({ items, onBlockSlot, onUnblock, onAppointmentClick }: DayScheduleListProps) {
  if (!items.length) {
    return (
      <p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
        Sem horários neste dia. Ajuste sua agenda ou escolha outra data.
      </p>
    );
  }

  return (
    <ul className="space-y-2">
      {items.map((item, index) => {
        if (item.kind === "break") {
          return (
            <li
              key={`break-${item.start_time}-${index}`}
              className="flex items-center gap-2 rounded-lg border border-dashed px-3 py-2 text-sm text-muted-foreground"
            >
              <Clock className="h-4 w-4 shrink-0" aria-hidden />
              <span>
                {item.start_time} → {item.end_time} · {item.label}
              </span>
            </li>
          );
        }

        const isOccupied = item.status === "occupied" && item.appointmentId;

        return (
          <li
            key={`${item.start_time}-${item.status}-${index}`}
            className={cn(
              "flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2.5",
              statusStyles[item.status],
              isOccupied && onAppointmentClick && "cursor-pointer transition-colors hover:bg-blue-500/10",
            )}
          >
            {isOccupied && onAppointmentClick ? (
              <button
                type="button"
                className="flex min-w-0 flex-1 flex-wrap items-center justify-between gap-2 text-left"
                onClick={() => onAppointmentClick(item.appointmentId!)}
              >
                <div className="min-w-0">
                  <p className="font-medium tabular-nums">
                    {item.start_time} → {item.end_time}
                  </p>
                  <p className="text-sm text-muted-foreground">{item.label}</p>
                </div>
              </button>
            ) : (
              <div className="min-w-0">
                <p className="font-medium tabular-nums">
                  {item.start_time} → {item.end_time}
                </p>
                <p className="text-sm text-muted-foreground">{item.label}</p>
              </div>
            )}

            {item.status === "free" && onBlockSlot ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="shrink-0"
                onClick={() => onBlockSlot(item.start_time, item.end_time)}
              >
                <Ban className="h-3.5 w-3.5" aria-hidden />
                Bloquear
              </Button>
            ) : null}

            {item.status === "blocked" && item.blockId && onUnblock ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="shrink-0 text-destructive"
                onClick={() => onUnblock(item.blockId!)}
              >
                Desbloquear
              </Button>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
