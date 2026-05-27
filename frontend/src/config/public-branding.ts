import type { CSSProperties } from "react";

/**
 * Configuração white-label da experiência pública.
 * Futuro: carregar por tenant/domínio ou API de branding.
 */
export type PublicBranding = {
  companyName: string;
  slogan: string;
  tagline: string;
  /** Valores HSL sem wrapper `hsl()` — ex: "142 76% 45%" */
  primaryColor: string;
  logoUrl: string | null;
  whatsapp: string;
  phone: string;
  address: string;
  hours: string;
  social: {
    instagram: string;
    facebook: string;
  };
};

export const publicBranding: PublicBranding = {
  companyName: "Barbearia Premium",
  slogan: "Estilo e confiança em cada visita",
  tagline: "Agende online em menos de 2 minutos — sem fila, sem complicação.",
  primaryColor: "142 76% 45%",
  logoUrl: null,
  whatsapp: "5511999999999",
  phone: "(11) 99999-9999",
  address: "Av. Paulista, 1000 — Bela Vista, São Paulo - SP",
  hours: "Segunda a sábado · 9h às 20h",
  social: {
    instagram: "#",
    facebook: "#",
  },
};

export function getWhatsAppUrl(phone: string, message?: string): string {
  const digits = phone.replace(/\D/g, "");
  const text = message ? `?text=${encodeURIComponent(message)}` : "";
  return `https://wa.me/${digits}${text}`;
}

export function getBrandingStyleVars(brand: PublicBranding = publicBranding): CSSProperties {
  return {
    ["--primary" as string]: brand.primaryColor,
    ["--ring" as string]: brand.primaryColor,
  };
}
