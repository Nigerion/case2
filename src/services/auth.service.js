import bcrypt from "bcrypt";
import { Op } from "sequelize";

import { userRepository } from "../repositories/user.repository.js";
import { Technician } from "../models/index.js";
import { env } from "../config/env.js";
import {
  signAccessToken,
  signRefreshToken,
  verifyToken,
} from "../utils/tokens.js";

import { ConflictError } from "../errors/ConflictError.js";
import { NotFoundError } from "../errors/NotFoundError.js";
import { UnauthorizedError } from "../errors/UnauthorizedError.js";
import { ValidationError } from "../errors/ValidationError.js";

const GENERIC_LOGIN_ERROR = "Неверный email или пароль";
const DUMMY_PASSWORD = "timing-padding-not-a-user-password";
let dummyPasswordHashPromise;

async function hashPassword(password) {
    return bcrypt.hash(password, env.bcryptRounds);
}

export async function initializeAuthService() {
    if (!dummyPasswordHashPromise) {
        dummyPasswordHashPromise = hashPassword(DUMMY_PASSWORD);
    }
    return dummyPasswordHashPromise;
}

async function verifyPassword(password, hash) {
    return bcrypt.compare(password, hash);
}

function toPublicUser(user) {
    return {
        id: user.id,
        email: user.email,
        role: user.role,
        technicianId: user.technicianId ?? null,
        createdAt: user.createdAt,
    };
}

export const authService = {
    async register(data, { actor } = {}) {
        const email = String(data.email ?? "").trim().toLowerCase();

        const existing = await userRepository.findByEmail(email);
        if (existing) {
            throw new ConflictError("Пользователь с таким email уже существует");
        }

        let role = "viewer";
        if (data.role && data.role !== "viewer") {
            if (!actor || actor.role !== "admin") {
                throw new ValidationError(
                "Назначать роль может только администратор",
                [{ field: "role", message: "Недостаточно прав для назначения роли" }],
                422,
                );
            }
            role = data.role;
        }

        let technicianId = null;
        if (role === "technician") {
            if (!data.technicianId) {
                throw new ValidationError(
                    "Для роли technician требуется technicianId",
                    [{
                        field: "technicianId", message: "Обязательное поле" 
                    }],
                    422,
                );
            }
            const technician = await Technician.findByPk(data.technicianId);
            if (!technician) {
                throw new NotFoundError("Специалист не найден");
            }
            technicianId = data.technicianId;
        }

        const passwordHash = await hashPassword(data.password);

        const user = await userRepository.create({
            email,
            passwordHash,
            role,
            technicianId,
        });

        return toPublicUser(user);
    },

    async login({ email, password }) {
        const normalizedEmail = String(email ?? "").trim().toLowerCase();
        const user = await userRepository.findByEmail(normalizedEmail, { withHash: true });
        const passwordHash = user?.isActive
            ? user.passwordHash
            : await initializeAuthService();
        const passwordIsValid = await verifyPassword(password, passwordHash);

        if (!user || !user.isActive || !passwordIsValid) {
            throw new UnauthorizedError(GENERIC_LOGIN_ERROR);
        }

        const accessToken = signAccessToken(user);
        const refreshToken = signRefreshToken(user);

        return {
            user: toPublicUser(user),
            accessToken,
            refreshToken,
        };
    },

    async refresh(refreshToken) {
        if (!refreshToken) {
            throw new UnauthorizedError("Refresh-токен отсутствует");
        }

        let payload;
        try {
            payload = verifyToken(refreshToken);
        } catch {
            throw new UnauthorizedError("Недействительный refresh-токен");
        }

        if (payload.type !== "refresh") {
            throw new UnauthorizedError("Недействительный refresh-токен");
        }

        const user = await userRepository.findById(payload.sub);
        if (!user || !user.isActive) {
            throw new UnauthorizedError("Пользователь не найден или отключён");
        }

        const accessToken = signAccessToken(user);
        const nextRefreshToken = signRefreshToken(user);
        return { user: toPublicUser(user), accessToken, refreshToken: nextRefreshToken };
    },
};