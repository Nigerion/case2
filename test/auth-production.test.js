import { validateAuthRuntimeConfig } from "../src/config/env.js";

function productionConfig(overrides = {}) {
  return {
    nodeEnv: "production",
    jwt: { secret: "a".repeat(48) },
    cookie: { secure: true, sameSite: "strict" },
    ...overrides,
  };
}

describe("production auth configuration", () => {
  test("accepts valid production settings", () => {
    expect(() => validateAuthRuntimeConfig(productionConfig())).not.toThrow();
  });

  test.each([undefined, "", "replace-with-a-random-secret"])(
    "rejects missing or placeholder JWT secrets",
    (secret) => {
      const config = productionConfig({ jwt: { secret } });
      expect(() => validateAuthRuntimeConfig(config)).toThrow(/JWT_SECRET/);
    },
  );

  test("requires a 32-character JWT secret in production", () => {
    const config = productionConfig({ jwt: { secret: "short-secret" } });
    expect(() => validateAuthRuntimeConfig(config)).toThrow(/at least 32 characters/);
  });

  test("requires Secure cookies in production", () => {
    const config = productionConfig({ cookie: { secure: false, sameSite: "strict" } });
    expect(() => validateAuthRuntimeConfig(config)).toThrow(/COOKIE_SECURE/);
  });

  test("requires Secure when SameSite=None and rejects unknown SameSite values", () => {
    expect(() => validateAuthRuntimeConfig(productionConfig({
      cookie: { secure: true, sameSite: "invalid" },
    }))).toThrow(/COOKIE_SAMESITE/);
    expect(() => validateAuthRuntimeConfig(productionConfig({
      cookie: { secure: false, sameSite: "none" },
    }))).toThrow(/COOKIE_SECURE/);
  });

  test("allows an explicit development secret and HTTP cookie settings", () => {
    const config = {
      nodeEnv: "development",
      jwt: { secret: "local-development-secret" },
      cookie: { secure: false, sameSite: "strict" },
    };
    expect(() => validateAuthRuntimeConfig(config)).not.toThrow();
  });
});