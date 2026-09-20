import { AppError } from "../errors/AppError.js";

export function errorHandler(err, req, res, next) {
    if (res.headersSent) {
        return next(err);
    }

    const isOperationalError = err instanceof AppError;

    const statusCode = isOperationalError
        ? err.statusCode
        : 500;

    const code = isOperationalError
        ? err.code
        : "INTERNAL_SERVER_ERROR";

    const message = isOperationalError
        ? err.message
        : "Внутренняя ошибка сервера";

    const details = isOperationalError
        ? err.details
        : [];

    req.log?.error(
        {
            err,
            requestId: req.requestId,
            statusCode,
        },
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