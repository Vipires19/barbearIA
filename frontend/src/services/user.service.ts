import { apiClient } from "@/lib/api-client";
import type { User } from "@/types/user";

export const userService = {
  async getMe(): Promise<User> {
    const { data } = await apiClient.get<User>("/api/v1/users/me");
    return data;
  },
};
