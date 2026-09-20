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
  serialNumber: z.string().trim().min(1).max(100),
  location: z.object({
    lat: z.number().min(-90).max(90),
    lon: z.number().min(-180).max(180),
  }),
  status: z.enum(equipmentStatuses),
  installedAt: z
    .string()
    .datetime()
    .refine(
      (value) => new Date(value) <= new Date(),
      "Дата установки не может быть в будущем",
    ),
});

export const equipmentPatchSchema = equipmentSchema
  .partial()
  .refine(
    (data) => Object.keys(data).length > 0,
    "Необходимо передать хотя бы одно поле",
  );

export const equipmentListQuerySchema = z.object({
  type: z.enum(equipmentTypes).optional(),
  status: z.enum(equipmentStatuses).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  sortBy: z
    .enum(["name", "type", "status", "installedAt"])
    .default("name"),
  order: z.enum(["asc", "desc"]).default("asc"),
});