/**
 * Candidate Domain service — list and manual add operations.
 */

import { prisma } from "../plugins/prisma.js";
import { normalizeDomain, getTld } from "../lib/domain-normalize.js";
import { computeSimilarityScore } from "../lib/similarity.js";

/**
 * List candidates for a watch domain. Scopes by tenantId for security.
 */
export async function listCandidates(
    watchDomainId: string,
    tenantId: string
) {
    // Verify watch domain belongs to tenant
    const watchDomain = await prisma.watchDomain.findFirst({
        where: { id: watchDomainId, tenantId },
    });

    if (!watchDomain) {
        throw new Error("Watch domain not found or access denied");
    }

    const candidates = await prisma.candidateDomain.findMany({
        where: { watchDomainId },
        orderBy: { similarityScore: "desc" },
    });

    return {
        items: candidates.map((c: any) => ({
            id: c.id,
            domain: c.domain,
            source: c.source,
            similarityScore: c.similarityScore,
            tld: c.tld,
            isActive: c.isActive,
            rdapRegistered: c.rdapRegistered,
            rdapCheckedAt: c.rdapCheckedAt,
        })),
    };
}

/**
 * Add manual candidate domains. Deduplicates, normalizes, and computes similarity.
 * Returns count of newly added candidates.
 */
export async function addManualCandidates(
    watchDomainId: string,
    tenantId: string,
    domains: string[]
): Promise<number> {
    // Verify watch domain belongs to tenant
    const watchDomain = await prisma.watchDomain.findFirst({
        where: { id: watchDomainId, tenantId },
    });

    if (!watchDomain) {
        throw new Error("Watch domain not found or access denied");
    }

    let addedCount = 0;

    for (const rawDomain of domains) {
        try {
            const normalized = normalizeDomain(rawDomain);

            // Skip if it matches the watch domain itself
            if (normalized === watchDomain.domain) continue;

            const tld = getTld(normalized);
            const similarityScore = computeSimilarityScore(
                watchDomain.domain,
                normalized
            );

            await prisma.candidateDomain.create({
                data: {
                    watchDomainId,
                    domain: normalized,
                    tld,
                    source: "MANUAL",
                    similarityScore,
                    isActive: true,
                },
            });

            addedCount++;
        } catch (error: any) {
            // Skip duplicates (unique constraint) or invalid domains
            if (error?.code === "P2002") continue;
            if (error?.message?.includes("Invalid") || error?.message?.includes("Domain")) continue;
            console.error(`[CandidateService] Error adding ${rawDomain}:`, error);
        }
    }

    return addedCount;
}
