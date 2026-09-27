"use strict";

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable("request_status_history", {
        id: {
            type: Sequelize.UUID,
            defaultValue: Sequelize.literal("gen_random_uuid()"),
            primaryKey: true,
        },
        request_id: {
            type: Sequelize.UUID,
            allowNull: false,
            references: {
            model: "maintenance_requests",
            key: "id",
            },
            onDelete: "CASCADE",
            onUpdate: "CASCADE",
        },
        from_status: {
            type: Sequelize.ENUM("new", "in_progress", "done", "rejected"),
            allowNull: true,
        },
        to_status: {
            type: Sequelize.ENUM("new", "in_progress", "done", "rejected"),
            allowNull: false,
        },
        changed_by: {
            type: Sequelize.STRING(150),
            allowNull: false,
            defaultValue: "system",
        },
        comment: {
            type: Sequelize.TEXT,
            allowNull: true,
        },
        changed_at: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.fn("now"),
        },
        created_at: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.fn("now"),
        },
        });

        await queryInterface.addIndex("request_status_history", ["request_id"], {
        name: "rsh_request_idx",
        });
        await queryInterface.addIndex("request_status_history", ["changed_at"], {
        name: "rsh_changed_at_idx",
        });
    },

    async down(queryInterface) {
        await queryInterface.dropTable("request_status_history");

        await queryInterface.sequelize.query(
        'DROP TYPE IF EXISTS "enum_request_status_history_from_status";',
        );
        await queryInterface.sequelize.query(
        'DROP TYPE IF EXISTS "enum_request_status_history_to_status";',
        );
    },
};