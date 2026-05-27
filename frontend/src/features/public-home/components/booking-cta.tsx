import Link from "next/link";
import { Calendar } from "lucide-react";

import { publicBranding } from "@/config/public-branding";
import { Button } from "@/components/ui/button";

export function BookingCta() {
  return (
    <section className="py-14 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="relative overflow-hidden rounded-3xl border border-primary/30 bg-gradient-to-br from-primary/20 via-primary/10 to-transparent px-6 py-12 text-center sm:px-12 sm:py-16">
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,hsl(var(--primary)/0.25),transparent_50%)]"
            aria-hidden
          />
          <div className="relative z-10 mx-auto max-w-2xl space-y-6">
            <h2 className="text-2xl font-bold tracking-tight sm:text-4xl">
              Pronto para o seu próximo visual?
            </h2>
            <p className="text-sm text-muted-foreground sm:text-lg">
              Reserve seu horário na {publicBranding.companyName} agora — leva menos de 2 minutos.
            </p>
            <Button size="lg" asChild className="h-14 gap-2 px-8 text-base shadow-lg shadow-primary/25">
              <Link href="/booking">
                <Calendar className="h-5 w-5" />
                Agendar horário
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
