"use client";

import { RequireRole } from "@/components/auth/require-role";
import { InventoryDashboardView } from "@/features/inventory/components/inventory-dashboard";

export default function InventoryPage() {
  return (
    <RequireRole allow={["admin", "barber"]}>
      <InventoryDashboardView />
    </RequireRole>
  );
}
