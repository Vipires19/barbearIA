"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
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
import { categorySchema, type CategoryFormValues } from "@/features/inventory/schemas/inventory.schema";
import { useCreateCategory, useUpdateCategory } from "@/features/inventory/hooks/use-inventory";
import type { ProductCategory } from "@/features/inventory/types/inventory.types";

type CategoryFormModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category?: ProductCategory;
};

export function CategoryFormModal({ open, onOpenChange, category }: CategoryFormModalProps) {
  const createMutation = useCreateCategory();
  const updateMutation = useUpdateCategory();
  const isEdit = !!category;

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: "",
      description: "",
      color: "#6366f1",
      is_active: true,
    },
  });

  useEffect(() => {
    if (category && open) {
      form.reset({
        name: category.name,
        description: category.description ?? "",
        color: category.color,
        is_active: category.is_active,
      });
    } else if (!category && open) {
      form.reset({
        name: "",
        description: "",
        color: "#6366f1",
        is_active: true,
      });
    }
  }, [category, open, form]);

  const handleSubmit = async (values: CategoryFormValues) => {
    if (isEdit && category) {
      await updateMutation.mutateAsync({
        id: category.id,
        payload: {
          name: values.name,
          description: values.description || null,
          color: values.color,
          is_active: values.is_active,
        },
      });
    } else {
      await createMutation.mutateAsync({
        name: values.name,
        description: values.description || null,
        color: values.color,
        is_active: values.is_active,
      });
    }
    onOpenChange(false);
  };

  const pending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar categoria" : "Nova categoria"}</DialogTitle>
          <DialogDescription>
            Organize seus produtos em categorias personalizadas para a operação.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Ex: Pomadas" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value ?? ""} placeholder="Opcional" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="color"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cor</FormLabel>
                    <FormControl>
                      <div className="flex gap-2">
                        <Input type="color" className="h-10 w-14 p-1" {...field} />
                        <Input {...field} className="flex-1 font-mono text-sm" />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {isEdit ? (
                <FormField
                  control={form.control}
                  name="is_active"
                  render={({ field }) => (
                    <FormItem className="flex items-end gap-2 pb-2">
                      <FormControl>
                        <input
                          type="checkbox"
                          checked={field.value}
                          onChange={field.onChange}
                          className="h-4 w-4 rounded border border-input"
                        />
                      </FormControl>
                      <FormLabel className="!mt-0">Ativa</FormLabel>
                    </FormItem>
                  )}
                />
              ) : null}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={pending}>
                {pending ? "Salvando..." : isEdit ? "Salvar" : "Criar"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
