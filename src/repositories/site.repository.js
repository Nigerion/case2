import { QueryTypes } from "sequelize";
import { sequelize, Site } from "../models/index.js";

export const siteRepository = {
    async findById(id) {
        return Site.findByPk(id, {
        attributes: ["id", "name", "code", "region", "latitude", "longitude"],
        });
    },

    async findByCode(code) {
        return Site.findOne({
        where: { code },
        attributes: ["id", "name", "code", "region", "latitude", "longitude"],
        });
    },

    async findOrCreateDefault() {
        const [site] = await Site.findOrCreate({
            where: { code: DEFAULT_SITE_CODE },
            defaults: {
                name: "Площадка по умолчанию",
                code: DEFAULT_SITE_CODE,
                region: "Не указан",
                latitude: 0,
                longitude: 0,
            },
            attributes: ["id", "name", "code", "region", "latitude", "longitude"],
        });
        return site;
    },
    
    async updateCoordinates(siteId, { lat, lon }) {
        await Site.update(
            { latitude: lat, longitude: lon },
            { where: { id: siteId } },
        );
    },

    async summary(siteId) {
        const [statusRows, priorityRows, avgRow] = await Promise.all([
        sequelize.query(
            `SELECT mr.status AS status, COUNT(*)::int AS count
            FROM maintenance_requests mr
            JOIN equipment e ON e.id = mr.equipment_id
            WHERE e.site_id = :siteId
            GROUP BY mr.status
            ORDER BY mr.status`,
            {
                replacements: { siteId },
                type: QueryTypes.SELECT,
            },
        ),

        sequelize.query(
            `SELECT mr.priority AS priority, COUNT(*)::int AS count
            FROM maintenance_requests mr
            JOIN equipment e ON e.id = mr.equipment_id
            WHERE e.site_id = :siteId
            GROUP BY mr.priority
            ORDER BY mr.priority`,
            {
                replacements: { siteId },
                type: QueryTypes.SELECT,
            },
        ),

        sequelize.query(
            `SELECT AVG(EXTRACT(EPOCH FROM (mr.closed_at - mr.created_at)) / 3600.0) AS avg_hours
            FROM maintenance_requests mr
            JOIN equipment e ON e.id = mr.equipment_id
            WHERE e.site_id = :siteId
                AND mr.closed_at IS NOT NULL`,
            {
                replacements: { siteId },
                type: QueryTypes.SELECT,
            },
        ),
        ]);

        return {
            byStatus: Object.fromEntries(
                statusRows.map((r) => [r.status, r.count]),
            ),
            byPriority: Object.fromEntries(
                priorityRows.map((r) => [r.priority, r.count]),
            ),
            avgCloseHours:
                avgRow[0]?.avg_hours != null ? Number(avgRow[0].avg_hours) : null,
        };
    },
};