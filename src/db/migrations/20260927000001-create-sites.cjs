"use strict";

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable("sites", {
        id: {
            type: Sequelize.UUID,
            defaultValue: Sequelize.literal("gen_random_uuid()"),
            primaryKey: true,
        },
        name: {
            type: Sequelize.STRING(150),
            allowNull: false,
        },
        code: {
            type: Sequelize.STRING(50),
            allowNull: false,
            unique: true,
        },
        region: {
            type: Sequelize.STRING(100),
            allowNull: false,
        },
        latitude: {
            type: Sequelize.DOUBLE,
            allowNull: false,
        },
        longitude: {
            type: Sequelize.DOUBLE,
            allowNull: false,
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

        await queryInterface.addIndex("sites", ["region"], {
        name: "sites_region_idx",
        });
    },

    async down(queryInterface) {
        await queryInterface.dropTable("sites");
    },
};