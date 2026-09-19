import { AppError } from "./AppError";


export class ValidationError extends AppError {
    constructor(message='Ошибка валидации', datails=[]) {
        super(message, 400, "VALIDATION_ERROR", datails );
    }
}