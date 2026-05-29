import { z } from "zod";



export const professionalOnboardingSchema = z.object({

  name: z.string().min(1, "Nome obrigatório").max(200),

  login_email: z.string().email("E-mail de login inválido"),

  login_password: z

    .string()

    .min(6, "Mínimo 6 caracteres")

    .max(128)

    .optional()

    .or(z.literal("")),

  is_active: z.boolean().default(true),

});



export const professionalAdminSchema = z.object({

  name: z.string().min(1, "Nome obrigatório").max(200),

  is_active: z.boolean().default(true),

  participation_percentage: z.coerce.number().min(0, "Mínimo 0%").max(100, "Máximo 100%").default(0),

  active_for_distribution: z.boolean().default(false),

});



export const professionalProfileSchema = z.object({

  bio: z.string().max(5000).optional().nullable(),

  specialties: z.array(z.string().min(1).max(100)).max(20).default([]),

  service_ids: z.array(z.string().uuid()).default([]),

  is_publicly_visible: z.boolean().default(false),

});



export type ProfessionalOnboardingValues = z.infer<typeof professionalOnboardingSchema>;

export type ProfessionalAdminValues = z.infer<typeof professionalAdminSchema>;

export type ProfessionalProfileValues = z.infer<typeof professionalProfileSchema>;



export const avatarFileSchema = z

  .instanceof(File)

  .refine((f) => f.size <= 5 * 1024 * 1024, "Máximo 5MB")

  .refine(

    (f) => ["image/jpeg", "image/png", "image/webp"].includes(f.type),

    "Use JPEG, PNG ou WebP",

  );

