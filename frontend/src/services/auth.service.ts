import { apiClient } from "@/lib/api-client";
import type { LoginPayload, TokenResponse } from "@/types/auth";

export const authService = {
  async login(payload: LoginPayload): Promise<TokenResponse> {
    const { data } = await apiClient.post<TokenResponse>("/api/v1/auth/login", payload);
    return data;
  },

  async refresh(refreshToken: string): Promise<TokenResponse> {
    const { data } = await apiClient.post<TokenResponse>("/api/v1/auth/refresh", {
      refresh_token: refreshToken,
    });
    return data;
  },
};
