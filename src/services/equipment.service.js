import { equipmentRepository } from
    "../repositories/equipment.repository.js";

import { NotFoundError } from "../errors/NotFoundError.js";
import { ConflictError } from "../errors/ConflictError.js";
import { requestRepository } from
    "../repositories/request.repository.js";

export const equipmentService = {

    async getById(id) {
        const equipment = await equipmentRepository.findById(id);

        if (!equipment) {
            throw new NotFoundError("Оборудование не найдено");
        }

        return equipment;
    },

    async getMany(query) {
        return equipmentRepository.findMany(query);
    },

    async create(data) {
        const existing =
            await equipmentRepository.findBySerialNumber(
                data.serialNumber,
            );

        if (existing) {
            throw new ConflictError(
                "Оборудование с таким серийным номером уже существует",
            );
        }

        return equipmentRepository.create(data);
    },

    async update(id, data) {
        await this.getById(id);

        if (data.serialNumber) {
            const existing =
                await equipmentRepository.findBySerialNumber(
                    data.serialNumber,
                );

            if (existing && existing.id !== id) {
                throw new ConflictError(
                    "Серийный номер уже используется",
                );
            }
        }

        return equipmentRepository.update(id, data);
    },

    async delete(id) {
        const equipment = await this.getById(id);

        const requests =
            await requestRepository.findByEquipmentId(id);

        const hasOpenRequests = requests.some(
            (request) =>
                request.status === "new" ||
                request.status === "in_progress",
        );

        if (hasOpenRequests) {
            throw new ConflictError(
                "Нельзя удалить оборудование с открытыми заявками",
            );
        }

        await equipmentRepository.delete(equipment.id);
    }
};