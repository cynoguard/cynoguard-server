// src/modules/social-monitoring/social-monitoring.routes.ts
// Route definitions only — no logic here. All logic lives in social-monitoring.handler.ts.
// Register in your main Fastify app: fastify.register(socialMonitoringRoutes)
import { addKeyword, deleteKeyword, getMention, getMentionStats, listKeywords, listMentions, toggleKeyword, triggerScan, updateMention, } from "./social-monitoring.handler.js";
import { AddKeywordBody, KeywordParams, MentionParams, MentionsQuerystring, ProjectParams, ToggleKeywordBody, UpdateMentionBody, } from "./social-monitoring.schema.js";
// ─── Routes ───────────────────────────────────────────────────────
export default async function socialMonitoringRoutes(fastify) {
    // ── Keywords ──────────────────────────────────────────────────
    fastify.get("/api/v1/projects/:projectId/keywords", { schema: { tags: ["Social Monitoring"], params: ProjectParams } }, (req, rep) => listKeywords(fastify, req, rep));
    fastify.post("/api/v1/projects/:projectId/keywords", { schema: { tags: ["Social Monitoring"], params: ProjectParams, body: AddKeywordBody } }, (req, rep) => addKeyword(fastify, req, rep));
    fastify.patch("/api/v1/projects/:projectId/keywords/:keywordId", { schema: { tags: ["Social Monitoring"], params: KeywordParams, body: ToggleKeywordBody } }, (req, rep) => toggleKeyword(fastify, req, rep));
    fastify.delete("/api/v1/projects/:projectId/keywords/:keywordId", { schema: { tags: ["Social Monitoring"], params: KeywordParams } }, (req, rep) => deleteKeyword(fastify, req, rep));
    // ── Mentions ──────────────────────────────────────────────────
    fastify.get("/api/v1/projects/:projectId/mentions", { schema: { tags: ["Social Monitoring"], params: ProjectParams, querystring: MentionsQuerystring } }, (req, rep) => listMentions(fastify, req, rep));
    // NOTE: stats MUST be registered before /:mentionId
    fastify.get("/api/v1/projects/:projectId/mentions/stats", { schema: { tags: ["Social Monitoring"], params: ProjectParams } }, (req, rep) => getMentionStats(fastify, req, rep));
    fastify.get("/api/v1/projects/:projectId/mentions/:mentionId", { schema: { tags: ["Social Monitoring"], params: MentionParams } }, (req, rep) => getMention(fastify, req, rep));
    fastify.patch("/api/v1/projects/:projectId/mentions/:mentionId", { schema: { tags: ["Social Monitoring"], params: MentionParams, body: UpdateMentionBody } }, (req, rep) => updateMention(fastify, req, rep));
    fastify.post("/api/v1/projects/:projectId/mentions/scan", { schema: { tags: ["Social Monitoring"], params: ProjectParams } }, (req, rep) => triggerScan(fastify, req, rep));
}
