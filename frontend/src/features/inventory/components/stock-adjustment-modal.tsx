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
import { stockAdjustmentSchema, type StockAdjustmentFormValues } from "@/features/inventory/schemas/inventory.schema";
import { useUpdateProductStock } from "@/features/inventory/hooks/use-inventory";
import type { Product } from "@/features/inventory/types/inventory.types";
import { MOVEMENT_TYPE_LABELS } from "@/features/inventory/types/inventory.types";

type StockAdjustmentModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: Product;
};

export function StockAdjustmentModal({ open, onOpenChange, product }: StockAdjustmentModalProps) {
  const mutation = useUpdateProductStock();
  const form = useForm<StockAdjustmentFormValues>({
    resolver: zodResolver(stockAdjustmentSchema),
    defaultValues: {
      movement_type: "IN",
      quantity: 1,
      reason: "",
    },
  });

  const movementType = form.watch("movement_type");

  useEffect(() => {
    if (open) {
      form.reset({
        movement_type: "IN",
        quantity: 1,
        new_quantity: product?.stock_quantity,
        reason: "",
      });
    }
  }, [open, product, form]);

  const handleSubmit = async (values: StockAdjustmentFormValues) => {
    if (!product) return;
    await mutation.mutateAsync({
      id: product.id,
      payload: {
        movement_type: values.movement_type,
        quantity: values.quantity ?? 1,
        new_quantity: values.new_quantity,
        reason: values.reason || null,
      },
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Ajustar estoque</DialogTitle>
          <DialogDescription>
            {product ? (
              <>
                {product.name} — estoque atual: <strong>{product.stock_quantity}</strong>
              </>
            ) : (
              "Atualize a quantidade em estoque."
            )}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="movement_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo</FormLabel>
                  <FormControl>
                    <select
                      {...field}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      {Object.entries(MOVEMENT_TYPE_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {movementType === "ADJUSTMENT" ? (
              <FormField
                control={form.control}
                name="new_quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nova quantidade</FormLabel>
                    <FormControl>
                      <Input type="number" step="1" min="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : (
              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantidade</FormLabel>
                    <FormControl>
                      <Input type="number" step="1" min="1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Motivo</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value ?? ""} placeholder="Opcional" />
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
                {mutation.isPending ? "Salvando..." : "Atualizar estoque"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
