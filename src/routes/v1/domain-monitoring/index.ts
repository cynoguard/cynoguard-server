import type { FastifyInstance } from "fastify";
import {
    addCandidatesHandler,
    createWatchlist,
    deleteWatchlistEntryHandler,
    getCandidates,
    getFindings,
    getScanLogs,
    getWatchlist,
    getWatchlistEntryHandler,
    triggerScanHandler,
    updateWatchlistEntryHandler,
} from "./domain-monitoring.handler.js";
import {
    AddCandidatesBody,
    CreateWatchlistBody,
    FindingsQuery,
    ProjectParams,
    UpdateWatchlistBody,
    WatchlistParams,
} from "./domain-monitoring.schema.js";

export default async function domainMonitoringRoutes(fastify: FastifyInstance) {

  // ── Watchlist ──────────────────────────────────────────────────────────────

  fastify.get(
    "/api/v1/orgs/:orgId/projects/:projectId/watchlist",
    { schema: { tags: ["Domain Monitoring"], params: ProjectParams } },
    (req, rep) => getWatchlist(req as any, rep)
  );

  fastify.post(
    "/api/v1/orgs/:orgId/projects/:projectId/watchlist",
    { schema: { tags: ["Domain Monitoring"], params: ProjectParams, body: CreateWatchlistBody } },
    (req, rep) => createWatchlist(req as any, rep)
  );

  fastify.get(
    "/api/v1/orgs/:orgId/projects/:projectId/watchlist/:watchlistId",
    { schema: { tags: ["Domain Monitoring"], params: WatchlistParams } },
    (req, rep) => getWatchlistEntryHandler(req as any, rep)
  );

  fastify.patch(
    "/api/v1/orgs/:orgId/projects/:projectId/watchlist/:watchlistId",
    { schema: { tags: ["Domain Monitoring"], params: WatchlistParams, body: UpdateWatchlistBody } },
    (req, rep) => updateWatchlistEntryHandler(req as any, rep)
  );

  fastify.delete(
    "/api/v1/orgs/:orgId/projects/:projectId/watchlist/:watchlistId",
    { schema: { tags: ["Domain Monitoring"], params: WatchlistParams } },
    (req, rep) => deleteWatchlistEntryHandler(req as any, rep)
  );

  fastify.post(
    "/api/v1/orgs/:orgId/projects/:projectId/watchlist/:watchlistId/scan",
    { schema: { tags: ["Domain Monitoring"], params: WatchlistParams } },
    (req, rep) => triggerScanHandler(req as any, rep)
  );

  // ── Candidates ─────────────────────────────────────────────────────────────

  fastify.get(
    "/api/v1/orgs/:orgId/projects/:projectId/watchlist/:watchlistId/candidates",
    { schema: { tags: ["Domain Monitoring"], params: WatchlistParams } },
    (req, rep) => getCandidates(req as any, rep)
  );

  fastify.get(
    "/api/v1/orgs/:orgId/projects/:projectId/watchlist/:watchlistId/findings",
    { schema: { tags: ["Domain Monitoring"], params: WatchlistParams, querystring: FindingsQuery } },
    (req, rep) => getFindings(req as any, rep)
  );

  fastify.post(
    "/api/v1/orgs/:orgId/projects/:projectId/watchlist/:watchlistId/candidates",
    { schema: { tags: ["Domain Monitoring"], params: WatchlistParams, body: AddCandidatesBody } },
    (req, rep) => addCandidatesHandler(req as any, rep)
  );

  // ── Scan logs ──────────────────────────────────────────────────────────────

  fastify.get(
    "/api/v1/orgs/:orgId/projects/:projectId/watchlist/:watchlistId/scans",
    { schema: { tags: ["Domain Monitoring"], params: WatchlistParams } },
    (req, rep) => getScanLogs(req as any, rep)
  );
}