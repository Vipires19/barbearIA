"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  cancelAppointment,
  createAppointment,
  fetchAppointment,
  fetchAppointments,
  fetchAvailableSlots,
  rescheduleAppointment,
  updateAppointment,
} from "@/features/appointments/api/appointments.api";
import type {
  Appointment,
  AppointmentCancelPayload,
  AppointmentCreatePayload,
  AppointmentListParams,
  AppointmentReschedulePayload,
  AppointmentUpdatePayload,
} from "@/features/appointments/types/appointment.types";
import { getApiErrorMessage } from "@/lib/api-client";

export const appointmentsKeys = {
  all: ["appointments"] as const,
  list: (params: AppointmentListParams) => [...appointmentsKeys.all, "list", params] as const,
  detail: (id: string) => [...appointmentsKeys.all, "detail", id] as const,
  slots: (professionalId: string, serviceIdsKey: string, date: string) =>
    [...appointmentsKeys.all, "slots", professionalId, serviceIdsKey, date] as const,
};

export function useAppointmentsList(params: AppointmentListParams) {
  return useQuery({
    queryKey: appointmentsKeys.list(params),
    queryFn: () => fetchAppointments(params),
  });
}

export function useAppointment(id: string) {
  return useQuery({
    queryKey: appointmentsKeys.detail(id),
    queryFn: () => fetchAppointment(id),
    enabled: Boolean(id),
  });
}

export function useAvailableSlots(professionalId?: string, serviceIds?: string[], date?: string) {
  const serviceIdsKey = (serviceIds ?? []).slice().sort().join(",");
  return useQuery({
    queryKey: appointmentsKeys.slots(professionalId ?? "", serviceIdsKey, date ?? ""),
    queryFn: () => fetchAvailableSlots(professionalId!, serviceIds!, date!),
    enabled: Boolean(professionalId && serviceIds?.length && date),
  });
}

export function useCreateAppointment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: AppointmentCreatePayload) => createAppointment(payload),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: appointmentsKeys.all });
      if (typeof window !== "undefined") {
        sessionStorage.setItem("lastAppointment", JSON.stringify(data));
      }
      toast.success("Agendamento criado");
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });
}

export function useUpdateAppointment(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: AppointmentUpdatePayload) => updateAppointment(id, payload),
    onMutate: async (payload) => {
      await qc.cancelQueries({ queryKey: appointmentsKeys.detail(id) });
      const previous = qc.getQueryData<Appointment>(appointmentsKeys.detail(id));
      if (previous) {
        qc.setQueryData<Appointment>(appointmentsKeys.detail(id), { ...previous, ...payload });
      }
      return { previous };
    },
    onError: (e, _payload, context) => {
      if (context?.previous) qc.setQueryData(appointmentsKeys.detail(id), context.previous);
      toast.error(getApiErrorMessage(e));
    },
    onSuccess: (data) => {
      qc.setQueryData(appointmentsKeys.detail(data.id), data);
      qc.invalidateQueries({ queryKey: appointmentsKeys.all });
      toast.success("Agendamento atualizado");
    },
  });
}

export function usePatchAppointment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: AppointmentUpdatePayload }) =>
      updateAppointment(id, payload),
    onSuccess: (data) => {
      qc.setQueryData(appointmentsKeys.detail(data.id), data);
      qc.invalidateQueries({ queryKey: appointmentsKeys.all });
      toast.success("Agendamento atualizado");
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });
}

export function useCancelAppointment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload?: AppointmentCancelPayload }) =>
      cancelAppointment(id, payload),
    onSuccess: (data) => {
      qc.setQueryData(appointmentsKeys.detail(data.id), data);
      qc.invalidateQueries({ queryKey: appointmentsKeys.all });
      toast.success("Agendamento cancelado");
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });
}

export function useRescheduleAppointment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: AppointmentReschedulePayload }) =>
      rescheduleAppointment(id, payload),
    onSuccess: (data) => {
      qc.setQueryData(appointmentsKeys.detail(data.id), data);
      qc.invalidateQueries({ queryKey: appointmentsKeys.all });
      toast.success("Agendamento reagendado");
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });
}
