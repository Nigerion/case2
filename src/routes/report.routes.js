import { Router } from "express";
import { reportController } from "../controllers/report.controller.js";
import { validate } from "../middlewares/validate.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { equipmentLoadQuerySchema } from "../schemas/report.schema.js";

const router = Router();

router.get(
    "/equipment-load",
    validate("query", equipmentLoadQuerySchema),
    asyncHandler(reportController.equipmentLoad),
);

export default router;