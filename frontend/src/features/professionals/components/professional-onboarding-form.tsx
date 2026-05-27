"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  professionalOnboardingSchema,
  type ProfessionalOnboardingValues,
} from "@/features/professionals/schemas/professional.schema";

type ProfessionalOnboardingFormProps = {
  onSubmit: (values: ProfessionalOnboardingValues) => void;
  isLoading?: boolean;
  submitLabel?: string;
};

export function ProfessionalOnboardingForm({
  onSubmit,
  isLoading,
  submitLabel = "Criar profissional",
}: ProfessionalOnboardingFormProps) {
  const form = useForm<ProfessionalOnboardingValues>({
    resolver: zodResolver(professionalOnboardingSchema),
    defaultValues: {
      name: "",
      login_email: "",
      login_password: "",
      is_active: true,
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome</FormLabel>
              <FormControl>
                <Input placeholder="Ex: João Silva" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-4 rounded-xl border border-border/60 bg-muted/20 p-4">
          <p className="text-sm font-medium">Acesso ao dashboard</p>
          <FormField
            control={form.control}
            name="login_email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>E-mail</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="barbeiro@barbearia.com" autoComplete="off" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="login_password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Senha (opcional)</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="Gerar automaticamente se vazio"
                    autoComplete="new-password"
                    {...field}
                    value={field.value ?? ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="is_active"
          render={({ field }) => (
            <FormItem className="flex items-center gap-3 space-y-0">
              <FormControl>
                <input
                  type="checkbox"
                  checked={field.value}
                  onChange={field.onChange}
                  className="h-4 w-4 rounded accent-primary"
                />
              </FormControl>
              <FormLabel className="!mt-0 font-normal">Profissional ativo (operação interna)</FormLabel>
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
          {isLoading ? "Salvando..." : submitLabel}
        </Button>
      </form>
    </Form>
  );
}
