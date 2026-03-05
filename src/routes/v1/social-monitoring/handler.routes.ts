import { Type } from "@sinclair/typebox";
import type { FastifyInstance } from "fastify";
import { encrypt } from "../../../lib/encryption.js";
import { validateBearerToken } from "../../../services/x.service.js";

// ─── Schemas ──────────────────────────────────────────────────────

const SetupHandlerBody = Type.Object({
  bearerToken: Type.String({ minLength: 10, description: "X API Bearer Token" }),
});

const HandlerResponse = Type.Object({
  id: Type.String(),
  projectId: Type.String(),
  platform: Type.String(),
  isValid: Type.Boolean(),
  lastValidatedAt: Type.Union([Type.String(), Type.Null()]),
  validationError: Type.Union([Type.String(), Type.Null()]),
  createdAt: Type.String(),
});

// ─── Auth Helper ──────────────────────────────────────────────────

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

// ─── Routes ───────────────────────────────────────────────────────

export default async function handlerRoutes(fastify: FastifyInstance) {
  // ── POST /api/v1/projects/:projectId/social-handlers ──────────
  fastify.post<{ Params: { projectId: string }; Body: { bearerToken: string } }>(
    "/api/v1/projects/:projectId/social-handlers",
    {
      schema: {
        tags: ["Social Monitoring"],
        description: "Setup X/Twitter handler for a project. Token is validated before storing.",
        params: Type.Object({ projectId: Type.String() }),
        body: SetupHandlerBody,
        response: { 201: HandlerResponse },
      },
    },
    async (request, reply) => {
      const { projectId } = request.params;
      const userId: string = (request as any).userId;

      if (!(await assertOwner(fastify, projectId, userId))) {
        return reply.status(403).send({ error: "Forbidden" });
      }

      const encrypted = encrypt(request.body.bearerToken);
      const validation = await validateBearerToken(encrypted);

      const handler = await fastify.prisma.socialHandler.upsert({
        where: { projectId_platform: { projectId, platform: "X" } },
        update: {
          bearerTokenEncrypted: encrypted,
          isValid: validation.isValid,
          lastValidatedAt: new Date(),
          validationError: validation.error ?? null,
        },
        create: {
          projectId,
          platform: "X",
          bearerTokenEncrypted: encrypted,
          isValid: validation.isValid,
          lastValidatedAt: new Date(),
          validationError: validation.error ?? null,
        },
      });

      return reply.status(201).send({
        id: handler.id,
        projectId: handler.projectId,
        platform: handler.platform,
        isValid: handler.isValid,
        lastValidatedAt: handler.lastValidatedAt?.toISOString() ?? null,
        validationError: handler.validationError,
        createdAt: handler.createdAt.toISOString(),
        // ⚠️ bearerTokenEncrypted is intentionally never returned
      });
    }
  );

  // ── GET /api/v1/projects/:projectId/social-handlers ───────────
  fastify.get<{ Params: { projectId: string } }>(
    "/api/v1/projects/:projectId/social-handlers",
    {
      schema: {
        tags: ["Social Monitoring"],
        description: "List all social handlers for a project",
        params: Type.Object({ projectId: Type.String() }),
      },
    },
    async (request, reply) => {
      const { projectId } = request.params;
      const userId: string = (request as any).userId;

      if (!(await assertOwner(fastify, projectId, userId))) {
        return reply.status(403).send({ error: "Forbidden" });
      }

      const handlers = await fastify.prisma.socialHandler.findMany({
        where: { projectId },
        select: {
          id: true, platform: true, isValid: true,
          lastValidatedAt: true, validationError: true,
          createdAt: true, updatedAt: true,
          // bearerTokenEncrypted omitted
        },
      });

      return reply.send({ handlers });
    }
  );

  // ── POST /api/v1/projects/:projectId/social-handlers/:handlerId/validate ──
  fastify.post<{ Params: { projectId: string; handlerId: string } }>(
    "/api/v1/projects/:projectId/social-handlers/:handlerId/validate",
    {
      schema: {
        tags: ["Social Monitoring"],
        description: "Re-validate stored X credentials against the live API",
        params: Type.Object({ projectId: Type.String(), handlerId: Type.String() }),
      },
    },
    async (request, reply) => {
      const { projectId, handlerId } = request.params;
      const userId: string = (request as any).userId;

      if (!(await assertOwner(fastify, projectId, userId))) {
        return reply.status(403).send({ error: "Forbidden" });
      }

      const handler = await fastify.prisma.socialHandler.findFirst({
        where: { id: handlerId, projectId },
      });
      if (!handler) return reply.status(404).send({ error: "Handler not found" });

      const validation = await validateBearerToken(handler.bearerTokenEncrypted);

      const updated = await fastify.prisma.socialHandler.update({
        where: { id: handlerId },
        data: {
          isValid: validation.isValid,
          lastValidatedAt: new Date(),
          validationError: validation.error ?? null,
        },
        select: { id: true, isValid: true, lastValidatedAt: true, validationError: true },
      });

      return reply.send(updated);
    }
  );

  // ── DELETE /api/v1/projects/:projectId/social-handlers/:handlerId ──
  fastify.delete<{ Params: { projectId: string; handlerId: string } }>(
    "/api/v1/projects/:projectId/social-handlers/:handlerId",
    {
      schema: {
        tags: ["Social Monitoring"],
        description: "Remove a social handler",
        params: Type.Object({ projectId: Type.String(), handlerId: Type.String() }),
      },
    },
    async (request, reply) => {
      const { projectId, handlerId } = request.params;
      const userId: string = (request as any).userId;

      if (!(await assertOwner(fastify, projectId, userId))) {
        return reply.status(403).send({ error: "Forbidden" });
      }

      const handler = await fastify.prisma.socialHandler.findFirst({
        where: { id: handlerId, projectId },
      });
      if (!handler) return reply.status(404).send({ error: "Handler not found" });

      await fastify.prisma.socialHandler.delete({ where: { id: handlerId } });
      return reply.status(204).send();
    }
  );
}