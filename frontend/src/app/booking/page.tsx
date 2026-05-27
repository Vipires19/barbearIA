import Link from "next/link";

import { Button } from "@/components/ui/button";
import { AppointmentForm } from "@/features/appointments/components/appointment-form";

export const metadata = {
  title: "Agendar | Barbearia",
  description: "Agende seu horário online",
};

export default function BookingPage() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-background">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link href="/services" className="text-lg font-semibold tracking-tight">
            Barbearia<span className="text-primary">.</span>
          </Link>
          <Button asChild variant="outline" size="sm">
            <Link href="/services">Serviços</Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
        <section className="mb-8 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">
            Agendamento online
          </p>
          <h1 className="text-2xl font-bold tracking-tight sm:text-4xl">
            Reserve seu horário em poucos cliques
          </h1>
          <p className="max-w-xl text-sm text-muted-foreground sm:text-base">
            Escolha serviço, profissional, data e horário. Simples, rápido e otimizado para celular.
          </p>
        </section>
        <AppointmentForm />
      </main>
    </div>
  );
}
