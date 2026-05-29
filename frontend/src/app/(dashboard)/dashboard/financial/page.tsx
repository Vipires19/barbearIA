"use client";

import { RequireRole } from "@/components/auth/require-role";
import { PageHeader } from "@/components/shared/page-header";
import { FinancialAdminDashboard } from "@/features/financial/components/financial-admin-dashboard";
import { ProfessionalWalletView } from "@/features/financial/components/professional-wallet";
import { useCurrentUser } from "@/hooks/use-current-user";

export function FinancialPageContent() {
  const { data: user } = useCurrentUser();

  if (user?.role === "barber") {
    return (
      <div className="space-y-6">
        <PageHeader title="Carteira" description="Acompanhe sua participação financeira e vales." />
        <ProfessionalWalletView />
      </div>
    );
  }

  return <FinancialAdminDashboard />;
}

export default function FinancialPage() {
  return (
    <RequireRole allow={["admin", "barber"]}>
      <FinancialPageContent />
    </RequireRole>
  );
}
