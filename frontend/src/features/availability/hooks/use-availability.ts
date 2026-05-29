"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  fetchMyAvailabilities,
  fetchProfessionalAvailabilities,
  saveMyAvailabilities,
  saveProfessionalAvailabilities,
} from "@/features/availability/api/availability.api";
import type { WeekdayAvailabilityPayload } from "@/features/availability/types/availability.types";
import { appointmentsKeys } from "@/features/appointments/hooks/use-appointments";
import { professionalsKeys } from "@/features/professionals/hooks/use-professionals";
import { getApiErrorMessage } from "@/lib/api-client";

export const availabilityKeys = {
  all: ["availability"] as const,
  me: () => [...availabilityKeys.all, "me"] as const,
  professional: (id: string) => [...availabilityKeys.all, "professional", id] as const,
};

export function useMyAvailabilities(enabled = true) {
  return useQuery({
    queryKey: availabilityKeys.me(),
    queryFn: fetchMyAvailabilities,
    enabled,
  });
}

export function useProfessionalAvailabilities(professionalId?: string) {
  return useQuery({
    queryKey: availabilityKeys.professional(professionalId ?? ""),
    queryFn: () => fetchProfessionalAvailabilities(professionalId!),
    enabled: Boolean(professionalId),
  });
}

export function useSaveMyAvailabilities() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: WeekdayAvailabilityPayload) => saveMyAvailabilities(payload),
    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey: availabilityKeys.me() });
      const previous = queryClient.getQueryData(availabilityKeys.me());
      queryClient.setQueryData(availabilityKeys.me(), payload);
      return { previous };
    },
    onError: (error, _payload, context) => {
      if (context?.previous) {
        queryClient.setQueryData(availabilityKeys.me(), context.previous);
      }
      toast.error(getApiErrorMessage(error));
    },
    onSuccess: (data) => {
      queryClient.setQueryData(availabilityKeys.me(), data);
      void queryClient.invalidateQueries({ queryKey: professionalsKeys.me() });
      void queryClient.invalidateQueries({ queryKey: appointmentsKeys.all });
      toast.success("Disponibilidade salva — booking atualizado");
    },
  });
}

export function useSaveProfessionalAvailabilities(professionalId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: WeekdayAvailabilityPayload) =>
      saveProfessionalAvailabilities(professionalId, payload),
    onMutate: async (payload) => {
      const key = availabilityKeys.professional(professionalId);
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData(key);
      queryClient.setQueryData(key, payload);
      return { previous };
    },
    onError: (error, _payload, context) => {
      const key = availabilityKeys.professional(professionalId);
      if (context?.previous) {
        queryClient.setQueryData(key, context.previous);
      }
      toast.error(getApiErrorMessage(error));
    },
    onSuccess: (data) => {
      queryClient.setQueryData(availabilityKeys.professional(professionalId), data);
      void queryClient.invalidateQueries({ queryKey: professionalsKeys.detail(professionalId) });
      void queryClient.invalidateQueries({ queryKey: appointmentsKeys.all });
      toast.success("Disponibilidade salva — booking atualizado");
    },
  });
}
