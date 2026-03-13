// src/modules/social-monitoring/social-monitoring.routes.ts
// Route definitions only — no logic here. All logic lives in social-monitoring.handler.ts.
// Register in your main Fastify app: fastify.register(socialMonitoringRoutes)

import type { FastifyInstance } from "fastify";
import {
  addKeyword,
  deleteKeyword,
  getMention,
  getMentionStats,
  listKeywords,
  listMentions,
  toggleKeyword,
  triggerScan,
  updateMention,
} from "./social-monitoring.handler.js";
import {
  AddKeywordBody,
  KeywordParams, MentionParams,
  MentionsQuerystring,
  ProjectParams,
  ToggleKeywordBody,
  UpdateMentionBody,
} from "./social-monitoring.schema.js";

export default async function socialMonitoringRoutes(fastify: FastifyInstance) {

  // ── Keywords ────────────────────────────────────────────────────────────────

  fastify.get(
    "/api/v1/projects/:projectId/keywords",
    { schema: { tags: ["Social Monitoring"], params: ProjectParams } },
    (req, rep) => listKeywords(fastify, req as any, rep)
  );

  fastify.post(
    "/api/v1/projects/:projectId/keywords",
    { schema: { tags: ["Social Monitoring"], params: ProjectParams, body: AddKeywordBody } },
    (req, rep) => addKeyword(fastify, req as any, rep)
  );

  fastify.patch(
    "/api/v1/projects/:projectId/keywords/:keywordId",
    { schema: { tags: ["Social Monitoring"], params: KeywordParams, body: ToggleKeywordBody } },
    (req, rep) => toggleKeyword(fastify, req as any, rep)
  );

  fastify.delete(
    "/api/v1/projects/:projectId/keywords/:keywordId",
    { schema: { tags: ["Social Monitoring"], params: KeywordParams } },
    (req, rep) => deleteKeyword(fastify, req as any, rep)
  );

  // ── Mentions ────────────────────────────────────────────────────────────────

  fastify.get(
    "/api/v1/projects/:projectId/mentions",
    { schema: { tags: ["Social Monitoring"], params: ProjectParams, querystring: MentionsQuerystring } },
    (req, rep) => listMentions(fastify, req as any, rep)
  );

  // NOTE: /mentions/stats must be registered BEFORE /mentions/:mentionId
  // so Fastify doesn't match "stats" as a mentionId param.
  fastify.get(
    "/api/v1/projects/:projectId/mentions/stats",
    { schema: { tags: ["Social Monitoring"], params: ProjectParams } },
    (req, rep) => getMentionStats(fastify, req as any, rep)
  );

  fastify.get(
    "/api/v1/projects/:projectId/mentions/:mentionId",
    { schema: { tags: ["Social Monitoring"], params: MentionParams } },
    (req, rep) => getMention(fastify, req as any, rep)
  );

  fastify.patch(
    "/api/v1/projects/:projectId/mentions/:mentionId",
    { schema: { tags: ["Social Monitoring"], params: MentionParams, body: UpdateMentionBody } },
    (req, rep) => updateMention(fastify, req as any, rep)
  );

  fastify.post(
    "/api/v1/projects/:projectId/mentions/scan",
    { schema: { tags: ["Social Monitoring"], params: ProjectParams } },
    (req, rep) => triggerScan(fastify, req as any, rep)
  );
}

// ─── Scheduler ────────────────────────────────────────────────────────────────
// Call startMonitoringScheduler(prisma, logger) once at app startup.

import type { PrismaClient } from "@prisma/client";
import type { FastifyBaseLogger } from "fastify";
import cron from "node-cron";
import { scanAllProjects } from "../../../services/monitoring.service.js";

export function startMonitoringScheduler(prisma: PrismaClient, logger: FastifyBaseLogger): void {
  if (!process.env.X_BEARER_TOKEN) {
    logger.warn("[SocialMonitoring] X_BEARER_TOKEN not set — scans will fail until it is added.");
  }

  cron.schedule("0 */6 * * *", () => {
    logger.info("[SocialMonitoring] Cron fired — scanning all active projects");
    scanAllProjects(prisma, logger).catch((err) =>
      logger.error({ err }, "[SocialMonitoring] Scheduled scan error")
    );
  });

  logger.info("[SocialMonitoring] Scheduler started — fires every 6 hours");
}
