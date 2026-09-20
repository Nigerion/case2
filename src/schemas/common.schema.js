import { z } from "zod";

export const uuidParamsSchema = z.object({
    id: z.string().uuid(),
});

export const equipmentIdParamsSchema = z.object({
    equipmentId: z.string().uuid(),
});