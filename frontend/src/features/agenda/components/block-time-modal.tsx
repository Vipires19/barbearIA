"use client";

import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

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

type BlockTimeModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  date: string;
  defaultStart?: string;
  defaultEnd?: string;
  onSave: (payload: { block_date: string; start_time: string; end_time: string; reason?: string }) => void;
  isSaving?: boolean;
};

export function BlockTimeModal({
  open,
  onOpenChange,
  date,
  defaultStart = "14:00",
  defaultEnd = "15:00",
  onSave,
  isSaving,
}: BlockTimeModalProps) {
  const [startTime, setStartTime] = useState(defaultStart);
  const [endTime, setEndTime] = useState(defaultEnd);
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (open) {
      setStartTime(defaultStart);
      setEndTime(defaultEnd);
      setReason("");
    }
  }, [open, defaultStart, defaultEnd]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Bloquear horário</DialogTitle>
          <DialogDescription>
            Este intervalo não aparecerá no booking ({date}).
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="block-start">Início</Label>
              <Input
                id="block-start"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value.slice(0, 5))}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="block-end">Fim</Label>
              <Input
                id="block-end"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value.slice(0, 5))}
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="block-reason">Motivo (opcional)</Label>
            <Input
              id="block-reason"
              placeholder="Almoço, imprevisto..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            type="button"
            disabled={isSaving || startTime >= endTime}
            onClick={() =>
              onSave({
                block_date: date,
                start_time: startTime,
                end_time: endTime,
                reason: reason.trim() || undefined,
              })
            }
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                Salvando...
              </>
            ) : (
              "Bloquear"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
