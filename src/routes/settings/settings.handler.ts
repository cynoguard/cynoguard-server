import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { prisma } from "../../plugins/prisma.js";
import {
    getOrganization, getOrgMembers, getUser,
    updateOrganization, updateUser,
} from "../../services/settings.service.js";
import type {
    TOrgParams, TUpdateOrgBody,
    TUpdateUserBody,
    TUserParams,
} from "./settings.schema.js";

// ─── Org ──────────────────────────────────────────────────────────────────────

export async function getOrgSettings(
  fastify: FastifyInstance,
  request: FastifyRequest<{ Params: TOrgParams }>,
  reply:   FastifyReply
) {
  const { orgId } = request.params;
  const org = await getOrganization(prisma, orgId);
  if (!org) return reply.status(404).send({ error: "Organization not found" });
  return reply.send(org);
}

export async function patchOrgSettings(
  fastify: FastifyInstance,
  request: FastifyRequest<{ Params: TOrgParams; Body: TUpdateOrgBody }>,
  reply:   FastifyReply
) {
  const { orgId } = request.params;
  try {
    const updated = await updateOrganization(prisma, orgId, request.body);
    return reply.send(updated);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "";
    if (msg.includes("Unique constraint"))
      return reply.status(409).send({ error: "Organization name already taken" });
    throw err;
  }
}

export async function listOrgMembers(
  fastify: FastifyInstance,
  request: FastifyRequest<{ Params: TOrgParams }>,
  reply:   FastifyReply
) {
  const { orgId } = request.params;
  const members = await getOrgMembers(prisma, orgId);
  return reply.send({ members });
}

// ─── User ─────────────────────────────────────────────────────────────────────

export async function getUserAccount(
  request: FastifyRequest<{ Params: TUserParams }>,
  reply:   FastifyReply
) {
  const { userId, orgId } = request.params; // userId = firebaseId
  const member = await getUser(prisma, userId, orgId);
  if (!member) return reply.status(404).send({ error: "User not found" });
  return reply.send(member);
}

export async function patchUserAccount(
  request: FastifyRequest<{ Params: TUserParams; Body: TUpdateUserBody }>,
  reply:   FastifyReply
) {
  const { userId, orgId } = request.params;
  const member = await getUser(prisma, userId, orgId);
  if (!member) return reply.status(404).send({ error: "User not found" });
  const updated = await updateUser(prisma, member.userId, request.body);
  return reply.send(updated);
}