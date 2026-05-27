"use client";

import { useEffect } from "react";

import { setAuthCookies } from "@/lib/cookies";
import { useAuthStore } from "@/store/auth-store";

export function AuthHydrator() {
  useEffect(() => {
    const { accessToken, refreshToken, user } = useAuthStore.getState();
    if (accessToken && refreshToken) {
      setAuthCookies(accessToken, refreshToken, user?.role);
    }
  }, []);

  return null;
}
