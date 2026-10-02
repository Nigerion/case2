import { jest } from "@jest/globals";

process.env.JWT_SECRET ??= "integration-test-secret-with-at-least-32-characters";

const userRepository = {
  findByEmail: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
};
const Technician = { findByPk: jest.fn() };

jest.unstable_mockModule("../src/repositories/user.repository.js", () => ({ userRepository }));
jest.unstable_mockModule("../src/models/index.js", () => ({ Technician }));

const [{ authService }, bcrypt, tokenUtils, { ConflictError }, { UnauthorizedError }, { ValidationError }] = await Promise.all([
  import("../src/services/auth.service.js"),
  import("bcrypt"),
  import("../src/utils/tokens.js"),
  import("../src/errors/ConflictError.js"),
  import("../src/errors/UnauthorizedError.js"),
  import("../src/errors/ValidationError.js"),
]);

const user = {
  id: "00000000-0000-4000-8000-000000000001",
  email: "viewer@example.test",
  role: "viewer",
  technicianId: null,
  isActive: true,
  createdAt: "2026-01-01T00:00:00.000Z",
};

beforeEach(() => {
  jest.clearAllMocks();
  userRepository.findByEmail.mockResolvedValue(null);
  userRepository.findById.mockResolvedValue(user);
  userRepository.create.mockImplementation(async (data) => ({
    ...data,
    ...user,
    email: data.email,
    role: data.role,
    technicianId: data.technicianId,
  }));
});

describe("authService", () => {
  test("normalizes email, hashes password, and returns no hash on registration", async () => {
    const result = await authService.register({
      email: "  New.User@Example.Test ",
      password: "Password123!",
    });
    const savedUser = userRepository.create.mock.calls[0][0];

    expect(userRepository.findByEmail).toHaveBeenCalledWith("new.user@example.test");
    expect(savedUser.email).toBe("new.user@example.test");
    expect(savedUser.role).toBe("viewer");
    expect(savedUser.passwordHash).not.toBe("Password123!");
    expect(await bcrypt.compare("Password123!", savedUser.passwordHash)).toBe(true);
    expect(result).not.toHaveProperty("passwordHash");
  });

  test("rejects duplicate email and unauthorized role elevation", async () => {
    userRepository.findByEmail.mockResolvedValueOnce(user);
    await expect(authService.register({ email: user.email, password: "Password123!" }))
      .rejects.toBeInstanceOf(ConflictError);

    userRepository.findByEmail.mockResolvedValueOnce(null);
    await expect(authService.register({
      email: "admin@example.test",
      password: "Password123!",
      role: "admin",
    })).rejects.toBeInstanceOf(ValidationError);
  });

  test("returns the same login error for unknown, inactive, and wrong-password users", async () => {
    const passwordHash = await bcrypt.hash("Password123!", 4);
    userRepository.findByEmail.mockImplementation(async (email) => {
      if (email === user.email) return { ...user, passwordHash };
      if (email === "inactive@example.test") return { ...user, email, isActive: false, passwordHash };
      return null;
    });

    const unknown = authService.login({ email: "missing@example.test", password: "Password123!" });
    const inactive = authService.login({ email: "inactive@example.test", password: "Password123!" });
    const wrongPassword = authService.login({ email: user.email, password: "wrong" });
    const results = await Promise.all([unknown, inactive, wrongPassword].map((promise) => promise.catch((error) => error)));

    expect(results.every((result) => result instanceof UnauthorizedError)).toBe(true);
    expect(new Set(results.map((error) => error.message)).size).toBe(1);
  });

  test("issues typed tokens on login and only refreshes a valid refresh token", async () => {
    const passwordHash = await bcrypt.hash("Password123!", 4);
    userRepository.findByEmail.mockResolvedValue({ ...user, passwordHash });

    const login = await authService.login({ email: " VIEWER@example.test ", password: "Password123!" });
    expect(tokenUtils.verifyToken(login.accessToken).type).toBe("access");
    expect(tokenUtils.verifyToken(login.refreshToken).type).toBe("refresh");

    const refreshed = await authService.refresh(login.refreshToken);
    expect(tokenUtils.verifyToken(refreshed.accessToken).type).toBe("access");
    expect(tokenUtils.verifyToken(refreshed.refreshToken).type).toBe("refresh");
    await expect(authService.refresh(login.accessToken)).rejects.toBeInstanceOf(UnauthorizedError);
  });
});