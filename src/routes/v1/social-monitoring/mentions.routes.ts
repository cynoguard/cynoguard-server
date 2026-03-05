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
  fastify.get<{
    Params: { projectId: string };
    Querystring: { page?: string; limit?: string; status?: string; riskLevel?: string };
  }>(
    "/api/v1/projects/:projectId/mentions",
    {
      schema: {
        tags: ["Social Monitoring"],
        description: "List brand mentions with pagination and optional filters",
        params: Type.Object({ projectId: Type.String() }),
        querystring: Type.Object({
          page: Type.Optional(Type.String()),
          limit: Type.Optional(Type.String()),
          status: Type.Optional(Type.String()),
          riskLevel: Type.Optional(Type.String()),
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
      const { status, riskLevel } = request.query;
      const where = {
        projectId,
        ...(status && { status: status as any }),
        ...(riskLevel && { riskLevel: riskLevel as any }),
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

  fastify.get<{ Params: { projectId: string } }>(
    "/api/v1/projects/:projectId/mentions/stats",
    {
      schema: {
        tags: ["Social Monitoring"],
        description: "Aggregated mention stats for dashboard",
        params: Type.Object({ projectId: Type.String() }),
      },
    },
    async (request, reply) => {
      const { projectId } = request.params;
      const userId: string = (request as any).userId;
      if (!(await assertOwner(fastify, projectId, userId))) {
        return reply.status(403).send({ error: "Forbidden" });
      }
      const [byRisk, byStatus, recentScans] = await Promise.all([
        fastify.prisma.brandMention.groupBy({
          by: ["riskLevel"],
          where: { projectId },
          _count: true,
        }),
        fastify.prisma.brandMention.groupBy({
          by: ["status"],
          where: { projectId },
          _count: true,
        }),
        fastify.prisma.scanLog.findMany({
          where: { projectId },
          orderBy: { scannedAt: "desc" },
          take: 10,
          select: {
            id: true, scanStatus: true,
            mentionsFound: true, highRiskCount: true, scannedAt: true,
          },
        }),
      ]);
      return reply.send({ byRisk, byStatus, recentScans });
    }
  );

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