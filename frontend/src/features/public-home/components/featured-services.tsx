"use client";

import Link from "next/link";
import { ArrowRight, Scissors } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { ServiceCard } from "@/features/services/components/service-card";
import { LoadingSkeleton } from "@/features/services/components/loading-skeleton";
import { useServicesList } from "@/features/services/hooks/use-services";

const FEATURED_LIMIT = 6;

export function FeaturedServices() {
  const { data, isLoading, isError } = useServicesList({ page: 1, page_size: FEATURED_LIMIT });

  return (
    <section id="servicos" className="scroll-mt-24 border-b border-border/40 py-14 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mb-8 flex flex-col gap-4 sm:mb-10 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary sm:text-sm">
              Serviços em destaque
            </p>
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Escolha seu serviço</h2>
            <p className="max-w-xl text-sm text-muted-foreground sm:text-base">
              Preços transparentes e duração estimada. Toque em agendar e finalize em poucos passos.
            </p>
          </div>
          <Button variant="outline" asChild className="w-full shrink-0 sm:w-auto">
            <Link href="/services">
              Ver todos
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>

        {isLoading ? <LoadingSkeleton variant="grid" /> : null}

        {!isLoading && isError ? (
          <EmptyState
            icon={Scissors}
            title="Não foi possível carregar os serviços"
            description="Verifique sua conexão e tente novamente em instantes."
            action={
              <Button variant="outline" onClick={() => window.location.reload()}>
                Recarregar
              </Button>
            }
          />
        ) : null}

        {!isLoading && !isError && !data?.items.length ? (
          <EmptyState
            icon={Scissors}
            title="Nenhum serviço disponível"
            description="Em breve novos serviços serão adicionados."
          />
        ) : null}

        {!isLoading && !isError && data?.items.length ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.items.map((service) => (
              <ServiceCard key={service.id} service={service} variant="public" />
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
