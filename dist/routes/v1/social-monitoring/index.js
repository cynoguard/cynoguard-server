// src/modules/social-monitoring/social-monitoring.routes.ts
// Route definitions only — no logic here. All logic lives in social-monitoring.handler.ts.
// Register in your main Fastify app: fastify.register(socialMonitoringRoutes)
import { verifyFirebaseToken } from "../../../services/firebase.service.js";
import { addKeyword, deleteKeyword, getMention, getMentionStats, listKeywords, listMentions, toggleKeyword, triggerScan, updateMention, } from "./social-monitoring.handler.js";
import { AddKeywordBody, KeywordParams, MentionParams, MentionsQuerystring, ProjectParams, ToggleKeywordBody, UpdateMentionBody, } from "./social-monitoring.schema.js";
// ─── Auth preHandler ──────────────────────────────────────────────
// Decodes the Firebase/JWT token from the Authorization header
// and sets request.userId so assertMember() can verify access.
async function authPreHandler(request, reply) {
    const authHeader = request.headers.authorization;
    if (!authHeader) {
        return reply.status(401).send({ error: "Unauthorized", message: "No authorization header" });
    }
    const token = authHeader.replace("Bearer ", "").trim();
    try {
        // Try Firebase token first
        const decoded = await verifyFirebaseToken(token);
        if (decoded?.uid) {
            // Look up the internal DB user id from firebaseId
            const user = await request.server.prisma.user.findUnique({
                where: { firebaseId: decoded.uid },
                select: { id: true },
            });
            if (!user) {
                return reply.status(401).send({ error: "Unauthorized", message: "User not found" });
            }
            request.userId = user.id;
            return;
        }
    }
    catch {
        // Not a Firebase token — try JWT below
    }
    try {
        // Try internal JWT (used after onboarding)
        const jwt = await import("jsonwebtoken");
        const decoded = jwt.default.verify(token, "2cc08b7a5f4090a29c309dd9ee072cceaaef89e9e68f87ca64a79401083213bc0245d277d4785d02c4d21e6239fe7619a9485536641d83325f1676f413946d09");
        if (decoded?.uid) {
            request.userId = decoded.uid;
            return;
        }
    }
    catch {
        return reply.status(401).send({ error: "Unauthorized", message: "Invalid token" });
    }
}
// ─── Routes ───────────────────────────────────────────────────────
export default async function socialMonitoringRoutes(fastify) {
    // Apply auth to all social monitoring routes
    fastify.addHook("preHandler", authPreHandler);
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
