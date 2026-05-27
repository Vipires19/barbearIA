"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { uploadServiceImage } from "@/features/services/api/services.api";
import { ServiceForm } from "@/features/services/components/service-form";
import { UploadField } from "@/features/services/components/upload-field";
import { useCreateService } from "@/features/services/hooks/use-services";
import type { ServiceFormValues } from "@/features/services/schemas/service.schema";

export function ServiceCreateForm() {
  const router = useRouter();
  const createMutation = useCreateService();
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleSubmit = async (values: ServiceFormValues) => {
    const created = await createMutation.mutateAsync(values);
    if (imageFile) {
      setIsUploading(true);
      try {
        await uploadServiceImage(created.id, imageFile);
      } finally {
        setIsUploading(false);
      }
    }
    router.push("/dashboard/services");
  };

  const busy = createMutation.isPending || isUploading;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Imagem do serviço</CardTitle>
        </CardHeader>
        <CardContent>
          <UploadField onFileSelect={setImageFile} disabled={busy} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Dados do serviço</CardTitle>
        </CardHeader>
        <CardContent>
          <ServiceForm onSubmit={handleSubmit} isLoading={busy} submitLabel="Criar serviço" />
        </CardContent>
      </Card>
    </div>
  );
}
