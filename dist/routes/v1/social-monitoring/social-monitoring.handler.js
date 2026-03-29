// src/modules/social-monitoring/social-monitoring.handler.ts
// All route handler logic for the Social Monitoring module.
// Routes are registered in social-monitoring.routes.ts (index).
import { scanProject } from "../../../services/social-monitoring.service.js";
// ─── Keywords ─────────────────────────────────────────────────────────────────
export async function listKeywords(fastify, request, reply) {
    const { projectId } = request.params;
    const [keywords, mentionGroups] = await Promise.all([
        fastify.prisma.monitoringKeyword.findMany({ where: { projectId }, orderBy: { createdAt: "desc" } }),
        fastify.prisma.brandMention.groupBy({
            by: ["matchedKeyword"],
            where: { projectId, matchedKeyword: { not: null } },
            _count: true,
        }),
    ]);
    const countMap = new Map(mentionGroups.filter((r) => r.matchedKeyword).map((r) => [r.matchedKeyword, r._count]));
    return reply.send({
        keywords: keywords.map((kw) => ({ ...kw, mentionCount: countMap.get(kw.keyword) ?? 0 })),
    });
}
export async function addKeyword(fastify, request, reply) {
    const { projectId } = request.params;
    const count = await fastify.prisma.monitoringKeyword.count({ where: { projectId } });
    if (count >= 50)
        return reply.status(422).send({ error: "Maximum 50 keywords per project" });
    try {
        const kw = await fastify.prisma.monitoringKeyword.create({
            data: { projectId, keyword: request.body.keyword.trim() },
        });
        // Fire-and-forget background scan so results appear immediately
        scanProject(fastify.prisma, projectId, fastify.log).catch((err) => fastify.log.error({ err }, "[SocialMonitoring] Background scan failed"));
        return reply.status(201).send({ ...kw, mentionCount: 0 });
    }
    catch (err) {
        const msg = err instanceof Error ? err.message : "";
        if (msg.includes("Unique constraint"))
            return reply.status(409).send({ error: "Keyword already exists" });
        throw err;
    }
}
export async function toggleKeyword(fastify, request, reply) {
    const { projectId, keywordId } = request.params;
    const kw = await fastify.prisma.monitoringKeyword.findFirst({ where: { id: keywordId, projectId } });
    if (!kw)
        return reply.status(404).send({ error: "Keyword not found" });
    const updated = await fastify.prisma.monitoringKeyword.update({
        where: { id: keywordId },
        data: { isActive: request.body.isActive },
    });
    if (request.body.isActive) {
        scanProject(fastify.prisma, projectId, fastify.log).catch((err) => fastify.log.error({ err }, "[SocialMonitoring] Background scan failed"));
    }
    return reply.send({ ...updated, mentionCount: 0 });
}
export async function deleteKeyword(fastify, request, reply) {
    const { projectId, keywordId } = request.params;
    const kw = await fastify.prisma.monitoringKeyword.findFirst({ where: { id: keywordId, projectId } });
    if (!kw)
        return reply.status(404).send({ error: "Keyword not found" });
    await fastify.prisma.monitoringKeyword.delete({ where: { id: keywordId } });
    return reply.status(204).send();
}
// ─── Mentions ─────────────────────────────────────────────────────────────────
export async function listMentions(fastify, request, reply) {
    const { projectId } = request.params;
    const page = Math.max(parseInt(request.query.page ?? "1", 10), 1);
    const limit = Math.min(Math.max(parseInt(request.query.limit ?? "20", 10), 1), 100);
    const { status, riskLevel, sentiment } = request.query;
    const where = {
        projectId,
        ...(status && { status: status }),
        ...(riskLevel && { riskLevel: riskLevel }),
        ...(sentiment && { sentiment: sentiment }),
    };
    const [data, total] = await Promise.all([
        fastify.prisma.brandMention.findMany({ where, orderBy: { scannedAt: "desc" }, skip: (page - 1) * limit, take: limit }),
        fastify.prisma.brandMention.count({ where }),
    ]);
    return reply.send({ data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
}
export async function getMentionStats(fastify, request, reply) {
    const { projectId } = request.params;
    const now = Date.now();
    const last24h = new Date(now - 24 * 60 * 60 * 1000);
    const last30d = new Date(now - 30 * 24 * 60 * 60 * 1000);
    const [byRisk, bySentiment, byStatus, mentionsToday, recentScans, rawOverTime] = await Promise.all([
        fastify.prisma.brandMention.groupBy({ by: ["riskLevel"], where: { projectId }, _count: true }),
        fastify.prisma.brandMention.groupBy({ by: ["sentiment"], where: { projectId }, _count: true }),
        fastify.prisma.brandMention.groupBy({ by: ["status"], where: { projectId }, _count: true }),
        fastify.prisma.brandMention.count({ where: { projectId, scannedAt: { gte: last24h } } }),
        fastify.prisma.scanLog.findMany({
            where: { projectId },
            orderBy: { scannedAt: "desc" },
            take: 10,
            select: { id: true, scanStatus: true, mentionsFound: true, highRiskCount: true, scannedAt: true },
        }),
        fastify.prisma.brandMention.findMany({
            where: { projectId, scannedAt: { gte: last30d } },
            select: { scannedAt: true },
        }),
    ]);
    const dailyMap = new Map();
    for (const { scannedAt } of rawOverTime) {
        const day = scannedAt.toISOString().slice(0, 10);
        dailyMap.set(day, (dailyMap.get(day) ?? 0) + 1);
    }
    const mentionsOverTime = Array.from({ length: 30 }, (_, i) => {
        const day = new Date(now - (29 - i) * 86400000).toISOString().slice(0, 10);
        return { date: day, count: dailyMap.get(day) ?? 0 };
    });
    return reply.send({ byRisk, bySentiment, byStatus, mentionsToday, mentionsOverTime, recentScans });
}
export async function getMention(fastify, request, reply) {
    const { projectId, mentionId } = request.params;
    const mention = await fastify.prisma.brandMention.findFirst({ where: { id: mentionId, projectId } });
    if (!mention)
        return reply.status(404).send({ error: "Mention not found" });
    // Auto-mark as viewed on open
    if (mention.status === "NEW") {
        await fastify.prisma.brandMention.update({ where: { id: mentionId }, data: { status: "VIEWED" } });
        mention.status = "VIEWED";
    }
    return reply.send(mention);
}
export async function updateMention(fastify, request, reply) {
    const { projectId, mentionId } = request.params;
    const mention = await fastify.prisma.brandMention.findFirst({ where: { id: mentionId, projectId } });
    if (!mention)
        return reply.status(404).send({ error: "Mention not found" });
    const updated = await fastify.prisma.brandMention.update({
        where: { id: mentionId },
        data: { status: request.body.status },
    });
    return reply.send(updated);
}
export async function triggerScan(fastify, request, reply) {
    const { projectId } = request.params;
    const result = await scanProject(fastify.prisma, projectId, request.log);
    return reply.status(202).send({ message: "Scan complete", ...result });
}
