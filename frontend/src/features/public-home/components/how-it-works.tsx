import { Calendar, CheckCircle2, Scissors, User } from "lucide-react";

const STEPS = [
  {
    step: 1,
    icon: Scissors,
    title: "Escolha o serviço",
    description: "Corte, barba ou combo — veja preço e duração antes de confirmar.",
  },
  {
    step: 2,
    icon: User,
    title: "Escolha o profissional",
    description: "Selecione quem você prefere ou deixe a barbearia indicar o melhor horário.",
  },
  {
    step: 3,
    icon: Calendar,
    title: "Escolha data e horário",
    description: "Horários disponíveis em tempo real, sem ligação e sem espera.",
  },
  {
    step: 4,
    icon: CheckCircle2,
    title: "Confirme o agendamento",
    description: "Informe nome e telefone. Consulte ou altere depois em Meus agendamentos.",
  },
] as const;

export function HowItWorks() {
  return (
    <section className="border-b border-border/40 bg-muted/20 py-14 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mb-10 space-y-2 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary sm:text-sm">
            Como funciona
          </p>
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Agende em 4 passos</h2>
          <p className="mx-auto max-w-lg text-sm text-muted-foreground sm:text-base">
            Fluxo pensado para mobile: rápido, claro e sem criar conta.
          </p>
        </div>

        <ol className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map(({ step, icon: Icon, title, description }) => (
            <li
              key={step}
              className="relative flex flex-col rounded-2xl border border-border/50 bg-card/60 p-5 transition-shadow hover:shadow-md hover:shadow-primary/5"
            >
              <span className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-sm font-bold text-primary">
                {step}
              </span>
              <Icon className="mb-3 h-6 w-6 text-primary" aria-hidden />
              <h3 className="font-semibold">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
