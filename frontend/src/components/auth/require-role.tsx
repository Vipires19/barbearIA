"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";

import { useAuth } from "@/hooks/use-auth";
import type { UserRole } from "@/types/user";

type RequireRoleProps = {
  allow: UserRole[];
  children: ReactNode;
};

export function RequireRole({ allow, children }: RequireRoleProps) {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) return;
    if (user && !allow.includes(user.role)) {
      logout();
      router.replace("/login");
    }
  }, [allow, isAuthenticated, logout, router, user]);

  if (!isAuthenticated || !user) return null;
  if (!allow.includes(user.role)) return null;
  return <>{children}</>;
}
