"use client";

import { CheckCircle2, CalendarDays, Clock, Scissors, User } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { ElementType } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { PublicAppointment } from "@/features/public-appointments/types/public-appointment.types";
import { getPublicServiceLabel } from "@/features/public-appointments/types/public-appointment.types";
import {
  formatAppointmentDateLong,
  formatTimeRange,
} from "@/features/appointments/utils/format";

export function BookingConfirmation() {
  const [appointment, setAppointment] = useState<PublicAppointment | null>(null);

  useEffect(() => {
    const raw =
      sessionStorage.getItem("lastPublicAppointment") ??
      sessionStorage.getItem("lastAppointment");
    if (raw) setAppointment(JSON.parse(raw) as PublicAppointment);
  }, []);

  return (
    <div className="mx-auto flex min-h-screen max-w-xl flex-col justify-center px-4 py-10">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
          <CheckCircle2 className="h-9 w-9" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Agendamento confirmado</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Recebemos sua solicitação. A barbearia pode confirmar detalhes pelo telefone informado.
        </p>
      </div>

      {appointment ? (
        <Card className="border-primary/30 bg-card/90">
          <CardContent className="space-y-4 p-5">
            <p className="text-lg font-semibold">{appointment.client_display_name}</p>
            <Info icon={Scissors} label={getPublicServiceLabel(appointment)} />
            <Info icon={User} label={appointment.professional.name} />
            <Info icon={CalendarDays} label={formatAppointmentDateLong(appointment.appointment_date)} />
            <Info
              icon={Clock}
              label={formatTimeRange(appointment.start_time, appointment.end_time)}
            />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-5 text-center text-sm text-muted-foreground">
            Seu agendamento foi criado. Guarde o horário escolhido.
          </CardContent>
        </Card>
      )}

      <div className="mt-6 flex flex-col gap-3">
        <Button asChild size="lg">
          <Link href="/my-appointments">Consultar meus agendamentos</Link>
        </Button>
        <div className="grid gap-3 sm:grid-cols-2">
          <Button asChild size="lg" variant="outline">
            <Link href="/services">Ver serviços</Link>
          </Button>
          <Button asChild size="lg" variant="secondary">
            <Link href="/booking">Novo agendamento</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

function Info({ icon: Icon, label }: { icon: ElementType; label: string }) {
  return (
    <div className="flex items-center gap-3 text-sm text-muted-foreground">
      <Icon className="h-4 w-4 text-primary" />
      <span>{label}</span>
    </div>
  );
}
