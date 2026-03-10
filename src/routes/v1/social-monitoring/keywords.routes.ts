import { Type } from "@sinclair/typebox";
import type { FastifyInstance } from "fastify";
import { scanProject } from "../../../services/monitoring.service.js";

const KeywordBody = Type.Object({
  keyword: Type.String({ minLength: 2, maxLength: 100 }),
});

const UpdateKeywordBody = Type.Object({
  isActive: Type.Boolean(),
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

export default async function keywordRoutes(fastify: FastifyInstance) {

  // ── GET /keywords ──────────────────────────────────────────────
  fastify.get<{ Params: { projectId: string } }>(
    "/api/v1/projects/:projectId/keywords",
    {
      schema: {
        tags: ["Social Monitoring"],
        description: "List all monitoring keywords. Each keyword includes a mention count.",
        params: Type.Object({ projectId: Type.String() }),
      },
    },
    async (request, reply) => {
      const { projectId } = request.params;
      const userId: string = (request as any).userId;
      if (!(await assertOwner(fastify, projectId, userId))) {
        return reply.status(403).send({ error: "Forbidden" });
      }

      const keywords = await fastify.prisma.monitoringKeyword.findMany({
        where: { projectId },
        orderBy: { createdAt: "desc" },
      });

      // Count mentions per keyword using the matchedKeyword field
      const mentionCounts = await fastify.prisma.brandMention.groupBy({
        by: ["matchedKeyword"],
        where: { projectId, matchedKeyword: { not: null } },
        _count: true,
      });

      const countMap = new Map<string, number>();
      for (const row of mentionCounts) {
        if (row.matchedKeyword) {
          countMap.set(row.matchedKeyword, row._count);
        }
      }

      const result = keywords.map((kw) => ({
        ...kw,
        mentionCount: countMap.get(kw.keyword) ?? 0,
      }));

      return reply.send({ keywords: result });
    }
  );

  // ── POST /keywords ─────────────────────────────────────────────
  fastify.post<{ Params: { projectId: string }; Body: { keyword: string } }>(
    "/api/v1/projects/:projectId/keywords",
    {
      schema: {
        tags: ["Social Monitoring"],
        description: "Add a brand monitoring keyword. Automatically triggers a background scan so results appear immediately.",
        params: Type.Object({ projectId: Type.String() }),
        body: KeywordBody,
      },
    },
    async (request, reply) => {
      const { projectId } = request.params;
      const userId: string = (request as any).userId;
      if (!(await assertOwner(fastify, projectId, userId))) {
        return reply.status(403).send({ error: "Forbidden" });
      }

      const count = await fastify.prisma.monitoringKeyword.count({
        where: { projectId },
      });
      if (count >= 50) {
        return reply.status(422).send({ error: "Maximum 50 keywords per project" });
      }

      try {
        const kw = await fastify.prisma.monitoringKeyword.create({
          data: { projectId, keyword: request.body.keyword.trim() },
        });

        // Fire background scan immediately — don't await so client gets
        // a fast response. Scan runs silently in the background.
        scanProject(fastify.prisma, projectId, fastify.log).catch((err) => {
          fastify.log.error({ err }, "[SocialMonitoring] Background scan failed after keyword add");
        });

        return reply.status(201).send({ ...kw, mentionCount: 0 });

      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "";
        if (msg.includes("Unique constraint")) {
          return reply.status(409).send({ error: "Keyword already exists" });
        }
        throw err;
      }
    }
  );

  // ── PATCH /keywords/:keywordId ─────────────────────────────────
  fastify.patch<{ Params: { projectId: string; keywordId: string }; Body: { isActive: boolean } }>(
    "/api/v1/projects/:projectId/keywords/:keywordId",
    {
      schema: {
        tags: ["Social Monitoring"],
        description: "Enable or disable a keyword",
        params: Type.Object({ projectId: Type.String(), keywordId: Type.String() }),
        body: UpdateKeywordBody,
      },
    },
    async (request, reply) => {
      const { projectId, keywordId } = request.params;
      const userId: string = (request as any).userId;
      if (!(await assertOwner(fastify, projectId, userId))) {
        return reply.status(403).send({ error: "Forbidden" });
      }
      const kw = await fastify.prisma.monitoringKeyword.findFirst({
        where: { id: keywordId, projectId },
      });
      if (!kw) return reply.status(404).send({ error: "Keyword not found" });

      const updated = await fastify.prisma.monitoringKeyword.update({
        where: { id: keywordId },
        data: { isActive: request.body.isActive },
      });

      // If keyword was re-enabled, trigger a background scan
      if (request.body.isActive) {
        scanProject(fastify.prisma, projectId, fastify.log).catch((err) => {
          fastify.log.error({ err }, "[SocialMonitoring] Background scan failed after keyword enable");
        });
      }

      return reply.send({ ...updated, mentionCount: 0 });
    }
  );

  // ── DELETE /keywords/:keywordId ────────────────────────────────
  fastify.delete<{ Params: { projectId: string; keywordId: string } }>(
    "/api/v1/projects/:projectId/keywords/:keywordId",
    {
      schema: {
        tags: ["Social Monitoring"],
        description: "Delete a monitoring keyword",
        params: Type.Object({ projectId: Type.String(), keywordId: Type.String() }),
      },
    },
    async (request, reply) => {
      const { projectId, keywordId } = request.params;
      const userId: string = (request as any).userId;
      if (!(await assertOwner(fastify, projectId, userId))) {
        return reply.status(403).send({ error: "Forbidden" });
      }
      const kw = await fastify.prisma.monitoringKeyword.findFirst({
        where: { id: keywordId, projectId },
      });
      if (!kw) return reply.status(404).send({ error: "Keyword not found" });
      await fastify.prisma.monitoringKeyword.delete({ where: { id: keywordId } });
      return reply.status(204).send();
    }
  );
}