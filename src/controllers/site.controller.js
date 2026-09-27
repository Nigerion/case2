import { siteService } from "../services/site.service.js";

export const siteController = {
    async getSummary(req, res) {
        const summary = await siteService.getSummary(req.params.id);
        res.status(200).json({ data: summary });
    },
};