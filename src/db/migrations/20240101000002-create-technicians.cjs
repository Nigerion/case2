"use strict";

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable("technicians", {
        id: {
            type: Sequelize.UUID,
            defaultValue: Sequelize.literal("gen_random_uuid()"),
            primaryKey: true,
        },
        full_name: {
            type: Sequelize.STRING(150),
            allowNull: false,
        },
        specialization: {
            type: Sequelize.STRING(100),
            allowNull: false,
        },
        personnel_number: {
            type: Sequelize.STRING(50),
            allowNull: false,
            unique: true,
        },
        created_at: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.fn("now"),
        },
        updated_at: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.fn("now"),
        },
        });

        await queryInterface.addIndex("technicians", ["specialization"], {
        name: "technicians_specialization_idx",
        });
    },

    async down(queryInterface) {
        await queryInterface.dropTable("technicians");
    },
};