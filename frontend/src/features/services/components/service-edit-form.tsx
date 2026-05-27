"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { LoadingSkeleton } from "@/features/services/components/loading-skeleton";
import { ServiceForm, toFormValues } from "@/features/services/components/service-form";
import { UploadField } from "@/features/services/components/upload-field";
import {
  useDeleteService,
  useService,
  useUpdateService,
  useUploadServiceImage,
} from "@/features/services/hooks/use-services";
import type { ServiceFormValues } from "@/features/services/schemas/service.schema";
import { resolveImageUrl } from "@/features/services/utils/format";

type ServiceEditFormProps = {
  serviceId: string;
};

export function ServiceEditForm({ serviceId }: ServiceEditFormProps) {
  const router = useRouter();
  const { data: service, isLoading } = useService(serviceId);
  const updateMutation = useUpdateService(serviceId);
  const uploadMutation = useUploadServiceImage(serviceId);
  const deleteMutation = useDeleteService();
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleSubmit = async (values: ServiceFormValues) => {
    await updateMutation.mutateAsync(values);
    if (imageFile) {
      await uploadMutation.mutateAsync(imageFile);
      setImageFile(null);
    }
    router.push("/dashboard/services");
  };

  const handleDelete = () => {
    deleteMutation.mutate(serviceId, {
      onSuccess: () => router.push("/dashboard/services"),
    });
  };

  if (isLoading || !service) {
    return <LoadingSkeleton variant="form" />;
  }

  const previewUrl = imageFile
    ? URL.createObjectURL(imageFile)
    : resolveImageUrl(service.image_url);

  return (
    <>
      <div className="mx-auto max-w-2xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Imagem do serviço</CardTitle>
          </CardHeader>
          <CardContent>
            <UploadField
              value={previewUrl}
              onFileSelect={setImageFile}
              disabled={updateMutation.isPending || uploadMutation.isPending}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <CardTitle>Dados do serviço</CardTitle>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={() => setConfirmDelete(true)}
            >
              <Trash2 className="h-4 w-4" />
              Excluir
            </Button>
          </CardHeader>
          <CardContent>
            <ServiceForm
              key={service.updated_at}
              defaultValues={toFormValues(service)}
              onSubmit={handleSubmit}
              isLoading={updateMutation.isPending || uploadMutation.isPending}
              submitLabel="Salvar alterações"
            />
          </CardContent>
        </Card>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Excluir serviço"
        description={`Remover "${service.name}" permanentemente?`}
        confirmLabel="Excluir"
        variant="destructive"
        isLoading={deleteMutation.isPending}
        onConfirm={handleDelete}
      />
    </>
  );
}
