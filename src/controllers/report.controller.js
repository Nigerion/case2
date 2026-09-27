import { reportService } from "../services/report.service.js";

export const reportController = {
    async equipmentLoad(req, res) {
        const result = await reportService.equipmentLoad(req.validatedQuery);
        res.status(200).json(result);
    },
};