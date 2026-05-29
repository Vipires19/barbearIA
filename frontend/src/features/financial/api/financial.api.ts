import { apiClient } from "@/lib/api-client";
import type {
  Advance,
  AdvanceCreatePayload,
  Expense,
  ExpenseCreatePayload,
  FinancialDashboard,
  FinancialPeriod,
  FinancialPeriodListResponse,
  FinancialSettings,
  FinancialSettingsUpdatePayload,
  ProfessionalWallet,
  ParticipationSummary,
} from "@/features/financial/types/financial.types";

const BASE = "/api/v1/financial";

export async function fetchFinancialDashboard(): Promise<FinancialDashboard> {
  const { data } = await apiClient.get<FinancialDashboard>(`${BASE}/dashboard`);
  return data;
}

export async function fetchFinancialPeriods(params?: {
  page?: number;
  page_size?: number;
}): Promise<FinancialPeriodListResponse> {
  const { data } = await apiClient.get<FinancialPeriodListResponse>(`${BASE}/periods`, { params });
  return data;
}

export async function fetchParticipationSummary(): Promise<ParticipationSummary> {
  const { data } = await apiClient.get<ParticipationSummary>(`${BASE}/participation-summary`);
  return data;
}

export async function fetchMyWallet(): Promise<ProfessionalWallet> {
  const { data } = await apiClient.get<ProfessionalWallet>(`${BASE}/my-wallet`);
  return data;
}

export async function createExpense(payload: ExpenseCreatePayload): Promise<Expense> {
  const { data } = await apiClient.post<Expense>(`${BASE}/expenses`, payload);
  return data;
}

export async function createAdvance(payload: AdvanceCreatePayload): Promise<Advance> {
  const { data } = await apiClient.post<Advance>(`${BASE}/advances`, payload);
  return data;
}

export async function closeFinancialPeriod(): Promise<FinancialPeriod> {
  const { data } = await apiClient.post<FinancialPeriod>(`${BASE}/periods/close`);
  return data;
}

export async function updateFinancialSettings(
  payload: FinancialSettingsUpdatePayload,
): Promise<FinancialSettings> {
  const { data } = await apiClient.patch<FinancialSettings>(`${BASE}/settings`, payload);
  return data;
}
