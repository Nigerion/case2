import { EventEmitter } from "node:events";
import { metricsMiddleware, metricsRegistry } from "../src/monitoring/metrics.js";

describe("HTTP metrics middleware", () => {
  beforeEach(() => {
    metricsRegistry.resetMetrics();
  });

  test("records requests with route and response status labels", async () => {
    const response = new EventEmitter();
    response.statusCode = 503;
    let nextCalled = false;

    metricsMiddleware(
      {
        method: "GET",
        path: "/api/health/ready",
        baseUrl: "",
        route: { path: "/api/health/ready" },
      },
      response,
      () => { nextCalled = true; },
    );
    response.emit("finish");

    const exposition = await metricsRegistry.metrics();
    expect(nextCalled).toBe(true);
    expect(exposition).toContain('http_requests_total{method="GET",route="/api/health/ready",status_code="503"} 1');
    expect(exposition).toContain('http_errors_total{method="GET",route="/api/health/ready",status_code="503"} 1');
  });

  test("does not count Prometheus scrape requests", async () => {
    const response = new EventEmitter();
    response.statusCode = 200;

    metricsMiddleware(
      { method: "GET", path: "/metrics" },
      response,
      () => {},
    );
    response.emit("finish");

    const exposition = await metricsRegistry.metrics();
    expect(exposition).not.toContain("route=\"/metrics\"");
  });
});