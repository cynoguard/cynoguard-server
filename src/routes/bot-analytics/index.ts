import type { FastifyCorsOptions } from "@fastify/cors";
import type { FastifyInstance } from "fastify";
import { addWhitelistEntryHandler, getApiKeyMetricsHandler, getApiKeyRuleHandler, getBotDetections, getBotOverview, getGeoDistributionHandler, getProjectRulesHandler, removeWhitelistEntryHandler, upsertApiKeyRulesHandler } from "../bot-analytics/bot-analytics.handler.js";

const botAnalyticsRoute = async (fastify:FastifyInstance,option:FastifyCorsOptions)=>{
   fastify.get("/api/v1/bot-management/overview", getBotOverview);
    fastify.get("/api/v1/bot-management/detections", getBotDetections);
    fastify.get("/api/v1/bot-management/keys/:keyId/metrics", getApiKeyMetricsHandler);
    fastify.get("/api/v1/bot-management/geo", getGeoDistributionHandler);
  fastify.get("/api/v1/bot-management/rules",          getProjectRulesHandler);
  fastify.get("/api/v1/bot-management/rules/:keyId",   getApiKeyRuleHandler);
  fastify.patch("/api/v1/bot-management/rules",        upsertApiKeyRulesHandler);
  fastify.post("/api/v1/bot-management/whitelist",   addWhitelistEntryHandler);
  fastify.delete("/api/v1/bot-management/whitelist", removeWhitelistEntryHandler);
}


export default botAnalyticsRoute;
