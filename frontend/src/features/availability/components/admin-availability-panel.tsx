"use client";

import { useEffect, useState } from "react";

import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { ProfessionalAvailabilityEditor } from "@/features/availability/components/professional-availability-editor";
import { useProfessionalsList } from "@/features/professionals/hooks/use-professionals";

export function AdminAvailabilityPanel() {
  const { data, isLoading } = useProfessionalsList({ page: 1, page_size: 100, is_active: true });
  const professionals = data?.items ?? [];
  const [selectedId, setSelectedId] = useState<string>("");

  useEffect(() => {
    if (!selectedId && professionals.length > 0) {
      setSelectedId(professionals[0].id);
    }
  }, [professionals, selectedId]);

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-10 w-full max-w-md" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (!professionals.length) {
    return (
      <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
        Cadastre um profissional antes de configurar disponibilidade.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="max-w-md space-y-2">
        <Label htmlFor="availability-professional">Profissional</Label>
        <select
          id="availability-professional"
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
        >
          {professionals.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      {selectedId ? <ProfessionalAvailabilityEditor key={selectedId} professionalId={selectedId} /> : null}
    </div>
  );
}
