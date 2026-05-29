"use client";

import { Plus, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useCreateSale, useProducts } from "@/features/inventory/hooks/use-inventory";
import type { SaleItemCreatePayload } from "@/features/inventory/types/inventory.types";
import { formatCurrency } from "@/features/inventory/utils/format";

type CreateSaleModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type DraftItem = SaleItemCreatePayload & { key: string };

export function CreateSaleModal({ open, onOpenChange }: CreateSaleModalProps) {
  const { data: productsData } = useProducts(1);
  const mutation = useCreateSale();
  const [items, setItems] = useState<DraftItem[]>([]);

  const activeProducts = useMemo(
    () => productsData?.items.filter((p) => p.is_active && p.stock_quantity > 0) ?? [],
    [productsData],
  );

  useEffect(() => {
    if (open) {
      setItems([{ key: crypto.randomUUID(), product_id: "", quantity: 1 }]);
    }
  }, [open]);

  const addItem = () => {
    setItems((prev) => [...prev, { key: crypto.randomUUID(), product_id: "", quantity: 1 }]);
  };

  const removeItem = (key: string) => {
    setItems((prev) => (prev.length <= 1 ? prev : prev.filter((i) => i.key !== key)));
  };

  const updateItem = (key: string, field: "product_id" | "quantity", value: string | number) => {
    setItems((prev) =>
      prev.map((item) => (item.key === key ? { ...item, [field]: value } : item)),
    );
  };

  const estimatedTotal = useMemo(() => {
    return items.reduce((sum, item) => {
      const product = activeProducts.find((p) => p.id === item.product_id);
      if (!product) return sum;
      return sum + product.sale_price * item.quantity;
    }, 0);
  }, [items, activeProducts]);

  const handleSubmit = async () => {
    const validItems = items.filter((i) => i.product_id && i.quantity > 0);
    if (!validItems.length) return;
    await mutation.mutateAsync({
      items: validItems.map(({ product_id, quantity }) => ({ product_id, quantity })),
    });
    onOpenChange(false);
  };

  const canSubmit = items.some((i) => i.product_id && i.quantity > 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Nova venda</DialogTitle>
          <DialogDescription>
            Selecione os produtos. O estoque e a receita financeira serão atualizados automaticamente.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {items.map((item) => {
            const product = activeProducts.find((p) => p.id === item.product_id);
            return (
              <div key={item.key} className="flex flex-wrap items-end gap-2 rounded-lg border p-3">
                <div className="min-w-[180px] flex-1">
                  <label className="mb-1 block text-xs text-muted-foreground">Produto</label>
                  <select
                    value={item.product_id}
                    onChange={(e) => updateItem(item.key, "product_id", e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="">Selecione...</option>
                    {activeProducts.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.stock_quantity} un.)
                      </option>
                    ))}
                  </select>
                </div>
                <div className="w-24">
                  <label className="mb-1 block text-xs text-muted-foreground">Qtd</label>
                  <Input
                    type="number"
                    min={1}
                    max={product?.stock_quantity ?? 999}
                    value={item.quantity}
                    onChange={(e) => updateItem(item.key, "quantity", Number(e.target.value))}
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Remover item"
                  disabled={items.length <= 1}
                  onClick={() => removeItem(item.key)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            );
          })}
          <Button type="button" variant="outline" size="sm" onClick={addItem}>
            <Plus className="mr-2 h-4 w-4" />
            Adicionar item
          </Button>
        </div>

        <div className="rounded-lg bg-muted/50 p-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total estimado</span>
            <span className="font-semibold tabular-nums">{formatCurrency(estimatedTotal)}</span>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button type="button" disabled={!canSubmit || mutation.isPending} onClick={() => void handleSubmit()}>
            {mutation.isPending ? "Registrando..." : "Registrar venda"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
