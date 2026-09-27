import { QueryTypes } from "sequelize";
import { sequelize } from "../models/index.js";

const SORTABLE = {
    requestCount: "request_count",
    closedCount: "closed_count",
    totalHours: "total_hours",
    lastMaintenanceAt: "last_maintenance_at",
};

export const reportRepository = {
    async equipmentLoad({
        from = null,
        to = null,
        minRequests = 1,
        sortBy = "requestCount",
        order = "desc",
        limit = 50,
        offset = 0,
    } = {}) {
        const column = SORTABLE[sortBy] ?? "request_count";
        const direction = order === "asc" ? "ASC" : "DESC";

        const sql = `
        SELECT
            e.id                                     AS equipment_id,
            e.name                                   AS equipment_name,
            e.serial_number                          AS serial_number,
            s.id                                     AS site_id,
            s.name                                   AS site_name,
            COUNT(mr.id)::int                        AS request_count,
            COUNT(mr.id) FILTER (WHERE mr.status IN ('done', 'rejected'))::int
                                                    AS closed_count,
            COALESCE(SUM(ra.hours), 0)::numeric      AS total_hours,
            MAX(mr.closed_at)                        AS last_maintenance_at
        FROM equipment e
        JOIN sites s
            ON s.id = e.site_id
        LEFT JOIN maintenance_requests mr
            ON mr.equipment_id = e.id
        AND (:from::timestamptz IS NULL OR mr.created_at >= :from::timestamptz)
        AND (:to::timestamptz   IS NULL OR mr.created_at <= :to::timestamptz)
        LEFT JOIN request_assignees ra
            ON ra.request_id = mr.id
        GROUP BY e.id, e.name, e.serial_number, s.id, s.name
        HAVING COUNT(mr.id) >= :minRequests
        ORDER BY ${column} ${direction}
        LIMIT :limit OFFSET :offset
        `;

        const rows = await sequelize.query(sql, {
        replacements: {
            from,
            to,
            minRequests,
            limit,
            offset,
        },
        type: QueryTypes.SELECT,
        });

        return rows.map((r) => ({
            equipmentId: r.equipment_id,
            equipmentName: r.equipment_name,
            serialNumber: r.serial_number,
            siteId: r.site_id,
            siteName: r.site_name,
            requestCount: Number(r.request_count),
            closedCount: Number(r.closed_count),
            totalHours: Number(r.total_hours),
            lastMaintenanceAt: r.last_maintenance_at,
        }));
    },
};