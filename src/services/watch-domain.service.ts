/**
 * Watch Domain service — CRUD operations for watch domains.
 */

import { prisma } from "../plugins/prisma.js";
import { normalizeDomain } from "../lib/domain-normalize.js";
import { generateAndStoreCandidates } from "./candidate-generator.service.js";
import type { TldStrategy, WatchDomainStatus } from "@prisma/client";

interface CreateWatchDomainInput {
    domain: string;
    label?: string;
    candidateCount?: number;
    tldStrategy?: TldStrategy;
    tldAllowlist?: string[];
    tldSuspicious?: string[];
    similarityThreshold?: number;
}

/**
 * Create a new watch domain, normalize it, store it, and trigger candidate generation.
 */
export async function createWatchDomain(
    tenantId: string,
    userId: string,
    input: CreateWatchDomainInput
) {
    // Normalize and validate the domain
    const domain = normalizeDomain(input.domain);

    // Create the watch domain
    const watchDomain = await prisma.watchDomain.create({
        data: {
            tenantId,
            userId,
            domain,
            label: input.label ?? null,
            status: "ACTIVE",
            tldStrategy: input.tldStrategy ?? "MIXED",
            tldAllowlist: input.tldAllowlist ?? [],
            tldSuspicious: input.tldSuspicious ?? [],
            similarityThreshold: input.similarityThreshold ?? null,
        },
    });

    // Trigger candidate generation (async — don't block the response)
    const candidateCount = Math.min(input.candidateCount ?? 100, 100);

    // We'll await this since the user expects candidates to be generated
    const storedCount = await generateAndStoreCandidates(
        watchDomain.id,
        domain,
        watchDomain.tldAllowlist,
        watchDomain.tldSuspicious,
        watchDomain.tldStrategy,
        candidateCount
    );

    return {
        watchDomain: {
            id: watchDomain.id,
            domain: watchDomain.domain,
            label: watchDomain.label,
            status: watchDomain.status,
            tldStrategy: watchDomain.tldStrategy,
            candidateCount: storedCount,
        },
    };
}

/**
 * List all watch domains for a tenant, with candidate count and unread alert count.
 */
export async function listWatchDomains(tenantId: string) {
    const watchDomains = await prisma.watchDomain.findMany({
        where: { tenantId },
        include: {
            _count: {
                select: {
                    candidates: true,
                    alerts: {
                        where: { isRead: false },
                    },
                },
            },
        },
        orderBy: { createdAt: "desc" },
    });

    return watchDomains.map((wd: any) => ({
        id: wd.id,
        domain: wd.domain,
        label: wd.label,
        status: wd.status,
        tldStrategy: wd.tldStrategy,
        candidateCount: wd._count.candidates,
        unreadAlerts: wd._count.alerts,
        createdAt: wd.createdAt,
    }));
}
