import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
import { ServiceCreateForm } from "@/features/services/components/service-create-form";

export default function NewServicePage() {
  return (
    <>
      <PageHeader
        title="Novo serviço"
        description="Cadastre um serviço para exibir na área pública"
        action={
          <Button variant="outline" asChild>
            <Link href="/dashboard/services">
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Link>
          </Button>
        }
      />
      <ServiceCreateForm />
    </>
  );
}
