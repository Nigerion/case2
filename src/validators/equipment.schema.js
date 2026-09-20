import { z } from "zod";

export const equipmentTypes = [
    "turbine",
    "inverter",
    "sensor",
    "substation",
];

export const equipmentStatuses = [
    "operational",
    "maintenance",
    "fault",
    "decommissioned",
];

export const equipmentSchema = z.object({
    name: z.string().trim().min(3).max(100),

    type: z.enum(equipmentTypes),

    serialNumber: z.string().trim().min(1),

    location: z.object({
        lat: z.number().min(-90).max(90),
        lon: z.number().min(-180).max(180),
    }).strict(),

    status: z.enum(equipmentStatuses),

    installedAt: z.string().datetime().refine(
        (value) => new Date(value) <= new Date(),
        "Дата установки не может быть в будущем",
    ),
}).strict();

export const equipmentPatchSchema =
    equipmentSchema.partial().refine(
        (data) => Object.keys(data).length > 0,
        "Необходимо передать хотя бы одно поле",
    );