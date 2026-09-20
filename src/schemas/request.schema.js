import { z } from "zod";

const priorities = ["low", "medium", "high", "critical"];

const statuses = [
  "new",
  "in_progress",
  "done",
  "rejected",
];

export const createRequestSchema = z.object({
  equipmentId: z.string().uuid(),

  title: z
    .string()
    .trim()
    .min(5, "Название должно содержать минимум 5 символов")
    .max(120, "Название не должно превышать 120 символов"),

  description: z
    .string()
    .max(2000, "Описание не должно превышать 2000 символов")
    .optional(),

  priority: z.enum(priorities),

  plannedAt: z
    .string()
    .datetime()
    .optional(),
});

export const updateRequestSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(5)
      .max(120),

    description: z
      .string()
      .max(2000),

    priority: z.enum(priorities),

    plannedAt: z
      .string()
      .datetime()
      .nullable(),
  })
  .partial()
  .refine(
    (data) => Object.keys(data).length > 0,
    "Передайте хотя бы одно поле для изменения",
  );

export const updateRequestStatusSchema = z.object({
  status: z.enum(statuses),
});