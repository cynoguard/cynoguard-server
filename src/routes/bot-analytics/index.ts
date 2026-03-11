import type { FastifyCorsOptions } from "@fastify/cors";
import type { FastifyInstance } from "fastify";
import { getApiKeyMetricsHandler, getBotDetections, getBotOverview, getGeoDistributionHandler, getProjectRules, getSingleKeyRule, updateKeyRules } from "../bot-analytics/bot-analytics.handler.js";

const botAnalyticsRoute = async (fastify:FastifyInstance,option:FastifyCorsOptions)=>{
   fastify.get("/api/v1/bot-management/overview", getBotOverview);
    fastify.get("/api/v1/bot-management/detections", getBotDetections);
    fastify.get("/api/v1/bot-management/rules", getProjectRules);
    fastify.get("/api/v1/bot-management/rules/:keyId", getSingleKeyRule);
    fastify.patch("/api/v1/bot-management/rules", updateKeyRules);
    fastify.get("/api/v1/bot-management/keys/:keyId/metrics", getApiKeyMetricsHandler);
    fastify.get("/api/v1/bot-management/geo", getGeoDistributionHandler);
}


export default botAnalyticsRoute;
