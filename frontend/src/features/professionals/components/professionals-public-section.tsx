"use client";

import { Users } from "lucide-react";
import { useState } from "react";

import { EmptyState } from "@/components/shared/empty-state";
import { LoadingSkeleton } from "@/features/professionals/components/loading-skeleton";
import { ProfessionalCard } from "@/features/professionals/components/professional-card";
import { useProfessionalsList } from "@/features/professionals/hooks/use-professionals";

type ProfessionalsPublicSectionProps = {
  serviceId?: string;
  title?: string;
};

export function ProfessionalsPublicSection({
  serviceId,
  title = "Nossa equipe",
}: ProfessionalsPublicSectionProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data, isLoading } = useProfessionalsList({
    page: 1,
    page_size: 50,
    service_id: serviceId,
  });

  if (isLoading) {
    return <LoadingSkeleton variant="grid" />;
  }

  if (!data?.items.length) {
    return (
      <EmptyState
        icon={Users}
        title="Nenhum profissional disponível"
        description="Em breve nossa equipe estará disponível para agendamento."
      />
    );
  }

  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary sm:text-sm">
          Profissionais
        </p>
        <h2 className="text-xl font-bold tracking-tight sm:text-2xl">{title}</h2>
        <p className="text-sm text-muted-foreground">
          Escolha quem vai atender você. Fluxo: serviço → profissional → data → horário.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {data.items.map((pro) => (
          <ProfessionalCard
            key={pro.id}
            professional={pro}
            variant="public"
            serviceId={serviceId}
            selected={selectedId === pro.id}
            onSelect={() => setSelectedId(selectedId === pro.id ? null : pro.id)}
          />
        ))}
      </div>
    </section>
  );
}
