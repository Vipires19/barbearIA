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
import { Textarea } from "@/components/ui/textarea";
import { productSchema, type ProductFormValues } from "@/features/inventory/schemas/inventory.schema";
import { useCategories, useCreateProduct, useUpdateProduct } from "@/features/inventory/hooks/use-inventory";
import type { Product } from "@/features/inventory/types/inventory.types";

type ProductFormModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: Product;
};

export function ProductFormModal({ open, onOpenChange, product }: ProductFormModalProps) {
  const createMutation = useCreateProduct();
  const updateMutation = useUpdateProduct();
  const { data: categories } = useCategories(true);
  const isEdit = !!product;

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      description: "",
      category_id: "",
      purchase_price: 0,
      sale_price: 0,
      stock_quantity: 0,
      minimum_stock: 0,
      is_active: true,
    },
  });

  useEffect(() => {
    if (product && open) {
      form.reset({
        name: product.name,
        description: product.description ?? "",
        category_id: product.category_id,
        purchase_price: product.purchase_price,
        sale_price: product.sale_price,
        stock_quantity: product.stock_quantity,
        minimum_stock: product.minimum_stock,
        is_active: product.is_active,
      });
    } else if (!product && open) {
      const defaultCategory = categories?.items[0]?.id ?? "";
      form.reset({
        name: "",
        description: "",
        category_id: defaultCategory,
        purchase_price: 0,
        sale_price: 0,
        stock_quantity: 0,
        minimum_stock: 0,
        is_active: true,
      });
    }
  }, [product, open, form, categories]);

  const handleSubmit = async (values: ProductFormValues) => {
    if (isEdit && product) {
      await updateMutation.mutateAsync({
        id: product.id,
        payload: {
          name: values.name,
          description: values.description || null,
          category_id: values.category_id,
          purchase_price: values.purchase_price,
          sale_price: values.sale_price,
          minimum_stock: values.minimum_stock,
          is_active: values.is_active,
        },
      });
    } else {
      await createMutation.mutateAsync({
        name: values.name,
        description: values.description || null,
        category_id: values.category_id,
        purchase_price: values.purchase_price,
        sale_price: values.sale_price,
        stock_quantity: values.stock_quantity,
        minimum_stock: values.minimum_stock,
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
          <DialogTitle>{isEdit ? "Editar produto" : "Novo produto"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Atualize os dados do produto." : "Cadastre um produto para venda na barbearia."}
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
                    <Input {...field} placeholder="Ex: Pomada modeladora" />
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
                    <Textarea {...field} value={field.value ?? ""} placeholder="Opcional" rows={2} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="category_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoria</FormLabel>
                  <FormControl>
                    <select
                      {...field}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="">Selecione...</option>
                      {categories?.items.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="purchase_price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preço compra (R$)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" min="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="sale_price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preço venda (R$)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" min="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            {!isEdit ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="stock_quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estoque inicial</FormLabel>
                      <FormControl>
                        <Input type="number" step="1" min="0" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="minimum_stock"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estoque mínimo</FormLabel>
                      <FormControl>
                        <Input type="number" step="1" min="0" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            ) : (
              <FormField
                control={form.control}
                name="minimum_stock"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estoque mínimo</FormLabel>
                    <FormControl>
                      <Input type="number" step="1" min="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            {isEdit ? (
              <FormField
                control={form.control}
                name="is_active"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2">
                    <FormControl>
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={field.onChange}
                        className="h-4 w-4 rounded border border-input"
                      />
                    </FormControl>
                    <FormLabel className="!mt-0">Produto ativo</FormLabel>
                  </FormItem>
                )}
              />
            ) : null}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={pending}>
                {pending ? "Salvando..." : isEdit ? "Salvar" : "Cadastrar"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
