import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";
import { REQUEST_STATUSES } from "./maintenanceRequest.model.js";

export const RequestStatusHistory = sequelize.define(
    "RequestStatusHistory",
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
        fromStatus: {
        type: DataTypes.ENUM(...REQUEST_STATUSES),
        allowNull: true,
        field: "from_status",
        },
        toStatus: {
        type: DataTypes.ENUM(...REQUEST_STATUSES),
        allowNull: false,
        field: "to_status",
        },
        changedBy: {
        type: DataTypes.STRING(150),
        allowNull: false,
        defaultValue: "system",
        field: "changed_by",
        },
        comment: {
        type: DataTypes.TEXT,
        allowNull: true,
        },
        changedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        field: "changed_at",
        },
    },
    {
        tableName: "request_status_history",
        underscored: true,
        timestamps: true,
        updatedAt: false,
    },
);