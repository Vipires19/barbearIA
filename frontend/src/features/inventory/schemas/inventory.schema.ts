import { z } from "zod";

export const categorySchema = z.object({
  name: z.string().min(1, "Nome obrigatório").max(100),
  description: z.string().max(500).optional().nullable(),
  color: z.string().min(4).max(7).default("#6366f1"),
  is_active: z.boolean().default(true),
});

export type CategoryFormValues = z.infer<typeof categorySchema>;

export const productSchema = z.object({
  name: z.string().min(1, "Nome obrigatório").max(200),
  description: z.string().max(2000).optional().nullable(),
  category_id: z.string().uuid("Selecione uma categoria"),
  purchase_price: z.coerce.number().min(0, "Preço de compra inválido"),
  sale_price: z.coerce.number().gt(0, "Preço de venda deve ser maior que zero"),
  stock_quantity: z.coerce.number().int().min(0).default(0),
  minimum_stock: z.coerce.number().int().min(0).default(0),
  is_active: z.boolean().default(true),
});

export type ProductFormValues = z.infer<typeof productSchema>;

export const stockAdjustmentSchema = z
  .object({
    movement_type: z.enum(["IN", "OUT", "ADJUSTMENT"]),
    quantity: z.coerce.number().int().min(1).optional(),
    new_quantity: z.coerce.number().int().min(0).optional(),
    reason: z.string().max(500).optional().nullable(),
  })
  .superRefine((data, ctx) => {
    if (data.movement_type === "ADJUSTMENT") {
      if (data.new_quantity === undefined) {
        ctx.addIssue({ code: "custom", message: "Informe a nova quantidade", path: ["new_quantity"] });
      }
    } else if (!data.quantity || data.quantity < 1) {
      ctx.addIssue({ code: "custom", message: "Informe a quantidade", path: ["quantity"] });
    }
  });

export type StockAdjustmentFormValues = z.infer<typeof stockAdjustmentSchema>;

export const saleItemSchema = z.object({
  product_id: z.string().uuid("Selecione um produto"),
  quantity: z.coerce.number().int().min(1, "Quantidade mínima: 1"),
});

export const saleSchema = z.object({
  items: z.array(saleItemSchema).min(1, "Adicione ao menos um item"),
});

export type SaleFormValues = z.infer<typeof saleSchema>;
