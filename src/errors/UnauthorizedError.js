import { AppError } from "./AppError.js";

export class UnauthorizedError extends AppError {
    constructor(message = "Требуется аутентификация") {
        super(message, 401, "UNAUTHORIZED");
    }
}