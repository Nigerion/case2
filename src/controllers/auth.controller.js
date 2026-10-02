import { authService } from "../services/auth.service.js";
import {
  setRefreshCookie,
  clearRefreshCookie,
} from "../utils/tokens.js";

export const authController = {
    async register(req, res) {
        const user = await authService.register(req.body, {
        actor: req.user ?? null,
        });

        res.status(201).json({ data: user });
    },

    async login(req, res) {
        const { user, accessToken, refreshToken } =
        await authService.login(req.body);

        setRefreshCookie(res, refreshToken);

        res.status(200).json({
        data: {
            user,
            accessToken,
        },
        });
    },

    async refresh(req, res) {
        const token = req.cookies?.refreshToken;
        const { user, accessToken } = await authService.refresh(token);

        res.status(200).json({
        data: {
            user,
            accessToken,
        },
        });
    },

    async logout(req, res) {
        clearRefreshCookie(res);
        res.status(204).send();
    },

    async me(req, res) {
        res.status(200).json({ data: req.user });
    },
};