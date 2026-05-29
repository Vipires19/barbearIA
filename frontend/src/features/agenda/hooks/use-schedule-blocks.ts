"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  createMyScheduleBlock,
  createProfessionalScheduleBlock,
  deleteMyScheduleBlock,
  deleteProfessionalScheduleBlock,
  fetchMyScheduleBlocks,
  fetchProfessionalScheduleBlocks,
  type ScheduleBlockCreatePayload,
} from "@/features/agenda/api/schedule-blocks.api";
import { appointmentsKeys } from "@/features/appointments/hooks/use-appointments";
import { getApiErrorMessage } from "@/lib/api-client";

export const scheduleBlockKeys = {
  all: ["schedule-blocks"] as const,
  day: (date: string, professionalId?: string) =>
    [...scheduleBlockKeys.all, professionalId ?? "me", date] as const,
};

export function useScheduleBlocks(date: string, enabled = true, professionalId?: string) {
  const isPro = Boolean(professionalId);
  return useQuery({
    queryKey: scheduleBlockKeys.day(date, professionalId),
    queryFn: () =>
      isPro
        ? fetchProfessionalScheduleBlocks(professionalId!, date)
        : fetchMyScheduleBlocks(date),
    enabled: enabled && Boolean(date) && (!isPro || Boolean(professionalId)),
  });
}

export function useCreateScheduleBlock(professionalId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ScheduleBlockCreatePayload) =>
      professionalId
        ? createProfessionalScheduleBlock(professionalId, payload)
        : createMyScheduleBlock(payload),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: scheduleBlockKeys.day(variables.block_date, professionalId),
      });
      void queryClient.invalidateQueries({ queryKey: appointmentsKeys.all });
      toast.success("Horário bloqueado");
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });
}

export function useDeleteScheduleBlock(date: string, professionalId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (blockId: string) =>
      professionalId
        ? deleteProfessionalScheduleBlock(professionalId, blockId)
        : deleteMyScheduleBlock(blockId),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: scheduleBlockKeys.day(date, professionalId),
      });
      void queryClient.invalidateQueries({ queryKey: appointmentsKeys.all });
      toast.success("Bloqueio removido");
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });
}
