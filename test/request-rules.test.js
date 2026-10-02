import {
  assertAllowedStatusTransition,
  assertCanUnassignAssignee,
  assertCrewValid,
  assertEditableRequest,
  assertHasAssignees,
  assertTechnicianAssigned,
} from "../src/utils/request.rules.js";
import { ConflictError } from "../src/errors/ConflictError.js";
import { ForbiddenError } from "../src/errors/ForbiddenError.js";
import { NotFoundError } from "../src/errors/NotFoundError.js";
import { ValidationError } from "../src/errors/ValidationError.js";

describe("request business rules", () => {
  test.each([
    ["new", "in_progress"],
    ["new", "rejected"],
    ["in_progress", "done"],
    ["in_progress", "rejected"],
  ])("allows transition %s -> %s", (current, next) => {
    expect(() => assertAllowedStatusTransition(current, next)).not.toThrow();
  });

  test.each([
    ["new", "done"],
    ["done", "in_progress"],
    ["rejected", "new"],
  ])("rejects transition %s -> %s", (current, next) => {
    expect(() => assertAllowedStatusTransition(current, next)).toThrow(ConflictError);
  });

  test("requires assignees before work starts and blocks editing closed requests", () => {
    expect(() => assertHasAssignees("in_progress", 0)).toThrow(ConflictError);
    expect(() => assertHasAssignees("in_progress", 1)).not.toThrow();
    expect(() => assertEditableRequest({ status: "done" })).toThrow(ConflictError);
    expect(() => assertEditableRequest({ status: "new" })).not.toThrow();
  });

  test("restricts technicians to assigned requests while admin is unrestricted", () => {
    const technician = { role: "technician", technicianId: "tech-1" };
    expect(() => assertTechnicianAssigned(technician, true)).not.toThrow();
    expect(() => assertTechnicianAssigned(technician, false)).toThrow(ForbiddenError);
    expect(() => assertTechnicianAssigned({ role: "technician" }, false)).toThrow(ForbiddenError);
    expect(() => assertTechnicianAssigned({ role: "admin" }, false)).not.toThrow();
  });

  test("requires exactly one lead and rejects duplicate technicians", () => {
    const validCrew = [
      { technicianId: "tech-1", role: "lead" },
      { technicianId: "tech-2", role: "member" },
    ];
    expect(() => assertCrewValid(validCrew)).not.toThrow();
    expect(() => assertCrewValid([])).toThrow(ValidationError);
    expect(() => assertCrewValid([
      { technicianId: "tech-1", role: "member" },
    ])).toThrow(ValidationError);
    expect(() => assertCrewValid([
      { technicianId: "tech-1", role: "lead" },
      { technicianId: "tech-2", role: "lead" },
    ])).toThrow(ValidationError);
    expect(() => assertCrewValid([
      { technicianId: "tech-1", role: "lead" },
      { technicianId: "tech-1", role: "member" },
    ])).toThrow(ValidationError);
  });

  test("prevents removing the sole lead while members remain", () => {
    const crew = [
      { technicianId: "tech-1", role: "lead" },
      { technicianId: "tech-2", role: "member" },
    ];
    expect(() => assertCanUnassignAssignee(crew, "tech-1")).toThrow(ConflictError);
    expect(() => assertCanUnassignAssignee(crew, "tech-2")).not.toThrow();
    expect(() => assertCanUnassignAssignee(crew, "missing")).toThrow(NotFoundError);
  });
});