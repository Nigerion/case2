import { Op } from "sequelize";
import { requestRepository } from "../repositories/request.repository.js";
import { equipmentRepository } from "../repositories/equipment.repository.js";
import { RequestAssignee, Technician } from "../models/index.js";
import { sequelize } from "../config/db.js";
import { NotFoundError } from "../errors/NotFoundError.js";
import { ConflictError } from "../errors/ConflictError.js";
import {
  assertAllowedStatusTransition,
  assertCanUnassignAssignee,
  assertCrewValid,
  assertEditableRequest,
  assertHasAssignees,
  assertTechnicianAssigned,
} from "../utils/request.rules.js";

export const requestService = {
  async getById(id) {
    const request = await requestRepository.findByIdFull(id);
    if (!request) throw new NotFoundError("Заявка не найдена");
    return request;
  },

  async getByEquipmentId(equipmentId) {
    const equipment = await equipmentRepository.findById(equipmentId);
    if (!equipment) throw new NotFoundError("Оборудование не найдено");
    return requestRepository.findByEquipmentId(equipmentId);
  },

  async getMany(query) {
    const { items, total } = await requestRepository.findMany(query);
    return {
      data: items,
      meta: { total, page: query.page, limit: query.limit },
    };
  },

  async create(data) {
    const equipment = await equipmentRepository.findById(data.equipmentId);
    if (!equipment) {
      throw new NotFoundError(
        "Нельзя создать заявку: оборудование не найдено",
      );
    }
    return requestRepository.create(data);
  },

  async update(id, data, { user } = {}) {
    const request = await this.getById(id);

    assertEditableRequest(request);
    const isAssigned = request.assignees?.some(
      (assignee) => assignee.technicianId === user?.technicianId,
    );
    assertTechnicianAssigned(user, isAssigned);

    return requestRepository.update(id, data);
  },

  async delete(id) {
    const request = await this.getById(id);

    if (request.status === "in_progress") {
      throw new ConflictError(
        "Нельзя удалить заявку, которая находится в работе",
      );
    }

    if (await requestRepository.hasHistory(id)) {
      throw new ConflictError(
        "Нельзя удалить заявку с историей статусов",
      );
    }

    await requestRepository.delete(id);
  },

  async updateStatus(id, nextStatus, { changedBy = "system", comment = null, user } = {}) {
    const transaction = await sequelize.transaction();

    try {
      const request = await requestRepository.findByIdWithLock(id, transaction);
      if (!request) {
        throw new NotFoundError("Заявка не найдена");
      }

      let isAssigned = false;
      if (user?.role === "technician" && user.technicianId) {
        isAssigned = Boolean(await RequestAssignee.findOne({
          where: { requestId: id, technicianId: user.technicianId },
          transaction,
        }));
      }
      assertTechnicianAssigned(user, isAssigned);

      assertAllowedStatusTransition(request.status, nextStatus);

      if (nextStatus === "in_progress") {
        const count = await requestRepository.countAssignees(id, transaction);
        assertHasAssignees(nextStatus, count);
      }

      const updated = await requestRepository.updateStatus(id, nextStatus, {
        transaction,
        changedBy,
        comment,
      });

      await transaction.commit();
      return updated;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async assignCrew(requestId, assignees, { changedBy = "system" } = {}) {
    assertCrewValid(assignees);

    const transaction = await sequelize.transaction();

    try {
      const request = await requestRepository.findByIdWithLock(requestId, transaction);
      if (!request) {
        throw new NotFoundError("Заявка не найдена");
      }

      if (request.status === "done" || request.status === "rejected") {
        throw new ConflictError("Нельзя назначать бригаду на закрытую заявку");
      }

      const ids = [...new Set(assignees.map((a) => a.technicianId))];
      const found = await Technician.findAll({
        where: { id: ids },
        attributes: ["id"],
        transaction,
      });

      if (found.length !== ids.length) {
        const foundIds = new Set(found.map((t) => t.id));
        const missing = ids.filter((id) => !foundIds.has(id));
        throw new NotFoundError(
          `Специалисты не найдены: ${missing.join(", ")}`,
        );
      }

      await requestRepository.replaceAssignees(requestId, assignees, transaction);

      await transaction.commit();
      return requestRepository.findByIdFull(requestId);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async unassign(requestId, technicianId) {
    const transaction = await sequelize.transaction();

    try {
      const request = await requestRepository.findByIdWithLock(requestId, transaction);
      if (!request) {
        throw new NotFoundError("Заявка не найдена");
      }

      const currentAssignees = await RequestAssignee.findAll({
        where: { requestId },
        attributes: ["technicianId", "role"],
        transaction,
      });
      assertCanUnassignAssignee(currentAssignees, technicianId);

      const removed = await requestRepository.removeAssignee(
        requestId,
        technicianId,
        transaction,
      );

      if (removed === 0) {
        throw new NotFoundError("Специалист не назначен на эту заявку");
      }

      await transaction.commit();
      return true;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async getHistory(requestId) {
    const request = await requestRepository.findById(requestId);
    if (!request) throw new NotFoundError("Заявка не найдена");
    return requestRepository.getHistory(requestId);
  },
};