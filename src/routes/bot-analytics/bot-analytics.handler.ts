import type { FastifyReply, FastifyRequest } from "fastify";
import { getApiKeyMetrics, getApiKeyRule, getDetectionLogs, getGeoDistribution, getOverviewKpis, getProjectApiKeysWithRules, upsertApiKeyRules } from "../../services/bot-analytics.service.js";

// GET /api/v1/bot-management/overview?projectId=xxx&range=7d
export const getBotOverview = async (request: FastifyRequest, reply: FastifyReply) => {
  const { projectId, range = "7d" } = request.query as { projectId: string; range: string };
  try {
    if (!projectId) return reply.code(400).send({ status: "Bad Request", message: "projectId is required" });
    const data = await getOverviewKpis(projectId, range);
    return reply.code(200).send({ status: "success", data });
  } catch (error) {
    return reply.code(500).send({ status: "Internal Server Error", error });
  }
};

// GET /api/v1/bot-management/detections?projectId=xxx&page=1&limit=50&search=&action=
export const getBotDetections = async (request: FastifyRequest, reply: FastifyReply) => {
  const { projectId, page = "1", limit = "50", search = "", action = "" } = request.query as {
    projectId: string; page: string; limit: string; search: string; action: string;
  };
  try {
    if (!projectId) return reply.code(400).send({ status: "Bad Request", message: "projectId is required" });
    const data = await getDetectionLogs(projectId, parseInt(page), parseInt(limit), search, action);
    return reply.code(200).send({ status: "success", data });
  } catch (error) {
    return reply.code(500).send({ status: "Internal Server Error", error });
  }
};

// GET /api/v1/bot-management/rules?projectId=xxx
export const getProjectRules = async (request: FastifyRequest, reply: FastifyReply) => {
  const { projectId } = request.query as { projectId: string };
  try {
    if (!projectId) return reply.code(400).send({ status: "Bad Request", message: "projectId is required" });
    const data = await getProjectApiKeysWithRules(projectId);
    return reply.code(200).send({ status: "success", data });
  } catch (error) {
    return reply.code(500).send({ status: "Internal Server Error", error });
  }
};

// GET /api/v1/bot-management/rules/:keyId
export const getSingleKeyRule = async (request: FastifyRequest, reply: FastifyReply) => {
  const { keyId } = request.params as { keyId: string };
  try {
    const data = await getApiKeyRule(keyId);
    if (!data) return reply.code(404).send({ status: "Not Found", message: "No rule found for this key" });
    return reply.code(200).send({ status: "success", data });
  } catch (error) {
    return reply.code(500).send({ status: "Internal Server Error", error });
  }
};

// PATCH /api/v1/bot-management/rules
// Body: { keyIds: string[], rules: { strictness, persistence, signals, whitelist } }
export const updateKeyRules = async (request: FastifyRequest, reply: FastifyReply) => {
  const { keyIds, rules } = request.body as {
    keyIds: string[];
    rules: {
      strictness: string;
      persistence: number;
      signals: Record<string, boolean>;
      whitelist: { name: string; type: string; value: string }[];
    };
  };
  try {
    if (!keyIds?.length) return reply.code(400).send({ status: "Bad Request", message: "keyIds array is required" });
    const data = await upsertApiKeyRules(keyIds, rules);
    return reply.code(200).send({ status: "success", data });
  } catch (error) {
    return reply.code(500).send({ status: "Internal Server Error", error });
  }
};


// GET /api/v1/bot-management/keys/:keyId/metrics?range=7d
export const getApiKeyMetricsHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  const { keyId } = request.params as { keyId: string };
  const { range = "7d" } = request.query as { range: string };
  try {
    const data = await getApiKeyMetrics(keyId, range);
    if (!data) return reply.code(404).send({ status: "Not Found", message: "API key not found" });
    return reply.code(200).send({ status: "success", data });
  } catch (error) {
    return reply.code(500).send({ status: "Internal Server Error", error });
  }
};

// GET /api/v1/bot-management/geo?projectId=xxx&range=7d
export const getGeoDistributionHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  const { projectId, range = "7d" } = request.query as { projectId: string; range: string };
  try {
    if (!projectId) return reply.code(400).send({ status: "Bad Request", message: "projectId is required" });
    const data = await getGeoDistribution(projectId, range);
    return reply.code(200).send({ status: "success", data });
  } catch (error) {
    return reply.code(500).send({ status: "Internal Server Error", error });
  }
};