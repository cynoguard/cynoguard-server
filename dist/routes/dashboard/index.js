import { getOrganizationProjects } from "./dashboard.handler.js";
const dashboardRoutes = (fastify, options) => {
    fastify.get("/organization/:orgId/projects", async (request, reply) => {
        return getOrganizationProjects(request, reply);
    });
};
export default dashboardRoutes;
