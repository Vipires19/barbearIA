"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  createService,
  deleteService,
  fetchService,
  fetchServices,
  updateService,
  uploadServiceImage,
} from "@/features/services/api/services.api";
import type {
  Service,
  ServiceCreatePayload,
  ServiceListParams,
  ServiceUpdatePayload,
} from "@/features/services/types/service.types";
import { getApiErrorMessage } from "@/lib/api-client";

export const servicesKeys = {
  all: ["services"] as const,
  list: (params: ServiceListParams) => [...servicesKeys.all, "list", params] as const,
  detail: (id: string) => [...servicesKeys.all, "detail", id] as const,
};

export function useServicesList(params: ServiceListParams) {
  return useQuery({
    queryKey: servicesKeys.list(params),
    queryFn: () => fetchServices(params),
  });
}

export function useService(id: string) {
  return useQuery({
    queryKey: servicesKeys.detail(id),
    queryFn: () => fetchService(id),
    enabled: Boolean(id),
  });
}

export function useCreateService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: ServiceCreatePayload) => createService(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: servicesKeys.all });
      toast.success("Serviço criado");
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });
}

export function useUpdateService(id: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: ServiceUpdatePayload) => updateService(id, payload),
    onMutate: async (payload) => {
      await qc.cancelQueries({ queryKey: servicesKeys.detail(id) });
      const previous = qc.getQueryData<Service>(servicesKeys.detail(id));
      if (previous) {
        qc.setQueryData<Service>(servicesKeys.detail(id), {
          ...previous,
          ...payload,
          price: payload.price !== undefined ? String(payload.price) : previous.price,
        });
      }
      return { previous };
    },
    onError: (e, _payload, context) => {
      if (context?.previous) {
        qc.setQueryData(servicesKeys.detail(id), context.previous);
      }
      toast.error(getApiErrorMessage(e));
    },
    onSuccess: (data) => {
      qc.setQueryData(servicesKeys.detail(id), data);
      qc.invalidateQueries({ queryKey: servicesKeys.all });
      toast.success("Serviço atualizado");
    },
  });
}

export function useDeleteService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteService(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: servicesKeys.all });
      toast.success("Serviço excluído");
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });
}

export function useUploadServiceImage(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => uploadServiceImage(id, file),
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: servicesKeys.detail(id) });
      const previous = qc.getQueryData<Service>(servicesKeys.detail(id));
      return { previous };
    },
    onSuccess: (data) => {
      qc.setQueryData(servicesKeys.detail(id), data);
      qc.invalidateQueries({ queryKey: servicesKeys.all });
      toast.success("Imagem enviada");
    },
    onError: (e, _file, context) => {
      if (context?.previous) {
        qc.setQueryData(servicesKeys.detail(id), context.previous);
      }
      toast.error(getApiErrorMessage(e));
    },
  });
}
