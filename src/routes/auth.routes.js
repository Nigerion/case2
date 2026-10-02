import { Router } from "express";
import cookieParser from "cookie-parser";

import { authController } from "../controllers/auth.controller.js";
import { validate } from "../middlewares/validate.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { authenticate } from "../middlewares/authenticate.js";
import { loginRateLimit } from "../middlewares/loginRateLimit.js";
import {
  registerSchema,
  loginSchema,
} from "../schemas/auth.schema.js";

const router = Router();

router.use(cookieParser());

router.post(
  "/register",
  authenticate({ optional: true }),
  validate("body", registerSchema),
  asyncHandler(authController.register),
);

router.post(
  "/login",
  loginRateLimit,
  validate("body", loginSchema),
  asyncHandler(authController.login),
);

router.post(
  "/refresh",
  asyncHandler(authController.refresh),
);

router.post(
  "/logout",
  asyncHandler(authController.logout),
);

router.get(
  "/me",
  authenticate(),
  asyncHandler(authController.me),
);

export default router;