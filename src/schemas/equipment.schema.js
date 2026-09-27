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

const locationSchema = z.object({
  lat: z.number().min(-90).max(90),
  lon: z.number().min(-180).max(180),
});

export const equipmentSchema = z.object({
  name: z.string().trim().min(3).max(100),
    type: z.enum(equipmentTypes),
    serialNumber: z.string().trim().min(1).max(100),
    location: locationSchema.optional(),
    siteId: z.string().uuid().optional(),
    status: z.enum(equipmentStatuses),
    installedAt: z
      .string()
      .datetime()
      .refine(
        (value) => new Date(value) <= new Date(),
        "Дата установки не может быть в будущем",
      ),
  })
  .refine(
    (data) => Boolean(data.location) !== Boolean(data.siteId),
    {
      message: "Укажите одно из полей: location или siteId",
      path: ["location"],
    },
  );

export const equipmentPatchSchema =  z
  .object({
    name: z.string().trim().min(3).max(100).optional(),
    type: z.enum(equipmentTypes).optional(),
    serialNumber: z.string().trim().min(1).max(100).optional(),
    location: locationSchema.optional(),
    siteId: z.string().uuid().optional(),
    status: z.enum(equipmentStatuses).optional(),
    installedAt: z
      .string()
      .datetime()
      .refine(
        (value) => new Date(value) <= new Date(),
        "Дата установки не может быть в будущем",
      )
      .optional(),
  })
  .refine(
    (data) => Object.keys(data).length > 0,
    "Необходимо передать хотя бы одно поле",
  )
  .refine(
    (data) => !(data.location && data.siteId),
    {
      message: "Нельзя передавать одновременно location и siteId",
      path: ["siteId"],
    },
  );

export const equipmentListQuerySchema = z.object({
  type: z.enum(equipmentTypes).optional(),
    status: z.enum(equipmentStatuses).optional(),
    installedAtFrom: z.string().datetime().optional(),
    installedAtTo: z.string().datetime().optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
    sortBy: z
      .enum(["name", "type", "status", "installedAt"])
      .default("name"),
    order: z.enum(["asc", "desc"]).default("asc"),
  })
  .refine(
    (query) =>
      !query.installedAtFrom ||
      !query.installedAtTo ||
      query.installedAtFrom <= query.installedAtTo,
    {
      message: "Начало диапазона не может быть позже конца",
      path: ["installedAtFrom"],
    },
  );