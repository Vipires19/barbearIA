"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  cancelPublicAppointment,
  createPublicAppointment,
  fetchPublicAppointments,
  reschedulePublicAppointment,
} from "@/features/public-appointments/api/public-appointments.api";
import type {
  PublicAppointment,
  PublicAppointmentCancelPayload,
  PublicAppointmentCreatePayload,
  PublicAppointmentListParams,
  PublicAppointmentReschedulePayload,
} from "@/features/public-appointments/types/public-appointment.types";
import { getApiErrorMessage } from "@/lib/api-client";

export const publicAppointmentsKeys = {
  all: ["public-appointments"] as const,
  list: (params: PublicAppointmentListParams) => [...publicAppointmentsKeys.all, "list", params] as const,
};

export function useCreatePublicAppointment() {
  return useMutation({
    mutationFn: (payload: PublicAppointmentCreatePayload) => createPublicAppointment(payload),
    onSuccess: (data) => {
      if (typeof window !== "undefined") {
        sessionStorage.setItem("lastPublicAppointment", JSON.stringify(data));
      }
      toast.success("Agendamento criado");
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });
}

export function usePublicAppointmentsList(params: PublicAppointmentListParams | null) {
  const enabled = Boolean(params?.phone?.trim());
  return useQuery({
    queryKey: enabled
      ? publicAppointmentsKeys.list({ phone: params!.phone, scope: params?.scope ?? "all" })
      : (["public-appointments", "idle"] as const),
    queryFn: () => fetchPublicAppointments(params!),
    enabled,
  });
}

export function useCancelPublicAppointment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: PublicAppointmentCancelPayload }) =>
      cancelPublicAppointment(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: publicAppointmentsKeys.all });
      toast.success("Agendamento cancelado");
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });
}

export function useReschedulePublicAppointment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: PublicAppointmentReschedulePayload }) =>
      reschedulePublicAppointment(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: publicAppointmentsKeys.all });
      toast.success("Horário atualizado");
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });
}
