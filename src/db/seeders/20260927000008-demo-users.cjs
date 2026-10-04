"use strict";

const bcrypt = require("bcrypt");

module.exports = {
  async up(queryInterface) {
    const now = new Date();
    const rounds = Number(process.env.BCRYPT_ROUNDS) || 12;
    const isProduction = process.env.NODE_ENV === "production";
    const adminPassword = process.env.SEED_ADMIN_PASSWORD || "Admin123!";

    if (
      isProduction &&
      (adminPassword.length < 16 || /replace-with|change-me/i.test(adminPassword))
    ) {
      throw new Error("SEED_ADMIN_PASSWORD must be a non-placeholder value of at least 16 characters in production");
    }

    const adminHash = await bcrypt.hash(adminPassword, rounds);
    const users = [
      {
        id: "e1111111-1111-4111-8111-111111111111",
        email: "admin@example.com",
        password_hash: adminHash,
        role: "admin",
        technician_id: null,
        is_active: true,
        created_at: now,
        updated_at: now,
      },
    ];

    if (!isProduction) {
      const techHash = await bcrypt.hash("Tech123!", rounds);
      const viewerHash = await bcrypt.hash("Viewer123!", rounds);
      users.push(
        {
          id: "e1111111-1111-4111-8111-111111111112",
          email: "tech@example.com",
          password_hash: techHash,
          role: "technician",
          technician_id: "a1111111-1111-4111-8111-111111111111",
          is_active: true,
          created_at: now,
          updated_at: now,
        },
        {
          id: "e1111111-1111-4111-8111-111111111113",
          email: "viewer@example.com",
          password_hash: viewerHash,
          role: "viewer",
          technician_id: null,
          is_active: true,
          created_at: now,
          updated_at: now,
        },
      );
    }

    await queryInterface.bulkInsert("users", users);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete("users", null, {});
  },
};