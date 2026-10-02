import { verifyToken } from "../utils/tokens.js";
import { userRepository } from "../repositories/user.repository.js";
import { UnauthorizedError } from "../errors/UnauthorizedError.js";

export function authenticate({ optional = false } = {}) {
    return async function (req, res, next) {
        const header = req.headers.authorization;
        if (!header || !/^Bearer\s+/i.test(header)) {
            if (optional) return next();
            return next(new UnauthorizedError());
        }

        const token = header.replace(/^Bearer\s+/i, "").trim();

        let payload;
        try {
            payload = verifyToken(token);
        } catch {
            if (optional) return next();
            return next(new UnauthorizedError("Недействительный токен"));
        }

        if (!payload || !payload.sub) {
            if (optional) return next();
            return next(new UnauthorizedError("Недействительный токен"));
        }

        if (payload.type === "refresh") {
            return next(new UnauthorizedError("Refresh-токен не подходит для доступа"));
        }

        if (payload.type && payload.type !== "access") {
            return next(new UnauthorizedError("Недействительный токен"));
        }

        try {
            const user = await userRepository.findById(payload.sub);
            if (!user || !user.isActive) {
                return next(new UnauthorizedError("Пользователь не найден или отключён"));
            }

            req.user = {
                id: user.id,
                email: user.email,
                role: user.role,
                technicianId: user.technicianId ?? null,
            };

            next();
        } catch (err) {
            next(err);
        }
    };
}