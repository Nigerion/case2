"use strict";

module.exports = {
    async up(queryInterface) {
        const now = new Date();

        await queryInterface.bulkInsert("equipment_passports", [
        {
            id: "c1111111-1111-1111-1111-111111111111",
            equipment_id: "b1111111-1111-1111-1111-111111111111",
            manufacturer: "Vestas",
            model: "V150-4.2",
            rated_power_kw: 4200.0,
            last_verified_at: new Date("2024-06-01T10:00:00Z"),
            created_at: now,
            updated_at: now,
        },
        {
            id: "c1111111-1111-1111-1111-111111111112",
            equipment_id: "b1111111-1111-1111-1111-111111111112",
            manufacturer: "Vestas",
            model: "V150-4.2",
            rated_power_kw: 4200.0,
            last_verified_at: new Date("2024-06-01T10:00:00Z"),
            created_at: now,
            updated_at: now,
        },
        {
            id: "c1111111-1111-1111-1111-111111111113",
            equipment_id: "b1111111-1111-1111-1111-111111111113",
            manufacturer: "SMA",
            model: "Sunny Central 2200",
            rated_power_kw: 2200.0,
            last_verified_at: null,
            created_at: now,
            updated_at: now,
        },
        {
            id: "c2222222-2222-2222-2222-222222222221",
            equipment_id: "b2222222-2222-2222-2222-222222222221",
            manufacturer: "Siemens Gamesa",
            model: "SG 5.0-145",
            rated_power_kw: 5000.0,
            last_verified_at: new Date("2024-02-15T10:00:00Z"),
            created_at: now,
            updated_at: now,
        },
        ]);
    },

    async down(queryInterface) {
        await queryInterface.bulkDelete("equipment_passports", null, {});
    },
};