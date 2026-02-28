import type { FastifyReply, FastifyRequest } from "fastify";
import { listAlerts, markAlertRead } from "../../../services/alert.service.js";

interface ListAlertsQuery {
    unread?: boolean;
    watchDomainId?: string;
}

interface MarkAlertParams {
    id: string;
}

interface MarkAlertBody {
    isRead: boolean;
}

export const handleListAlerts = async (
    request: FastifyRequest<{ Querystring: ListAlertsQuery }>,
    reply: FastifyReply
) => {
    try {
        const user = request.user;
        if (!user) {
            return reply.code(401).send({ error: "Unauthorized", message: "Not authenticated" });
        }

        const filters: { unread?: boolean; watchDomainId?: string } = {};
        if (request.query.unread !== undefined) filters.unread = request.query.unread;
        if (request.query.watchDomainId !== undefined) filters.watchDomainId = request.query.watchDomainId;

        const result = await listAlerts(user.tenantId, user.userId, filters);

        return reply.code(200).send(result);
    } catch (error: any) {
        console.error("[Alerts] Error listing alerts:", error);
        return reply
            .code(500)
            .send({ error: "Internal Server Error", message: error?.message || "Unknown error" });
    }
};

export const handleMarkAlertRead = async (
    request: FastifyRequest<{ Params: MarkAlertParams; Body: MarkAlertBody }>,
    reply: FastifyReply
) => {
    try {
        const user = request.user;
        if (!user) {
            return reply.code(401).send({ error: "Unauthorized", message: "Not authenticated" });
        }

        const result = await markAlertRead(request.params.id, user.tenantId);
        return reply.code(200).send(result);
    } catch (error: any) {
        if (error?.message?.includes("not found")) {
            return reply
                .code(404)
                .send({ error: "Not Found", message: error.message });
        }
        console.error("[Alerts] Error marking alert read:", error);
        return reply
            .code(500)
            .send({ error: "Internal Server Error", message: error?.message || "Unknown error" });
    }
};
