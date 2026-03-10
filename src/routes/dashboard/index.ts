import type {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyReply,
  FastifyRequest,
} from "fastify";
import { createApiKey, getApiKeyData, getApiKeysList, getApiKeyStatus, getOrganizationProjects, getOrganizations, revokeApiKey, updateApiKeyData } from "./dashboard.handler.js";

const dashboardRoutes = (
  fastify: FastifyInstance,
  options: FastifyPluginOptions,
) => {

  fastify.get(
    "/api/organization/:orgId/projects",
    async (request: FastifyRequest, reply: FastifyReply) => {
      return getOrganizationProjects(request, reply);
    },
  );

  fastify.get("/api/organizations/:authId",async(request: FastifyRequest, reply: FastifyReply)=>{
     return getOrganizations(request,reply);
  });

  //! Bot detection related information fetching and business logics

  // create new api key for bot detection js snippets

  fastify.post("/api/bot-dtection/api-key",async(request: FastifyRequest, reply: FastifyReply )=>{
    return createApiKey(request,reply);
  });

  fastify.get("/api/bot-dtection/api-key/:id",async(request: FastifyRequest, reply: FastifyReply )=>{
    return getApiKeyData(request,reply);
  });

  fastify.get("/api/bot-dtection/api-key/:id/connection/status",async(request: FastifyRequest, reply: FastifyReply )=>{
    return getApiKeyStatus(request,reply)
  });

   fastify.get("/api/bot-dtection/api-keys/:projectId/list",async(request: FastifyRequest, reply: FastifyReply )=>{
    return getApiKeysList(request,reply);
  });

   fastify.put("/api/bot-dtection/api-key/:id",async(request: FastifyRequest, reply: FastifyReply )=>{
    return updateApiKeyData(request,reply);
  });

   fastify.delete("/api/bot-dtection/api-keys/:id",async(request: FastifyRequest, reply: FastifyReply )=>{
    return revokeApiKey(request,reply);
  });

};

export default dashboardRoutes;
