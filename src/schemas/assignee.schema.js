import { z } from "zod";

export const assigneeItemSchema = z.object({
    technicianId: z.string().uuid(),
    role: z.enum(["lead", "member"]),
    hours: z.number().min(0).max(1000).optional(),
});

export const assignCrewSchema = z.object({
    assignees: z
        .array(assigneeItemSchema)
        .min(1)
        .max(20),
    changedBy: z.string().min(1).max(150).optional(),
});

export const unassignParamsSchema = z.object({
    id: z.string().uuid(),
    userId: z.string().uuid(),
});