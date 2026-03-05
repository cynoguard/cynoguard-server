import type { FastifyInstance } from "fastify";
import handlerRoutes from "./handler.routes.js";
import keywordRoutes from "./keywords.routes.js";
import mentionRoutes from "./mentions.routes.js";

export default async function socialMonitoringRoutes(fastify: FastifyInstance) {
  fastify.register(handlerRoutes);
  fastify.register(keywordRoutes);
  fastify.register(mentionRoutes);
}