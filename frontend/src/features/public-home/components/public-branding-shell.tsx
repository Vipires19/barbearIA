"use client";

import type { CSSProperties, ReactNode } from "react";

import { getBrandingStyleVars, publicBranding } from "@/config/public-branding";
import { cn } from "@/lib/utils";

type PublicBrandingShellProps = {
  children: ReactNode;
  className?: string;
};

export function PublicBrandingShell({ children, className }: PublicBrandingShellProps) {
  return (
    <div className={cn("min-h-screen overflow-x-hidden bg-background", className)} style={getBrandingStyleVars() as CSSProperties}>
      {children}
    </div>
  );
}

export function BrandLogo({ className }: { className?: string }) {
  const { companyName, logoUrl } = publicBranding;
  if (logoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={logoUrl} alt={companyName} className={cn("h-8 w-auto sm:h-9", className)} />
    );
  }
  return (
    <span className={cn("text-lg font-bold tracking-tight sm:text-xl", className)}>
      {companyName}
      <span className="text-primary">.</span>
    </span>
  );
}
