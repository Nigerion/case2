import {env} from './env.js';
import {Sequelize} from 'sequelize';
import {logger} from "../utils/logger.js";

export const sequelize = new Sequelize(
    env.db.name,
    env.db.user,
    env.db.password,
    {
        host: env.db.host,
        port: env.db.port,
        dialect: "postgres",
        logging: env.db.logging
            ? (msg) => logger.debug({ sql: msg }, "sequelize")
            : false,
        define: {
            underscored: true,
            timestamps: true,
        },
        pool:{
            max: env.db.pool.max,
            min:env.db.pool.min,
            acquire: env.db.pool.acquire,
            idle: env.db.pool.idle,
        }
    }
);


export async function assertDatabaseConnection() {
    try{
        await sequelize.authenticate()
        logger.info({
            host: env.db.host,
            port: env.db.port,
            db: env.db.name
        }, 'Database connection established successfully');
    } catch (error) {
        logger.fatal({
            err: error,
            host: env.db.host,
            port: env.db.port,
            db: env.db.name
        }, "Failed to connect to the database");
        process.exit(1);
    }
}