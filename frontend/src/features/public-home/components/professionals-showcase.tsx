"use client";

import Link from "next/link";
import { ArrowRight, Users } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { LoadingSkeleton } from "@/features/professionals/components/loading-skeleton";
import { ProfessionalCard } from "@/features/professionals/components/professional-card";
import { useProfessionalsList } from "@/features/professionals/hooks/use-professionals";

const SHOWCASE_LIMIT = 6;

export function ProfessionalsShowcase() {
  const { data, isLoading, isError } = useProfessionalsList({
    page: 1,
    page_size: SHOWCASE_LIMIT,
  });

  return (
    <section id="profissionais" className="scroll-mt-24 border-b border-border/40 py-14 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mb-8 flex flex-col gap-4 sm:mb-10 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary sm:text-sm">
              Nossa equipe
            </p>
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Profissionais de confiança</h2>
            <p className="max-w-xl text-sm text-muted-foreground sm:text-base">
              Conheça quem vai cuidar do seu visual. Especialidades e serviços em cada perfil.
            </p>
          </div>
          <Button variant="outline" asChild className="w-full shrink-0 sm:w-auto">
            <Link href="/services#profissionais">
              Ver equipe completa
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>

        {isLoading ? <LoadingSkeleton variant="grid" /> : null}

        {!isLoading && isError ? (
          <EmptyState
            icon={Users}
            title="Não foi possível carregar a equipe"
            description="Tente novamente em alguns instantes."
            action={
              <Button variant="outline" onClick={() => window.location.reload()}>
                Recarregar
              </Button>
            }
          />
        ) : null}

        {!isLoading && !isError && !data?.items.length ? (
          <EmptyState
            icon={Users}
            title="Nenhum profissional disponível"
            description="Em breve nossa equipe estará disponível para agendamento."
          />
        ) : null}

        {!isLoading && !isError && data?.items.length ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.items.map((pro) => (
              <ProfessionalCard key={pro.id} professional={pro} variant="public" />
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
