import express from "express";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";

import { AppError } from "./errors/AppError.js";
import { env } from "./config/env.js";
import { requestIdMiddleware } from "./middlewares/requestId.js";
import { requestLogger } from "./utils/requestLogger.js";
import { notFoundMiddleware } from "./middlewares/notFoundMiddleware.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import equipmentRoutes from "./routes/equipment.routes.js";
import requestRoutes from "./routes/request.routes.js";
import siteRoutes from "./routes/site.routes.js";
import reportRoutes from "./routes/report.routes.js";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth.routes.js";
import { sequelize } from "./config/db.js";
import { logger } from "./utils/logger.js";
import { readFileSync } from "node:fs";
import { parse as parseYaml } from "yaml";
import swaggerUi from "swagger-ui-express";
import {
    metricsRegistry,
    metricsMiddleware,
    refreshBusinessMetrics,
} from "./monitoring/metrics.js";

const openapiSpec = parseYaml(
    readFileSync(new URL("./openapi/openapi.yaml", import.meta.url), "utf8"),
);

const app = express();
app.set("trust proxy", 1);
app.use(requestIdMiddleware);
app.use(requestLogger);
app.use(helmet());
app.use(
    cors({
        origin(origin, callback) {
            if (!origin) return callback(null, true);
            if (env.corsOrigins.includes(origin)) return callback(null, true);
            return callback(
                new AppError("Origin не разрешён политикой CORS", 403, "CORS_FORBIDDEN"),
            );
        },
        methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    }),
);

app.use(metricsMiddleware);

app.get("/metrics", async (req, res, next) => {
    try {
        await refreshBusinessMetrics();
        res.set("Content-Type", metricsRegistry.contentType);
        res.end(await metricsRegistry.metrics());
    } catch (error) {
        next(error);
    }
});

app.get("/api/health/live", (req, res) => {
    res.status(200).json({ status: "alive", requestId: req.requestId });
});

app.get("/api/health/ready", async (req, res) => {
    try {
        await sequelize.authenticate();
        res.status(200).json({
            status: "ready",
            dependencies: { database: "available" },
            requestId: req.requestId,
        });
    } catch (error) {
        logger.warn({ err: error, requestId: req.requestId }, "Readiness check failed");
        res.status(503).json({
            status: "not_ready",
            dependencies: { database: "unavailable" },
            requestId: req.requestId,
        });
    }
});

app.get("/api/health", (req, res) => {
    res.status(200).json({
        status: "ok",
        message: "Maintenance API is running",
        requestId: req.requestId,
    });
});

app.get("/api/openapi.json", (req, res) => {
    res.status(200).json(openapiSpec);
});

app.use(
    "/api/docs",
    helmet.contentSecurityPolicy({
        directives: { scriptSrc: ["'self'", "'unsafe-inline'"] },
    }),
    swaggerUi.serve,
    swaggerUi.setup(openapiSpec, {
        customSiteTitle: "Maintenance API | OpenAPI",
        swaggerOptions: { persistAuthorization: true },
    }),
);

const apiLimiter = rateLimit({
    windowMs: env.rateLimitWindowMs,
    limit: env.rateLimitMax,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    handler: (req, res) => {
        res.status(429).json({
            error: {
                code: "RATE_LIMIT_EXCEEDED",
                message: "Слишком много запросов, попробуйте позже",
                details: [],
                requestId: req.requestId,
            },
        });
    },
});

app.use("/api", apiLimiter);
app.use(cookieParser());
app.use(express.json({ limit: "100kb" }));

app.use("/api/equipment", equipmentRoutes);
app.use("/api/requests", requestRoutes);
app.use("/api/sites", siteRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/auth", authRoutes);
app.use(notFoundMiddleware);
app.use(errorHandler);

export default app;