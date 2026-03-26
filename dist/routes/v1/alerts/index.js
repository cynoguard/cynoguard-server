import { authPreHandler } from "../../../lib/auth-hook.js";
import { handleListAlerts, handleMarkAlertRead } from "./alerts.handler.js";
import { listAlertsSchema, markAlertReadSchema } from "./alerts.schema.js";
const alertRoutes = async (fastify, options) => {
    // GET /api/v1/alerts — List alerts
    fastify.get("/api/v1/alerts", {
        schema: listAlertsSchema,
        preHandler: authPreHandler,
    }, handleListAlerts);
    // PATCH /api/v1/alerts/:id — Mark alert read
    fastify.patch("/api/v1/alerts/:id", {
        schema: markAlertReadSchema,
        preHandler: authPreHandler,
    }, handleMarkAlertRead);
};
export default alertRoutes;
