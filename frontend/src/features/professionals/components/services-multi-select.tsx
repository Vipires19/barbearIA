"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { useServicesList } from "@/features/services/hooks/use-services";
import { cn } from "@/lib/utils";

type ServicesMultiSelectProps = {
  value: string[];
  onChange: (ids: string[]) => void;
  disabled?: boolean;
};

export function ServicesMultiSelect({ value, onChange, disabled }: ServicesMultiSelectProps) {
  const { data, isLoading } = useServicesList({ page: 1, page_size: 100, is_active: true });

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    );
  }

  const services = data?.items ?? [];

  const toggle = (id: string) => {
    if (disabled) return;
    if (value.includes(id)) {
      onChange(value.filter((v) => v !== id));
    } else {
      onChange([...value, id]);
    }
  };

  if (!services.length) {
    return <p className="text-sm text-muted-foreground">Cadastre serviços antes de vincular.</p>;
  }

  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {services.map((s) => {
        const selected = value.includes(s.id);
        return (
          <button
            key={s.id}
            type="button"
            disabled={disabled}
            onClick={() => toggle(s.id)}
            className={cn(
              "rounded-lg border px-3 py-2.5 text-left text-sm transition-colors",
              selected
                ? "border-primary bg-primary/10 text-foreground"
                : "border-border hover:border-primary/40",
              disabled && "opacity-50",
            )}
          >
            <span className="font-medium">{s.name}</span>
          </button>
        );
      })}
    </div>
  );
}
