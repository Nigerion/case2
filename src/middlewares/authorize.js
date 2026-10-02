import { ForbiddenError } from "../errors/ForbiddenError.js";
import { UnauthorizedError } from "../errors/UnauthorizedError.js";

export function authorize(...allowedRoles) {
    return function (req, res, next) {
        if (!req.user) {
            return next(new UnauthorizedError());
        }

        if (!allowedRoles.includes(req.user.role)) {
            return next(new ForbiddenError());
        }

        next();
    };
}