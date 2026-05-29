"use client";

import { AvailabilitySettings } from "@/features/availability/components/availability-settings";
import {
  useProfessionalAvailabilities,
  useSaveProfessionalAvailabilities,
} from "@/features/availability/hooks/use-availability";

type ProfessionalAvailabilityEditorProps = {
  professionalId: string;
};

export function ProfessionalAvailabilityEditor({ professionalId }: ProfessionalAvailabilityEditorProps) {
  const { data, isLoading } = useProfessionalAvailabilities(professionalId);
  const saveMutation = useSaveProfessionalAvailabilities(professionalId);

  return (
    <AvailabilitySettings
      data={data}
      isLoading={isLoading}
      isSaving={saveMutation.isPending}
      onSave={(payload) => saveMutation.mutate(payload)}
    />
  );
}
