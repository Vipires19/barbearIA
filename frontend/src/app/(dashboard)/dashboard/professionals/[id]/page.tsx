import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
import { ProfessionalEditForm } from "@/features/professionals/components/professional-edit-form";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditProfessionalPage({ params }: PageProps) {
  const { id } = await params;

  return (
    <>
      <PageHeader
        title="Editar profissional"
        description="Atualize dados, disponibilidade e serviços"
        action={
          <Button variant="outline" asChild>
            <Link href="/dashboard/professionals">
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Link>
          </Button>
        }
      />
      <ProfessionalEditForm professionalId={id} />
    </>
  );
}
