"use client";

import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/hooks/use-auth";
import { userService } from "@/services/user.service";
import { useAuthStore } from "@/store/auth-store";

export function useCurrentUser() {
  const { isAuthenticated } = useAuth();
  const setUser = useAuthStore((s) => s.setUser);

  return useQuery({
    queryKey: ["current-user"],
    queryFn: async () => {
      const user = await userService.getMe();
      setUser(user);
      return user;
    },
    enabled: isAuthenticated,
  });
}
