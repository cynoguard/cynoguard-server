import { addCandidatesHandler, createWatchlist, deleteWatchlistEntryHandler, getCandidates, getScanLogs, getWatchlist, getWatchlistEntryHandler, triggerScanHandler, updateWatchlistEntryHandler, } from "./domain-monitoring.handler.js";
import { AddCandidatesBody, CreateWatchlistBody, ProjectParams, UpdateWatchlistBody, WatchlistParams, } from "./domain-monitoring.schema.js";
export default async function domainMonitoringRoutes(fastify) {
    // ── Watchlist ──────────────────────────────────────────────────────────────
    fastify.get("/api/v1/orgs/:orgId/projects/:projectId/watchlist", { schema: { tags: ["Domain Monitoring"], params: ProjectParams } }, (req, rep) => getWatchlist(req, rep));
    fastify.post("/api/v1/orgs/:orgId/projects/:projectId/watchlist", { schema: { tags: ["Domain Monitoring"], params: ProjectParams, body: CreateWatchlistBody } }, (req, rep) => createWatchlist(req, rep));
    fastify.get("/api/v1/orgs/:orgId/projects/:projectId/watchlist/:watchlistId", { schema: { tags: ["Domain Monitoring"], params: WatchlistParams } }, (req, rep) => getWatchlistEntryHandler(req, rep));
    fastify.patch("/api/v1/orgs/:orgId/projects/:projectId/watchlist/:watchlistId", { schema: { tags: ["Domain Monitoring"], params: WatchlistParams, body: UpdateWatchlistBody } }, (req, rep) => updateWatchlistEntryHandler(req, rep));
    fastify.delete("/api/v1/orgs/:orgId/projects/:projectId/watchlist/:watchlistId", { schema: { tags: ["Domain Monitoring"], params: WatchlistParams } }, (req, rep) => deleteWatchlistEntryHandler(req, rep));
    fastify.post("/api/v1/orgs/:orgId/projects/:projectId/watchlist/:watchlistId/scan", { schema: { tags: ["Domain Monitoring"], params: WatchlistParams } }, (req, rep) => triggerScanHandler(req, rep));
    // ── Candidates ─────────────────────────────────────────────────────────────
    fastify.get("/api/v1/orgs/:orgId/projects/:projectId/watchlist/:watchlistId/candidates", { schema: { tags: ["Domain Monitoring"], params: WatchlistParams } }, (req, rep) => getCandidates(req, rep));
    fastify.post("/api/v1/orgs/:orgId/projects/:projectId/watchlist/:watchlistId/candidates", { schema: { tags: ["Domain Monitoring"], params: WatchlistParams, body: AddCandidatesBody } }, (req, rep) => addCandidatesHandler(req, rep));
    // ── Scan logs ──────────────────────────────────────────────────────────────
    fastify.get("/api/v1/orgs/:orgId/projects/:projectId/watchlist/:watchlistId/scans", { schema: { tags: ["Domain Monitoring"], params: WatchlistParams } }, (req, rep) => getScanLogs(req, rep));
}
