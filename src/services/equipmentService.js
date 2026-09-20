import { equipmentRepository } from
    "../repositories/equipmentRepository.js";

import { NotFoundError } from "../errors/NotFoundError.js";
import { ConflictError } from "../errors/ConflictError.js";

export const equipmentService = {
    async getAll() {
        return equipmentRepository.findAll();
    },

    async getById(id) {
        const equipment = await equipmentRepository.findById(id);

        if (!equipment) {
            throw new NotFoundError("Оборудование не найдено");
        }

        return equipment;
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
        await this.getById(id);
        await equipmentRepository.delete(id);
    },
};