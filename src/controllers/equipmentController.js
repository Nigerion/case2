import { equipmentService } from "../services/equipmentService.js";

export const equipmentController = {
    async getAll(req, res) {
        const result = await equipmentService.getMany(req.validatedQuery);
        res.status(200).json(result);
    },

    async getById(req, res) {
        const equipment = await equipmentService.getById(
            req.params.id,
        );

        res.status(200).json({
            data: equipment,
        });
    },

    async create(req, res) {
        const equipment = await equipmentService.create(req.body);

        res
            .status(201)
            .location(`/api/equipment/${equipment.id}`)
            .json({
                data: equipment,
            });
    },

    async update(req, res) {
        const equipment = await equipmentService.update(
            req.params.id,
            req.body,
        );

        res.status(200).json({
            data: equipment,
        });
    },

    async delete(req, res) {
        await equipmentService.delete(req.params.id);

        res.status(204).send();
    }
};