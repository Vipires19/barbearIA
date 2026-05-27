import Link from "next/link";
import { ArrowRight, CalendarCheck, Sparkles } from "lucide-react";

import { publicBranding } from "@/config/public-branding";
import { Button } from "@/components/ui/button";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden border-b border-border/40">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,hsl(var(--primary)/0.18),transparent)]"
        aria-hidden
      />
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-2 lg:items-center lg:gap-12 lg:py-20">
        <div className="relative z-10 space-y-6">
          <p className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary sm:text-sm">
            <Sparkles className="h-3.5 w-3.5" />
            Agendamento online 24h
          </p>
          <h1 className="text-3xl font-bold leading-[1.1] tracking-tight sm:text-4xl lg:text-5xl">
            {publicBranding.slogan}
          </h1>
          <p className="max-w-lg text-base text-muted-foreground sm:text-lg">{publicBranding.tagline}</p>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button size="lg" asChild className="h-12 gap-2 text-base shadow-lg shadow-primary/20">
              <Link href="/booking">
                Agendar agora
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="h-12 text-base">
              <Link href="/my-appointments">Meus agendamentos</Link>
            </Button>
          </div>
          <p className="flex items-center gap-2 text-xs text-muted-foreground sm:text-sm">
            <CalendarCheck className="h-4 w-4 text-primary" />
            Confirmação imediata · Lembretes por telefone
          </p>
        </div>

        <HeroMockVisual />
      </div>
    </section>
  );
}

function HeroMockVisual() {
  return (
    <div className="relative mx-auto w-full max-w-md lg:max-w-none" aria-hidden>
      <div className="absolute -inset-4 rounded-3xl bg-primary/10 blur-2xl" />
      <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-card/80 shadow-2xl shadow-black/20 backdrop-blur-sm">
        <div className="border-b border-border/60 bg-muted/30 px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="h-2.5 w-2.5 rounded-full bg-primary/80" />
            <div className="h-2.5 w-2.5 rounded-full bg-muted-foreground/30" />
            <div className="h-2.5 w-2.5 rounded-full bg-muted-foreground/30" />
            <span className="ml-2 text-xs text-muted-foreground">Próximo horário</span>
          </div>
        </div>
        <div className="space-y-4 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Hoje</p>
              <p className="text-lg font-semibold">Corte + Barba</p>
            </div>
            <span className="rounded-full bg-primary/15 px-3 py-1 text-xs font-medium text-primary">
              14:30
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {["09:00", "10:30", "14:30", "15:00", "16:30", "18:00"].map((slot, i) => (
              <div
                key={slot}
                className={`rounded-lg border px-2 py-2 text-center text-xs font-medium transition-colors ${
                  i === 2
                    ? "border-primary bg-primary/15 text-primary"
                    : "border-border/60 bg-muted/20 text-muted-foreground"
                }`}
              >
                {slot}
              </div>
            ))}
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-border/50 bg-background/50 p-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20 text-sm font-bold text-primary">
              JP
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">João Profissional</p>
              <p className="text-xs text-muted-foreground">Especialista em fade</p>
            </div>
            <span className="text-xs font-medium text-primary">Confirmado</span>
          </div>
        </div>
      </div>
    </div>
  );
}
