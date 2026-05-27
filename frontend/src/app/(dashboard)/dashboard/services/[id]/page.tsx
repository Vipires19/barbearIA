import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
import { ServiceEditForm } from "@/features/services/components/service-edit-form";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditServicePage({ params }: PageProps) {
  const { id } = await params;

  return (
    <>
      <PageHeader
        title="Editar serviço"
        description="Atualize informações e imagem do serviço"
        action={
          <Button variant="outline" asChild>
            <Link href="/dashboard/services">
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Link>
          </Button>
        }
      />
      <ServiceEditForm serviceId={id} />
    </>
  );
}
