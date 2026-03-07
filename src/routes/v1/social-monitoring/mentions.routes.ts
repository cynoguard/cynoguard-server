import { Type } from "@sinclair/typebox";
import type { FastifyInstance } from "fastify";
import { scanProject } from "../../../services/monitoring.service.js";

const UpdateMentionBody = Type.Object({
  status: Type.Union([
    Type.Literal("VIEWED"),
    Type.Literal("DISMISSED"),
    Type.Literal("ARCHIVED"),
  ]),
});

async function assertOwner(
  fastify: FastifyInstance,
  projectId: string,
  userId: string
): Promise<boolean> {
  const project = await fastify.prisma.project.findUnique({
    where: { id: projectId },
    select: { organizationId: true },
  });
  if (!project) return false;
  const member = await fastify.prisma.organizationMember.findFirst({
    where: { organizationId: project.organizationId, userId },
  });
  return !!member;
}

export default async function mentionRoutes(fastify: FastifyInstance) {

  // ── GET /mentions ──────────────────────────────────────────────
  fastify.get<{
    Params: { projectId: string };
    Querystring: {
      page?: string;
      limit?: string;
      status?: string;
      riskLevel?: string;
      sentiment?: string;
    };
  }>(
    "/api/v1/projects/:projectId/mentions",
    {
      schema: {
        tags: ["Social Monitoring"],
        description: "List brand mentions with pagination. Filter by status, riskLevel, or sentiment.",
        params: Type.Object({ projectId: Type.String() }),
        querystring: Type.Object({
          page: Type.Optional(Type.String()),
          limit: Type.Optional(Type.String()),
          status: Type.Optional(Type.String()),
          riskLevel: Type.Optional(Type.String()),
          sentiment: Type.Optional(Type.String()),
        }),
      },
    },
    async (request, reply) => {
      const { projectId } = request.params;
      const userId: string = (request as any).userId;
      if (!(await assertOwner(fastify, projectId, userId))) {
        return reply.status(403).send({ error: "Forbidden" });
      }

      const page = Math.max(parseInt(request.query.page ?? "1", 10), 1);
      const limit = Math.min(Math.max(parseInt(request.query.limit ?? "20", 10), 1), 100);
      const { status, riskLevel, sentiment } = request.query;

      const where = {
        projectId,
        ...(status && { status: status as any }),
        ...(riskLevel && { riskLevel: riskLevel as any }),
        ...(sentiment && { sentiment: sentiment as any }),
      };

      const [data, total] = await Promise.all([
        fastify.prisma.brandMention.findMany({
          where,
          orderBy: { scannedAt: "desc" },
          skip: (page - 1) * limit,
          take: limit,
        }),
        fastify.prisma.brandMention.count({ where }),
      ]);

      return reply.send({
        data,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      });
    }
  );

  // ── GET /mentions/stats ────────────────────────────────────────
  fastify.get<{ Params: { projectId: string } }>(
    "/api/v1/projects/:projectId/mentions/stats",
    {
      schema: {
        tags: ["Social Monitoring"],
        description: "Aggregated dashboard stats: risk breakdown, sentiment, status counts, mentions today, over-time chart data, recent scans.",
        params: Type.Object({ projectId: Type.String() }),
      },
    },
    async (request, reply) => {
      const { projectId } = request.params;
      const userId: string = (request as any).userId;
      if (!(await assertOwner(fastify, projectId, userId))) {
        return reply.status(403).send({ error: "Forbidden" });
      }

      // Last 24 hours window
      const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

      // Last 30 days for the over-time chart
      const last30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      const [byRisk, bySentiment, byStatus, mentionsToday, recentScans, overTimeMentions] =
        await Promise.all([

          // Count by risk level
          fastify.prisma.brandMention.groupBy({
            by: ["riskLevel"],
            where: { projectId },
            _count: true,
          }),

          // Count by sentiment (POSITIVE / NEGATIVE / NEUTRAL)
          fastify.prisma.brandMention.groupBy({
            by: ["sentiment"],
            where: { projectId },
            _count: true,
          }),

          // Count by status (NEW / VIEWED / DISMISSED / ARCHIVED)
          fastify.prisma.brandMention.groupBy({
            by: ["status"],
            where: { projectId },
            _count: true,
          }),

          // Mentions in last 24 hours
          fastify.prisma.brandMention.count({
            where: {
              projectId,
              scannedAt: { gte: last24h },
            },
          }),

          // Last 10 scan logs for the scan history table
          fastify.prisma.scanLog.findMany({
            where: { projectId },
            orderBy: { scannedAt: "desc" },
            take: 10,
            select: {
              id: true,
              scanStatus: true,
              mentionsFound: true,
              highRiskCount: true,
              scannedAt: true,
            },
          }),

          // Daily mention counts for the last 30 days (line chart data)
          fastify.prisma.brandMention.findMany({
            where: {
              projectId,
              scannedAt: { gte: last30d },
            },
            select: { scannedAt: true },
            orderBy: { scannedAt: "asc" },
          }),
        ]);

      // Aggregate daily counts from raw timestamps
      const dailyMap = new Map<string, number>();
      for (const row of overTimeMentions) {
        const day = row.scannedAt.toISOString().slice(0, 10); // "2026-03-05"
        dailyMap.set(day, (dailyMap.get(day) ?? 0) + 1);
      }

      // Build a full 30-day array — days with 0 mentions are included
      const mentionsOverTime: { date: string; count: number }[] = [];
      for (let i = 29; i >= 0; i--) {
        const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
        const day = d.toISOString().slice(0, 10);
        mentionsOverTime.push({ date: day, count: dailyMap.get(day) ?? 0 });
      }

      return reply.send({
        byRisk,
        bySentiment,
        byStatus,
        mentionsToday,
        mentionsOverTime,
        recentScans,
      });
    }
  );

  // ── GET /mentions/:mentionId ───────────────────────────────────
  fastify.get<{ Params: { projectId: string; mentionId: string } }>(
    "/api/v1/projects/:projectId/mentions/:mentionId",
    {
      schema: {
        tags: ["Social Monitoring"],
        description: "Get a single mention (auto-marks as VIEWED)",
        params: Type.Object({ projectId: Type.String(), mentionId: Type.String() }),
      },
    },
    async (request, reply) => {
      const { projectId, mentionId } = request.params;
      const userId: string = (request as any).userId;
      if (!(await assertOwner(fastify, projectId, userId))) {
        return reply.status(403).send({ error: "Forbidden" });
      }
      const mention = await fastify.prisma.brandMention.findFirst({
        where: { id: mentionId, projectId },
      });
      if (!mention) return reply.status(404).send({ error: "Mention not found" });
      if (mention.status === "NEW") {
        await fastify.prisma.brandMention.update({
          where: { id: mentionId },
          data: { status: "VIEWED" },
        });
        mention.status = "VIEWED";
      }
      return reply.send(mention);
    }
  );

  // ── PATCH /mentions/:mentionId ─────────────────────────────────
  fastify.patch<{ Params: { projectId: string; mentionId: string }; Body: { status: string } }>(
    "/api/v1/projects/:projectId/mentions/:mentionId",
    {
      schema: {
        tags: ["Social Monitoring"],
        description: "Update mention status (VIEWED / DISMISSED / ARCHIVED)",
        params: Type.Object({ projectId: Type.String(), mentionId: Type.String() }),
        body: UpdateMentionBody,
      },
    },
    async (request, reply) => {
      const { projectId, mentionId } = request.params;
      const userId: string = (request as any).userId;
      if (!(await assertOwner(fastify, projectId, userId))) {
        return reply.status(403).send({ error: "Forbidden" });
      }
      const mention = await fastify.prisma.brandMention.findFirst({
        where: { id: mentionId, projectId },
      });
      if (!mention) return reply.status(404).send({ error: "Mention not found" });
      const updated = await fastify.prisma.brandMention.update({
        where: { id: mentionId },
        data: { status: request.body.status as any },
      });
      return reply.send(updated);
    }
  );

  // ── POST /mentions/scan ────────────────────────────────────────
  fastify.post<{ Params: { projectId: string } }>(
    "/api/v1/projects/:projectId/mentions/scan",
    {
      schema: {
        tags: ["Social Monitoring"],
        description: "Manually trigger a scan now (does not affect cron schedule)",
        params: Type.Object({ projectId: Type.String() }),
      },
    },
    async (request, reply) => {
      const { projectId } = request.params;
      const userId: string = (request as any).userId;
      if (!(await assertOwner(fastify, projectId, userId))) {
        return reply.status(403).send({ error: "Forbidden" });
      }
      const result = await scanProject(fastify.prisma, projectId, request.log);
      return reply.status(202).send({ message: "Scan complete", ...result });
    }
  );
}


