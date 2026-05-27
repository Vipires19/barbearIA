"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";

import { useAuth } from "@/hooks/use-auth";
import { useCurrentUser } from "@/hooks/use-current-user";
import { isInternalRole } from "@/lib/auth-constants";

type DashboardGuardProps = {
  children: ReactNode;
};

export function DashboardGuard({ children }: DashboardGuardProps) {
  const router = useRouter();
  const { isAuthenticated, user, logout } = useAuth();
  const { data: currentUser, isLoading, isError } = useCurrentUser();

  const effectiveUser = currentUser ?? user;
  const role = effectiveUser?.role;

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }
    if (isLoading) return;
    if (isError || !isInternalRole(role)) {
      logout();
      router.replace("/login");
    }
  }, [isAuthenticated, isError, isLoading, logout, role, router]);

  if (!isAuthenticated || isLoading) return null;
  if (!isInternalRole(role)) return null;

  return <>{children}</>;
}
