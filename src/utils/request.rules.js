import { ConflictError } from "../errors/ConflictError.js";
import { ForbiddenError } from "../errors/ForbiddenError.js";
import { NotFoundError } from "../errors/NotFoundError.js";
import { ValidationError } from "../errors/ValidationError.js";

const allowedTransitions = {
  new: ["in_progress", "rejected"],
  in_progress: ["done", "rejected"],
  done: [],
  rejected: [],
};

export function assertEditableRequest(request) {
  if (request.status === "done" || request.status === "rejected") {
    throw new ConflictError("Нельзя редактировать завершённую или отклонённую заявку");
  }
}

export function assertTechnicianAssigned(user, isAssigned) {
  if (user?.role !== "technician") return;
  if (!user.technicianId) {
    throw new ForbiddenError("Пользователь не привязан к специалисту");
  }
  if (!isAssigned) {
    throw new ForbiddenError("Вы не назначены на эту заявку");
  }
}

export function assertAllowedStatusTransition(currentStatus, nextStatus) {
  if (!allowedTransitions[currentStatus]?.includes(nextStatus)) {
    throw new ConflictError(
      `Недопустимый переход статуса: ${currentStatus} → ${nextStatus}`,
    );
  }
}

export function assertHasAssignees(nextStatus, count) {
  if (nextStatus === "in_progress" && count === 0) {
    throw new ConflictError(
      "Нельзя перевести заявку в статус in_progress без назначенных исполнителей",
    );
  }
}

export function assertCrewValid(assignees) {
  if (!Array.isArray(assignees) || assignees.length === 0) {
    throw new ValidationError("Список исполнителей не может быть пустым", [], 422);
  }

  const leads = assignees.filter((assignee) => assignee.role === "lead");
  if (leads.length !== 1) {
    throw new ValidationError(
      "Ровно один специалист должен иметь роль lead",
      [{ field: "assignees", message: `Найдено lead: ${leads.length}` }],
      422,
    );
  }

  const ids = assignees.map((assignee) => assignee.technicianId);
  if (new Set(ids).size !== ids.length) {
    throw new ValidationError(
      "Специалист не может быть назначен в бригаду несколько раз",
      [{ field: "assignees", message: "Идентификаторы специалистов должны быть уникальны" }],
      422,
    );
  }
}

export function assertCanUnassignAssignee(assignees, technicianId) {
  const assignee = assignees.find((item) => item.technicianId === technicianId);
  if (!assignee) {
    throw new NotFoundError("Специалист не назначен на эту заявку");
  }
  if (assignee.role === "lead" && assignees.length > 1) {
    throw new ConflictError(
      "Нельзя снять единственного lead, пока в бригаде остаются специалисты",
    );
  }
}