import { Router } from "express";

import { equipmentController } from
    "../controllers/equipment.controller.js";

import { requestController } from
    "../controllers/request.controller.js";

import { weatherController } from
    "../controllers/weather.controller.js";

import { validate } from "../middlewares/validate.js";
import { asyncHandler } from "../utils/asyncHandler.js";

import {
    equipmentSchema,
    equipmentPatchSchema,
    equipmentListQuerySchema,
} from "../schemas/equipment.schema.js";

import {  uuidParamsSchema, equipmentIdParamsSchema,} from "../schemas/common.schema.js";
import { authorize } from "../middlewares/authorize.js";

const router = Router();

router.get(
    "/",
    validate("query", equipmentListQuerySchema),
    asyncHandler(equipmentController.getAll),
);

router.post(
    "/",
    authorize('admin'),
    validate("body", equipmentSchema),
    asyncHandler(equipmentController.create),
);

router.get(
    "/:equipmentId/requests",
    validate("params", equipmentIdParamsSchema),
    asyncHandler(requestController.getByEquipmentId),
);

router.get(
    "/:id/weather",
    validate("params", uuidParamsSchema),
    asyncHandler(weatherController.getEquipmentWeather),
);

router.get(
    "/:id",
    validate("params", uuidParamsSchema),
    asyncHandler(equipmentController.getById),
);

router.patch(
    "/:id",
    authorize('admin'),
    validate("params", uuidParamsSchema),
    validate("body", equipmentPatchSchema),
    asyncHandler(equipmentController.update),
);

router.delete(
    "/:id",
    authorize('admin'),
    validate("params", uuidParamsSchema),
    asyncHandler(equipmentController.delete),
);

export default router;