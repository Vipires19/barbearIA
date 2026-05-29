import { apiClient } from "@/lib/api-client";

export type ScheduleBlock = {
  id: string;
  professional_id: string;
  block_date: string;
  start_time: string;
  end_time: string;
  reason: string | null;
};

export type ScheduleBlockCreatePayload = {
  block_date: string;
  start_time: string;
  end_time: string;
  reason?: string | null;
};

export async function fetchMyScheduleBlocks(date: string): Promise<ScheduleBlock[]> {
  const { data } = await apiClient.get<ScheduleBlock[]>("/api/v1/professionals/me/schedule-blocks", {
    params: { date },
  });
  return data;
}

export async function createMyScheduleBlock(
  payload: ScheduleBlockCreatePayload,
): Promise<ScheduleBlock> {
  const { data } = await apiClient.post<ScheduleBlock>(
    "/api/v1/professionals/me/schedule-blocks",
    payload,
  );
  return data;
}

export async function deleteMyScheduleBlock(blockId: string): Promise<void> {
  await apiClient.delete(`/api/v1/professionals/me/schedule-blocks/${blockId}`);
}

export async function fetchProfessionalScheduleBlocks(
  professionalId: string,
  date: string,
): Promise<ScheduleBlock[]> {
  const { data } = await apiClient.get<ScheduleBlock[]>(
    `/api/v1/professionals/${professionalId}/schedule-blocks`,
    { params: { date } },
  );
  return data;
}

export async function createProfessionalScheduleBlock(
  professionalId: string,
  payload: ScheduleBlockCreatePayload,
): Promise<ScheduleBlock> {
  const { data } = await apiClient.post<ScheduleBlock>(
    `/api/v1/professionals/${professionalId}/schedule-blocks`,
    payload,
  );
  return data;
}

export async function deleteProfessionalScheduleBlock(
  professionalId: string,
  blockId: string,
): Promise<void> {
  await apiClient.delete(`/api/v1/professionals/${professionalId}/schedule-blocks/${blockId}`);
}
