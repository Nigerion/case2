"use strict";

require("dotenv/config");

const base = {
  username: process.env.POSTGRES_USER || "maintenance",
  password: process.env.POSTGRES_PASSWORD || "maintenance",
  database: process.env.POSTGRES_DB || "maintenance",
  host: process.env.POSTGRES_HOST || "localhost",
  port: Number(process.env.POSTGRES_PORT) || 5432,
  dialect: "postgres",
  logging: process.env.DB_LOGGING === "true" ? console.log : false,
  define: {
    underscored: true,
    timestamps: true,
  },
};

module.exports = {
  development: base,
  test: {
    ...base,
    database: `${base.database}_test`,
  },
  production: base,
};