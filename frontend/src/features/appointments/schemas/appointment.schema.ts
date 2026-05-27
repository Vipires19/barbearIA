import { z } from "zod";

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

export const appointmentFormSchema = z.object({
  client_name: z.string().min(2, "Informe seu nome").max(200),
  client_phone: z.string().min(8, "Informe um telefone válido").max(30),
  client_email: z.string().email("E-mail inválido").optional().or(z.literal("")),
  service_id: z.string().uuid("Selecione um serviço"),
  professional_id: z.string().uuid("Selecione um profissional"),
  appointment_date: z.string().min(1, "Selecione uma data"),
  start_time: z.string().regex(timeRegex, "Selecione um horário"),
  notes: z.string().max(5000).optional(),
});

export const appointmentRescheduleSchema = z.object({
  appointment_date: z.string().min(1, "Selecione uma data"),
  start_time: z.string().regex(timeRegex, "Use HH:MM"),
  professional_id: z.string().uuid().optional(),
});

export type AppointmentFormValues = z.infer<typeof appointmentFormSchema>;
export type AppointmentRescheduleValues = z.infer<typeof appointmentRescheduleSchema>;
