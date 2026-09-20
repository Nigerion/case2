import "dotenv/config";

export const env = {
    port: Number(process.env.PORT) || 3000,

    nodeEnv: process.env.NODE_ENV || "development",

    corsOrigins: (process.env.CORS_ORIGINS || "")
        .split(",")
        .map((origin) => origin.trim())
        .filter(Boolean),

    rateLimitWindowMs:
        Number(process.env.RATE_LIMIT_WINDOW_MS) || 900000,

    rateLimitMax:
        Number(process.env.RATE_LIMIT_MAX) || 100,

    weatherApiUrl: process.env.WEATHER_API_URL || "",

    requestTimeoutMs:
        Number(process.env.REQUEST_TIMEOUT_MS) || 5000,
};