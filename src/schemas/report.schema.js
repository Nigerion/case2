import { z } from "zod";

export const equipmentLoadQuerySchema = z.object({
    from: z.string().datetime().optional(),
    to: z.string().datetime().optional(),
    minRequests: z.coerce.number().int().min(0).max(1000).default(1),
    sortBy: z
        .enum([
            "requestCount",
            "closedCount",
            "totalHours",
            "lastMaintenanceAt",
        ])
        .default("requestCount"),
    order: z.enum(["asc", "desc"]).default("desc"),
    limit: z.coerce.number().int().min(1).max(100).default(50),
    offset: z.coerce.number().int().min(0).max(10000).default(0),
    })
    .refine(
        (q) => !q.from || !q.to || q.from <= q.to,
        {
        message: "Начало периода не может быть позже конца",
        path: ["from"],
        },
    );