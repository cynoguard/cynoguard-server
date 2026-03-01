import type {
    FastifyInstance,
    FastifyPluginOptions,
    FastifyReply,
    FastifyRequest,
} from "fastify";
import { getOrganizationProjects } from "./dashboard.handler.js";

const dashboardRoutes = (
  fastify: FastifyInstance,
  options: FastifyPluginOptions,
) => {
  fastify.get(
    "/organization/:orgId/projects",
    async (request: FastifyRequest, reply: FastifyReply) => {
      return getOrganizationProjects(request, reply);
    },
  );
};

export default dashboardRoutes;
