"use strict";

module.exports = {
    async up(queryInterface) {
        const now = new Date();

        await queryInterface.bulkInsert("equipment", [
        {
            id: "b1111111-1111-1111-1111-111111111111",
            site_id: "11111111-1111-1111-1111-111111111111",
            name: "Turbine N1",
            type: "turbine",
            serial_number: "TRB-N-001",
            status: "operational",
            installed_at: new Date("2022-05-01T10:00:00Z"),
            created_at: now,
            updated_at: now,
        },
        {
            id: "b1111111-1111-1111-1111-111111111112",
            site_id: "11111111-1111-1111-1111-111111111111",
            name: "Turbine N2",
            type: "turbine",
            serial_number: "TRB-N-002",
            status: "maintenance",
            installed_at: new Date("2022-05-01T10:00:00Z"),
            created_at: now,
            updated_at: now,
        },
        {
            id: "b1111111-1111-1111-1111-111111111113",
            site_id: "11111111-1111-1111-1111-111111111111",
            name: "Inverter N1",
            type: "inverter",
            serial_number: "INV-N-001",
            status: "fault",
            installed_at: new Date("2023-03-15T10:00:00Z"),
            created_at: now,
            updated_at: now,
        },
        {
            id: "b2222222-2222-2222-2222-222222222221",
            site_id: "22222222-2222-2222-2222-222222222222",
            name: "Turbine S1",
            type: "turbine",
            serial_number: "TRB-S-001",
            status: "operational",
            installed_at: new Date("2021-09-10T10:00:00Z"),
            created_at: now,
            updated_at: now,
        },
        {
            id: "b2222222-2222-2222-2222-222222222222",
            site_id: "22222222-2222-2222-2222-222222222222",
            name: "Sensor S1",
            type: "sensor",
            serial_number: "SNS-S-001",
            status: "operational",
            installed_at: new Date("2023-01-20T10:00:00Z"),
            created_at: now,
            updated_at: now,
        },
        {
            id: "b2222222-2222-2222-2222-222222222223",
            site_id: "22222222-2222-2222-2222-222222222222",
            name: "Substation S1",
            type: "substation",
            serial_number: "SUB-S-001",
            status: "decommissioned",
            installed_at: new Date("2019-06-01T10:00:00Z"),
            created_at: now,
            updated_at: now,
        },
        ]);
    },

    async down(queryInterface) {
        await queryInterface.bulkDelete("equipment", null, {});
    },
};