import rateLimit from "express-rate-limit";
import { env } from "../config/env.js";

export const loginRateLimit = rateLimit({
    windowMs: env.authLoginRateLimit.windowMs,
    limit: env.authLoginRateLimit.max,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    keyGenerator: (req) => {
        const email = (req.body?.email || "").toLowerCase();
        return `${req.ip}:${email}`;
    },
    handler: (req, res) => {
        res.status(429).json({
        error: {
            code: "RATE_LIMIT_EXCEEDED",
            message: "Слишком много попыток входа, попробуйте позже",
            details: [],
            requestId: req.requestId,
        },
        });
    },
});