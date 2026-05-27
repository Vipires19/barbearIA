import Link from "next/link";
import { Clock, Facebook, Instagram, MapPin, Phone } from "lucide-react";

import { publicBranding } from "@/config/public-branding";
import { BrandLogo } from "@/features/public-home/components/public-branding-shell";

export function PublicFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border/60 bg-card/30">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-3 lg:col-span-2">
          <BrandLogo />
          <p className="max-w-sm text-sm text-muted-foreground">{publicBranding.slogan}</p>
          <div className="flex gap-3 pt-2">
            <a
              href={publicBranding.social.instagram}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-border/60 text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
              aria-label="Instagram"
            >
              <Instagram className="h-4 w-4" />
            </a>
            <a
              href={publicBranding.social.facebook}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-border/60 text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
              aria-label="Facebook"
            >
              <Facebook className="h-4 w-4" />
            </a>
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-semibold">Contato</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <Phone className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              {publicBranding.phone}
            </li>
            <li className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              {publicBranding.address}
            </li>
            <li className="flex items-start gap-2">
              <Clock className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              {publicBranding.hours}
            </li>
          </ul>
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-semibold">Links rápidos</h3>
          <ul className="space-y-2 text-sm">
            <li>
              <Link href="/booking" className="text-muted-foreground hover:text-primary">
                Agendar
              </Link>
            </li>
            <li>
              <Link href="/my-appointments" className="text-muted-foreground hover:text-primary">
                Meus agendamentos
              </Link>
            </li>
            <li>
              <Link href="/services" className="text-muted-foreground hover:text-primary">
                Serviços
              </Link>
            </li>
            <li>
              <Link href="/login" className="text-muted-foreground hover:text-primary">
                Login equipe
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-border/40 py-4 text-center text-xs text-muted-foreground">
        © {year} {publicBranding.companyName}. Todos os direitos reservados.
      </div>
    </footer>
  );
}
