import { sequelize } from "../config/db.js";
import { Site } from "./site.model.js";
import { Technician } from "./technician.model.js";
import { Equipment } from "./equipment.model.js";
import { EquipmentPassport } from "./equipmentPassport.model.js";
import { MaintenanceRequest } from "./maintenanceRequest.model.js";
import { RequestStatusHistory } from "./requestStatusHistory.model.js";
import { RequestAssignee } from "./requestAssignee.model.js";
import { User } from "./user.model.js";

Site.hasMany(Equipment, {
  foreignKey: "siteId",
  as: "equipment",
  onDelete: "RESTRICT",
  onUpdate: "CASCADE",
});

Equipment.belongsTo(Site, {
  foreignKey: "siteId",
  as: "site",
});

Equipment.hasOne(EquipmentPassport, {
  foreignKey: "equipmentId",
  as: "passport",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});

EquipmentPassport.belongsTo(Equipment, {
  foreignKey: "equipmentId",
  as: "equipment",
});

Equipment.hasMany(MaintenanceRequest, {
  foreignKey: "equipmentId",
  as: "requests",
  onDelete: "RESTRICT",
  onUpdate: "CASCADE",
});

MaintenanceRequest.belongsTo(Equipment, {
  foreignKey: "equipmentId",
  as: "equipment",
});

MaintenanceRequest.hasMany(RequestStatusHistory, {
  foreignKey: "requestId",
  as: "history",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});

RequestStatusHistory.belongsTo(MaintenanceRequest, {
  foreignKey: "requestId",
  as: "request",
});

MaintenanceRequest.belongsToMany(Technician, {
  through: RequestAssignee,
  foreignKey: "requestId",
  otherKey: "technicianId",
  as: "assignees",
  onDelete: "CASCADE",
});

Technician.belongsToMany(MaintenanceRequest, {
  through: RequestAssignee,
  foreignKey: "technicianId",
  otherKey: "requestId",
  as: "requests",
  onDelete: "RESTRICT",
});

RequestAssignee.belongsTo(MaintenanceRequest, {
  foreignKey: "requestId",
  as: "request",
});

RequestAssignee.belongsTo(Technician, {
  foreignKey: "technicianId",
  as: "technician",
});

MaintenanceRequest.hasMany(RequestAssignee, {
  foreignKey: "requestId",
  as: "assigneeRows",
});

Technician.hasMany(RequestAssignee, {
  foreignKey: "technicianId",
  as: "assignmentRows",
});

Technician.hasOne(User, {
  foreignKey: "technicianId",
  as: "user",
  onDelete: "SET NULL",
  onUpdate: "CASCADE",
});

User.belongsTo(Technician, {
  foreignKey: "technicianId",
  as: "technician",
});

export {
    sequelize,
    Site,
    Technician,
    Equipment,
    EquipmentPassport,
    MaintenanceRequest,
    RequestStatusHistory,
    RequestAssignee,
    User,
};