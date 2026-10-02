import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";

export const USER_ROLES = ['viewer', 'technician', 'admin'];

export const User = sequelize.define(
    "User",
    {

        id:{
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        email:{
            type: DataTypes.STRING(150),
            allowNull: false,
            unique: true,
            validate: {
                isEmail: true,
            },
        },
        role: {
            type: DataTypes.ENUM(...USER_ROLES),
            allowNull: false,
            defaultValue: "viewer",
        },
        passwordHash:{
            type: DataTypes.STRING(255),
            allowNull: false,
            field: "password_hash",
        },
        technicianId:{
            type: DataTypes.UUID,
            allowNull: true,
            field: "technician_id",
        },
        isActive:{
            type:DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
            field: "is_active",
        }
    },
    {
        tableName: "users",
        underscored: true,
        timestamps: true,
    },
);