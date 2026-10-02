import client from "prom-client";
import { QueryTypes } from "sequelize";
import { sequelize } from "../config/db.js";
import { logger } from "../utils/logger.js";

const metricsRegistry = new client.Registry();
client.collectDefaultMetrics({ register: metricsRegistry, prefix: "maintenance_" });

const requestsTotal = new client.Counter({
    name: "http_requests_total",
    help: "Total HTTP requests handled by the API",
    labelNames: ["method", "route", "status_code"],
    registers: [metricsRegistry],
});

const requestErrorsTotal = new client.Counter({
    name: "http_errors_total",
    help: "Total HTTP responses with a 4xx or 5xx status",
    labelNames: ["method", "route", "status_code"],
    registers: [metricsRegistry],
});

const requestDuration = new client.Histogram({
    name: "http_request_duration_seconds",
    help: "HTTP request duration in seconds",
    labelNames: ["method", "route", "status_code"],
    buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
    registers: [metricsRegistry],
});

const businessCollectionErrors = new client.Counter({
    name: "business_metrics_collection_errors_total",
    help: "Failed attempts to refresh database-backed business metrics",
    registers: [metricsRegistry],
});

const databaseAvailable = new client.Gauge({
    name: "maintenance_database_available",
    help: "Whether the application database is available for queries",
    registers: [metricsRegistry],
});

const requestsByStatus = new client.Gauge({
    name: "maintenance_requests_by_status_total",
    help: "Current maintenance request count by status",
    labelNames: ["status"],
    registers: [metricsRegistry],
});

const requestsByPriority = new client.Gauge({
    name: "maintenance_requests_by_priority_total",
    help: "Current maintenance request count by priority",
    labelNames: ["priority"],
    registers: [metricsRegistry],
});

const averageCloseDuration = new client.Gauge({
    name: "maintenance_request_close_duration_seconds_avg",
    help: "Average time from request creation to closure in seconds",
    registers: [metricsRegistry],
});

const openRequestsByEquipment = new client.Gauge({
    name: "equipment_open_requests_total",
    help: "Current open request count by equipment",
    labelNames: ["equipment_name"],
    registers: [metricsRegistry],
});

const overdueRequests = new client.Gauge({
    name: "maintenance_overdue_planned_requests_total",
    help: "Current number of overdue planned maintenance requests",
    registers: [metricsRegistry],
});

let lastBusinessRefresh = 0;
let businessRefreshInFlight;
const BUSINESS_METRICS_TTL_MS = 30_000;

export function metricsMiddleware(req, res, next) {
    if (req.path === "/metrics") return next();

    const endTimer = requestDuration.startTimer();
    res.once("finish", () => {
        const routePath = req.route?.path;
        const route = routePath
            ? `${req.baseUrl}${Array.isArray(routePath) ? routePath.join("|") : routePath}`
            : "unmatched";
        const labels = {
            method: req.method,
            route,
            status_code: String(res.statusCode),
        };

        requestsTotal.inc(labels);
        endTimer(labels);
        if (res.statusCode >= 400) requestErrorsTotal.inc(labels);
    });

    next();
}

export async function refreshBusinessMetrics() {
    if (Date.now() - lastBusinessRefresh < BUSINESS_METRICS_TTL_MS) return;
    if (businessRefreshInFlight) return businessRefreshInFlight;

    businessRefreshInFlight = (async () => {
        try {
            const [statuses, priorities, closeDuration, equipmentLoad, overdue] = await Promise.all([
                sequelize.query(
                    "SELECT status, COUNT(*)::int AS count FROM maintenance_requests GROUP BY status",
                    { type: QueryTypes.SELECT },
                ),
                sequelize.query(
                    "SELECT priority, COUNT(*)::int AS count FROM maintenance_requests GROUP BY priority",
                    { type: QueryTypes.SELECT },
                ),
                sequelize.query(
                    "SELECT COALESCE(AVG(EXTRACT(EPOCH FROM (closed_at - created_at))), 0)::float AS seconds FROM maintenance_requests WHERE closed_at IS NOT NULL",
                    { type: QueryTypes.SELECT },
                ),
                sequelize.query(
                    "SELECT e.name AS equipment_name, COUNT(r.id)::int AS count FROM equipment e LEFT JOIN maintenance_requests r ON r.equipment_id = e.id AND r.status IN ('new', 'in_progress') GROUP BY e.id, e.name",
                    { type: QueryTypes.SELECT },
                ),
                sequelize.query(
                    "SELECT COUNT(*)::int AS count FROM maintenance_requests WHERE status IN ('new', 'in_progress') AND planned_at < NOW()",
                    { type: QueryTypes.SELECT },
                ),
            ]);
            databaseAvailable.set(1);

            requestsByStatus.reset();
            for (const row of statuses) {
                requestsByStatus.set({ status: row.status }, Number(row.count));
            }

            requestsByPriority.reset();
            for (const row of priorities) {
                requestsByPriority.set({ priority: row.priority }, Number(row.count));
            }

            averageCloseDuration.set(Number(closeDuration[0]?.seconds ?? 0));

            openRequestsByEquipment.reset();
            for (const row of equipmentLoad) {
                openRequestsByEquipment.set(
                    { equipment_name: row.equipment_name },
                    Number(row.count),
                );
            }

            overdueRequests.set(Number(overdue[0]?.count ?? 0));
        } catch (error) {
            databaseAvailable.set(0);
            businessCollectionErrors.inc();
            logger.warn({ err: error }, "Could not refresh business metrics");
        } finally {
            lastBusinessRefresh = Date.now();
            businessRefreshInFlight = undefined;
        }
    })();

    return businessRefreshInFlight;
}

export { metricsRegistry as metricsRegistry };