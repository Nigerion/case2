import { jest } from "@jest/globals";
import request from "supertest";

const database = {
  authenticate: jest.fn().mockResolvedValue(undefined),
  query: jest.fn().mockResolvedValue([]),
};

const users = {
  "00000000-0000-4000-8000-000000000001": {
    id: "00000000-0000-4000-8000-000000000001",
    email: "viewer@example.test",
    role: "viewer",
    technicianId: null,
    isActive: true,
    createdAt: "2026-01-01T00:00:00.000Z",
  },
  "00000000-0000-4000-8000-000000000002": {
    id: "00000000-0000-4000-8000-000000000002",
    email: "tech@example.test",
    role: "technician",
    technicianId: "00000000-0000-4000-8000-000000000102",
    isActive: true,
    createdAt: "2026-01-01T00:00:00.000Z",
  },
  "00000000-0000-4000-8000-000000000003": {
    id: "00000000-0000-4000-8000-000000000003",
    email: "admin@example.test",
    role: "admin",
    technicianId: null,
    isActive: true,
    createdAt: "2026-01-01T00:00:00.000Z",
  },
};

const publicUser = (user) => ({
  id: user.id,
  email: user.email,
  role: user.role,
  technicianId: user.technicianId,
  createdAt: user.createdAt,
});

const mockServices = {
  auth: {
    register: jest.fn(),
    login: jest.fn(),
    refresh: jest.fn(),
  },
  equipment: {
    getMany: jest.fn(),
    getById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  request: {
    getMany: jest.fn(),
    getById: jest.fn(),
    getByEquipmentId: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateStatus: jest.fn(),
    delete: jest.fn(),
    assignCrew: jest.fn(),
    unassign: jest.fn(),
    getHistory: jest.fn(),
  },
  site: { getSummary: jest.fn() },
  report: { equipmentLoad: jest.fn() },
  weather: { getEquipmentWeather: jest.fn() },
};

const userRepository = {
  findById: jest.fn(async (id) => users[id] ?? null),
};

jest.unstable_mockModule("../src/config/db.js", () => ({ sequelize: database }));
jest.unstable_mockModule("../src/repositories/user.repository.js", () => ({ userRepository }));
jest.unstable_mockModule("../src/services/auth.service.js", () => ({ authService: mockServices.auth }));
jest.unstable_mockModule("../src/services/equipment.service.js", () => ({ equipmentService: mockServices.equipment }));
jest.unstable_mockModule("../src/services/request.service.js", () => ({ requestService: mockServices.request }));
jest.unstable_mockModule("../src/services/site.service.js", () => ({ siteService: mockServices.site }));
jest.unstable_mockModule("../src/services/report.service.js", () => ({ reportService: mockServices.report }));
jest.unstable_mockModule("../src/services/weather.service.js", () => ({ weatherService: mockServices.weather }));

const [{ default: app }, tokenUtils, { UnauthorizedError }, { ConflictError }] = await Promise.all([
  import("../src/app.js"),
  import("../src/utils/tokens.js"),
  import("../src/errors/UnauthorizedError.js"),
  import("../src/errors/ConflictError.js"),
]);

const userByEmail = Object.fromEntries(Object.values(users).map((user) => [user.email, user]));

mockServices.auth.login.mockImplementation(async ({ email, password }) => {
  const user = userByEmail[email.trim().toLowerCase()];
  if (!user || password !== "Password123!") {
    throw new UnauthorizedError("Неверный email или пароль");
  }
  return {
    user: publicUser(user),
    accessToken: tokenUtils.signAccessToken(user),
    refreshToken: tokenUtils.signRefreshToken(user),
  };
});

mockServices.auth.register.mockImplementation(async (data, { actor } = {}) => {
  const user = { ...users["00000000-0000-4000-8000-000000000001"], email: data.email };
  if (data.role && data.role !== "viewer" && actor?.role !== "admin") {
    const { ValidationError } = await import("../src/errors/ValidationError.js");
    throw new ValidationError("Назначать роль может только администратор", [], 422);
  }
  return { ...publicUser(user), role: actor?.role === "admin" ? data.role ?? "viewer" : "viewer" };
});

mockServices.auth.refresh.mockImplementation(async (refreshToken) => {
  let payload;
  try {
    payload = tokenUtils.verifyToken(refreshToken);
  } catch {
    throw new UnauthorizedError("Недействительный refresh-токен");
  }
  if (payload.type !== "refresh" || !users[payload.sub]) {
    throw new UnauthorizedError("Недействительный refresh-токен");
  }
  const user = users[payload.sub];
  return {
    user: publicUser(user),
    accessToken: tokenUtils.signAccessToken(user),
    refreshToken: tokenUtils.signRefreshToken(user),
  };
});

const equipment = {
  id: "10000000-0000-4000-8000-000000000001",
  name: "Test turbine",
  type: "turbine",
  serialNumber: "TST-001",
  status: "operational",
  installedAt: "2025-01-01T00:00:00.000Z",
};

const maintenanceRequest = {
  id: "20000000-0000-4000-8000-000000000001",
  equipmentId: equipment.id,
  title: "Inspect turbine bearing",
  description: "Quarterly inspection",
  priority: "high",
  status: "new",
  plannedAt: null,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

mockServices.equipment.getMany.mockResolvedValue({ data: [equipment], meta: { total: 1, page: 1, limit: 10 } });
mockServices.equipment.getById.mockResolvedValue(equipment);
mockServices.equipment.create.mockResolvedValue(equipment);
mockServices.equipment.update.mockResolvedValue(equipment);
mockServices.equipment.delete.mockResolvedValue(undefined);
mockServices.request.getMany.mockResolvedValue({ data: [maintenanceRequest], meta: { total: 1, page: 1, limit: 10 } });
mockServices.request.getById.mockResolvedValue(maintenanceRequest);
mockServices.request.getByEquipmentId.mockResolvedValue([maintenanceRequest]);
mockServices.request.create.mockResolvedValue(maintenanceRequest);
mockServices.request.update.mockResolvedValue(maintenanceRequest);
mockServices.request.updateStatus.mockResolvedValue({ ...maintenanceRequest, status: "rejected" });
mockServices.request.delete.mockResolvedValue(undefined);
mockServices.request.assignCrew.mockResolvedValue(maintenanceRequest);
mockServices.request.unassign.mockResolvedValue(true);
mockServices.request.getHistory.mockResolvedValue([]);
mockServices.site.getSummary.mockResolvedValue({ site: { id: "site-1" }, byStatus: {}, byPriority: {}, avgCloseHours: null });
mockServices.report.equipmentLoad.mockResolvedValue({ data: [], meta: { total: 0 } });
mockServices.weather.getEquipmentWeather.mockResolvedValue({
  equipmentId: equipment.id,
  source: "mock",
  fetchedAt: "2026-01-01T00:00:00.000Z",
  data: [],
  outdoorWorkSuitable: true,
  criteria: { maxWindSpeed: 10, allowPrecipitation: false },
});

const accessToken = (user) => tokenUtils.signAccessToken(user);

beforeEach(() => {
  jest.clearAllMocks();
  database.authenticate.mockResolvedValue(undefined);
  database.query.mockResolvedValue([]);
  userRepository.findById.mockImplementation(async (id) => users[id] ?? null);
  mockServices.equipment.getMany.mockResolvedValue({ data: [equipment], meta: { total: 1, page: 1, limit: 10 } });
  mockServices.request.getMany.mockResolvedValue({ data: [maintenanceRequest], meta: { total: 1, page: 1, limit: 10 } });
});

describe("API authentication and authorization integration", () => {
  test.each([
    ["/api/equipment"],
    ["/api/requests"],
    ["/api/reports/equipment-load"],
  ])("returns 401 for unauthenticated reads at %s", async (path) => {
    const response = await request(app).get(path);

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe("UNAUTHORIZED");
  });

  test("allows viewer reads and rejects writes requiring elevated roles", async () => {
    const viewer = users["00000000-0000-4000-8000-000000000001"];
    const token = accessToken(viewer);

    const readResponse = await request(app)
      .get("/api/equipment")
      .set("Authorization", `Bearer ${token}`);
    const equipmentWriteResponse = await request(app)
      .post("/api/equipment")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Test turbine", type: "turbine", serialNumber: "TST-002", status: "operational", installedAt: "2025-01-01T00:00:00.000Z", siteId: "30000000-0000-4000-8000-000000000001" });
    const requestWriteResponse = await request(app)
      .post("/api/requests")
      .set("Authorization", `Bearer ${token}`)
      .send({ equipmentId: equipment.id, title: "Inspect turbine bearing", priority: "high" });

    expect(readResponse.status).toBe(200);
    expect(readResponse.body.data).toHaveLength(1);
    expect(equipmentWriteResponse.status).toBe(403);
    expect(requestWriteResponse.status).toBe(403);
  });

  test("allows technician request creation and passes actor into status service", async () => {
    const technician = users["00000000-0000-4000-8000-000000000002"];
    const token = accessToken(technician);

    const createResponse = await request(app)
      .post("/api/requests")
      .set("Authorization", `Bearer ${token}`)
      .send({ equipmentId: equipment.id, title: "Inspect turbine bearing", priority: "high" });
    const statusResponse = await request(app)
      .patch(`/api/requests/${maintenanceRequest.id}/status`)
      .set("Authorization", `Bearer ${token}`)
      .send({ status: "rejected" });

    expect(createResponse.status).toBe(201);
    expect(statusResponse.status).toBe(200);
    expect(mockServices.request.updateStatus).toHaveBeenCalledWith(
      maintenanceRequest.id,
      "rejected",
      expect.objectContaining({ user: expect.objectContaining({ role: "technician", technicianId: technician.technicianId }) }),
    );
  });

  test("enforces request validation and formats conflict responses", async () => {
    const admin = users["00000000-0000-4000-8000-000000000003"];
    const token = accessToken(admin);
    const invalid = await request(app)
      .post("/api/requests")
      .set("Authorization", `Bearer ${token}`)
      .send({ equipmentId: "not-a-uuid", title: "x", priority: "urgent" });

    mockServices.request.delete.mockRejectedValueOnce(new ConflictError("Request has status history"));
    const conflict = await request(app)
      .delete(`/api/requests/${maintenanceRequest.id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(invalid.status).toBe(422);
    expect(invalid.body.error.code).toBe("VALIDATION_ERROR");
    expect(conflict.status).toBe(409);
    expect(conflict.body.error.code).toBe("CONFLICT");
    expect(conflict.body.error.requestId).toBeDefined();
  });

  test("covers equipment and request read, create, update and delete routes", async () => {
    const adminToken = accessToken(users["00000000-0000-4000-8000-000000000003"]);
    const technicianToken = accessToken(users["00000000-0000-4000-8000-000000000002"]);
    const equipmentId = equipment.id;
    const requestId = maintenanceRequest.id;

    const equipmentList = await request(app).get("/api/equipment").set("Authorization", `Bearer ${adminToken}`);
    const equipmentCard = await request(app).get(`/api/equipment/${equipmentId}`).set("Authorization", `Bearer ${adminToken}`);
    const equipmentCreate = await request(app)
      .post("/api/equipment")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ name: "Test turbine", type: "turbine", serialNumber: "TST-002", status: "operational", installedAt: "2025-01-01T00:00:00.000Z", siteId: "30000000-0000-4000-8000-000000000001" });
    const equipmentUpdate = await request(app)
      .patch(`/api/equipment/${equipmentId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ name: "Renamed turbine" });
    const equipmentDelete = await request(app).delete(`/api/equipment/${equipmentId}`).set("Authorization", `Bearer ${adminToken}`);

    const requestList = await request(app).get("/api/requests").set("Authorization", `Bearer ${technicianToken}`);
    const requestCard = await request(app).get(`/api/requests/${requestId}`).set("Authorization", `Bearer ${technicianToken}`);
    const requestUpdate = await request(app)
      .patch(`/api/requests/${requestId}`)
      .set("Authorization", `Bearer ${technicianToken}`)
      .send({ description: "Updated inspection notes" });
    const requestDelete = await request(app).delete(`/api/requests/${requestId}`).set("Authorization", `Bearer ${adminToken}`);

    expect(equipmentList.status).toBe(200);
    expect(equipmentCard.status).toBe(200);
    expect(equipmentCreate.status).toBe(201);
    expect(equipmentUpdate.status).toBe(200);
    expect(equipmentDelete.status).toBe(204);
    expect(requestList.status).toBe(200);
    expect(requestCard.status).toBe(200);
    expect(requestUpdate.status).toBe(200);
    expect(requestDelete.status).toBe(204);
  });

  test("registers a viewer by default and exercises summary, report and assignment routes", async () => {
    const viewerRegistration = await request(app)
      .post("/api/auth/register")
      .send({ email: "new-viewer@example.test", password: "Password123!" });
    const viewerToken = accessToken(users["00000000-0000-4000-8000-000000000001"]);
    const siteSummary = await request(app)
      .get("/api/sites/30000000-0000-4000-8000-000000000001/summary")
      .set("Authorization", `Bearer ${viewerToken}`);
    const report = await request(app)
      .get("/api/reports/equipment-load")
      .set("Authorization", `Bearer ${viewerToken}`);
    const adminToken = accessToken(users["00000000-0000-4000-8000-000000000003"]);
    const crew = [{ technicianId: "00000000-0000-4000-8000-000000000102", role: "lead" }];
    const assigned = await request(app)
      .post(`/api/requests/${maintenanceRequest.id}/assignees`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ assignees: crew });
    const unassigned = await request(app)
      .delete(`/api/requests/${maintenanceRequest.id}/assignees/${crew[0].technicianId}`)
      .set("Authorization", `Bearer ${adminToken}`);
    const history = await request(app)
      .get(`/api/requests/${maintenanceRequest.id}/history`)
      .set("Authorization", `Bearer ${viewerToken}`);

    expect(viewerRegistration.status).toBe(201);
    expect(viewerRegistration.body.data.role).toBe("viewer");
    expect(viewerRegistration.body.data).not.toHaveProperty("passwordHash");
    expect(siteSummary.status).toBe(200);
    expect(report.status).toBe(200);
    expect(assigned.status).toBe(200);
    expect(unassigned.status).toBe(204);
    expect(history.status).toBe(200);
  });

  test("login, me, refresh and logout use access and refresh cookies", async () => {
    const login = await request(app)
      .post("/api/auth/login")
      .send({ email: "viewer@example.test", password: "Password123!" });
    const cookieHeader = login.headers["set-cookie"][0];
    const refreshCookie = cookieHeader.split(";")[0];

    const me = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${login.body.data.accessToken}`);
    const refresh = await request(app)
      .post("/api/auth/refresh")
      .set("Cookie", refreshCookie);
    const logout = await request(app)
      .post("/api/auth/logout")
      .set("Cookie", refreshCookie);

    expect(login.status).toBe(200);
    expect(cookieHeader.toLowerCase()).toContain("httponly");
    expect(me.status).toBe(200);
    expect(me.body.data.email).toBe("viewer@example.test");
    expect(refresh.status).toBe(200);
    expect(refresh.headers["set-cookie"][0]).toContain("refreshToken=");
    expect(logout.status).toBe(204);
  });

  test("returns the same login error for unknown users and wrong passwords", async () => {
    const wrongPassword = await request(app)
      .post("/api/auth/login")
      .send({ email: "viewer@example.test", password: "wrong-password" });
    const unknownUser = await request(app)
      .post("/api/auth/login")
      .send({ email: "missing@example.test", password: "Password123!" });

    expect(wrongPassword.status).toBe(401);
    expect(unknownUser.status).toBe(401);
    expect(wrongPassword.body.error.message).toBe(unknownUser.body.error.message);
  });

  test("rejects invalid refresh cookies and serves stubbed weather without external calls", async () => {
    const invalidRefresh = await request(app)
      .post("/api/auth/refresh")
      .set("Cookie", "refreshToken=invalid");
    const viewer = users["00000000-0000-4000-8000-000000000001"];
    const weather = await request(app)
      .get(`/api/equipment/${equipment.id}/weather`)
      .set("Authorization", `Bearer ${accessToken(viewer)}`);

    expect(invalidRefresh.status).toBe(401);
    expect(weather.status).toBe(200);
    expect(weather.body.data.source).toBe("mock");
    expect(mockServices.weather.getEquipmentWeather).toHaveBeenCalledWith(equipment.id);
  });
});