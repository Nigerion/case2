import { equipmentRepository } from "../repositories/equipment.repository.js";
import { siteRepository } from "../repositories/site.repository.js";
import { NotFoundError } from "../errors/NotFoundError.js";
import { ConflictError } from "../errors/ConflictError.js";

async function resolveSiteId({ siteId, location }) {
    if (siteId) {
        const site = await siteRepository.findById(siteId);
        if (!site) {
        throw new NotFoundError("Площадка не найдена");
        }
        return siteId;
    }

    if (location) {
        const defaultSite = await siteRepository.findOrCreateDefault();
        await siteRepository.updateCoordinates(defaultSite.id, location);
        return defaultSite.id;
    }

    throw new NotFoundError("Не указан ни siteId, ни location");
}

export const equipmentService = {
    async getById(id) {
        const equipment = await equipmentRepository.findById(id);
        if (!equipment) throw new NotFoundError("Оборудование не найдено");
        return equipment;
    },

    async getMany(query) {
        const { items, total } = await equipmentRepository.findMany(query);
        return {
            data: items,
            meta: { total, page: query.page, limit: query.limit },
        };
    },

    async create(data) {
        const existing = await equipmentRepository.findBySerialNumber(
            data.serialNumber,
        );
        if (existing) {
            throw new ConflictError(
                "Оборудование с таким серийным номером уже существует",
            );
        }

        const siteId = await resolveSiteId({
            siteId: data.siteId,
            location: data.location,
        });

        return equipmentRepository.create({
            siteId,
            name: data.name,
            type: data.type,
            serialNumber: data.serialNumber,
            status: data.status,
            installedAt: data.installedAt,
        });
    },

    async update(id, data) {
        await this.getById(id);

        if (data.serialNumber) {
        const existing = await equipmentRepository.findBySerialNumber(
            data.serialNumber,
        );
        if (existing && existing.id !== id) {
            throw new ConflictError("Серийный номер уже используется");
        }
        }

        const patch = { ...data };

        if (data.siteId || data.location) {
        patch.siteId = await resolveSiteId({
            siteId: data.siteId,
            location: data.location,
        });
        delete patch.location;
        }

        return equipmentRepository.update(id, patch);
    },

    async delete(id) {
        await this.getById(id);

        const hasOpen = await equipmentRepository.hasOpenRequests(id);
        if (hasOpen) {
        throw new ConflictError(
            "Нельзя удалить оборудование с открытыми заявками",
        );
        }

        if (await equipmentRepository.hasRequests(id)) {
        throw new ConflictError(
            "Нельзя удалить оборудование, пока сохранены связанные заявки",
        );
        }

        await equipmentRepository.delete(id);
    },
};