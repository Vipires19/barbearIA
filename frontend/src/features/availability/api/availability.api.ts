import { apiClient } from "@/lib/api-client";

import type { WeekdayAvailability, WeekdayAvailabilityPayload } from "@/features/availability/types/availability.types";

const ME = "/api/v1/professionals/me/availabilities";

export async function fetchMyAvailabilities(): Promise<WeekdayAvailability[]> {
  const { data } = await apiClient.get<WeekdayAvailability[]>(ME);
  return data;
}

export async function saveMyAvailabilities(
  payload: WeekdayAvailabilityPayload,
): Promise<WeekdayAvailability[]> {
  const { data } = await apiClient.put<WeekdayAvailability[]>(ME, payload);
  return data;
}

export async function fetchProfessionalAvailabilities(
  professionalId: string,
): Promise<WeekdayAvailability[]> {
  const { data } = await apiClient.get<WeekdayAvailability[]>(
    `/api/v1/professionals/${professionalId}/availabilities`,
  );
  return data;
}

export async function saveProfessionalAvailabilities(
  professionalId: string,
  payload: WeekdayAvailabilityPayload,
): Promise<WeekdayAvailability[]> {
  const { data } = await apiClient.put<WeekdayAvailability[]>(
    `/api/v1/professionals/${professionalId}/availabilities`,
    payload,
  );
  return data;
}
