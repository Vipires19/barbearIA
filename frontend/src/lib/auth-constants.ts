import type { UserRole } from "@/types/user";

export const INTERNAL_ROLES: UserRole[] = ["admin", "barber"];

export function isInternalRole(role: string | undefined | null): role is UserRole {
  return role === "admin" || role === "barber";
}
