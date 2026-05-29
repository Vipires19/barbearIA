"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Copy, Loader2, Plus, Trash2 } from "lucide-react";
import { useEffect } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  availabilityFormSchema,
  type AvailabilityFormValues,
} from "@/features/availability/schemas/availability.schema";
import {
  apiToFormValues,
  createDefaultFormValues,
  formToApiPayload,
  WEEKDAY_FULL_LABELS,
} from "@/features/availability/utils/defaults";
import type {
  WeekdayAvailability,
  WeekdayAvailabilityPayload,
} from "@/features/availability/types/availability.types";
import { cn } from "@/lib/utils";

type AvailabilitySettingsProps = {
  data?: WeekdayAvailability[];
  isLoading?: boolean;
  isSaving?: boolean;
  onSave: (payload: WeekdayAvailabilityPayload) => void;
};

export function AvailabilitySettings({ data, isLoading, isSaving, onSave }: AvailabilitySettingsProps) {
  const form = useForm<AvailabilityFormValues>({
    resolver: zodResolver(availabilityFormSchema),
    defaultValues: createDefaultFormValues(),
  });

  const { fields } = useFieldArray({ control: form.control, name: "days" });

  useEffect(() => {
    if (data) {
      form.reset(apiToFormValues(data));
    }
  }, [data, form]);

  const handleSubmit = form.handleSubmit(
    (values) => onSave(formToApiPayload(values)),
    () => toast.error("Revise os horários antes de salvar"),
  );

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
        <p className="text-sm font-medium text-foreground">Horários de atendimento</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Marque os dias disponíveis e adicione blocos (ex.: manhã e tarde). Depois salve para liberar o
          booking.
        </p>
      </div>

      {fields.map((field, dayIndex) => (
        <DayAvailabilityCard
          key={field.id}
          dayIndex={dayIndex}
          label={WEEKDAY_FULL_LABELS[dayIndex]}
          form={form}
          onCopyToAll={() => {
            const source = form.getValues(`days.${dayIndex}`);
            const days = form.getValues("days").map((day) => ({
              ...day,
              active: source.active,
              blocks: source.blocks.map((b) => ({ ...b })),
            }));
            form.setValue("days", days, { shouldDirty: true });
          }}
          onCopyFromPrevious={
            dayIndex > 0
              ? () => {
                  const source = form.getValues(`days.${dayIndex - 1}`);
                  form.setValue(`days.${dayIndex}.active`, source.active, { shouldDirty: true });
                  form.setValue(
                    `days.${dayIndex}.blocks`,
                    source.blocks.map((b) => ({ ...b })),
                    { shouldDirty: true },
                  );
                }
              : undefined
          }
        />
      ))}

      <div className="sticky bottom-0 z-10 -mx-1 border-t border-border bg-background/95 px-1 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <Button type="submit" className="w-full" disabled={isSaving}>
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              Salvando...
            </>
          ) : (
            "Salvar disponibilidade"
          )}
        </Button>
      </div>
    </form>
  );
}

type DayAvailabilityCardProps = {
  dayIndex: number;
  label: string;
  form: ReturnType<typeof useForm<AvailabilityFormValues>>;
  onCopyToAll: () => void;
  onCopyFromPrevious?: () => void;
};

function DayAvailabilityCard({
  dayIndex,
  label,
  form,
  onCopyToAll,
  onCopyFromPrevious,
}: DayAvailabilityCardProps) {
  const active = form.watch(`days.${dayIndex}.active`);
  const blocksArray = useFieldArray({
    control: form.control,
    name: `days.${dayIndex}.blocks`,
  });

  const toggleActive = () => {
    const next = !active;
    form.setValue(`days.${dayIndex}.active`, next, { shouldDirty: true });
    if (next && blocksArray.fields.length === 0) {
      blocksArray.append({ start_time: "09:00", end_time: "18:00" });
    }
  };

  return (
    <Card className={cn("p-4 transition-opacity", !active && "opacity-70")}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label className="flex cursor-pointer items-center gap-3">
          <input
            type="checkbox"
            checked={active}
            onChange={toggleActive}
            className="h-5 w-5 rounded border-input accent-primary"
          />
          <span className="font-medium">{label}</span>
          <span className="text-sm text-muted-foreground">{active ? "Disponível" : "Fechado"}</span>
        </label>
        <div className="flex flex-wrap gap-1">
          {onCopyFromPrevious ? (
            <Button type="button" variant="ghost" size="sm" onClick={onCopyFromPrevious}>
              <Copy className="h-3.5 w-3.5" aria-hidden />
              Copiar anterior
            </Button>
          ) : null}
          <Button type="button" variant="ghost" size="sm" onClick={onCopyToAll}>
            Aplicar a todos
          </Button>
        </div>
      </div>

      {active ? (
        <div className="mt-4 space-y-3">
          {blocksArray.fields.map((block, blockIndex) => (
            <div key={block.id} className="flex flex-wrap items-end gap-2 sm:flex-nowrap">
              <div className="min-w-0 flex-1 space-y-1">
                <Label className="text-xs text-muted-foreground">Início</Label>
                <Input
                  type="time"
                  {...form.register(`days.${dayIndex}.blocks.${blockIndex}.start_time`)}
                  className="w-full"
                />
              </div>
              <span className="hidden pb-2 text-muted-foreground sm:inline" aria-hidden>
                →
              </span>
              <div className="min-w-0 flex-1 space-y-1">
                <Label className="text-xs text-muted-foreground">Fim</Label>
                <Input
                  type="time"
                  {...form.register(`days.${dayIndex}.blocks.${blockIndex}.end_time`)}
                  className="w-full"
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="shrink-0"
                onClick={() => blocksArray.remove(blockIndex)}
                disabled={blocksArray.fields.length <= 1}
                aria-label="Remover bloco"
              >
                <Trash2 className="h-4 w-4" aria-hidden />
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full sm:w-auto"
            onClick={() => blocksArray.append({ start_time: "14:00", end_time: "18:00" })}
          >
            <Plus className="h-4 w-4" aria-hidden />
            Adicionar bloco
          </Button>
          {form.formState.errors.days?.[dayIndex]?.blocks?.message ? (
            <p className="text-sm text-destructive">
              {String(form.formState.errors.days[dayIndex]?.blocks?.message)}
            </p>
          ) : null}
        </div>
      ) : (
        <p className="mt-2 text-sm text-muted-foreground">Dia desativado — sem atendimentos.</p>
      )}
    </Card>
  );
}
