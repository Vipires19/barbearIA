import { RequireRole } from "@/components/auth/require-role";
import { ServicesAdminList } from "@/features/services/components/services-admin-list";

export default function DashboardServicesPage() {
  return (
    <RequireRole allow={["admin"]}>
      <ServicesAdminList />
    </RequireRole>
  );
}
