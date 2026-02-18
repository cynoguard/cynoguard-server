import type { FastifyInstance } from "fastify";
import { getAllBrands, getBrandById } from "../../services/brand.service.js";

export default async function brandRoutes(fastify: FastifyInstance) {
  fastify.get(
    "/brands",
    {
      schema: {
        tags: ["Brand"],
        description: "Get all brands",
      },
    },
    async () => {
      return getAllBrands();
    }
  );

  fastify.get(
    "/brands/:id",
    {
      schema: {
        tags: ["Brand"],
        description: "Get brand by ID",
      },
    },
    async (request: any) => {
      const { id } = request.params;
      return getBrandById(id);
    }
  );
}