"use client";

import Link from "next/link";

import { Card } from "@/components/ui/card";
import { AvailabilitySetupBanner } from "@/features/availability/components/availability-setup-banner";
import { AvailabilitySettings } from "@/features/availability/components/availability-settings";
import { AdminAvailabilityPanel } from "@/features/availability/components/admin-availability-panel";
import {
  useMyAvailabilities,
  useSaveMyAvailabilities,
} from "@/features/availability/hooks/use-availability";
import { useMyProfile } from "@/features/professionals/hooks/use-professionals";
import { useAuthStore } from "@/store/auth-store";

export function MyAvailabilitySettings() {
  const role = useAuthStore((s) => s.user?.role);

  if (role === "admin") {
    return <AdminAvailabilityPanel />;
  }

  return <BarberAvailabilitySettings />;
}

function BarberAvailabilitySettings() {
  const { data: profile } = useMyProfile();
  const { data, isLoading, isError } = useMyAvailabilities(true);
  const saveMutation = useSaveMyAvailabilities();

  if (isError) {
    return (
      <Card className="border-dashed p-6 text-center text-sm text-muted-foreground">
        Perfil profissional não encontrado. Peça ao administrador para vincular seu login a um profissional.
      </Card>
    );
  }

  const hasServices = (profile?.services?.length ?? 0) > 0;

  return (
    <div className="space-y-4">
      <AvailabilitySetupBanner data={data} />

      {!hasServices && !isLoading ? (
        <Card className="border-dashed p-4 text-sm text-muted-foreground">
          <p className="font-medium text-foreground">Serviços não vinculados</p>
          <p className="mt-1">
            O booking só mostra horários para serviços que você executa. Vincule em{" "}
            <Link
              href="/dashboard/settings/profile"
              className="text-primary underline-offset-4 hover:underline"
            >
              Configurações → Perfil
            </Link>
            .
          </p>
        </Card>
      ) : null}

      <AvailabilitySettings
        data={data}
        isLoading={isLoading}
        isSaving={saveMutation.isPending}
        onSave={(payload) => saveMutation.mutate(payload)}
      />
    </div>
  );
}
