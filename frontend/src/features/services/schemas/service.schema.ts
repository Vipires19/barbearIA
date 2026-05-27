import { z } from "zod";

export const serviceFormSchema = z.object({
  name: z.string().min(1, "Nome obrigatório").max(200),
  description: z.string().max(5000).optional().nullable(),
  price: z.coerce.number().positive("Preço deve ser maior que zero"),
  duration_minutes: z.coerce.number().int().min(5).max(480),
  is_active: z.boolean().default(true),
});

export type ServiceFormValues = z.infer<typeof serviceFormSchema>;

export const imageFileSchema = z
  .instanceof(File)
  .refine((f) => f.size <= 5 * 1024 * 1024, "Máximo 5MB")
  .refine(
    (f) => ["image/jpeg", "image/png", "image/webp"].includes(f.type),
    "Use JPEG, PNG ou WebP",
  );
