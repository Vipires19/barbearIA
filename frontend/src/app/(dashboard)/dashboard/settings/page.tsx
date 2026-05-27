import { RequireRole } from "@/components/auth/require-role";
import { DashboardSettings } from "@/features/dashboard/components/dashboard-settings";

export default function DashboardSettingsPage() {
  return (
    <RequireRole allow={["admin"]}>
      <DashboardSettings />
    </RequireRole>
  );
}
