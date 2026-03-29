import type { FastifyReply, FastifyRequest } from "fastify";

import { prisma } from "../../../plugins/prisma.js";
import { addManualCandidates, createWatchlistEntry, deleteWatchlistEntry, getWatchlistEntry, listCandidates, listFindings, listScanLogs, listWatchlist, triggerScan, updateWatchlistEntry } from "../../../services/domain-monitoring.service.js";
import type {
    TAddCandidatesBody,
    TCreateWatchlistBody,
    TFindingsQuery,
    TProjectParams,
    TUpdateWatchlistBody,
    TWatchlistParams,
} from "./domain-monitoring.schema.js";

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function assertProjectMember(orgId: string, projectId: string) {
  const project = await prisma.project.findFirst({
    where: { id: projectId, organizationId: orgId },
    select: { id: true },
  });
  return !!project;
}

// ─── Watchlist handlers ───────────────────────────────────────────────────────

export async function getWatchlist(
  request: FastifyRequest<{ Params: TProjectParams }>,
  reply:   FastifyReply
) {
  const { orgId, projectId } = request.params;
  if (!(await assertProjectMember(orgId, projectId)))
    return reply.status(403).send({ error: "Forbidden" });

  const entries = await listWatchlist(prisma, projectId);
  return reply.send(entries);
}

export async function createWatchlist(
  request: FastifyRequest<{ Params: TProjectParams; Body: TCreateWatchlistBody }>,
  reply:   FastifyReply
) {
  const { orgId, projectId } = request.params;
  if (!(await assertProjectMember(orgId, projectId)))
    return reply.status(403).send({ error: "Forbidden" });

  try {
    const entry = await createWatchlistEntry(prisma, projectId, request.body);
    return reply.status(201).send(entry);
  } catch (err: any) {
    if (err?.code === "P2002")
      return reply.status(409).send({ error: "Domain already monitored for this project" });
    throw err;
  }
}

export async function getWatchlistEntryHandler(
  request: FastifyRequest<{ Params: TWatchlistParams }>,
  reply:   FastifyReply
) {
  const { orgId, projectId, watchlistId } = request.params;
  if (!(await assertProjectMember(orgId, projectId)))
    return reply.status(403).send({ error: "Forbidden" });

  const entry = await getWatchlistEntry(prisma, watchlistId, projectId);
  if (!entry) return reply.status(404).send({ error: "Watchlist entry not found" });
  return reply.send(entry);
}

export async function updateWatchlistEntryHandler(
  request: FastifyRequest<{ Params: TWatchlistParams; Body: TUpdateWatchlistBody }>,
  reply:   FastifyReply
) {
  const { orgId, projectId, watchlistId } = request.params;
  if (!(await assertProjectMember(orgId, projectId)))
    return reply.status(403).send({ error: "Forbidden" });

  await updateWatchlistEntry(prisma, watchlistId, projectId, request.body);
  const updated = await getWatchlistEntry(prisma, watchlistId, projectId);
  if (!updated) return reply.status(404).send({ error: "Watchlist entry not found" });
  return reply.send(updated);
}

export async function deleteWatchlistEntryHandler(
  request: FastifyRequest<{ Params: TWatchlistParams }>,
  reply:   FastifyReply
) {
  const { orgId, projectId, watchlistId } = request.params;
  if (!(await assertProjectMember(orgId, projectId)))
    return reply.status(403).send({ error: "Forbidden" });

  await deleteWatchlistEntry(prisma, watchlistId, projectId);
  return reply.status(204).send();
}

export async function triggerScanHandler(
  request: FastifyRequest<{ Params: TWatchlistParams }>,
  reply:   FastifyReply
) {
  const { orgId, projectId, watchlistId } = request.params;
  if (!(await assertProjectMember(orgId, projectId)))
    return reply.status(403).send({ error: "Forbidden" });

  const ok = await triggerScan(prisma, watchlistId, projectId);
  if (!ok) return reply.status(404).send({ error: "Watchlist entry not found" });
  return reply.send({ queued: true });
}

// ─── Candidate handlers ───────────────────────────────────────────────────────

export async function getCandidates(
  request: FastifyRequest<{ Params: TWatchlistParams }>,
  reply:   FastifyReply
) {
  const { orgId, projectId, watchlistId } = request.params;
  if (!(await assertProjectMember(orgId, projectId)))
    return reply.status(403).send({ error: "Forbidden" });

  const items = await listCandidates(prisma, watchlistId, projectId);
  if (!items) return reply.status(404).send({ error: "Watchlist entry not found" });
  return reply.send({ items });
}

export async function getFindings(
  request: FastifyRequest<{ Params: TWatchlistParams; Querystring: TFindingsQuery }>,
  reply:   FastifyReply
) {
  const { orgId, projectId, watchlistId } = request.params;
  if (!(await assertProjectMember(orgId, projectId)))
    return reply.status(403).send({ error: "Forbidden" });

  const page = request.query.page ?? 1;
  const pageSize = request.query.pageSize ?? 10;
  const sort = request.query.sort ?? "similarity_desc";

  const result = await listFindings(prisma, watchlistId, projectId, { page, pageSize, sort });
  if (!result) return reply.status(404).send({ error: "Watchlist entry not found" });
  return reply.send(result);
}

export async function addCandidatesHandler(
  request: FastifyRequest<{ Params: TWatchlistParams; Body: TAddCandidatesBody }>,
  reply:   FastifyReply
) {
  const { orgId, projectId, watchlistId } = request.params;
  if (!(await assertProjectMember(orgId, projectId)))
    return reply.status(403).send({ error: "Forbidden" });

  const count = await addManualCandidates(prisma, watchlistId, projectId, request.body.domains);
  if (count === null) return reply.status(404).send({ error: "Watchlist entry not found" });
  return reply.send({ added: count });
}

// ─── Scan log handler ─────────────────────────────────────────────────────────

export async function getScanLogs(
  request: FastifyRequest<{ Params: TWatchlistParams }>,
  reply:   FastifyReply
) {
  const { orgId, projectId, watchlistId } = request.params;
  if (!(await assertProjectMember(orgId, projectId)))
    return reply.status(403).send({ error: "Forbidden" });

  const logs = await listScanLogs(prisma, watchlistId, projectId);
  if (!logs) return reply.status(404).send({ error: "Watchlist entry not found" });
  return reply.send({ logs });
}