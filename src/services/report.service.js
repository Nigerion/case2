import { reportRepository } from "../repositories/report.repository.js";

export const reportService = {
    async equipmentLoad(params) {
        const rows = await reportRepository.equipmentLoad(params);
        return {
        data: rows,
        meta: {
            total: rows.length,
            from: params.from ?? null,
            to: params.to ?? null,
            minRequests: params.minRequests,
            sortBy: params.sortBy,
            order: params.order,
        },
        };
    },
};