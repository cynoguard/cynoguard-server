/**
 * Monitoring service — runs the RDAP check cycle and creates alerts.
 * Called by the cron job every 6 hours.
 */

import { prisma } from "../plugins/prisma.js";
import { getTld } from "../lib/domain-normalize.js";
import { evaluateSuspiciousness } from "../lib/tld-strategy.js";
import { rdapLookup } from "./rdap.service.js";
import { createAlert } from "./alert.service.js";

const DEFAULT_SIMILARITY_THRESHOLD = 0.85;

function getThreshold(watchDomainThreshold: number | null): number {
    if (watchDomainThreshold !== null && watchDomainThreshold !== undefined) {
        return watchDomainThreshold;
    }
    const envThreshold = parseFloat(
        process.env.SIMILARITY_THRESHOLD || "0.85"
    );
    return isNaN(envThreshold) ? DEFAULT_SIMILARITY_THRESHOLD : envThreshold;
}

/**
 * Run a full monitoring cycle:
 * 1. Load all ACTIVE watch domains
 * 2. For each, load active candidates
 * 3. RDAP check each candidate
 * 4. Evaluate suspiciousness
 * 5. Create alerts for suspicious + registered candidates
 */
export async function runMonitoringCycle(): Promise<void> {
    console.log("[Monitoring] Starting monitoring cycle...");

    const watchDomains = await prisma.watchDomain.findMany({
        where: { status: "ACTIVE" },
    });

    console.log(`[Monitoring] Found ${watchDomains.length} active watch domains`);

    for (const wd of watchDomains) {
        try {
            await processWatchDomain(wd);
        } catch (error) {
            console.error(
                `[Monitoring] Error processing watch domain ${wd.domain}:`,
                error
            );
        }
    }

    console.log("[Monitoring] Monitoring cycle complete.");
}

async function processWatchDomain(wd: any): Promise<void> {
    const candidates = await prisma.candidateDomain.findMany({
        where: { watchDomainId: wd.id, isActive: true },
    });

    console.log(
        `[Monitoring] Processing ${candidates.length} candidates for ${wd.domain}`
    );

    const threshold = getThreshold(wd.similarityThreshold);
    const watchTld = getTld(wd.domain);

    for (const candidate of candidates) {
        try {
            // 1. RDAP lookup
            const rdapResult = await rdapLookup(candidate.domain);

            // 2. Persist RDAP result
            await prisma.candidateDomain.update({
                where: { id: candidate.id },
                data: {
                    rdapCheckedAt: new Date(),
                    rdapRegistered: rdapResult.registered,
                    rdapStatus: rdapResult.status ?? [],
                    rdapRaw: rdapResult.raw ?? undefined,
                },
            });

            // 3. Evaluate suspiciousness
            if (rdapResult.registered !== true) continue;

            const result = evaluateSuspiciousness(
                candidate.tld,
                watchTld,
                wd.tldStrategy,
                wd.tldAllowlist,
                wd.tldSuspicious,
                candidate.similarityScore,
                threshold
            );

            if (!result.isSuspicious) continue;

            // 4. Create alert (with dedupe)
            const message = `Suspicious similar domain registered: ${candidate.domain} (similarity ${candidate.similarityScore.toFixed(2)}, tld ${candidate.tld})`;

            await createAlert({
                tenantId: wd.tenantId,
                userId: wd.userId,
                watchDomainId: wd.id,
                candidateDomainId: candidate.id,
                candidateDomain: candidate.domain,
                watchDomain: wd.domain,
                severity: result.severity as any,
                similarityScore: candidate.similarityScore,
                tld: candidate.tld,
                message,
            });
        } catch (error) {
            console.error(
                `[Monitoring] Error checking candidate ${candidate.domain}:`,
                error
            );
        }
    }
}
