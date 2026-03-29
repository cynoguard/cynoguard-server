/**
 * Monitoring service — runs the RDAP check cycle and creates alerts.
 * Fixed: now uses WatchlistEntry (new model) instead of the old WatchDomain model.
 * Called by the cron job every 6 hours.
 */
import { prisma } from "../plugins/prisma.js";
import { getTld } from "../lib/domain-normalize.js";
import { evaluateSuspiciousness } from "../lib/tld-strategy.js";
import { rdapLookup } from "./rdap.service.js";
const DEFAULT_SIMILARITY_THRESHOLD = 0.85;
function getThreshold(threshold) {
    if (threshold !== null && threshold !== undefined) {
        return threshold;
    }
    const envThreshold = parseFloat(process.env.SIMILARITY_THRESHOLD || "0.85");
    return isNaN(envThreshold) ? DEFAULT_SIMILARITY_THRESHOLD : envThreshold;
}
/**
 * Run a full monitoring cycle:
 * 1. Load all ACTIVE watchlist entries (due for scanning)
 * 2. For each, load active candidates linked via watchlistEntryId
 * 3. RDAP check each candidate
 * 4. Evaluate suspiciousness
 * 5. Update suspiciousCount + write a DomainScanLog summary
 */
export async function runMonitoringCycle() {
    console.log("[Monitoring] Starting monitoring cycle...");
    // ✅ FIX: Query WatchlistEntry instead of the old WatchDomain model
    const entries = await prisma.watchlistEntry.findMany({
        where: {
            active: true,
            nextRunAt: { lte: new Date() },
        },
        include: { project: true },
    });
    console.log(`[Monitoring] Found ${entries.length} watchlist entries due for scanning`);
    for (const entry of entries) {
        try {
            await processWatchlistEntry(entry);
        }
        catch (error) {
            console.error(`[Monitoring] Error processing watchlist entry ${entry.officialDomainRaw}:`, error);
            // Mark as failed so it gets retried next cycle
            await prisma.watchlistEntry.update({
                where: { id: entry.id },
                data: { lastScanStatus: "failed", lastScanAt: new Date() },
            });
        }
    }
    console.log("[Monitoring] Monitoring cycle complete.");
}
async function processWatchlistEntry(entry) {
    // ✅ FIX: Query candidates by watchlistEntryId instead of watchDomainId
    const candidates = await prisma.candidateDomain.findMany({
        where: { watchlistEntryId: entry.id, isActive: true },
    });
    console.log(`[Monitoring] Processing ${candidates.length} candidates for ${entry.officialDomainRaw}`);
    const threshold = getThreshold(entry.similarityThreshold);
    const watchTld = getTld(entry.officialDomainRaw);
    let suspiciousCount = 0;
    const scanSummary = [];
    for (const candidate of candidates) {
        try {
            // 1. RDAP lookup
            const rdapResult = await rdapLookup(candidate.domain);
            // 2. Persist RDAP result on candidate
            await prisma.candidateDomain.update({
                where: { id: candidate.id },
                data: {
                    rdapCheckedAt: new Date(),
                    rdapRegistered: rdapResult.registered,
                    rdapStatus: rdapResult.status ?? [],
                    rdapRaw: rdapResult.raw ?? undefined,
                },
            });
            if (rdapResult.registered !== true)
                continue;
            // 3. Evaluate suspiciousness
            const result = evaluateSuspiciousness(candidate.tld, watchTld, entry.tldStrategy, entry.tldAllowlist, entry.tldSuspicious, candidate.similarityScore, threshold);
            if (!result.isSuspicious)
                continue;
            suspiciousCount++;
            // 4. Log suspicious domain to scan summary
            scanSummary.push({
                domain: candidate.domain,
                similarityScore: candidate.similarityScore,
                tld: candidate.tld,
                severity: result.severity,
            });
            // 5. Update candidate risk level
            await prisma.candidateDomain.update({
                where: { id: candidate.id },
                data: { riskLevel: result.severity },
            });
        }
        catch (error) {
            console.error(`[Monitoring] Error checking candidate ${candidate.domain}:`, error);
        }
    }
    const nextRunAt = new Date(Date.now() + entry.intervalHours * 60 * 60 * 1000);
    // ✅ Update WatchlistEntry scan metadata
    await prisma.watchlistEntry.update({
        where: { id: entry.id },
        data: {
            lastScanAt: new Date(),
            lastScanStatus: "completed",
            nextRunAt,
            suspiciousCount: { increment: suspiciousCount },
        },
    });
    // ✅ Write a DomainScanLog entry for audit trail
    await prisma.domainScanLog.create({
        data: {
            watchlistEntryId: entry.id,
            status: "completed",
            summary: {
                totalCandidates: candidates.length,
                suspiciousFound: suspiciousCount,
                suspicious: scanSummary,
            },
        },
    });
    console.log(`[Monitoring] Done: ${entry.officialDomainRaw} — ${suspiciousCount} suspicious found`);
}
