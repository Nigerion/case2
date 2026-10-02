import { AppError } from "./AppError.js";

export class ForbiddenError extends AppError {
    constructor(message = "Недостаточно прав") {
        super(message, 403, "FORBIDDEN");
    }
}