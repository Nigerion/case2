import { Router } from "express";

import { equipmentController } from
    "../controllers/equipmentController.js";

import { equipmentSchema, equipmentPatchSchema } from
    "../validators/equipment.schema.js";

import { validate } from "../middlewares/validate.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.get(
    "/",
    asyncHandler(equipmentController.getAll),
);

router.post(
    "/",
    validate(equipmentSchema),
    asyncHandler(equipmentController.create),
);

router.get(
    "/:id",
    asyncHandler(equipmentController.getById),
);

router.patch(
    "/:id",
    validate(equipmentPatchSchema),
    asyncHandler(equipmentController.update),
);

router.delete(
    "/:id",
    asyncHandler(equipmentController.delete),
);

export default router;