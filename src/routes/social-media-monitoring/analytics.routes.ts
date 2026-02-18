import type { FastifyInstance } from "fastify";
import { getBrandAnalytics } from "../../services/analytics.service.js";

export default async function analyticsRoutes(fastify: FastifyInstance) {
  fastify.get(
    "/brands/:id/analytics",
    {
      schema: {
        tags: ["Analytics"],
        description: "Get analytics for a brand",
      },
    },
    async (request: any) => {
      const { id } = request.params;
      return getBrandAnalytics(id);
    }
  );
}