import { z } from "zod";

/** Telefone como string flexível; backend normaliza para dígitos. */
export const phoneLookupSchema = z.object({
  phone: z
    .string()
    .trim()
    .min(10, "Informe DDD + número (mín. 10 dígitos)")
    .max(30, "Telefone muito longo"),
});

export type PhoneLookupFormValues = z.infer<typeof phoneLookupSchema>;
