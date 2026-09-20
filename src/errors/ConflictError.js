import { AppError } from "./AppError.js";

export class ConflictError extends AppError {
    constructor(message = "Конфликт данных") {
        super(message, 409, "CONFLICT");
    }
}