import { Router } from "express";
import { siteController } from "../controllers/site.controller.js";
import { validate } from "../middlewares/validate.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uuidParamsSchema } from "../schemas/common.schema.js";

const router = Router();

router.get(
    "/:id/summary",
    validate("params", uuidParamsSchema),
    asyncHandler(siteController.getSummary),
);

export default router;