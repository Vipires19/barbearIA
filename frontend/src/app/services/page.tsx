import Link from "next/link";

import { Button } from "@/components/ui/button";
import { ProfessionalsPublicSection } from "@/features/professionals/components/professionals-public-section";
import { ServicesPublicGrid } from "@/features/services/components/services-public-grid";

export const metadata = {
  title: "Serviços | Barbearia",
  description: "Conheça nossos serviços e agende online",
};

export default function PublicServicesPage() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-background">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4">
          <Link href="/services" className="truncate text-lg font-semibold tracking-tight sm:text-xl">
            Barbearia<span className="text-primary">.</span>
          </Link>
          <nav className="flex shrink-0 items-center gap-1.5 sm:gap-3">
            <Button variant="ghost" size="sm" asChild className="hidden sm:inline-flex">
              <Link href="/services">Serviços</Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/login">Admin</Link>
            </Button>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
        <section className="mb-8 space-y-3 sm:mb-12">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary sm:text-sm">
            Nossos serviços
          </p>
          <h1 className="text-2xl font-bold tracking-tight sm:text-4xl">
            Escolha o serviço ideal para você
          </h1>
          <p className="max-w-lg text-sm text-muted-foreground sm:text-base">
            Cortes, barba e tratamentos com profissionais experientes. Preço transparente e
            agendamento rápido.
          </p>
        </section>
        <ServicesPublicGrid />
        <div className="mt-16 border-t border-border/60 pt-12">
          <ProfessionalsPublicSection />
        </div>
      </main>
    </div>
  );
}
