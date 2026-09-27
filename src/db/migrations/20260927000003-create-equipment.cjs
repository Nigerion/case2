"use strict";

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable("equipment", {
        id: {
            type: Sequelize.UUID,
            defaultValue: Sequelize.literal("gen_random_uuid()"),
            primaryKey: true,
        },
        site_id: {
            type: Sequelize.UUID,
            allowNull: false,
            references: {
            model: "sites",
            key: "id",
            },
            onDelete: "RESTRICT",
            onUpdate: "CASCADE",
        },
        name: {
            type: Sequelize.STRING(100),
            allowNull: false,
        },
        type: {
            type: Sequelize.ENUM("turbine", "inverter", "sensor", "substation"),
            allowNull: false,
        },
        serial_number: {
            type: Sequelize.STRING(100),
            allowNull: false,
            unique: true,
        },
        status: {
            type: Sequelize.ENUM(
            "operational",
            "maintenance",
            "fault",
            "decommissioned",
            ),
            allowNull: false,
            defaultValue: "operational",
        },
        installed_at: {
            type: Sequelize.DATE,
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

        await queryInterface.addIndex("equipment", ["site_id"], {
        name: "equipment_site_idx",
        });
        await queryInterface.addIndex("equipment", ["status"], {
        name: "equipment_status_idx",
        });
        await queryInterface.addIndex("equipment", ["type"], {
        name: "equipment_type_idx",
        });
    },

    async down(queryInterface) {
        await queryInterface.dropTable("equipment");

        /* Postgres не удаляет ENUM-типы автоматически */
        await queryInterface.sequelize.query(
        'DROP TYPE IF EXISTS "enum_equipment_type";',
        );
        await queryInterface.sequelize.query(
        'DROP TYPE IF EXISTS "enum_equipment_status";',
        );
    },
};