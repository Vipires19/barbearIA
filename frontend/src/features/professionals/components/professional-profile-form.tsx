"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { ServicesMultiSelect } from "@/features/professionals/components/services-multi-select";
import { SpecialtiesSelect } from "@/features/professionals/components/specialties-select";
import {
  professionalProfileSchema,
  type ProfessionalProfileValues,
} from "@/features/professionals/schemas/professional.schema";
import type { Professional } from "@/features/professionals/types/professional.types";

type ProfessionalProfileFormProps = {
  defaultValues?: Professional;
  onSubmit: (values: ProfessionalProfileValues) => void;
  isLoading?: boolean;
};

export function toProfileValues(pro?: Professional): ProfessionalProfileValues {
  return {
    bio: pro?.bio ?? "",
    specialties: pro?.specialties ?? [],
    service_ids: pro?.services?.map((s) => s.id) ?? [],
    is_publicly_visible: pro?.is_publicly_visible ?? false,
  };
}

export function ProfessionalProfileForm({
  defaultValues: pro,
  onSubmit,
  isLoading,
}: ProfessionalProfileFormProps) {
  const form = useForm<ProfessionalProfileValues>({
    resolver: zodResolver(professionalProfileSchema),
    defaultValues: toProfileValues(pro),
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="bio"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Bio</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Breve apresentação..."
                  rows={3}
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="specialties"
          render={({ field }) => (
            <FormItem>
              <SpecialtiesSelect value={field.value} onChange={field.onChange} disabled={isLoading} />
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="service_ids"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Serviços que executa</FormLabel>
              <ServicesMultiSelect value={field.value} onChange={field.onChange} disabled={isLoading} />
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="is_publicly_visible"
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
              <FormLabel className="!mt-0 font-normal">Visível na área pública</FormLabel>
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Salvando..." : "Salvar perfil"}
        </Button>
      </form>
    </Form>
  );
}
