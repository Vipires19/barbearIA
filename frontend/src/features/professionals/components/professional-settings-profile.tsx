"use client";

import { useState } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AvatarUploadField } from "@/features/professionals/components/avatar-upload-field";
import { ProfessionalProfileForm } from "@/features/professionals/components/professional-profile-form";
import { LoadingSkeleton } from "@/features/professionals/components/loading-skeleton";
import {
  useMyProfile,
  useUpdateMyProfile,
  useUploadMyAvatar,
} from "@/features/professionals/hooks/use-professionals";
import type { ProfessionalProfileValues } from "@/features/professionals/schemas/professional.schema";
import { resolveAvatarUrl } from "@/features/professionals/utils/format";

export function ProfessionalSettingsProfile() {
  const { data: profile, isLoading } = useMyProfile();
  const updateMutation = useUpdateMyProfile();
  const uploadMutation = useUploadMyAvatar();
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  const handleSubmit = async (values: ProfessionalProfileValues) => {
    await updateMutation.mutateAsync({
      bio: values.bio,
      specialties: values.specialties,
      service_ids: values.service_ids,
      is_publicly_visible: values.is_publicly_visible,
    });
    if (avatarFile) {
      await uploadMutation.mutateAsync(avatarFile);
      setAvatarFile(null);
    }
  };

  if (isLoading || !profile) {
    return <LoadingSkeleton variant="form" />;
  }

  const previewUrl = avatarFile
    ? URL.createObjectURL(avatarFile)
    : resolveAvatarUrl(profile.avatar_url);

  const busy = updateMutation.isPending || uploadMutation.isPending;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Perfil</h1>
        <p className="text-sm text-muted-foreground">
          Foto, bio, especialidades, serviços executados e visibilidade pública.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Foto</CardTitle>
        </CardHeader>
        <CardContent>
          <AvatarUploadField
            value={previewUrl}
            onFileSelect={setAvatarFile}
            disabled={busy}
          />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Dados do perfil</CardTitle>
        </CardHeader>
        <CardContent>
          <ProfessionalProfileForm
            key={profile.updated_at}
            defaultValues={profile}
            onSubmit={handleSubmit}
            isLoading={busy}
          />
        </CardContent>
      </Card>
    </div>
  );
}
