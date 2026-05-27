"use client";

import { ArrowLeft, CalendarCheck, Clock, Sparkles } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ProfessionalCard } from "@/features/professionals/components/professional-card";
import { useProfessionalsList } from "@/features/professionals/hooks/use-professionals";
import { useService } from "@/features/services/hooks/use-services";
import { formatDuration, formatPrice } from "@/features/services/utils/format";

export function ServiceBookingDetail({ serviceId }: { serviceId: string }) {
  const serviceQuery = useService(serviceId);
  const professionalsQuery = useProfessionalsList({ page: 1, page_size: 50, service_id: serviceId });
  const service = serviceQuery.data;

  if (serviceQuery.isLoading) {
    return <div className="h-80 animate-pulse rounded-2xl bg-muted" />;
  }

  if (!service) {
    return (
      <div className="rounded-2xl border p-8 text-center">
        <p className="font-semibold">Serviço não encontrado</p>
        <Button asChild className="mt-4" variant="outline">
          <Link href="/services">Voltar</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <Button asChild variant="ghost" className="px-0">
        <Link href="/services">
          <ArrowLeft className="h-4 w-4" />
          Serviços
        </Link>
      </Button>

      <Card className="overflow-hidden border-border/60 bg-card/90">
        <CardContent className="grid gap-6 p-5 sm:p-8 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">
              Agendamento online
            </p>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{service.name}</h1>
            {service.description ? (
              <p className="max-w-2xl text-muted-foreground">{service.description}</p>
            ) : null}
            <div className="flex flex-wrap gap-3 text-sm">
              <span className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1">
                <Clock className="h-4 w-4" />
                {formatDuration(service.duration_minutes)}
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 font-semibold text-primary">
                {formatPrice(service.price)}
              </span>
            </div>
          </div>
          <div className="flex flex-col justify-end gap-3 rounded-2xl bg-muted/40 p-4">
            <p className="text-sm text-muted-foreground">
              Escolha este serviço e veja horários disponíveis em poucos segundos.
            </p>
            <Button asChild size="lg" className="h-12 w-full">
              <Link href={`/booking?service=${service.id}`}>
                <Sparkles className="h-4 w-4" />
                Agendar agora
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <CalendarCheck className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold">Profissionais disponíveis</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {professionalsQuery.data?.items.map((professional) => (
            <ProfessionalCard key={professional.id} professional={professional} serviceId={service.id} />
          ))}
        </div>
      </section>
    </div>
  );
}
