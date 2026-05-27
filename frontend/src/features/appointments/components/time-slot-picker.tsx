"use client";

import { Clock } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { AvailableSlot } from "@/features/appointments/types/appointment.types";
import { cn } from "@/lib/utils";

type TimeSlotPickerProps = {
  slots: AvailableSlot[];
  value?: string;
  isLoading?: boolean;
  onChange: (time: string) => void;
};

export function TimeSlotPicker({ slots, value, isLoading, onChange }: TimeSlotPickerProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="h-11 animate-pulse rounded-md bg-muted" />
        ))}
      </div>
    );
  }

  if (!slots.length) {
    return (
      <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
        Nenhum horário disponível para esta data.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
      {slots.map((slot) => {
        const selected = value === slot.start_time;
        return (
          <Button
            key={slot.start_time}
            type="button"
            variant={selected ? "default" : "outline"}
            className={cn("h-11 text-sm", selected && "shadow")}
            onClick={() => onChange(slot.start_time)}
          >
            <Clock className="h-3.5 w-3.5" />
            {slot.start_time}
          </Button>
        );
      })}
    </div>
  );
}
