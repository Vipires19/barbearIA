"use client";

import { Loader2 } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DEFAULT_QUICK_SETUP,
  quickSetupToPayload,
  type QuickAgendaSetup,
} from "@/features/agenda/utils/quick-setup";

const DAY_LABELS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

type OpenAgendaModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (payload: ReturnType<typeof quickSetupToPayload>) => void;
  isSaving?: boolean;
};

export function OpenAgendaModal({ open, onOpenChange, onSave, isSaving }: OpenAgendaModalProps) {
  const [setup, setSetup] = useState<QuickAgendaSetup>(DEFAULT_QUICK_SETUP);

  const toggleDay = (weekday: number) => {
    setSetup((prev) => {
      const active = prev.activeWeekdays.includes(weekday);
      return {
        ...prev,
        activeWeekdays: active
          ? prev.activeWeekdays.filter((d) => d !== weekday)
          : [...prev.activeWeekdays, weekday].sort(),
      };
    });
  };

  const handleSave = () => {
    if (setup.activeWeekdays.length === 0) return;
    onSave(quickSetupToPayload(setup));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Abrir agenda</DialogTitle>
          <DialogDescription>
            Escolha os dias e o horário padrão. Você pode ajustar detalhes depois.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div>
            <Label className="mb-2 block">Dias ativos</Label>
            <div className="flex flex-wrap gap-2">
              {DAY_LABELS.map((label, weekday) => {
                const active = setup.activeWeekdays.includes(weekday);
                return (
                  <button
                    key={weekday}
                    type="button"
                    onClick={() => toggleDay(weekday)}
                    className={
                      active
                        ? "rounded-full border border-primary bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground"
                        : "rounded-full border border-input px-3 py-1.5 text-sm text-muted-foreground"
                    }
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="open-start">Início</Label>
              <Input
                id="open-start"
                type="time"
                value={setup.startTime}
                onChange={(e) => setSetup((s) => ({ ...s, startTime: e.target.value.slice(0, 5) }))}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="open-end">Fim</Label>
              <Input
                id="open-end"
                type="time"
                value={setup.endTime}
                onChange={(e) => setSetup((s) => ({ ...s, endTime: e.target.value.slice(0, 5) }))}
              />
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={setup.breakEnabled}
              onChange={(e) => setSetup((s) => ({ ...s, breakEnabled: e.target.checked }))}
              className="h-4 w-4 accent-primary"
            />
            Pausa no meio do dia (ex.: almoço)
          </label>

          {setup.breakEnabled ? (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="break-start">Pausa início</Label>
                <Input
                  id="break-start"
                  type="time"
                  value={setup.breakStart}
                  onChange={(e) => setSetup((s) => ({ ...s, breakStart: e.target.value.slice(0, 5) }))}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="break-end">Pausa fim</Label>
                <Input
                  id="break-end"
                  type="time"
                  value={setup.breakEnd}
                  onChange={(e) => setSetup((s) => ({ ...s, breakEnd: e.target.value.slice(0, 5) }))}
                />
              </div>
            </div>
          ) : null}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button type="button" onClick={handleSave} disabled={isSaving || setup.activeWeekdays.length === 0}>
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                Salvando...
              </>
            ) : (
              "Salvar agenda"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
