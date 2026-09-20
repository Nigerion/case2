import { Router } from "express";

import { requestController } from "../controllers/request.controller.js";

import {
  createRequestSchema,
  updateRequestSchema,
  updateRequestStatusSchema,
  requestListQuerySchema,
} from "../schemas/request.schema.js";

import { validate } from "../middleware/validate.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

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
  asyncHandler(requestController.getById),
);

router.patch(
  "/:id",
  validate("body", updateRequestSchema),
  asyncHandler(requestController.update),
);

router.patch(
  "/:id/status",
  validate("body", updateRequestStatusSchema),
  asyncHandler(requestController.updateStatus),
);

router.delete(
  "/:id",
  asyncHandler(requestController.delete),
);

export default router;