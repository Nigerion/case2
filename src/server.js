import app from "./app.js";
import { env, validateAuthRuntimeConfig } from "./config/env.js";
import { initializeAuthService } from "./services/auth.service.js";
import { logger } from "./utils/logger.js";
import { assertDatabaseConnection, sequelize } from "./config/db.js";

async function start() {
  validateAuthRuntimeConfig();
  await initializeAuthService();
  await assertDatabaseConnection();

  const server = app.listen(env.port, () => {
    logger.info(
      { port: env.port, env: env.nodeEnv },
      "Server started",
    );
  });

  const shutdown = async (signal) => {
    logger.info({ signal }, "Shutting down...");

    server.close(async () => {
      try {
        await sequelize.close();
        logger.info("Database connection closed");
      } catch (err) {
        logger.error({ err }, "Error closing DB connection");
      }
      process.exit(0);
    });

    setTimeout(() => {
      logger.error("Forced shutdown after timeout");
      process.exit(1);
    }, 10_000).unref();
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

start().catch((err) => {
  logger.fatal({ err }, "Failed to start server");
  process.exit(1);
});