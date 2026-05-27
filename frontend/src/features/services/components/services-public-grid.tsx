"use client";

import { Scissors } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { ServiceCard } from "@/features/services/components/service-card";
import { LoadingSkeleton } from "@/features/services/components/loading-skeleton";
import { useServicesList } from "@/features/services/hooks/use-services";

export function ServicesPublicGrid() {
  const { data, isLoading } = useServicesList({ page: 1, page_size: 50 });

  if (isLoading) {
    return <LoadingSkeleton variant="grid" />;
  }

  if (!data?.items.length) {
    return (
      <EmptyState
        icon={Scissors}
        title="Nenhum serviço disponível"
        description="Em breve novos serviços serão adicionados."
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 lg:gap-6">
      {data.items.map((service) => (
        <ServiceCard key={service.id} service={service} variant="public" />
      ))}
    </div>
  );
}
