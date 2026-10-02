"use strict";

const TECHNICIAN_IDS = [
  "a1111111-1111-1111-1111-111111111111",
  "a1111111-1111-1111-1111-111111111112",
  "a1111111-1111-1111-1111-111111111113",
  "a1111111-1111-1111-1111-111111111114",
  "a1111111-1111-1111-1111-111111111115",
];

module.exports = {
    async up(queryInterface) {
        const requests = await queryInterface.sequelize.query(
        `SELECT id, status
            FROM maintenance_requests
            WHERE status IN ('in_progress', 'done')
            ORDER BY created_at`,
        { type: queryInterface.sequelize.QueryTypes.SELECT },
        );

        const now = new Date();
        const rows = [];
        let idx = 0;

        for (const r of requests) {
        const lead = TECHNICIAN_IDS[idx % TECHNICIAN_IDS.length];
        rows.push({
            request_id: r.id,
            technician_id: lead,
            role: "lead",
            hours: 8.0,
            created_at: now,
            updated_at: now,
        });

        const memberCount = idx % 3;
        for (let m = 1; m <= memberCount; m++) {
            const member =
            TECHNICIAN_IDS[(idx + m) % TECHNICIAN_IDS.length];
            if (member === lead) continue;

            rows.push({
            request_id: r.id,
            technician_id: member,
            role: "member",
            hours: 4.0,
            created_at: now,
            updated_at: now,
            });
        }
        idx++;
        }

        if (rows.length > 0) {
        await queryInterface.bulkInsert("request_assignees", rows);
        }
    },

    async down(queryInterface) {
        await queryInterface.bulkDelete("request_assignees", null, {});
    },
};