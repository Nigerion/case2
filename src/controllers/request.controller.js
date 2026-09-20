import { requestService } from "../services/request.service.js";

export const requestController = {
  async getAll(req, res) {
    const requests = await requestService.getAll();

    res.status(200).json({
      data: requests,
    });
  },

  async getById(req, res) {
    const request = await requestService.getById(req.params.id);

    res.status(200).json({
      data: request,
    });
  },

  async getByEquipmentId(req, res) {
    const requests = await requestService.getByEquipmentId(
      req.params.equipmentId,
    );

    res.status(200).json({
      data: requests,
    });
  },

  async create(req, res) {
    const request = await requestService.create(req.body);

    res
      .status(201)
      .location(`/api/requests/${request.id}`)
      .json({
        data: request,
      });
  },

  async update(req, res) {
    const request = await requestService.update(
      req.params.id,
      req.body,
    );

    res.status(200).json({
      data: request,
    });
  },

  async updateStatus(req, res) {
    const request = await requestService.updateStatus(
      req.params.id,
      req.body.status,
    );

    res.status(200).json({
      data: request,
    });
  },

  async delete(req, res) {
    await requestService.delete(req.params.id);

    res.status(204).send();
  },
};