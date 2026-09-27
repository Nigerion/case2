"use strict";

module.exports = {
    async up(queryInterface) {
        const now = new Date();

        await queryInterface.bulkInsert("technicians", [
        {
            id: "a1111111-1111-1111-1111-111111111111",
            full_name: "Иванов Иван Иванович",
            specialization: "Электрик",
            personnel_number: "T-001",
            created_at: now,
            updated_at: now,
        },
        {
            id: "a1111111-1111-1111-1111-111111111112",
            full_name: "Петров Пётр Петрович",
            specialization: "Механик",
            personnel_number: "T-002",
            created_at: now,
            updated_at: now,
        },
        {
            id: "a1111111-1111-1111-1111-111111111113",
            full_name: "Сидоров Сидор Сидорович",
            specialization: "Диагност",
            personnel_number: "T-003",
            created_at: now,
            updated_at: now,
        },
        {
            id: "a1111111-1111-1111-1111-111111111114",
            full_name: "Кузнецов Николай Николаевич",
            specialization: "Электрик",
            personnel_number: "T-004",
            created_at: now,
            updated_at: now,
        },
        {
            id: "a1111111-1111-1111-1111-111111111115",
            full_name: "Смирнова Анна Сергеевна",
            specialization: "Инженер-механик",
            personnel_number: "T-005",
            created_at: now,
            updated_at: now,
        },
        ]);
    },

    async down(queryInterface) {
        await queryInterface.bulkDelete("technicians", null, {});
    },
};