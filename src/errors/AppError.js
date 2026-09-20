export class AppError extends Error {
    constructor(message, statusCode, code, details = []) {
        super(message);

        this.name = this.constructor.name;
        this.statusCode = statusCode;
        this.code = code;
        this.details = details;

        Error.captureStackTrace?.(this, this.constructor);
    }
}