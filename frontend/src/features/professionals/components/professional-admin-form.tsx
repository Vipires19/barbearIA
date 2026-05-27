"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  professionalAdminSchema,
  type ProfessionalAdminValues,
} from "@/features/professionals/schemas/professional.schema";
import type { Professional } from "@/features/professionals/types/professional.types";

type ProfessionalAdminFormProps = {
  defaultValues?: Professional;
  onSubmit: (values: ProfessionalAdminValues) => void;
  isLoading?: boolean;
};

export function toAdminValues(pro?: Professional): ProfessionalAdminValues {
  return {
    name: pro?.name ?? "",
    is_active: pro?.is_active ?? true,
  };
}

export function ProfessionalAdminForm({ defaultValues: pro, onSubmit, isLoading }: ProfessionalAdminFormProps) {
  const form = useForm<ProfessionalAdminValues>({
    resolver: zodResolver(professionalAdminSchema),
    defaultValues: toAdminValues(pro),
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
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
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
              <FormLabel className="!mt-0 font-normal">Ativo (operação interna)</FormLabel>
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Salvando..." : "Salvar"}
        </Button>
      </form>
    </Form>
  );
}
