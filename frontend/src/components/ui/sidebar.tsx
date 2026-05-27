"use client";

import { Menu, X } from "lucide-react";
import { useState } from "react";

import { SidebarNav } from "@/components/layout/sidebar-nav";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { SidebarItem } from "@/types/navigation";

export type { SidebarItem } from "@/types/navigation";

type SidebarProps = {
  items: readonly SidebarItem[];
  brand?: string;
};

/**
 * Shell da sidebar: um único <aside>, uma única lista de navegação.
 * Mobile e desktop compartilham o mesmo DOM (sem render duplicado).
 */
export function Sidebar({ items, brand = "Barbearia" }: SidebarProps) {
  const [open, setOpen] = useState(false);
  const closeMobile = () => setOpen(false);

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="fixed left-4 top-4 z-50 lg:hidden"
        onClick={() => setOpen(true)}
        aria-label="Abrir menu"
      >
        <Menu className="h-5 w-5" />
      </Button>

      {open ? (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={closeMobile}
          aria-hidden
        />
      ) : null}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-sidebar-border bg-sidebar transition-transform lg:static lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-sidebar-border px-4">
          <span className="text-lg font-semibold tracking-tight">{brand}</span>
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={closeMobile} aria-label="Fechar menu">
            <X className="h-5 w-5" />
          </Button>
        </div>

        <SidebarNav items={items} onNavigate={closeMobile} />
      </aside>
    </>
  );
}
