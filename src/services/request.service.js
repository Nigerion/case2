import { requestRepository } from "../repositories/request.repository.js";
import { equipmentRepository } from "../repositories/equipment.repository.js";

import { NotFoundError } from "../errors/NotFoundError.js";
import { ConflictError } from "../errors/ConflictError.js";

const allowedTransitions = {
  new: ["in_progress", "rejected"],
  in_progress: ["done", "rejected"],
  done: [],
  rejected: [],
};

export const requestService = {

  async getById(id) {
    const request = await requestRepository.findById(id);

    if (!request) {
      throw new NotFoundError("Заявка не найдена");
    }

    return request;
  },

  async getByEquipmentId(equipmentId) {
    const equipment = await equipmentRepository.findById(
      equipmentId,
    );

    if (!equipment) {
      throw new NotFoundError("Оборудование не найдено");
    }

    return requestRepository.findByEquipmentId(equipmentId);
  },

  async create(data) {
    const equipment = await equipmentRepository.findById(
      data.equipmentId,
    );

    if (!equipment) {
      throw new NotFoundError(
        "Нельзя создать заявку: оборудование не найдено",
      );
    }

    return requestRepository.create(data);
  },

  async update(id, data) {
    const request = await this.getById(id);

    if (request.status === "done" || request.status === "rejected") {
      throw new ConflictError(
        "Нельзя редактировать завершённую или отклонённую заявку",
      );
    }

    return requestRepository.update(id, data);
  },

  async updateStatus(id, nextStatus) {
    const request = await this.getById(id);
    const allowed = allowedTransitions[request.status];

    if (!allowed.includes(nextStatus)) {
      throw new ConflictError(
        `Недопустимый переход статуса: ${request.status} → ${nextStatus}`,
      );
    }

    return requestRepository.update(id, {
      status: nextStatus,
    });
  },

  async delete(id) {
    const request = await this.getById(id);

    if (request.status === "in_progress") {
      throw new ConflictError(
        "Нельзя удалить заявку, которая находится в работе",
      );
    }

    await requestRepository.delete(request.id);
  },

  async getMany(query) {
    const { items, total } = await requestRepository.findMany(query);
    return {
      data: items,
      meta: { total, page: query.page, limit: query.limit },
    };
  },
};