"use client";



import { useRouter } from "next/navigation";



import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { ProfessionalOnboardingForm } from "@/features/professionals/components/professional-onboarding-form";

import { useCreateProfessional } from "@/features/professionals/hooks/use-professionals";

import type { ProfessionalOnboardingValues } from "@/features/professionals/schemas/professional.schema";

import type { ProfessionalCreatePayload } from "@/features/professionals/types/professional.types";



export function ProfessionalCreateForm() {

  const router = useRouter();

  const createMutation = useCreateProfessional();



  const handleSubmit = async (values: ProfessionalOnboardingValues) => {

    const payload: ProfessionalCreatePayload = {

      name: values.name,

      login_email: values.login_email,

      login_password: values.login_password?.trim() ? values.login_password.trim() : null,

      is_active: values.is_active,

    };

    await createMutation.mutateAsync(payload);

    router.push("/dashboard/professionals");

  };



  return (

    <div className="mx-auto max-w-2xl">

      <Card>

        <CardHeader>

          <CardTitle>Novo profissional</CardTitle>

        </CardHeader>

        <CardContent>

          <ProfessionalOnboardingForm

            onSubmit={handleSubmit}

            isLoading={createMutation.isPending}

          />

        </CardContent>

      </Card>

    </div>

  );

}

