import { RequireRole } from "@/components/auth/require-role";
import { ProfessionalsAdminList } from "@/features/professionals/components/professionals-admin-list";

export default function DashboardProfessionalsPage() {
  return (
    <RequireRole allow={["admin"]}>
      <ProfessionalsAdminList />
    </RequireRole>
  );
}
