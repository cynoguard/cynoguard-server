import { Type } from "@sinclair/typebox";
import type { FastifyInstance } from "fastify";

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
    select: { id: true },
  });
  if (!project) return false;
  return project.id === userId;
}

export default async function keywordRoutes(fastify: FastifyInstance) {
  // ── GET /api/v1/projects/:projectId/keywords ──────────────────
  fastify.get<{ Params: { projectId: string } }>(
    "/api/v1/projects/:projectId/keywords",
    {
      schema: {
        tags: ["Social Monitoring"],
        description: "List all monitoring keywords for a project",
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

      return reply.send({ keywords });
    }
  );

  // ── POST /api/v1/projects/:projectId/keywords ─────────────────
  fastify.post<{ Params: { projectId: string }; Body: { keyword: string } }>(
    "/api/v1/projects/:projectId/keywords",
    {
      schema: {
        tags: ["Social Monitoring"],
        description: "Add a brand monitoring keyword",
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

      // Cap at 50 keywords per project
      const count = await fastify.prisma.monitoringKeyword.count({ where: { projectId } });
      if (count >= 50) {
        return reply.status(422).send({ error: "Maximum 50 keywords per project" });
      }

      try {
        const kw = await fastify.prisma.monitoringKeyword.create({
          data: { projectId, keyword: request.body.keyword.trim() },
        });
        return reply.status(201).send(kw);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "";
        if (msg.includes("Unique constraint")) {
          return reply.status(409).send({ error: "Keyword already exists" });
        }
        throw err;
      }
    }
  );

  // ── PATCH /api/v1/projects/:projectId/keywords/:keywordId ─────
  fastify.patch<{
    Params: { projectId: string; keywordId: string };
    Body: { isActive: boolean };
  }>(
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
      return reply.send(updated);
    }
  );

  // ── DELETE /api/v1/projects/:projectId/keywords/:keywordId ────
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