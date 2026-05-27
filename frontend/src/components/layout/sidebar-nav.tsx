"use client";

import { ChevronDown } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";

import { cn } from "@/lib/utils";
import { assertNavItems, isNavGroupActive, isNavItemActive } from "@/lib/navigation/nav-utils";
import type { SidebarItem } from "@/types/navigation";

type SidebarNavProps = {
  items: readonly SidebarItem[];
  onNavigate?: () => void;
};

export function SidebarNav({ items, onNavigate }: SidebarNavProps) {
  const pathname = usePathname();
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  const navItems = useMemo(() => {
    assertNavItems(items, "SidebarNav props");
    return items;
  }, [items]);

  const toggleGroup = (id: string) => {
    setOpenGroups((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const linkClass = (active: boolean) =>
    cn(
      "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
      active
        ? "bg-primary/15 text-primary"
        : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground",
    );

  return (
    <nav className="flex flex-1 flex-col gap-1 p-4" aria-label="Navegação principal">
      {navItems.map((item) => {
        if (item.children?.length) {
          const groupActive = isNavGroupActive(pathname, item);
          const isOpen = openGroups[item.id] ?? groupActive;
          return (
            <div key={item.id} className="space-y-0.5">
              <button
                type="button"
                onClick={() => toggleGroup(item.id)}
                className={cn(linkClass(groupActive), "w-full justify-between")}
                aria-expanded={isOpen}
              >
                <span className="flex items-center gap-3">
                  {item.icon}
                  {item.label}
                </span>
                <ChevronDown
                  className={cn("h-4 w-4 shrink-0 transition-transform", isOpen && "rotate-180")}
                  aria-hidden
                />
              </button>
              {isOpen ? (
                <div className="ml-4 space-y-0.5 border-l border-sidebar-border pl-2">
                  {item.children.map((child) =>
                    child.href ? (
                      <Link
                        key={child.id}
                        href={child.href}
                        onClick={onNavigate}
                        className={linkClass(isNavItemActive(pathname, child.href))}
                      >
                        {child.icon}
                        {child.label}
                      </Link>
                    ) : null,
                  )}
                </div>
              ) : null}
            </div>
          );
        }

        if (!item.href) return null;

        return (
          <Link
            key={item.id}
            href={item.href}
            onClick={onNavigate}
            className={linkClass(isNavItemActive(pathname, item.href))}
          >
            {item.icon}
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
