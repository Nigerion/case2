import express from "express";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";

import { env } from "./config/env.js";
import { requestIdMiddleware } from "./middlewares/requestId.js";
import { requestLogger } from "./utils/requestLogger.js";
import { notFoundMiddleware } from "./middlewares/notFoundMiddleware.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import equipmentRoutes from "./routes/equipmentRoutes.js";
import requestRoutes from "./routes/request.routes.js";

const app = express();
app.use(requestIdMiddleware);

app.use(requestLogger);

app.use(helmet());
app.use(
    cors({
        origin(origin, callback) {
            if (!origin) {
                return callback(null, true);
            }

            if (env.corsOrigins.includes(origin)) {
                return callback(null, true);
            }

            return callback(
                new Error("Origin не разрешён политикой CORS"),
            );
        },
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    }),
);

const apiLimiter = rateLimit({
    windowMs: env.rateLimitWindowMs,
    limit: env.rateLimitMax,
    standardHeaders: "draft-8",
    legacyHeaders: false,
});

app.use("/api", apiLimiter);

app.use(express.json({ limit: '100kb' }));

app.get("/api/health", (req, res) => {
    res.status(200).json({
        status: "ok",
        message: "Maintenance API is running",
        requestId: req.requestId,
    });
});

app.use("/api/equipment", equipmentRoutes);
app.use("/api/requests", requestRoutes);

app.use(notFoundMiddleware);

app.use(errorHandler);

export default app;