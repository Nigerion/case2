'use strict';

module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('users', {
      id:{
          type: Sequelize.UUID,
          defaultValue: Sequelize.literal("gen_random_uuid()"),
          primaryKey: true,
      },
      email:{
        type: Sequelize.STRING(150),
        allowNull: false,
        unique: true,
      },
      role: {
        type: Sequelize.ENUM("viewer", "technician", "admin"),
        allowNull: false,
        defaultValue: "viewer",
      },
      password_hash:{
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      technician_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: "technicians",
          key: "id",
        },
        onDelete: "SET NULL",
        onUpdate: "CASCADE",
      },
      is_active:{
        type:Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn("now"),
      },
      updated_at:{
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn("now"),
      }
    });
    await queryInterface.addIndex("users", ["role"], {
      name: "users_role_idx",
    });
    await queryInterface.addIndex("users", ["technician_id"], {
      name: "users_technician_idx",
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable("users");
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_users_role";',
    );
  }
};
