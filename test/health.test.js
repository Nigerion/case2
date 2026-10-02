import app from "../src/app.js";

let server;
let baseUrl;

beforeAll(async () => {
  server = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

afterAll(async () => {
  await new Promise((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve());
  });
});

describe("health and metrics endpoints", () => {
  test("liveness succeeds without checking the database", async () => {
    const response = await fetch(`${baseUrl}/api/health/live`);

    expect(response.status).toBe(200);
    expect((await response.json()).status).toBe("alive");
  });

  test("readiness reports database state instead of crashing", async () => {
    const response = await fetch(`${baseUrl}/api/health/ready`);
    const body = await response.json();

    expect([200, 503]).toContain(response.status);
    expect(body.status).toBe(response.status === 200 ? "ready" : "not_ready");
    expect(["available", "unavailable"]).toContain(body.dependencies.database);
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