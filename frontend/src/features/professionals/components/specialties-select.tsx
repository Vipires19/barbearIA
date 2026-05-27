"use client";

import { Plus, X } from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const SUGGESTIONS = ["Corte", "Barba", "Degradê", "Sobrancelha", "Pigmentação", "Hidratação"];

type SpecialtiesSelectProps = {
  value: string[];
  onChange: (value: string[]) => void;
  disabled?: boolean;
};

export function SpecialtiesSelect({ value, onChange, disabled }: SpecialtiesSelectProps) {
  const [input, setInput] = useState("");

  const add = (item: string) => {
    const trimmed = item.trim();
    if (!trimmed || value.includes(trimmed) || value.length >= 20) return;
    onChange([...value, trimmed]);
    setInput("");
  };

  const remove = (item: string) => onChange(value.filter((s) => s !== item));

  return (
    <div className="space-y-3">
      <Label>Especialidades</Label>
      <div className="flex flex-wrap gap-2">
        {value.map((s) => (
          <Badge key={s} variant="secondary" className="gap-1 pr-1">
            {s}
            {!disabled ? (
              <button type="button" onClick={() => remove(s)} className="rounded-full p-0.5 hover:bg-muted">
                <X className="h-3 w-3" />
              </button>
            ) : null}
          </Badge>
        ))}
      </div>
      <div className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Nova especialidade..."
          disabled={disabled}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add(input);
            }
          }}
        />
        <Button type="button" variant="outline" size="icon" disabled={disabled} onClick={() => add(input)}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {SUGGESTIONS.filter((s) => !value.includes(s)).map((s) => (
          <button
            key={s}
            type="button"
            disabled={disabled}
            onClick={() => add(s)}
            className="rounded-full border border-border px-2.5 py-0.5 text-xs text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
          >
            + {s}
          </button>
        ))}
      </div>
    </div>
  );
}
