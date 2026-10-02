import { Router } from "express";
import { requestController } from "../controllers/request.controller.js";
import {
  createRequestSchema,
  updateRequestSchema,
  updateRequestStatusSchema,
  requestListQuerySchema,
} from "../schemas/request.schema.js";
import { assignCrewSchema, unassignParamsSchema } from "../schemas/assignee.schema.js";
import { uuidParamsSchema } from "../schemas/common.schema.js";
import { validate } from "../middlewares/validate.js";
import { authenticate } from "../middlewares/authenticate.js";
import { authorize } from "../middlewares/authorize.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();
router.use(authenticate());

router.get(
  "/",
  validate("query", requestListQuerySchema),
  asyncHandler(requestController.getAll),
);

router.post(
  "/",
  authorize("technician", "admin"),
  validate("body", createRequestSchema),
  asyncHandler(requestController.create),
);

router.get(
  "/:id/history",
  validate("params", uuidParamsSchema),
  asyncHandler(requestController.getHistory),
);

router.post(
  "/:id/assignees",
  authorize("admin"),
  validate("params", uuidParamsSchema),
  validate("body", assignCrewSchema),
  asyncHandler(requestController.assignCrew),
);

router.delete(
  "/:id/assignees/:userId",
  authorize("admin"),
  validate("params", unassignParamsSchema),
  asyncHandler(requestController.unassign),
);

router.get(
  "/:id",
  validate("params", uuidParamsSchema),
  asyncHandler(requestController.getById),
);

router.patch(
  "/:id",
  authorize("technician", "admin"),
  validate("params", uuidParamsSchema),
  validate("body", updateRequestSchema),
  asyncHandler(requestController.update),
);

router.patch(
  "/:id/status",
  authorize("technician", "admin"),
  validate("params", uuidParamsSchema),
  validate("body", updateRequestStatusSchema),
  asyncHandler(requestController.updateStatus),
);

router.delete(
  "/:id",
  authorize("admin"),
  validate("params", uuidParamsSchema),
  asyncHandler(requestController.delete),
);

export default router;