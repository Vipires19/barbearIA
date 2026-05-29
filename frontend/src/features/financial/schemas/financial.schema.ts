import { z } from "zod";

const expenseCategoryValues = [
  "RENT",
  "ENERGY",
  "WATER",
  "INTERNET",
  "SUPPLIES",
  "MAINTENANCE",
  "TAXES",
  "OTHER",
] as const;

export const expenseSchema = z.object({
  description: z.string().min(1, "Descrição obrigatória").max(500),
  category: z.enum(expenseCategoryValues, { message: "Categoria inválida" }),
  amount: z.coerce.number().positive("Valor deve ser positivo"),
  expense_date: z.string().min(1, "Data obrigatória"),
});

export const advanceSchema = z.object({
  professional_id: z.string().uuid("Selecione um profissional"),
  amount: z.coerce.number().positive("Valor deve ser positivo"),
  notes: z.string().max(2000).optional().nullable(),
});

export const financialSettingsSchema = z.object({
  reserve_percentage: z.coerce.number().min(0, "Mínimo 0%").max(100, "Máximo 100%"),
});

export type ExpenseFormValues = z.infer<typeof expenseSchema>;
export type AdvanceFormValues = z.infer<typeof advanceSchema>;
export type FinancialSettingsFormValues = z.infer<typeof financialSettingsSchema>;
