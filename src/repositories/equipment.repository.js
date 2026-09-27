import { Op } from "sequelize";
import {
    Equipment,
    EquipmentPassport,
    MaintenanceRequest,
    Site,
} from "../models/index.js";

const SORTABLE = {
    name: "name",
    type: "type",
    status: "status",
    installedAt: "installedAt",
};

const EQUIPMENT_ATTRIBUTES = [
    "id",
    "siteId",
    "name",
    "type",
    "serialNumber",
    "status",
    "installedAt",
    "createdAt",
    "updatedAt",
];

const SITE_ATTRIBUTES = [
    "id",
    "name",
    "code",
    "region",
    "latitude",
    "longitude",
];

const PASSPORT_ATTRIBUTES = [
    "id",
    "manufacturer",
    "model",
    "ratedPowerKw",
    "lastVerifiedAt",
];

function toApi(instance) {
    if (!instance) return null;
    const plain = instance.get({ plain: true });

    const result = {
        id: plain.id,
        name: plain.name,
        type: plain.type,
        serialNumber: plain.serialNumber,
        status: plain.status,
        installedAt: plain.installedAt,
    };

    if (plain.site) {
        result.location = {
        lat: plain.site.latitude,
        lon: plain.site.longitude,
        };
        result.site = {
        id: plain.site.id,
        name: plain.site.name,
        code: plain.site.code,
        region: plain.site.region,
        };
    }

    if (plain.passport !== undefined) {
        result.passport = plain.passport;
    }

    return result;
}

export const equipmentRepository = {
    async findById(id) {
        const instance = await Equipment.findByPk(id, {
        attributes: EQUIPMENT_ATTRIBUTES,
        include: [
            {
            model: Site,
            as: "site",
            attributes: SITE_ATTRIBUTES,
            },
            {
            model: EquipmentPassport,
            as: "passport",
            attributes: PASSPORT_ATTRIBUTES,
            },
        ],
        });
        return toApi(instance);
    },

    async findBySerialNumber(serialNumber) {
        return Equipment.findOne({
        where: { serialNumber },
        attributes: ["id", "serialNumber"],
        });
    },

    async create(data) {
        const instance = await Equipment.create({
        siteId: data.siteId,
        name: data.name,
        type: data.type,
        serialNumber: data.serialNumber,
        status: data.status,
        installedAt: data.installedAt,
        });
        return this.findById(instance.id);
    },

    async update(id, data) {
        const instance = await Equipment.findByPk(id);
        if (!instance) return null;

        const patch = {};
        if (data.name !== undefined) patch.name = data.name;
        if (data.type !== undefined) patch.type = data.type;
        if (data.serialNumber !== undefined) patch.serialNumber = data.serialNumber;
        if (data.status !== undefined) patch.status = data.status;
        if (data.installedAt !== undefined) patch.installedAt = data.installedAt;
        if (data.siteId !== undefined) patch.siteId = data.siteId;

        await instance.update(patch);
        return this.findById(id);
    },

    async delete(id) {
        const count = await Equipment.destroy({ where: { id } });
        return count > 0;
    },

    async findMany({
        type,
        status,
        installedAtFrom,
        installedAtTo,
        page = 1,
        limit = 10,
        sortBy = "name",
        order = "asc",
    }) {
        const where = {};
        if (type) where.type = type;
        if (status) where.status = status;
        if (installedAtFrom || installedAtTo) {
        where.installedAt = {};
        if (installedAtFrom) where.installedAt[Op.gte] = new Date(installedAtFrom);
        if (installedAtTo) where.installedAt[Op.lte] = new Date(installedAtTo);
        }
        const column = SORTABLE[sortBy] ?? "name";
        const direction = order === "asc" ? "ASC" : "DESC";

        const { rows, count } = await Equipment.findAndCountAll({
        where,
        attributes: EQUIPMENT_ATTRIBUTES,
        include: [
            {
            model: Site,
            as: "site",
            attributes: SITE_ATTRIBUTES,
            },
        ],
        order: [[column, direction]],
        limit,
        offset: (page - 1) * limit,
        distinct: true,
        });

        return {
        items: rows.map(toApi),
        total: count,
        };
    },

    async hasOpenRequests(equipmentId) {
        const count = await MaintenanceRequest.count({
        where: {
            equipmentId,
            status: { [Op.in]: ["new", "in_progress"] },
        },
        });
        return count > 0;
    },

        async hasRequests(equipmentId) {
                return (await MaintenanceRequest.count({ where: { equipmentId } })) > 0;
        },

    async findByIdRaw(id, options = {}) {
        return Equipment.findByPk(id, options);
    },
};