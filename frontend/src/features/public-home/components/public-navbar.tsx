"use client";

import Link from "next/link";
import { Calendar, Menu, X } from "lucide-react";
import { useState } from "react";

import { BrandLogo } from "@/features/public-home/components/public-branding-shell";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function PublicNavbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/85 backdrop-blur-lg">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <Link href="/" className="shrink-0" onClick={() => setOpen(false)}>
          <BrandLogo />
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/services">Serviços</Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/my-appointments">Meus agendamentos</Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/login">Login</Link>
          </Button>
          <Button size="sm" asChild className="ml-2 gap-1.5">
            <Link href="/booking">
              <Calendar className="h-4 w-4" />
              Agendar
            </Link>
          </Button>
        </nav>

        <div className="flex items-center gap-2 md:hidden">
          <Button size="sm" asChild className="gap-1">
            <Link href="/booking">Agendar</Link>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label={open ? "Fechar menu" : "Abrir menu"}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      <div
        className={cn(
          "border-t border-border/60 bg-background/95 md:hidden",
          open ? "block" : "hidden",
        )}
      >
        <nav className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-3">
          <Button variant="ghost" className="justify-start" asChild onClick={() => setOpen(false)}>
            <Link href="/services">Serviços</Link>
          </Button>
          <Button variant="ghost" className="justify-start" asChild onClick={() => setOpen(false)}>
            <Link href="/my-appointments">Meus agendamentos</Link>
          </Button>
          <Button variant="ghost" className="justify-start" asChild onClick={() => setOpen(false)}>
            <Link href="/login">Login equipe</Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}
