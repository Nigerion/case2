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

    db:{
        host: process.env.POSTGRES_HOST,
        port: Number(process.env.POSTGRES_PORT) || 5432,
        name: process.env.POSTGRES_DB || 'maintenance',
        user : process.env.USERNAME || 'maintenance', 
        password: process.env.PASSWORD ||'maintenance',
        logging: process.env.DB_LOGGING === "true",
        
        pool:{
            min: Number(process.env.DB_POOL_MIN) || 2,
            max: Number(process.env.DB_POOL_MAX) || 10,
            idle: Number(process.env.DB_POOL_IDLE) || 10000,
            acquire: Number(process.env.DB_POOL_ACQUIRE) || 30000
        }
    }
};

export const weatherConfig = {
  maxWindSpeed: Number(process.env.WEATHER_MAX_WIND_SPEED ?? 10),
  allowPrecipitation:
    process.env.WEATHER_ALLOW_PRECIPITATION === "true",
  timeoutMs: Number(process.env.WEATHER_TIMEOUT_MS ?? 5000),
};