import type { FastifyInstance, FastifyPluginOptions } from "fastify";
import { authPreHandler } from "../../../lib/auth-hook.js";
import { handleListAlerts, handleMarkAlertRead } from "./alerts.handler.js";
import { listAlertsSchema, markAlertReadSchema } from "./alerts.schema.js";

const alertRoutes = async (
    fastify: FastifyInstance,
    options: FastifyPluginOptions
) => {
    // GET /api/v1/alerts — List alerts
    fastify.get(
        "/api/v1/alerts",
        {
            schema: listAlertsSchema,
            preHandler: authPreHandler,
        },
        handleListAlerts as any
    );

    // PATCH /api/v1/alerts/:id — Mark alert read
    fastify.patch(
        "/api/v1/alerts/:id",
        {
            schema: markAlertReadSchema,
            preHandler: authPreHandler,
        },
        handleMarkAlertRead as any
    );
};

export default alertRoutes;
