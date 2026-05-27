import { apiClient } from "@/lib/api-client";

import type {

  Professional,

  ProfessionalAccessCreatePayload,

  ProfessionalAccessUpdatePayload,

  ProfessionalAdminUpdatePayload,

  ProfessionalCreatePayload,

  ProfessionalCreateResponse,

  ProfessionalListParams,

  ProfessionalListResponse,

  ProfessionalProfileUpdatePayload,

  ProfessionalResetPasswordPayload,

} from "@/features/professionals/types/professional.types";



const BASE = "/api/v1/professionals";



export async function fetchProfessionals(

  params: ProfessionalListParams = {},

): Promise<ProfessionalListResponse> {

  const { data } = await apiClient.get<ProfessionalListResponse>(BASE, { params });

  return data;

}



export async function fetchProfessional(id: string): Promise<Professional> {

  const { data } = await apiClient.get<Professional>(`${BASE}/${id}`);

  return data;

}



export async function fetchMyProfile(): Promise<Professional> {

  const { data } = await apiClient.get<Professional>(`${BASE}/me/profile`);

  return data;

}



export async function createProfessional(

  payload: ProfessionalCreatePayload,

): Promise<ProfessionalCreateResponse> {

  const { data } = await apiClient.post<ProfessionalCreateResponse>(BASE, payload);

  return data;

}



export async function updateProfessional(

  id: string,

  payload: ProfessionalAdminUpdatePayload,

): Promise<Professional> {

  const { data } = await apiClient.patch<Professional>(`${BASE}/${id}`, payload);

  return data;

}



export async function updateProfessionalProfile(

  id: string,

  payload: ProfessionalProfileUpdatePayload,

): Promise<Professional> {

  const { data } = await apiClient.patch<Professional>(`${BASE}/${id}/profile`, payload);

  return data;

}



export async function updateMyProfile(payload: ProfessionalProfileUpdatePayload): Promise<Professional> {

  const { data } = await apiClient.patch<Professional>(`${BASE}/me/profile`, payload);

  return data;

}



export async function deleteProfessional(id: string): Promise<void> {

  await apiClient.delete(`${BASE}/${id}`);

}



export async function uploadProfessionalAvatar(id: string, file: File): Promise<Professional> {

  const form = new FormData();

  form.append("file", file);

  const { data } = await apiClient.post<Professional>(`${BASE}/${id}/avatar`, form, {

    headers: { "Content-Type": "multipart/form-data" },

  });

  return data;

}



export async function uploadMyAvatar(file: File): Promise<Professional> {

  const form = new FormData();

  form.append("file", file);

  const { data } = await apiClient.post<Professional>(`${BASE}/me/avatar`, form, {

    headers: { "Content-Type": "multipart/form-data" },

  });

  return data;

}



export async function createProfessionalAccess(

  professionalId: string,

  payload: ProfessionalAccessCreatePayload,

): Promise<Professional> {

  const { data } = await apiClient.post<Professional>(`${BASE}/${professionalId}/access`, payload);

  return data;

}



export async function updateProfessionalAccess(

  professionalId: string,

  payload: ProfessionalAccessUpdatePayload,

): Promise<Professional> {

  const { data } = await apiClient.patch<Professional>(`${BASE}/${professionalId}/access`, payload);

  return data;

}



export async function deleteProfessionalAccess(professionalId: string): Promise<Professional> {

  const { data } = await apiClient.delete<Professional>(`${BASE}/${professionalId}/access`);

  return data;

}



export async function resetProfessionalPassword(

  professionalId: string,

  payload: ProfessionalResetPasswordPayload,

): Promise<Professional> {

  const { data } = await apiClient.post<Professional>(`${BASE}/${professionalId}/reset-password`, payload);

  return data;

}

