import { z } from "zod";

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

const timeBlockSchema = z
  .object({
    start_time: z.string().regex(timeRegex, "Use HH:MM"),
    end_time: z.string().regex(timeRegex, "Use HH:MM"),
  })
  .refine(
    (b) => b.start_time < b.end_time,
    { message: "Início deve ser antes do fim", path: ["end_time"] },
  );

const weekdayDaySchema = z
  .object({
    weekday: z.number().int().min(0).max(6),
    active: z.boolean(),
    blocks: z.array(timeBlockSchema),
  })
  .superRefine((day, ctx) => {
    if (!day.active) return;
    if (day.blocks.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Adicione ao menos um bloco",
        path: ["blocks"],
      });
      return;
    }
    const sorted = [...day.blocks].sort((a, b) => a.start_time.localeCompare(b.start_time));
    for (let i = 1; i < sorted.length; i += 1) {
      if (sorted[i].start_time < sorted[i - 1].end_time) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Blocos não podem se sobrepor",
          path: ["blocks"],
        });
        break;
      }
    }
  });

export const availabilityFormSchema = z.object({
  days: z.array(weekdayDaySchema).length(7),
});

export type AvailabilityFormValues = z.infer<typeof availabilityFormSchema>;
