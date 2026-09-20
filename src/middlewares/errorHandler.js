import { AppError } from "../errors/AppError.js";

export function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  if (err.type === "entity.parse.failed") {
    req.log?.error({ err, requestId: req.requestId }, "Invalid JSON");
    return res.status(400).json({
      error: {
        code: "INVALID_JSON",
        message: "Некорректный JSON в теле запроса",
        details: [],
        requestId: req.requestId,
      },
    });
  }

  if (err.type === "entity.too.large") {
    return res.status(413).json({
      error: {
        code: "PAYLOAD_TOO_LARGE",
        message: "Тело запроса слишком большое",
        details: [],
        requestId: req.requestId,
      },
    });
  }

  const isOperationalError = err instanceof AppError;

  const statusCode = isOperationalError ? err.statusCode : 500;
  const code = isOperationalError ? err.code : "INTERNAL_SERVER_ERROR";
  const message = isOperationalError
    ? err.message
    : "Внутренняя ошибка сервера";
  const details = isOperationalError ? err.details : [];

  req.log?.error(
    { err, requestId: req.requestId, statusCode },
    "Request failed",
  );

  res.status(statusCode).json({
    error: {
      code,
      message,
      details,
      requestId: req.requestId,
    },
  });
}