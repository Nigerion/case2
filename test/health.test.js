import app from "../src/app.js";
import { jest } from "@jest/globals";
import { sequelize } from "../src/config/db.js";

let server;
let baseUrl;
let authenticate;
let query;

beforeAll(async () => {
  authenticate = jest.spyOn(sequelize, "authenticate");
  query = jest.spyOn(sequelize, "query");
  server = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

beforeEach(() => {
  authenticate.mockReset();
  query.mockReset().mockResolvedValue([]);
});

afterAll(async () => {
  await new Promise((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve());
  });
  jest.restoreAllMocks();
});

describe("health and metrics endpoints", () => {
  test("liveness succeeds without checking the database", async () => {
    const response = await fetch(`${baseUrl}/api/health/live`);

    expect(response.status).toBe(200);
    expect((await response.json()).status).toBe("alive");
  });

  test("readiness returns 200 when the database is available", async () => {
    authenticate.mockResolvedValueOnce();
    const response = await fetch(`${baseUrl}/api/health/ready`);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.status).toBe("ready");
    expect(body.dependencies.database).toBe("available");
  });

  test("readiness returns 503 when the database is unavailable", async () => {
    authenticate.mockRejectedValueOnce(new Error("database unavailable"));
    const response = await fetch(`${baseUrl}/api/health/ready`);
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body.status).toBe("not_ready");
    expect(body.dependencies.database).toBe("unavailable");
  });

  test("metrics endpoint returns Prometheus exposition format", async () => {
    const response = await fetch(`${baseUrl}/metrics`);
    const body = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/plain");
    expect(body).toContain("http_requests_total");
    expect(body).toContain("maintenance_database_available");
  });
});

describe("OpenAPI documentation endpoints", () => {
  test("serves the interactive Swagger UI", async () => {
    const response = await fetch(`${baseUrl}/api/docs/`);
    const body = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/html");
    expect(response.headers.get("content-security-policy")).toContain("'unsafe-inline'");
    expect(body).toContain("swagger-ui");

    const configResponse = await fetch(`${baseUrl}/api/docs/swagger-ui-init.js`);
    const config = await configResponse.text();
    expect(configResponse.status).toBe(200);
    expect(config).toContain("Maintenance API");
    expect(config).toContain("persistAuthorization");
  });

  test("serves the OpenAPI document with auth schemes and API paths", async () => {
    const response = await fetch(`${baseUrl}/api/openapi.json`);
    const spec = await response.json();

    expect(response.status).toBe(200);
    expect(spec.openapi).toBe("3.1.0");
    expect(spec.paths["/api/requests/{id}/status"]).toBeDefined();
    expect(spec.components.securitySchemes.BearerAuth.scheme).toBe("bearer");
    expect(spec.components.securitySchemes.RefreshCookieAuth.in).toBe("cookie");
  });
});