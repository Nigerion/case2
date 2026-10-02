import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";

export const ASSIGNEE_ROLES = ["lead", "member"];

export const RequestAssignee = sequelize.define(
    "RequestAssignee",
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        requestId: {
            type: DataTypes.UUID,
            allowNull: false,
            field: "request_id",
        },
        technicianId: {
            type: DataTypes.UUID,
            allowNull: false,
            field: "technician_id",
        },
        role: {
            type: DataTypes.ENUM(...ASSIGNEE_ROLES),
            allowNull: false,
            defaultValue: "member",
        },
        hours: {
            type: DataTypes.DECIMAL(6, 2),
            allowNull: false,
            defaultValue: 0,
        },
    },
    {
        tableName: "request_assignees",
        underscored: true,
        timestamps: true,
        indexes: [
        {
            unique: true,
            fields: ["request_id", "technician_id"],
            name: "request_assignees_unique_pair",
        },
        ],
    },
);