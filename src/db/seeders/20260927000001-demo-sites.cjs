"use strict";

module.exports = {
    async up(queryInterface) {
        const now = new Date();

        await queryInterface.bulkInsert("sites", [
        {
            id: "11111111-1111-1111-1111-111111111111",
            name: "Северная площадка",
            code: "NORTH-01",
            region: "Мурманская область",
            latitude: 68.9585,
            longitude: 33.0827,
            created_at: now,
            updated_at: now,
        },
        {
            id: "22222222-2222-2222-2222-222222222222",
            name: "Южная площадка",
            code: "SOUTH-01",
            region: "Краснодарский край",
            latitude: 44.895,
            longitude: 37.3165,
            created_at: now,
            updated_at: now,
        },
        ]);
    },

    async down(queryInterface) {
        await queryInterface.bulkDelete("sites", null, {});
    },
};