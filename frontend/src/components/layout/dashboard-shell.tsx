"use client";

import { useMemo, type ReactNode } from "react";

import { DashboardHeader } from "@/components/layout/dashboard-header";
import { Sidebar } from "@/components/ui/sidebar";
import { getDashboardNavItems } from "@/config/dashboard-nav";
import { useAuth } from "@/hooks/use-auth";

type DashboardShellProps = {
  children: ReactNode;
};

export function DashboardShell({ children }: DashboardShellProps) {
  const { user } = useAuth();
  const navItems = useMemo(() => getDashboardNavItems(user?.role), [user?.role]);

  return (
    <div className="flex min-h-screen">
      <Sidebar items={navItems} />
      <div className="flex min-w-0 flex-1 flex-col">
        <DashboardHeader />
        <main className="flex-1 p-4 pt-20 lg:p-8 lg:pt-8">{children}</main>
      </div>
    </div>
  );
}
