import { createApiKey, getApiKeyData, getApiKeysList, getApiKeyStatus, getOrganizationProjects, getOrganizations, revokeApiKey, updateApiKeyData } from "./dashboard.handler.js";
const dashboardRoutes = (fastify, options) => {
    fastify.get("/api/organization/:orgId/projects", async (request, reply) => {
        return getOrganizationProjects(request, reply);
    });
    fastify.get("/api/organizations/:authId", async (request, reply) => {
        return getOrganizations(request, reply);
    });
    // ── Project ID lookup by org name + project name ──────────────────────────
    // Used by the console to resolve projectId from URL params (:org/:project)
    // without depending on localStorage. Works for every user and every project.
    fastify.get("/api/project-id", async (request, reply) => {
        const { orgName, projectName } = request.query;
        if (!orgName || !projectName) {
            return reply.status(400).send({ error: "orgName and projectName are required" });
        }
        try {
            const project = await fastify.prisma.project.findFirst({
                where: {
                    name: projectName,
                    organization: { name: orgName },
                },
                select: { id: true, name: true },
            });
            if (!project) {
                return reply.status(404).send({ error: "Project not found" });
            }
            return reply.send({ status: "success", data: { projectId: project.id, projectName: project.name } });
        }
        catch (err) {
            return reply.status(500).send({ error: "Internal Server Error", message: err.message });
        }
    });
    // Bot detection routes
    fastify.post("/api/bot-dtection/api-key", async (request, reply) => {
        return createApiKey(request, reply);
    });
    fastify.get("/api/bot-dtection/api-key/:id", async (request, reply) => {
        return getApiKeyData(request, reply);
    });
    fastify.get("/api/bot-dtection/api-key/:id/connection/status", async (request, reply) => {
        return getApiKeyStatus(request, reply);
    });
    fastify.get("/api/bot-dtection/api-keys/:projectId/list", async (request, reply) => {
        return getApiKeysList(request, reply);
    });
    fastify.put("/api/bot-dtection/api-key/:id", async (request, reply) => {
        return updateApiKeyData(request, reply);
    });
    fastify.delete("/api/bot-dtection/api-keys/:id", async (request, reply) => {
        return revokeApiKey(request, reply);
    });
};
export default dashboardRoutes;
