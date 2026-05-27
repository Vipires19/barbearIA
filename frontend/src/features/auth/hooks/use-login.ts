"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import type { LoginFormValues } from "@/features/auth/schemas/login.schema";
import { getApiErrorMessage } from "@/lib/api-client";
import { isInternalRole } from "@/lib/auth-constants";
import { authService } from "@/services/auth.service";
import { userService } from "@/services/user.service";
import { useAuthStore } from "@/store/auth-store";

export function useLogin() {
  const router = useRouter();
  const setSession = useAuthStore((s) => s.setSession);
  const logout = useAuthStore((s) => s.logout);

  return useMutation({
    mutationFn: async (values: LoginFormValues) => {
      const tokens = await authService.login(values);
      useAuthStore.getState().setTokens(tokens.access_token, tokens.refresh_token);
      const user = await userService.getMe();
      if (!isInternalRole(user.role)) {
        logout();
        throw new Error("Acesso restrito a usuários internos (admin ou barbeiro)");
      }
      return { tokens, user };
    },
    onSuccess: ({ tokens, user }) => {
      setSession(tokens.access_token, tokens.refresh_token, user);
      toast.success("Login realizado com sucesso");
      router.replace("/dashboard");
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error));
    },
  });
}
