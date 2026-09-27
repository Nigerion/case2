import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";

export const REQUEST_PRIORITIES = ["low", "medium", "high", "critical"];
export const REQUEST_STATUSES = ["new", "in_progress", "done", "rejected"];

export const MaintenanceRequest = sequelize.define(
    "MaintenanceRequest",
    {
        id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        },
        equipmentId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: "equipment_id",
        },
        title: {
        type: DataTypes.STRING(120),
        allowNull: false,
        },
        description: {
        type: DataTypes.TEXT,
        allowNull: false,
        defaultValue: "",
        },
        priority: {
        type: DataTypes.ENUM(...REQUEST_PRIORITIES),
        allowNull: false,
        },
        status: {
        type: DataTypes.ENUM(...REQUEST_STATUSES),
        allowNull: false,
        defaultValue: "new",
        },
        plannedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: "planned_at",
        },
        closedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: "closed_at",
        },
        author: {
        type: DataTypes.STRING(150),
        allowNull: false,
        defaultValue: "system",
        },
    },
    {
        tableName: "maintenance_requests",
        underscored: true,
        timestamps: true,
    },
);