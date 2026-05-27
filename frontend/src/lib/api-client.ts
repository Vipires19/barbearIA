import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";

import { clearAuthCookies } from "@/lib/cookies";
import { useAuthStore } from "@/store/auth-store";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
});

let isRefreshing = false;
let refreshQueue: Array<(token: string) => void> = [];

function processQueue(token: string) {
  refreshQueue.forEach((cb) => cb(token));
  refreshQueue = [];
}

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = useAuthStore.getState().accessToken;
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status !== 401 || !original || original._retry) {
      return Promise.reject(error);
    }

    const refreshToken = useAuthStore.getState().refreshToken;
    if (!refreshToken) {
      useAuthStore.getState().logout();
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve) => {
        refreshQueue.push((token: string) => {
          if (original.headers) original.headers.Authorization = `Bearer ${token}`;
          resolve(apiClient(original));
        });
      });
    }

    original._retry = true;
    isRefreshing = true;

    try {
      const { data } = await axios.post<{ access_token: string; refresh_token: string }>(
        `${API_URL}/api/v1/auth/refresh`,
        { refresh_token: refreshToken },
      );
      useAuthStore.getState().setTokens(data.access_token, data.refresh_token);
      processQueue(data.access_token);
      if (original.headers) original.headers.Authorization = `Bearer ${data.access_token}`;
      return apiClient(original);
    } catch {
      useAuthStore.getState().logout();
      clearAuthCookies();
      if (typeof window !== "undefined") window.location.href = "/login";
      return Promise.reject(error);
    } finally {
      isRefreshing = false;
    }
  },
);

export function getApiErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const detail = error.response?.data as { detail?: string } | undefined;
    if (detail?.detail) return detail.detail;
    return error.message;
  }
  if (error instanceof Error) return error.message;
  return "Erro inesperado";
}
