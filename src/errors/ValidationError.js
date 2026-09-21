import { AppError } from "./AppError.js";

export class ValidationError extends AppError {
    constructor(
        message = "Некорректные данные запроса. Пожалуйста проверьте данные",
        details = [],
        statusCode = 400,
    ) {
        super(message, statusCode, "VALIDATION_ERROR", details);
    }
}