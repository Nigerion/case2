import { Op } from "sequelize";
import {
  Equipment,
  MaintenanceRequest,
  RequestAssignee,
  RequestStatusHistory,
  Site,
  Technician,
} from "../models/index.js";

const SORTABLE = {
  createdAt: "createdAt",
  updatedAt: "updatedAt",
  plannedAt: "plannedAt",
  priority: "priority",
  status: "status",
  title: "title",
};

const REQUEST_ATTRIBUTES = [
  "id",
  "equipmentId",
  "title",
  "description",
  "priority",
  "status",
  "plannedAt",
  "closedAt",
  "author",
  "createdAt",
  "updatedAt",
];

const EQUIPMENT_ATTRIBUTES = [
  "id",
  "name",
  "type",
  "serialNumber",
  "status",
];

const ASSIGNEE_ATTRIBUTES = ["technicianId", "role", "hours"];

const TECHNICIAN_ATTRIBUTES = [
  "id",
  "fullName",
  "specialization",
  "personnelNumber",
];

const HISTORY_ATTRIBUTES = [
  "id",
  "fromStatus",
  "toStatus",
  "changedBy",
  "comment",
  "changedAt",
];

function toApi(instance, options = {}) {
  if (!instance) return null;
  const plain = instance.get({ plain: true });

  const result = {
    id: plain.id,
    equipmentId: plain.equipmentId,
    title: plain.title,
    description: plain.description,
    priority: plain.priority,
    status: plain.status,
    plannedAt: plain.plannedAt ?? null,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };

  if (options.includeEquipment && plain.equipment) {
    result.equipment = {
      id: plain.equipment.id,
      name: plain.equipment.name,
      type: plain.equipment.type,
      serialNumber: plain.equipment.serialNumber,
      status: plain.equipment.status,
    };
  }

  if (options.includeAssignees && plain.assigneeRows) {
    result.assignees = plain.assigneeRows.map((row) => ({
      technicianId: row.technicianId,
      role: row.role,
      hours: Number(row.hours),
      fullName: row.technician?.fullName ?? null,
      specialization: row.technician?.specialization ?? null,
      personnelNumber: row.technician?.personnelNumber ?? null,
    }));
  }

  if (options.includeHistory && plain.history) {
    result.history = plain.history.map((h) => ({
      id: h.id,
      fromStatus: h.fromStatus,
      toStatus: h.toStatus,
      changedBy: h.changedBy,
      comment: h.comment,
      changedAt: h.changedAt,
    }));
  }

  return result;
}

export const requestRepository = {
  async findById(id, options = {}) {
    const instance = await MaintenanceRequest.findByPk(id, {
      attributes: REQUEST_ATTRIBUTES,
      ...options,
    });
    return toApi(instance, options);
  },

  async removeAssignee(requestId, technicianId, transaction) {
    return RequestAssignee.destroy({
      where: { requestId, technicianId },
      transaction,
    });
  },

  async findByIdFull(id) {
    const instance = await MaintenanceRequest.findByPk(id, {
      attributes: REQUEST_ATTRIBUTES,
      include: [
        {
          model: Equipment,
          as: "equipment",
          attributes: EQUIPMENT_ATTRIBUTES,
        },
        {
          model: RequestAssignee,
          as: "assigneeRows",
          attributes: ASSIGNEE_ATTRIBUTES,
          include: [
            {
              model: Technician,
              as: "technician",
              attributes: TECHNICIAN_ATTRIBUTES,
            },
          ],
        },
      ],
    });
    return toApi(instance, {
      includeAssignees: true,
      includeEquipment: true,
    });
  },

  async findByEquipmentId(equipmentId) {
    const rows = await MaintenanceRequest.findAll({
      where: { equipmentId },
      attributes: REQUEST_ATTRIBUTES,
      order: [["createdAt", "DESC"]],
    });
    return rows.map((r) => toApi(r));
  },

  async create(data) {
    const instance = await MaintenanceRequest.create({
      equipmentId: data.equipmentId,
      title: data.title,
      description: data.description ?? "",
      priority: data.priority,
      status: "new",
      plannedAt: data.plannedAt ?? null,
      author: data.author ?? "system",
    });
    return this.findById(instance.id);
  },

  async update(id, data) {
    const instance = await MaintenanceRequest.findByPk(id);
    if (!instance) return null;

    const patch = {};
    if (data.title !== undefined) patch.title = data.title;
    if (data.description !== undefined) patch.description = data.description;
    if (data.priority !== undefined) patch.priority = data.priority;
    if (data.plannedAt !== undefined) patch.plannedAt = data.plannedAt;

    await instance.update(patch);
    return this.findById(id);
  },

  async updateStatus(id, nextStatus, { transaction, changedBy = "system", comment = null } = {}) {
    const instance = await MaintenanceRequest.findByPk(id, { transaction });
    if (!instance) return null;

    const fromStatus = instance.status;
    instance.status = nextStatus;

    if (nextStatus === "done" || nextStatus === "rejected") {
      instance.closedAt = new Date();
    }

    await instance.save({ transaction });

    await RequestStatusHistory.create(
      {
        requestId: id,
        fromStatus,
        toStatus: nextStatus,
        changedBy,
        comment,
        changedAt: new Date(),
      },
      { transaction },
    );

    return this.findById(id, { transaction });
  },

  async findByIdWithLock(id, transaction) {
    return MaintenanceRequest.findByPk(id, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
  },

  async delete(id) {
    const count = await MaintenanceRequest.destroy({ where: { id } });
    return count > 0;
  },

  async findMany({
    status,
    priority,
    equipmentId,
    createdAtFrom,
    createdAtTo,
    plannedAtFrom,
    plannedAtTo,
    page = 1,
    limit = 10,
    sortBy = "createdAt",
    order = "desc",
  }) {
    const where = {};
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (equipmentId) where.equipmentId = equipmentId;

    if (createdAtFrom || createdAtTo) {
      where.createdAt = {};
      if (createdAtFrom) where.createdAt[Op.gte] = new Date(createdAtFrom);
      if (createdAtTo) where.createdAt[Op.lte] = new Date(createdAtTo);
    }

    if (plannedAtFrom || plannedAtTo) {
      where.plannedAt = {};
      if (plannedAtFrom) where.plannedAt[Op.gte] = new Date(plannedAtFrom);
      if (plannedAtTo) where.plannedAt[Op.lte] = new Date(plannedAtTo);
    }

    const column = SORTABLE[sortBy] ?? "createdAt";
    const direction = order === "asc" ? "ASC" : "DESC";

    const { rows, count } = await MaintenanceRequest.findAndCountAll({
      where,
      attributes: REQUEST_ATTRIBUTES,
      order: [[column, direction]],
      limit,
      offset: (page - 1) * limit,
      distinct: true,
    });

    return {
      items: rows.map((r) => toApi(r)),
      total: count,
    };
  },

  async findByIdWithLock(id, transaction) {
    return MaintenanceRequest.findByPk(id, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
  },

  async replaceAssignees(requestId, list, transaction) {
    await RequestAssignee.destroy({ where: { requestId }, transaction });

    if (list.length > 0) {
      await RequestAssignee.bulkCreate(
        list.map((x) => ({
          requestId,
          technicianId: x.technicianId,
          role: x.role,
          hours: x.hours ?? 0,
        })),
        { transaction },
      );
    }
  },

  async getHistory(requestId) {
    const rows = await RequestStatusHistory.findAll({
      where: { requestId },
      attributes: HISTORY_ATTRIBUTES,
      order: [["changedAt", "ASC"]],
    });
    return rows.map((r) => r.get({ plain: true }));
  },

  async countAssignees(requestId, transaction) {
    return RequestAssignee.count({ where: { requestId }, transaction });
  },
};