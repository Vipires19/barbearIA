import { apiClient } from "@/lib/api-client";
import type {
  Appointment,
  AppointmentCancelPayload,
  AppointmentCreatePayload,
  AppointmentListParams,
  AppointmentListResponse,
  AppointmentReschedulePayload,
  AppointmentUpdatePayload,
  AvailableSlotsResponse,
} from "@/features/appointments/types/appointment.types";

const BASE = "/api/v1/appointments";

export async function fetchAppointments(
  params: AppointmentListParams = {},
): Promise<AppointmentListResponse> {
  const { data } = await apiClient.get<AppointmentListResponse>(BASE, { params });
  return data;
}

export async function fetchAppointment(id: string): Promise<Appointment> {
  const { data } = await apiClient.get<Appointment>(`${BASE}/${id}`);
  return data;
}

export async function createAppointment(payload: AppointmentCreatePayload): Promise<Appointment> {
  const { data } = await apiClient.post<Appointment>(BASE, payload);
  return data;
}

export async function updateAppointment(
  id: string,
  payload: AppointmentUpdatePayload,
): Promise<Appointment> {
  const { data } = await apiClient.patch<Appointment>(`${BASE}/${id}`, payload);
  return data;
}

export async function cancelAppointment(
  id: string,
  payload: AppointmentCancelPayload = {},
): Promise<Appointment> {
  const { data } = await apiClient.post<Appointment>(`${BASE}/${id}/cancel`, payload);
  return data;
}

export async function rescheduleAppointment(
  id: string,
  payload: AppointmentReschedulePayload,
): Promise<Appointment> {
  const { data } = await apiClient.post<Appointment>(`${BASE}/${id}/reschedule`, payload);
  return data;
}

export async function fetchAvailableSlots(
  professionalId: string,
  serviceIds: string[],
  date: string,
): Promise<AvailableSlotsResponse> {
  const params = new URLSearchParams();
  params.set("date", date);
  if (serviceIds.length === 1) {
    params.set("service_id", serviceIds[0]);
  } else {
    serviceIds.forEach((id) => params.append("service_ids", id));
  }
  const { data } = await apiClient.get<AvailableSlotsResponse>(
    `/api/v1/professionals/${professionalId}/available-slots?${params.toString()}`,
  );
  return data;
}
