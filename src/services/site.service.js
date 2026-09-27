import { siteRepository } from "../repositories/site.repository.js";
import { NotFoundError } from "../errors/NotFoundError.js";

export const siteService = {
    async getSummary(siteId) {
        const site = await siteRepository.findById(siteId);
        if (!site) {
        throw new NotFoundError("Площадка не найдена");
        }

        const summary = await siteRepository.summary(siteId);

        return {
        site: {
            id: site.id,
            name: site.name,
            code: site.code,
            region: site.region,
        },
        ...summary,
        };
    },
};