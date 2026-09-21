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


export const requestListQuerySchema = z.object({
  status: z.enum([
    "new",
    "in_progress",
    "done",
    "rejected",
  ]).optional(),

  priority: z.enum([
    "low",
    "medium",
    "high",
    "critical",
  ]).optional(),

  equipmentId: z.string().uuid().optional(),

  createdAtFrom: z.string().datetime().optional(),
  createdAtTo: z.string().datetime().optional(),
  plannedAtFrom: z.string().datetime().optional(),
  plannedAtTo: z.string().datetime().optional(),

  page: z.coerce
    .number()
    .int()
    .min(1)
    .default(1),

  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(100)
    .default(10),

  sortBy: z.enum([
    "createdAt",
    "updatedAt",
    "plannedAt",
    "priority",
    "status",
    "title",
  ]).default("createdAt"),

  order: z.enum(["asc", "desc"]).default("desc"),
}).superRefine((query, context) => {
  const ranges = [
    ["createdAtFrom", "createdAtTo"],
    ["plannedAtFrom", "plannedAtTo"],
  ];

  for (const [from, to] of ranges) {
    if (query[from] && query[to] && query[from] > query[to]) {
      context.addIssue({
        code: "custom",
        path: [from],
        message: "Начало диапазона не может быть позже конца",
      });
    }
  }
});