import { AppError } from "./AppError.js";

export class NotFoundError extends AppError {
    constructor(message = "Ресурс не найден") {
        super(message, 404, "NOT_FOUND");
    }
}