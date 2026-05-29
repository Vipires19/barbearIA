"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  closeFinancialPeriod,
  createAdvance,
  createExpense,
  fetchFinancialDashboard,
  fetchFinancialPeriods,
  fetchMyWallet,
  fetchParticipationSummary,
  updateFinancialSettings,
} from "@/features/financial/api/financial.api";
import type {
  AdvanceCreatePayload,
  ExpenseCreatePayload,
  FinancialSettingsUpdatePayload,
} from "@/features/financial/types/financial.types";
import { getApiErrorMessage } from "@/lib/api-client";

export const financialKeys = {
  all: ["financial"] as const,
  dashboard: () => [...financialKeys.all, "dashboard"] as const,
  periods: (page: number) => [...financialKeys.all, "periods", page] as const,
  wallet: () => [...financialKeys.all, "wallet"] as const,
  participationSummary: () => [...financialKeys.all, "participation-summary"] as const,
};

export function useParticipationSummary() {
  return useQuery({
    queryKey: financialKeys.participationSummary(),
    queryFn: fetchParticipationSummary,
  });
}

export function useFinancialDashboard() {
  return useQuery({
    queryKey: financialKeys.dashboard(),
    queryFn: fetchFinancialDashboard,
  });
}

export function useFinancialPeriods(page = 1) {
  return useQuery({
    queryKey: financialKeys.periods(page),
    queryFn: () => fetchFinancialPeriods({ page, page_size: 10 }),
  });
}

export function useMyWallet() {
  return useQuery({
    queryKey: financialKeys.wallet(),
    queryFn: fetchMyWallet,
  });
}

export function useCreateExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ExpenseCreatePayload) => createExpense(payload),
    onSuccess: () => {
      toast.success("Despesa registrada");
      void queryClient.invalidateQueries({ queryKey: financialKeys.all });
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });
}

export function useCreateAdvance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: AdvanceCreatePayload) => createAdvance(payload),
    onSuccess: () => {
      toast.success("Vale registrado");
      void queryClient.invalidateQueries({ queryKey: financialKeys.all });
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });
}

export function useCloseFinancialPeriod() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: closeFinancialPeriod,
    onSuccess: () => {
      toast.success("Período fechado com sucesso");
      void queryClient.invalidateQueries({ queryKey: financialKeys.all });
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });
}

export function useUpdateFinancialSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: FinancialSettingsUpdatePayload) => updateFinancialSettings(payload),
    onSuccess: () => {
      toast.success("Configurações atualizadas");
      void queryClient.invalidateQueries({ queryKey: financialKeys.all });
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });
}
