import { createWatchDomain, listWatchDomains, } from "../../../services/watch-domain.service.js";
export const handleCreateWatchDomain = async (request, reply) => {
    try {
        const user = request.user;
        if (!user) {
            return reply.code(401).send({ error: "Unauthorized", message: "Not authenticated" });
        }
        const result = await createWatchDomain(user.tenantId, user.userId, request.body);
        return reply.code(201).send(result);
    }
    catch (error) {
        // Handle unique constraint violation (duplicate domain for tenant)
        if (error?.code === "P2002") {
            return reply
                .code(409)
                .send({ error: "Conflict", message: "Watch domain already exists for this tenant" });
        }
        // Handle validation errors
        if (error?.message?.includes("Invalid") || error?.message?.includes("Domain") || error?.message?.includes("IP") || error?.message?.includes("cannot")) {
            return reply
                .code(400)
                .send({ error: "Bad Request", message: error.message });
        }
        console.error("[WatchDomains] Error creating watch domain:", error);
        return reply
            .code(500)
            .send({ error: "Internal Server Error", message: error?.message || "Unknown error" });
    }
};
export const handleListWatchDomains = async (request, reply) => {
    try {
        const user = request.user;
        if (!user) {
            return reply.code(401).send({ error: "Unauthorized", message: "Not authenticated" });
        }
        const result = await listWatchDomains(user.tenantId);
        return reply.code(200).send(result);
    }
    catch (error) {
        console.error("[WatchDomains] Error listing watch domains:", error);
        return reply
            .code(500)
            .send({ error: "Internal Server Error", message: error?.message || "Unknown error" });
    }
};
