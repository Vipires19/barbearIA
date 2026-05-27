import { MessageCircle } from "lucide-react";

import { getWhatsAppUrl, publicBranding } from "@/config/public-branding";
import { Button } from "@/components/ui/button";

export function WhatsAppCta() {
  const waUrl = getWhatsAppUrl(
    publicBranding.whatsapp,
    `Olá! Gostaria de agendar um horário na ${publicBranding.companyName}.`,
  );

  return (
    <section className="border-b border-border/40 py-14 sm:py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex flex-col items-center gap-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 px-6 py-10 text-center sm:px-10">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/15">
            <MessageCircle className="h-7 w-7 text-emerald-400" aria-hidden />
          </div>
          <div className="max-w-lg space-y-2">
            <h2 className="text-xl font-bold tracking-tight sm:text-2xl">
              Prefere agendar pelo WhatsApp?
            </h2>
            <p className="text-sm text-muted-foreground sm:text-base">
              Fale com nossa equipe diretamente. Integração automática com WAHA em breve — por
              enquanto, use o link abaixo.
            </p>
          </div>
          <Button
            size="lg"
            className="h-12 gap-2 bg-emerald-600 text-white hover:bg-emerald-500"
            asChild
          >
            <a href={waUrl} target="_blank" rel="noopener noreferrer">
              <MessageCircle className="h-5 w-5" />
              Chamar no WhatsApp
            </a>
          </Button>
          <p className="text-xs text-muted-foreground">
            Placeholder · número configurável em branding
          </p>
        </div>
      </div>
    </section>
  );
}
