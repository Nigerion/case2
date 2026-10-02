import "dotenv/config";

const nodeEnv = process.env.NODE_ENV || "development";
const cookieSecure = process.env.COOKIE_SECURE === undefined
    ? nodeEnv === "production"
    : process.env.COOKIE_SECURE === "true";

export const env = {
    port: Number(process.env.PORT) || 3000,

    nodeEnv,

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
        user: process.env.POSTGRES_APP_USER,
        password: process.env.POSTGRES_APP_PASSWORD,
        logging: process.env.DB_LOGGING === "true",
        
        pool:{
            min: Number(process.env.DB_POOL_MIN) || 2,
            max: Number(process.env.DB_POOL_MAX) || 10,
            idle: Number(process.env.DB_POOL_IDLE) || 10000,
            acquire: Number(process.env.DB_POOL_ACQUIRE) || 30000
        }
    },

    jwt:{
        secret: process.env.JWT_SECRET,
        accessTtl : process.env.JWT_ACCESS_TTL || "15m",
        refreshTtl: process.env.JWT_REFRESH_TTL || "7d",
    },

    bcryptRounds: Number(process.env.BCRYPT_ROUNDS) || 10,
    authLoginRateLimit:{
        windowMs: Number(process.env.AUTH_LOGIN_RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
        max: Number(process.env.AUTH_LOGIN_RATE_LIMIT_MAX) || 5
    },
    cookie: {
        secure: cookieSecure,
        sameSite: process.env.COOKIE_SAMESITE || "strict",
        domain: process.env.COOKIE_DOMAIN || undefined,
    },
};

export const weatherConfig = {
  maxWindSpeed: Number(process.env.WEATHER_MAX_WIND_SPEED ?? 10),
  allowPrecipitation:
    process.env.WEATHER_ALLOW_PRECIPITATION === "true",
  timeoutMs: Number(process.env.WEATHER_TIMEOUT_MS ?? 5000),
};

export function validateAuthRuntimeConfig(config = env) {
    const secret = config.jwt.secret;
    if (!secret || /replace-with|your_jwt_secret|change-me/i.test(secret)) {
        throw new Error("JWT_SECRET must be set to a non-placeholder value");
    }

    if (config.nodeEnv === "production" && secret.length < 32) {
        throw new Error("JWT_SECRET must contain at least 32 characters in production");
    }

    if (config.nodeEnv === "production" && !config.cookie.secure) {
        throw new Error("COOKIE_SECURE must be true in production");
    }

    if (!["strict", "lax", "none"].includes(config.cookie.sameSite)) {
        throw new Error("COOKIE_SAMESITE must be strict, lax, or none");
    }

    if (config.cookie.sameSite === "none" && !config.cookie.secure) {
        throw new Error("COOKIE_SECURE must be true when COOKIE_SAMESITE is none");
    }
}