import {sequelize} from '../config/db.js';
import { DataTypes } from "sequelize";


export const Site = sequelize.define(
    'Site', 
    {
        id:{
            type : DataTypes.UUID,
            defaultValue : DataTypes.UUIDV4,
            primaryKey : true,
        },
        name:{
            type: DataTypes.STRING(150),
            allowNull:false,
        },
        code:{
            type:DataTypes.STRING(50),
            allowNull:false,
            unique:true
        },
        region:{
            type: DataTypes.STRING(100),
            allowNull:false
        },
        latitude:{
            type: DataTypes.DOUBLE,
            allowNull:false
        },
        longitude: {
            type: DataTypes.DOUBLE,
            allowNull: false,
        },
    },
    {
        tableName: "sites",
        underscored: true,
        timestamps: true,
    },
)