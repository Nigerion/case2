import { AppError } from "./AppError.js";

export class ValidationError extends AppError {
    constructor(
        message = "Некорректные данные запроса. Пожалуйста проверьте данные",
        details = [],
    ) {
        super(message, 400, "VALIDATION_ERROR", details);
    }
}