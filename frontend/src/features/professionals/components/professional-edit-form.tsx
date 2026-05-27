"use client";



import { KeyRound, Trash2 } from "lucide-react";

import Link from "next/link";

import { useRouter } from "next/navigation";

import { useState } from "react";



import { Button } from "@/components/ui/button";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { ConfirmDialog } from "@/components/shared/confirm-dialog";

import { Input } from "@/components/ui/input";

import { Label } from "@/components/ui/label";

import { ProfessionalAdminForm } from "@/features/professionals/components/professional-admin-form";

import { LoadingSkeleton } from "@/features/professionals/components/loading-skeleton";

import {

  useCreateProfessionalAccess,

  useDeleteProfessionalAccess,

  useDeleteProfessional,

  useProfessional,

  useResetProfessionalPassword,

  useUpdateProfessional,

  useUpdateProfessionalAccess,

} from "@/features/professionals/hooks/use-professionals";

import type { ProfessionalAdminValues } from "@/features/professionals/schemas/professional.schema";



type ProfessionalEditFormProps = {

  professionalId: string;

};



export function ProfessionalEditForm({ professionalId }: ProfessionalEditFormProps) {

  const router = useRouter();

  const { data: professional, isLoading } = useProfessional(professionalId);

  const updateMutation = useUpdateProfessional(professionalId);

  const deleteMutation = useDeleteProfessional();

  const createAccess = useCreateProfessionalAccess(professionalId);

  const updateAccess = useUpdateProfessionalAccess(professionalId);

  const deleteAccess = useDeleteProfessionalAccess(professionalId);

  const resetPassword = useResetProfessionalPassword(professionalId);

  const [confirmDelete, setConfirmDelete] = useState(false);

  const [accessEmail, setAccessEmail] = useState("");

  const [accessPassword, setAccessPassword] = useState("");

  const [resetPasswordValue, setResetPasswordValue] = useState("");



  const handleSubmit = async (values: ProfessionalAdminValues) => {

    await updateMutation.mutateAsync(values);

    router.push("/dashboard/professionals");

  };



  const handleDelete = () => {

    deleteMutation.mutate(professionalId, {

      onSuccess: () => router.push("/dashboard/professionals"),

    });

  };



  if (isLoading || !professional) {

    return <LoadingSkeleton variant="form" />;

  }



  return (

    <>

      <div className="mx-auto max-w-2xl space-y-6">

        <Card>

          <CardHeader className="flex flex-row items-center justify-between gap-4">

            <CardTitle>Operação</CardTitle>

            <Button type="button" variant="destructive" size="sm" onClick={() => setConfirmDelete(true)}>

              <Trash2 className="h-4 w-4" />

              Excluir

            </Button>

          </CardHeader>

          <CardContent>

            <ProfessionalAdminForm

              key={professional.updated_at}

              defaultValues={professional}

              onSubmit={handleSubmit}

              isLoading={updateMutation.isPending}

            />

            <p className="mt-4 text-sm text-muted-foreground">

              Foto, bio, serviços e visibilidade pública ficam em{" "}

              <Link href="/dashboard/settings/profile" className="text-primary underline-offset-4 hover:underline">

                Configurações → Perfil

              </Link>{" "}

              (pelo próprio profissional ou admin).

            </p>

          </CardContent>

        </Card>



        <Card>

          <CardHeader>

            <CardTitle className="flex items-center gap-2">

              <KeyRound className="h-4 w-4" aria-hidden />

              Acesso (login)

            </CardTitle>

          </CardHeader>

          <CardContent className="space-y-4">

            {professional.user_id ? (

              <>

                <div className="rounded-xl border p-3 text-sm">

                  <p className="font-medium">Usuário vinculado</p>

                  <p className="text-muted-foreground">{professional.login_email ?? "—"}</p>

                  <p className="mt-1 text-muted-foreground">

                    Status: {professional.login_is_active ? "Ativo" : "Inativo"}

                  </p>

                </div>

                <div className="grid gap-3 sm:grid-cols-2">

                  <div className="space-y-2">

                    <Label htmlFor="login-email">E-mail</Label>

                    <Input

                      id="login-email"

                      type="email"

                      defaultValue={professional.login_email ?? ""}

                      onBlur={(e) => {

                        const value = e.target.value.trim();

                        if (!value || value === professional.login_email) return;

                        updateAccess.mutate({ email: value });

                      }}

                    />

                  </div>

                  <div className="space-y-2">

                    <Label>Status do acesso</Label>

                    <div className="flex flex-wrap items-center gap-2">

                      <Button

                        type="button"

                        variant={professional.login_is_active ? "destructive" : "default"}

                        onClick={() => updateAccess.mutate({ is_active: !professional.login_is_active })}

                      >

                        {professional.login_is_active ? "Desativar acesso" : "Ativar acesso"}

                      </Button>

                      <Button type="button" variant="outline" onClick={() => deleteAccess.mutate()}>

                        Desvincular

                      </Button>

                    </div>

                  </div>

                </div>

                <div className="rounded-xl border p-4">

                  <p className="text-sm font-medium">Redefinir senha</p>

                  <div className="mt-3 flex flex-col gap-2 sm:flex-row">

                    <Input

                      type="password"

                      placeholder="Nova senha (mín. 6)"

                      value={resetPasswordValue}

                      minLength={6}

                      onChange={(e) => setResetPasswordValue(e.target.value)}

                    />

                    <Button

                      type="button"

                      disabled={resetPasswordValue.length < 6 || resetPassword.isPending}

                      onClick={() => {

                        resetPassword.mutate({ new_password: resetPasswordValue });

                        setResetPasswordValue("");

                      }}

                    >

                      Resetar senha

                    </Button>

                  </div>

                </div>

              </>

            ) : (

              <div className="space-y-3">

                <p className="text-sm text-muted-foreground">Crie login para este profissional.</p>

                <div className="grid gap-3 sm:grid-cols-2">

                  <div className="space-y-2">

                    <Label htmlFor="new-email">E-mail</Label>

                    <Input

                      id="new-email"

                      type="email"

                      value={accessEmail}

                      onChange={(e) => setAccessEmail(e.target.value)}

                    />

                  </div>

                  <div className="space-y-2">

                    <Label htmlFor="new-password">Senha</Label>

                    <Input

                      id="new-password"

                      type="password"

                      value={accessPassword}

                      minLength={6}

                      onChange={(e) => setAccessPassword(e.target.value)}

                    />

                  </div>

                </div>

                <Button

                  type="button"

                  disabled={!accessEmail.trim() || accessPassword.length < 6 || createAccess.isPending}

                  onClick={() => {

                    createAccess.mutate({ email: accessEmail.trim(), password: accessPassword });

                    setAccessEmail("");

                    setAccessPassword("");

                  }}

                >

                  Criar login

                </Button>

              </div>

            )}

          </CardContent>

        </Card>

      </div>



      <ConfirmDialog

        open={confirmDelete}

        onOpenChange={setConfirmDelete}

        title="Excluir profissional"

        description={`Remover "${professional.name}" permanentemente?`}

        confirmLabel="Excluir"

        variant="destructive"

        isLoading={deleteMutation.isPending}

        onConfirm={handleDelete}

      />

    </>

  );

}

