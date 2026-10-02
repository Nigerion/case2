"use strict";

const bcrypt = require("bcrypt");

module.exports = {
  async up(queryInterface) {
    const now = new Date();
    const rounds = Number(process.env.BCRYPT_ROUNDS) || 12;

    const adminHash = await bcrypt.hash("Admin123!", rounds);
    const techHash = await bcrypt.hash("Tech123!", rounds);
    const viewerHash = await bcrypt.hash("Viewer123!", rounds);

    await queryInterface.bulkInsert("users", [
      {
        id: "e1111111-1111-1111-1111-111111111111",
        email: "admin@example.com",
        password_hash: adminHash,
        role: "admin",
        technician_id: null,
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        id: "e1111111-1111-1111-1111-111111111112",
        email: "tech@example.com",
        password_hash: techHash,
        role: "technician",
        technician_id: "a1111111-1111-1111-1111-111111111111",
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        id: "e1111111-1111-1111-1111-111111111113",
        email: "viewer@example.com",
        password_hash: viewerHash,
        role: "viewer",
        technician_id: null,
        is_active: true,
        created_at: now,
        updated_at: now,
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete("users", null, {});
  },
};