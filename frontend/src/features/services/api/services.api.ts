import { apiClient } from "@/lib/api-client";
import type {
  Service,
  ServiceCreatePayload,
  ServiceListParams,
  ServiceListResponse,
  ServiceUpdatePayload,
} from "@/features/services/types/service.types";

const BASE = "/api/v1/services";

export async function fetchServices(params: ServiceListParams = {}): Promise<ServiceListResponse> {
  const { data } = await apiClient.get<ServiceListResponse>(BASE, { params });
  return data;
}

export async function fetchService(id: string): Promise<Service> {
  const { data } = await apiClient.get<Service>(`${BASE}/${id}`);
  return data;
}

export async function createService(payload: ServiceCreatePayload): Promise<Service> {
  const { data } = await apiClient.post<Service>(BASE, payload);
  return data;
}

export async function updateService(id: string, payload: ServiceUpdatePayload): Promise<Service> {
  const { data } = await apiClient.patch<Service>(`${BASE}/${id}`, payload);
  return data;
}

export async function deleteService(id: string): Promise<void> {
  await apiClient.delete(`${BASE}/${id}`);
}

export async function uploadServiceImage(id: string, file: File): Promise<Service> {
  const form = new FormData();
  form.append("file", file);
  const { data } = await apiClient.post<Service>(`${BASE}/${id}/image`, form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}
