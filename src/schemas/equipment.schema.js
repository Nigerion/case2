export const equipmentListQuerySchema = z.object({
  type: z.enum([
    "turbine",
    "inverter",
    "sensor",
    "substation",
  ]).optional(),

  status: z.enum([
    "operational",
    "maintenance",
    "fault",
    "decommissioned",
  ]).optional(),

  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),

  sortBy: z.enum([
    "name",
    "type",
    "status",
    "installedAt",
  ]).default("name"),

  order: z.enum(["asc", "desc"]).default("asc"),
});