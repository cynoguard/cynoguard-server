import { prisma } from "../../../plugins/prisma.js";
import { addManualCandidates, createWatchlistEntry, deleteWatchlistEntry, getWatchlistEntry, listCandidates, listScanLogs, listWatchlist, triggerScan, updateWatchlistEntry } from "../../../services/domain-monitoring.service.js";
// ─── Helpers ──────────────────────────────────────────────────────────────────
async function assertProjectMember(orgId, projectId) {
    const project = await prisma.project.findFirst({
        where: { id: projectId, organizationId: orgId },
        select: { id: true },
    });
    return !!project;
}
// ─── Watchlist handlers ───────────────────────────────────────────────────────
export async function getWatchlist(request, reply) {
    const { orgId, projectId } = request.params;
    if (!(await assertProjectMember(orgId, projectId)))
        return reply.status(403).send({ error: "Forbidden" });
    const entries = await listWatchlist(prisma, projectId);
    return reply.send(entries);
}
export async function createWatchlist(request, reply) {
    const { orgId, projectId } = request.params;
    if (!(await assertProjectMember(orgId, projectId)))
        return reply.status(403).send({ error: "Forbidden" });
    try {
        const entry = await createWatchlistEntry(prisma, projectId, request.body);
        return reply.status(201).send(entry);
    }
    catch (err) {
        if (err?.code === "P2002")
            return reply.status(409).send({ error: "Domain already monitored for this project" });
        throw err;
    }
}
export async function getWatchlistEntryHandler(request, reply) {
    const { orgId, projectId, watchlistId } = request.params;
    if (!(await assertProjectMember(orgId, projectId)))
        return reply.status(403).send({ error: "Forbidden" });
    const entry = await getWatchlistEntry(prisma, watchlistId, projectId);
    if (!entry)
        return reply.status(404).send({ error: "Watchlist entry not found" });
    return reply.send(entry);
}
export async function updateWatchlistEntryHandler(request, reply) {
    const { orgId, projectId, watchlistId } = request.params;
    if (!(await assertProjectMember(orgId, projectId)))
        return reply.status(403).send({ error: "Forbidden" });
    await updateWatchlistEntry(prisma, watchlistId, projectId, request.body);
    const updated = await getWatchlistEntry(prisma, watchlistId, projectId);
    if (!updated)
        return reply.status(404).send({ error: "Watchlist entry not found" });
    return reply.send(updated);
}
export async function deleteWatchlistEntryHandler(request, reply) {
    const { orgId, projectId, watchlistId } = request.params;
    if (!(await assertProjectMember(orgId, projectId)))
        return reply.status(403).send({ error: "Forbidden" });
    await deleteWatchlistEntry(prisma, watchlistId, projectId);
    return reply.status(204).send();
}
export async function triggerScanHandler(request, reply) {
    const { orgId, projectId, watchlistId } = request.params;
    if (!(await assertProjectMember(orgId, projectId)))
        return reply.status(403).send({ error: "Forbidden" });
    const ok = await triggerScan(prisma, watchlistId, projectId);
    if (!ok)
        return reply.status(404).send({ error: "Watchlist entry not found" });
    return reply.send({ queued: true });
}
// ─── Candidate handlers ───────────────────────────────────────────────────────
export async function getCandidates(request, reply) {
    const { orgId, projectId, watchlistId } = request.params;
    if (!(await assertProjectMember(orgId, projectId)))
        return reply.status(403).send({ error: "Forbidden" });
    const items = await listCandidates(prisma, watchlistId, projectId);
    if (!items)
        return reply.status(404).send({ error: "Watchlist entry not found" });
    return reply.send({ items });
}
export async function addCandidatesHandler(request, reply) {
    const { orgId, projectId, watchlistId } = request.params;
    if (!(await assertProjectMember(orgId, projectId)))
        return reply.status(403).send({ error: "Forbidden" });
    const count = await addManualCandidates(prisma, watchlistId, projectId, request.body.domains);
    if (count === null)
        return reply.status(404).send({ error: "Watchlist entry not found" });
    return reply.send({ added: count });
}
// ─── Scan log handler ─────────────────────────────────────────────────────────
export async function getScanLogs(request, reply) {
    const { orgId, projectId, watchlistId } = request.params;
    if (!(await assertProjectMember(orgId, projectId)))
        return reply.status(403).send({ error: "Forbidden" });
    const logs = await listScanLogs(prisma, watchlistId, projectId);
    if (!logs)
        return reply.status(404).send({ error: "Watchlist entry not found" });
    return reply.send({ logs });
}
