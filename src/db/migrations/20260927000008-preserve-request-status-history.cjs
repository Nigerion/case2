"use strict";

const constraintName = "request_status_history_request_id_fkey";

module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.removeConstraint(
        "request_status_history",
        constraintName,
        { transaction },
      );

      await queryInterface.addConstraint("request_status_history", {
        fields: ["request_id"],
        type: "foreign key",
        name: constraintName,
        references: { table: "maintenance_requests", field: "id" },
        onDelete: "RESTRICT",
        onUpdate: "CASCADE",
        transaction,
      });

      await queryInterface.sequelize.query(
        `CREATE OR REPLACE FUNCTION reject_request_status_history_mutation()
         RETURNS trigger LANGUAGE plpgsql AS $$
         BEGIN
           RAISE EXCEPTION 'request status history is immutable';
         END;
         $$;`,
        { transaction },
      );
      await queryInterface.sequelize.query(
        `CREATE TRIGGER request_status_history_immutable
         BEFORE UPDATE OR DELETE ON request_status_history
         FOR EACH ROW EXECUTE FUNCTION reject_request_status_history_mutation();`,
        { transaction },
      );
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query(
        "DROP TRIGGER request_status_history_immutable ON request_status_history;",
        { transaction },
      );
      await queryInterface.sequelize.query(
        "DROP FUNCTION reject_request_status_history_mutation();",
        { transaction },
      );

      await queryInterface.removeConstraint(
        "request_status_history",
        constraintName,
        { transaction },
      );
      await queryInterface.addConstraint("request_status_history", {
        fields: ["request_id"],
        type: "foreign key",
        name: constraintName,
        references: { table: "maintenance_requests", field: "id" },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
        transaction,
      });
    });
  },
};