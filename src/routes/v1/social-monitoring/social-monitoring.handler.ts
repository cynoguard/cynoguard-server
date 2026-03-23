// src/modules/social-monitoring/social-monitoring.handler.ts
// All route handler logic for the Social Monitoring module.
// Routes are registered in social-monitoring.routes.ts (index).

import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { scanProject } from "../../../services/social-monitoring.service.js";
import type {
  TAddKeywordBody,
  TKeywordParams, TMentionParams,
  TMentionsQuerystring,
  TProjectParams,
  TToggleKeywordBody,
  TUpdateMentionBody,
} from "./social-monitoring.schema.js";

// ─── Auth Guard ───────────────────────────────────────────────────────────────

async function assertMember(fastify: FastifyInstance, projectId: string, userId: string): Promise<boolean> {
  const project = await fastify.prisma.project.findUnique({
    where:  { id: projectId },
    select: { organizationId: true },
  });
  if (!project) return false;
  const member = await fastify.prisma.organizationMember.findFirst({
    where: { organizationId: project.organizationId, userId },
  });
  return !!member;
}

function userId(request: FastifyRequest): string {
  return (request as any).userId as string;
}

// ─── Keywords ─────────────────────────────────────────────────────────────────

export async function listKeywords(
  fastify: FastifyInstance,
  request: FastifyRequest<{ Params: TProjectParams }>,
  reply:   FastifyReply
) {
  const { projectId } = request.params;
  if (!(await assertMember(fastify, projectId, userId(request)))) return reply.status(403).send({ error: "Forbidden" });

  const [keywords, mentionGroups] = await Promise.all([
    fastify.prisma.monitoringKeyword.findMany({ where: { projectId }, orderBy: { createdAt: "desc" } }),
    fastify.prisma.brandMention.groupBy({
      by:    ["matchedKeyword"],
      where: { projectId, matchedKeyword: { not: null } },
      _count: true,
    }),
  ]);

  const countMap = new Map(
    mentionGroups.filter((r) => r.matchedKeyword).map((r) => [r.matchedKeyword!, r._count])
  );

  return reply.send({
    keywords: keywords.map((kw) => ({ ...kw, mentionCount: countMap.get(kw.keyword) ?? 0 })),
  });
}

export async function addKeyword(
  fastify: FastifyInstance,
  request: FastifyRequest<{ Params: TProjectParams; Body: TAddKeywordBody }>,
  reply:   FastifyReply
) {
  const { projectId } = request.params;
  if (!(await assertMember(fastify, projectId, userId(request)))) return reply.status(403).send({ error: "Forbidden" });

  const count = await fastify.prisma.monitoringKeyword.count({ where: { projectId } });
  if (count >= 50) return reply.status(422).send({ error: "Maximum 50 keywords per project" });

  try {
    const kw = await fastify.prisma.monitoringKeyword.create({
      data: { projectId, keyword: request.body.keyword.trim() },
    });

    // Fire-and-forget background scan so results appear immediately
    scanProject(fastify.prisma, projectId, fastify.log).catch((err) =>
      fastify.log.error({ err }, "[SocialMonitoring] Background scan failed")
    );

    return reply.status(201).send({ ...kw, mentionCount: 0 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "";
    if (msg.includes("Unique constraint")) return reply.status(409).send({ error: "Keyword already exists" });
    throw err;
  }
}

export async function toggleKeyword(
  fastify: FastifyInstance,
  request: FastifyRequest<{ Params: TKeywordParams; Body: TToggleKeywordBody }>,
  reply:   FastifyReply
) {
  const { projectId, keywordId } = request.params;
  if (!(await assertMember(fastify, projectId, userId(request)))) return reply.status(403).send({ error: "Forbidden" });

  const kw = await fastify.prisma.monitoringKeyword.findFirst({ where: { id: keywordId, projectId } });
  if (!kw) return reply.status(404).send({ error: "Keyword not found" });

  const updated = await fastify.prisma.monitoringKeyword.update({
    where: { id: keywordId },
    data:  { isActive: request.body.isActive },
  });

  if (request.body.isActive) {
    scanProject(fastify.prisma, projectId, fastify.log).catch((err) =>
      fastify.log.error({ err }, "[SocialMonitoring] Background scan failed")
    );
  }

  return reply.send({ ...updated, mentionCount: 0 });
}

export async function deleteKeyword(
  fastify: FastifyInstance,
  request: FastifyRequest<{ Params: TKeywordParams }>,
  reply:   FastifyReply
) {
  const { projectId, keywordId } = request.params;
  if (!(await assertMember(fastify, projectId, userId(request)))) return reply.status(403).send({ error: "Forbidden" });

  const kw = await fastify.prisma.monitoringKeyword.findFirst({ where: { id: keywordId, projectId } });
  if (!kw) return reply.status(404).send({ error: "Keyword not found" });

  await fastify.prisma.monitoringKeyword.delete({ where: { id: keywordId } });
  return reply.status(204).send();
}

// ─── Mentions ─────────────────────────────────────────────────────────────────

export async function listMentions(
  fastify: FastifyInstance,
  request: FastifyRequest<{ Params: TProjectParams; Querystring: TMentionsQuerystring }>,
  reply:   FastifyReply
) {
  const { projectId } = request.params;
  if (!(await assertMember(fastify, projectId, userId(request)))) return reply.status(403).send({ error: "Forbidden" });

  const page  = Math.max(parseInt(request.query.page  ?? "1",  10), 1);
  const limit = Math.min(Math.max(parseInt(request.query.limit ?? "20", 10), 1), 100);
  const { status, riskLevel, sentiment } = request.query;

  const where = {
    projectId,
    ...(status    && { status:    status    as any }),
    ...(riskLevel && { riskLevel: riskLevel as any }),
    ...(sentiment && { sentiment: sentiment as any }),
  };

  const [data, total] = await Promise.all([
    fastify.prisma.brandMention.findMany({ where, orderBy: { scannedAt: "desc" }, skip: (page - 1) * limit, take: limit }),
    fastify.prisma.brandMention.count({ where }),
  ]);

  return reply.send({ data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
}

export async function getMentionStats(
  fastify: FastifyInstance,
  request: FastifyRequest<{ Params: TProjectParams }>,
  reply:   FastifyReply
) {
  const { projectId } = request.params;
  if (!(await assertMember(fastify, projectId, userId(request)))) return reply.status(403).send({ error: "Forbidden" });

  const now     = Date.now();
  const last24h = new Date(now - 24 * 60 * 60 * 1000);
  const last30d = new Date(now - 30 * 24 * 60 * 60 * 1000);

  const [byRisk, bySentiment, byStatus, mentionsToday, recentScans, rawOverTime] = await Promise.all([
    fastify.prisma.brandMention.groupBy({ by: ["riskLevel"], where: { projectId }, _count: true }),
    fastify.prisma.brandMention.groupBy({ by: ["sentiment"], where: { projectId }, _count: true }),
    fastify.prisma.brandMention.groupBy({ by: ["status"],    where: { projectId }, _count: true }),
    fastify.prisma.brandMention.count({ where: { projectId, scannedAt: { gte: last24h } } }),
    fastify.prisma.scanLog.findMany({
      where:   { projectId },
      orderBy: { scannedAt: "desc" },
      take:    10,
      select:  { id: true, scanStatus: true, mentionsFound: true, highRiskCount: true, scannedAt: true },
    }),
    fastify.prisma.brandMention.findMany({
      where:  { projectId, scannedAt: { gte: last30d } },
      select: { scannedAt: true },
    }),
  ]);

  const dailyMap = new Map<string, number>();
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

export async function getMention(
  fastify: FastifyInstance,
  request: FastifyRequest<{ Params: TMentionParams }>,
  reply:   FastifyReply
) {
  const { projectId, mentionId } = request.params;
  if (!(await assertMember(fastify, projectId, userId(request)))) return reply.status(403).send({ error: "Forbidden" });

  const mention = await fastify.prisma.brandMention.findFirst({ where: { id: mentionId, projectId } });
  if (!mention) return reply.status(404).send({ error: "Mention not found" });

  // Auto-mark as viewed on open
  if (mention.status === "NEW") {
    await fastify.prisma.brandMention.update({ where: { id: mentionId }, data: { status: "VIEWED" } });
    mention.status = "VIEWED";
  }

  return reply.send(mention);
}

export async function updateMention(
  fastify: FastifyInstance,
  request: FastifyRequest<{ Params: TMentionParams; Body: TUpdateMentionBody }>,
  reply:   FastifyReply
) {
  const { projectId, mentionId } = request.params;
  if (!(await assertMember(fastify, projectId, userId(request)))) return reply.status(403).send({ error: "Forbidden" });

  const mention = await fastify.prisma.brandMention.findFirst({ where: { id: mentionId, projectId } });
  if (!mention) return reply.status(404).send({ error: "Mention not found" });

  const updated = await fastify.prisma.brandMention.update({
    where: { id: mentionId },
    data:  { status: request.body.status },
  });

  return reply.send(updated);
}

export async function triggerScan(
  fastify: FastifyInstance,
  request: FastifyRequest<{ Params: TProjectParams }>,
  reply:   FastifyReply
) {
  const { projectId } = request.params;
  if (!(await assertMember(fastify, projectId, userId(request)))) return reply.status(403).send({ error: "Forbidden" });

  const result = await scanProject(fastify.prisma, projectId, request.log);
  return reply.status(202).send({ message: "Scan complete", ...result });
}
