import {DataTypes} from "sequelize";
import {sequelize} from "../config/db.js";

export const EQUIPMENT_TYPES = [
  "turbine",
  "inverter",
  "sensor",
  "substation",
];

export const EQUIPMENT_STATUSES = [
  "operational",
  "maintenance",
  "fault",
  "decommissioned",
];

export const Equipment = sequelize.define(
  "Equipment",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    siteId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "site_id",
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM(...EQUIPMENT_TYPES),
      allowNull: false,
    },
    serialNumber: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      field: "serial_number",
    },
    status: {
      type: DataTypes.ENUM(...EQUIPMENT_STATUSES),
      allowNull: false,
      defaultValue: "operational",
    },
    installedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: "installed_at",
    },
  },
  {
    tableName: "equipment",
    underscored: true,
    timestamps: true,
  },
);