import type { FastifyInstance, FastifyPluginOptions } from "fastify";
import { authenticateUser } from "./auth.handler.js";
import { authenticateSchema } from "./auth.schema.js";


const authRoutes = async (fastify: FastifyInstance, options: FastifyPluginOptions) => {

  fastify.post("/api/auth/sync", { schema: authenticateSchema },async (request, reply) => {
    return await authenticateUser(request, reply);
  });
}


export default authRoutes;