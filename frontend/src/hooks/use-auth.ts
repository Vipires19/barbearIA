"use client";

import { useAuthStore } from "@/store/auth-store";

export function useAuth() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const refreshToken = useAuthStore((s) => s.refreshToken);
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const setSession = useAuthStore((s) => s.setSession);
  const logout = useAuthStore((s) => s.logout);

  return {
    accessToken,
    refreshToken,
    user,
    isAuthenticated,
    setSession,
    logout,
  };
}
