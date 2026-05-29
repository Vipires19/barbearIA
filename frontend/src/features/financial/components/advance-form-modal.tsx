"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { advanceSchema, type AdvanceFormValues } from "@/features/financial/schemas/financial.schema";
import { useCreateAdvance } from "@/features/financial/hooks/use-financial";
import { useProfessionalsList } from "@/features/professionals/hooks/use-professionals";

type AdvanceFormModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function AdvanceFormModal({ open, onOpenChange }: AdvanceFormModalProps) {
  const mutation = useCreateAdvance();
  const { data: professionalsData } = useProfessionalsList({ page: 1, page_size: 100, is_active: true });
  const form = useForm<AdvanceFormValues>({
    resolver: zodResolver(advanceSchema),
    defaultValues: {
      professional_id: "",
      amount: 0,
      notes: "",
    },
  });

  const handleSubmit = async (values: AdvanceFormValues) => {
    await mutation.mutateAsync({
      professional_id: values.professional_id,
      amount: values.amount,
      notes: values.notes?.trim() || null,
    });
    form.reset({ professional_id: "", amount: 0, notes: "" });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Novo vale</DialogTitle>
          <DialogDescription>
            Registre uma retirada antecipada. O valor será descontado na distribuição do profissional.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="professional_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Profissional</FormLabel>
                  <FormControl>
                    <select
                      {...field}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <option value="">Selecione</option>
                      {(professionalsData?.items ?? []).map((pro) => (
                        <option key={pro.id} value={pro.id}>
                          {pro.name}
                        </option>
                      ))}
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor (R$)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" min="0" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observação</FormLabel>
                  <FormControl>
                    <Textarea {...field} value={field.value ?? ""} placeholder="Opcional" rows={3} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? "Salvando..." : "Registrar vale"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
