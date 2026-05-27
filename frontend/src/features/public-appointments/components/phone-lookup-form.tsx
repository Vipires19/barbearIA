"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Search } from "lucide-react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { phoneLookupSchema, type PhoneLookupFormValues } from "@/features/public-appointments/schemas/phone-lookup.schema";

type PhoneLookupFormProps = {
  defaultPhone?: string;
  onSubmit: (values: PhoneLookupFormValues) => void;
  isLoading?: boolean;
};

export function PhoneLookupForm({ defaultPhone = "", onSubmit, isLoading }: PhoneLookupFormProps) {
  const form = useForm<PhoneLookupFormValues>({
    resolver: zodResolver(phoneLookupSchema),
    defaultValues: { phone: defaultPhone },
  });

  return (
    <form
      className="space-y-4 rounded-2xl border border-border/60 bg-card/80 p-4 shadow-sm sm:p-6"
      onSubmit={form.handleSubmit(onSubmit)}
      noValidate
    >
      <div className="space-y-2">
        <Label htmlFor="public-phone">Seu telefone</Label>
        <p className="text-xs text-muted-foreground">
          Use o mesmo número informado no agendamento (com DDD). Sem login e sem senha.
        </p>
        <Input
          id="public-phone"
          inputMode="tel"
          autoComplete="tel"
          placeholder="(11) 98765-4321"
          {...form.register("phone")}
          className="text-base"
        />
        {form.formState.errors.phone ? (
          <p className="text-sm text-destructive">{form.formState.errors.phone.message}</p>
        ) : null}
      </div>
      <Button type="submit" className="w-full sm:w-auto" disabled={isLoading}>
        <Search className="mr-2 h-4 w-4" aria-hidden />
        Ver meus horários
      </Button>
    </form>
  );
}
