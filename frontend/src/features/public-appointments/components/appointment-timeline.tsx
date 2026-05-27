"use client";

import { PublicAppointmentCard } from "@/features/public-appointments/components/public-appointment-card";
import type { PublicAppointment } from "@/features/public-appointments/types/public-appointment.types";

type AppointmentTimelineProps = {
  upcoming: PublicAppointment[];
  past: PublicAppointment[];
  phone: string;
};

export function AppointmentTimeline({ upcoming, past, phone }: AppointmentTimelineProps) {
  return (
    <div className="space-y-10">
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-primary" aria-hidden />
          <h2 className="text-lg font-semibold tracking-tight">Próximos</h2>
        </div>
        {upcoming.length ? (
          <div className="space-y-3">
            {upcoming.map((a) => (
              <PublicAppointmentCard key={a.id} appointment={a} phone={phone} />
            ))}
          </div>
        ) : (
          <p className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">Nenhum horário futuro.</p>
        )}
      </section>
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-muted-foreground/50" aria-hidden />
          <h2 className="text-lg font-semibold tracking-tight">Histórico</h2>
        </div>
        {past.length ? (
          <div className="space-y-3 opacity-90">
            {past.map((a) => (
              <PublicAppointmentCard key={a.id} appointment={a} phone={phone} />
            ))}
          </div>
        ) : (
          <p className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">Sem histórico para este telefone.</p>
        )}
      </section>
    </div>
  );
}
