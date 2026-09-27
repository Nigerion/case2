"use strict";

const EQUIPMENT_IDS = [
  "b1111111-1111-1111-1111-111111111111",
  "b1111111-1111-1111-1111-111111111112",
  "b1111111-1111-1111-1111-111111111113",
  "b2222222-2222-2222-2222-222222222221",
  "b2222222-2222-2222-2222-222222222222",
  "b2222222-2222-2222-2222-222222222223",
];

const PRIORITIES = ["low", "medium", "high", "critical"];
const STATUSES = ["new", "in_progress", "done", "rejected"];

module.exports = {
    async up(queryInterface) {
        const now = Date.now();
        const day = 86400000;
        const rows = [];

        for (let i = 0; i < 24; i++) {
        const created = new Date(now - (30 - i) * day);
        const status = STATUSES[i % STATUSES.length];
        const isClosed = status === "done" || status === "rejected";
        const closed = isClosed
            ? new Date(created.getTime() + (2 + (i % 5)) * day)
            : null;

        rows.push({
            id: `d1111111-1111-1111-1111-${String(i + 1).padStart(12, "0")}`,
            equipment_id: EQUIPMENT_IDS[i % EQUIPMENT_IDS.length],
            title: `Заявка №${i + 1}: ТО оборудования`,
            description: `Описание работ по заявке №${i + 1}. Проверить состояние, заменить изношенные компоненты.`,
            priority: PRIORITIES[i % PRIORITIES.length],
            status,
            planned_at: new Date(created.getTime() + 3 * day),
            closed_at: closed,
            author: "dispatcher",
            created_at: created,
            updated_at: closed ?? created,
        });
        }

        await queryInterface.bulkInsert("maintenance_requests", rows);
    },

    async down(queryInterface) {
        await queryInterface.bulkDelete("maintenance_requests", null, {});
    },
};