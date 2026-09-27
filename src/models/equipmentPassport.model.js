import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";

export const EquipmentPassport = sequelize.define(
    "EquipmentPassport",
    {
        id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        },
        equipmentId: {
        type: DataTypes.UUID,
        allowNull: false,
        unique: true,
        field: "equipment_id",
        },
        manufacturer: {
        type: DataTypes.STRING(150),
        allowNull: false,
        },
        model: {
        type: DataTypes.STRING(150),
        allowNull: false,
        },
        ratedPowerKw: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        field: "rated_power_kw",
        },
        lastVerifiedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: "last_verified_at",
        },
    },
    {
        tableName: "equipment_passports",
        underscored: true,
        timestamps: true,
    },
);