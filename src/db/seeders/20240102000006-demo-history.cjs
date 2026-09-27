"use strict";

module.exports = {
    async up(queryInterface) {
        const requests = await queryInterface.sequelize.query(
        `SELECT id, status, created_at, closed_at
            FROM maintenance_requests
            ORDER BY created_at`,
        { type: queryInterface.sequelize.QueryTypes.SELECT },
        );

        const rows = [];

        for (const r of requests) {
        const created = new Date(r.created_at);

        rows.push({
            request_id: r.id,
            from_status: null,
            to_status: "new",
            changed_by: "system",
            comment: "Заявка создана",
            changed_at: created,
            created_at: created,
        });

        if (r.status !== "new") {
            const t1 = new Date(created.getTime() + 3600_000);
            rows.push({
            request_id: r.id,
            from_status: "new",
            to_status: "in_progress",
            changed_by: "dispatcher",
            comment: "Взято в работу",
            changed_at: t1,
            created_at: t1,
            });
        }

        if (r.status === "done" || r.status === "rejected") {
            const t2 = new Date(
            r.closed_at ?? new Date(created.getTime() + 2 * 86400000),
            );
            rows.push({
            request_id: r.id,
            from_status: "in_progress",
            to_status: r.status,
            changed_by: "technician",
            comment:
                r.status === "done" ? "Работы завершены" : "Отклонено",
            changed_at: t2,
            created_at: t2,
            });
        }
        }

        if (rows.length > 0) {
        await queryInterface.bulkInsert("request_status_history", rows);
        }
    },

    async down(queryInterface) {
        await queryInterface.bulkDelete("request_status_history", null, {});
    },
};