import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
import { ProfessionalCreateForm } from "@/features/professionals/components/professional-create-form";

export default function NewProfessionalPage() {
  return (
    <>
      <PageHeader
        title="Novo profissional"
        description="Cadastre um membro da equipe"
        action={
          <Button variant="outline" asChild>
            <Link href="/dashboard/professionals">
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Link>
          </Button>
        }
      />
      <ProfessionalCreateForm />
    </>
  );
}
