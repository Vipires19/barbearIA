import { create } from "zustand";
import { persist } from "zustand/middleware";

import { clearAuthCookies, setAuthCookies } from "@/lib/cookies";
import type { User } from "@/types/user";

type AuthState = {
  accessToken: string | null;
  refreshToken: string | null;
  user: User | null;
  isAuthenticated: boolean;
  setSession: (access: string, refresh: string, user: User) => void;
  setTokens: (access: string, refresh: string) => void;
  setUser: (user: User) => void;
  logout: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      isAuthenticated: false,
      setSession: (access, refresh, user) => {
        setAuthCookies(access, refresh, user.role);
        set({
          accessToken: access,
          refreshToken: refresh,
          user,
          isAuthenticated: true,
        });
      },
      setTokens: (access, refresh) => {
        setAuthCookies(access, refresh, useAuthStore.getState().user?.role);
        set({ accessToken: access, refreshToken: refresh, isAuthenticated: true });
      },
      setUser: (user) => set({ user }),
      logout: () => {
        clearAuthCookies();
        set({
          accessToken: null,
          refreshToken: null,
          user: null,
          isAuthenticated: false,
        });
      },
    }),
    { name: "barbearia-auth" },
  ),
);
