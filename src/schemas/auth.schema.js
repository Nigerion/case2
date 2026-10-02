import { z } from "zod";

export const registerSchema = z.object({
    email: z.string().trim().toLowerCase().email().max(150),
    password: z
        .string()
        .min(8, "Пароль должен содержать минимум 8 символов")
        .max(72, "Пароль не должен превышать 72 символа"),
    role: z.enum(["viewer", "technician", "admin"]).optional(),
    technicianId: z.string().uuid().optional(),
});

export const loginSchema = z.object({
    email: z.string().trim().toLowerCase().email(),
    password: z.string().min(1).max(72),
});