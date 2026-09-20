import { Router } from "express";
import { requestController } from "../controllers/request.controller.js";
import {
  createRequestSchema,
  updateRequestSchema,
  updateRequestStatusSchema,
  requestListQuerySchema,
} from "../schemas/request.schema.js";
import { uuidParamsSchema } from "../schemas/common.schema.js";
import { validate } from "../middlewares/validate.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.get(
  "/",
  validate("query", requestListQuerySchema),
  asyncHandler(requestController.getAll),
);

router.post(
  "/",
  validate("body", createRequestSchema),
  asyncHandler(requestController.create),
);

router.get(
  "/:id",
  validate("params", uuidParamsSchema),
  asyncHandler(requestController.getById),
);

router.patch(
  "/:id",
  validate("params", uuidParamsSchema),
  validate("body", updateRequestSchema),
  asyncHandler(requestController.update),
);

router.patch(
  "/:id/status",
  validate("params", uuidParamsSchema),
  validate("body", updateRequestStatusSchema),
  asyncHandler(requestController.updateStatus),
);

router.delete(
  "/:id",
  validate("params", uuidParamsSchema),
  asyncHandler(requestController.delete),
);

export default router;