import { apiClient } from "@/lib/api-client";
import type {
  PublicAppointment,
  PublicAppointmentCancelPayload,
  PublicAppointmentCreatePayload,
  PublicAppointmentListParams,
  PublicAppointmentListResponse,
  PublicAppointmentReschedulePayload,
} from "@/features/public-appointments/types/public-appointment.types";

const BASE = "/api/v1/public/appointments";

export async function createPublicAppointment(
  payload: PublicAppointmentCreatePayload,
): Promise<PublicAppointment> {
  const { data } = await apiClient.post<PublicAppointment>(BASE, payload);
  return data;
}

export async function fetchPublicAppointments(
  params: PublicAppointmentListParams,
): Promise<PublicAppointmentListResponse> {
  const { data } = await apiClient.get<PublicAppointmentListResponse>(BASE, {
    params: { phone: params.phone, scope: params.scope ?? "all" },
  });
  return data;
}

export async function fetchPublicAppointment(
  id: string,
  phone: string,
): Promise<PublicAppointment> {
  const { data } = await apiClient.get<PublicAppointment>(`${BASE}/${id}`, {
    params: { phone },
  });
  return data;
}

export async function cancelPublicAppointment(
  id: string,
  payload: PublicAppointmentCancelPayload,
): Promise<PublicAppointment> {
  const { data } = await apiClient.post<PublicAppointment>(`${BASE}/${id}/cancel`, payload);
  return data;
}

export async function reschedulePublicAppointment(
  id: string,
  payload: PublicAppointmentReschedulePayload,
): Promise<PublicAppointment> {
  const { data } = await apiClient.post<PublicAppointment>(`${BASE}/${id}/reschedule`, payload);
  return data;
}
