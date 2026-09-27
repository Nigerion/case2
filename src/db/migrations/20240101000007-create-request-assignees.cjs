"use strict";

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable("request_assignees", {
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
        technician_id: {
            type: Sequelize.UUID,
            allowNull: false,
            references: {
            model: "technicians",
            key: "id",
            },
            onDelete: "RESTRICT",
            onUpdate: "CASCADE",
        },
        role: {
            type: Sequelize.ENUM("lead", "member"),
            allowNull: false,
            defaultValue: "member",
        },
        hours: {
            type: Sequelize.DECIMAL(6, 2),
            allowNull: false,
            defaultValue: 0,
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
        await queryInterface.addIndex(
        "request_assignees",
        ["request_id", "technician_id"],
        {
            name: "request_assignees_unique_pair",
            unique: true,
        },
        );
        await queryInterface.addIndex("request_assignees", ["technician_id"], {
        name: "request_assignees_technician_idx",
        });
    },

    async down(queryInterface) {
        await queryInterface.dropTable("request_assignees");

        await queryInterface.sequelize.query(
        'DROP TYPE IF EXISTS "enum_request_assignees_role";',
        );
    },
};