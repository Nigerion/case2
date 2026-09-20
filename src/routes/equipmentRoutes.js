import { Router } from "express";

import { equipmentController } from
    "../controllers/equipmentController.js";

import { equipmentSchema, equipmentPatchSchema } from
    "../validators/equipment.schema.js";

import { validate } from "../middlewares/validate.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { requestController } from "../controllers/request.controller.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

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
  "/:equipmentId/requests",
  asyncHandler(requestController.getByEquipmentId),
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