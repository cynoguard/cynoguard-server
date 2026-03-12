import type { FastifyInstance } from "fastify";
import keywordRoutes from "./keywords.routes.js";
import mentionRoutes from "./mentions.routes.js";
// NOTE: handlers.routes removed — CynoGuard owns the X token, clients don't need to connect anything

export default async function socialMonitoringRoutes(fastify: FastifyInstance) {
  await fastify.register(keywordRoutes);
  await fastify.register(mentionRoutes);
}