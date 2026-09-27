"use strict";

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable("maintenance_requests", {
        id: {
            type: Sequelize.UUID,
            defaultValue: Sequelize.literal("gen_random_uuid()"),
            primaryKey: true,
        },
        equipment_id: {
            type: Sequelize.UUID,
            allowNull: false,
            references: {
            model: "equipment",
            key: "id",
            },
            onDelete: "RESTRICT",
            onUpdate: "CASCADE",
        },
        title: {
            type: Sequelize.STRING(120),
            allowNull: false,
        },
        description: {
            type: Sequelize.TEXT,
            allowNull: false,
            defaultValue: "",
        },
        priority: {
            type: Sequelize.ENUM("low", "medium", "high", "critical"),
            allowNull: false,
        },
        status: {
            type: Sequelize.ENUM("new", "in_progress", "done", "rejected"),
            allowNull: false,
            defaultValue: "new",
        },
        planned_at: {
            type: Sequelize.DATE,
            allowNull: true,
        },
        closed_at: {
            type: Sequelize.DATE,
            allowNull: true,
        },
        author: {
            type: Sequelize.STRING(150),
            allowNull: false,
            defaultValue: "system",
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

        await queryInterface.addIndex("maintenance_requests", ["status"], {
        name: "mr_status_idx",
        });
        await queryInterface.addIndex("maintenance_requests", ["priority"], {
        name: "mr_priority_idx",
        });
        await queryInterface.addIndex("maintenance_requests", ["equipment_id"], {
        name: "mr_equipment_idx",
        });
        await queryInterface.addIndex("maintenance_requests", ["created_at"], {
        name: "mr_created_at_idx",
        });
    },

    async down(queryInterface) {
        await queryInterface.dropTable("maintenance_requests");

        await queryInterface.sequelize.query(
        'DROP TYPE IF EXISTS "enum_maintenance_requests_priority";',
        );
        await queryInterface.sequelize.query(
        'DROP TYPE IF EXISTS "enum_maintenance_requests_status";',
        );
    },
};