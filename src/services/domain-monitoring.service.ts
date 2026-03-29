
import { computeSimilarityScore } from "../lib/similarity.js";
import { buildTldList, generateAlgoCandidates } from "./algo-generator.service.js";
import { generateGeminiCandidates } from "./gemini.service.js";

// ─── Watchlist ────────────────────────────────────────────────────────────────


export async function listWatchlist(prisma:any, projectId: string) {
  return prisma.watchlistEntry.findMany({
    where:   { projectId },
    orderBy: { createdAt: "desc" },
    select: {
      id:                      true,
      officialDomainRaw:       true,
      officialDomainNormalized:true,
      label:                   true,
      active:                  true,
      intervalHours:           true,
      lastScanAt:              true,
      lastScanStatus:          true,
      nextRunAt:               true,
      suspiciousCount:         true,
      createdAt:               true,
    },
  });
}

export async function getWatchlistEntry(
  prisma:      any,
  watchlistId: string,
  projectId:   string
) {
  return prisma.watchlistEntry.findFirst({
    where: { id: watchlistId, projectId },
  });
}

export async function createWatchlistEntry(
  prisma:    any,
  projectId: string,
  data: {
    domain:               string;
    label?:               string;
    intervalHours?:       number;
    candidateCount?:      number;
    similarityThreshold?: number;
    tldStrategy?:         string;
    tldAllowlist?:        string[];
    tldSuspicious?:       string[];
  }
) {
  const normalized = data.domain.toLowerCase().trim();
  const entry = await prisma.watchlistEntry.create({
    data: {
      projectId,
      officialDomainRaw:        data.domain,
      officialDomainNormalized: normalized,
      label:                    data.label,
      intervalHours:            data.intervalHours  ?? 24,
      candidateCount:           data.candidateCount ?? 100,
      similarityThreshold:      data.similarityThreshold ?? 0.8,
      tldStrategy:              data.tldStrategy   ?? "SAME_TLD_ONLY",
      tldAllowlist:             data.tldAllowlist  ?? [],
      tldSuspicious:            data.tldSuspicious ?? [],
      nextRunAt:                new Date(),
    },
    select: {
      id: true, officialDomainRaw: true, officialDomainNormalized: true,
      label: true, active: true, intervalHours: true,
      candidateCount: true, tldStrategy: true, createdAt: true,
    },
  });

  try {
    await generateInitialCandidates(prisma, entry.id, {
      domain: entry.officialDomainNormalized,
      tldStrategy: data.tldStrategy ?? "SAME_TLD_ONLY",
      tldAllowlist: data.tldAllowlist ?? [],
      tldSuspicious: data.tldSuspicious ?? [],
      candidateCount: data.candidateCount ?? 100,
    });
  } catch (error) {
    console.error("[DomainMonitoring] Failed to generate initial candidates:", error);
  }

  return entry;
}

async function generateInitialCandidates(
  prisma: any,
  watchlistEntryId: string,
  options: {
    domain: string;
    tldStrategy: string;
    tldAllowlist: string[];
    tldSuspicious: string[];
    candidateCount: number;
  }
) {
  const maxCount = Math.min(Math.max(options.candidateCount, 1), 100);
  const tlds = buildTldList(
    options.domain,
    options.tldAllowlist,
    options.tldSuspicious,
    options.tldStrategy,
  );

  const algoDomains = generateAlgoCandidates(options.domain, tlds, 50);
  const seen = new Set<string>();
  const all: Array<{ domain: string; source: "ALGO" | "GEMINI" }> = [];

  for (const domain of algoDomains) {
    if (seen.has(domain)) continue;
    seen.add(domain);
    all.push({ domain, source: "ALGO" });
    if (all.length >= maxCount) break;
  }

  const remaining = maxCount - all.length;
  if (remaining > 0) {
    const geminiDomains = await generateGeminiCandidates(options.domain, remaining, seen);
    for (const domain of geminiDomains) {
      if (seen.has(domain)) continue;
      seen.add(domain);
      all.push({ domain, source: "GEMINI" });
      if (all.length >= maxCount) break;
    }
  }

  if (all.length === 0) return;

  await prisma.candidateDomain.createMany({
    data: all.map((item) => ({
      watchlistEntryId,
      domain: item.domain,
      tld: item.domain.split(".").pop() ?? "",
      source: item.source,
      similarityScore: computeSimilarityScore(options.domain, item.domain),
      isActive: true,
    })),
    skipDuplicates: true,
  });
}

export async function updateWatchlistEntry(
  prisma:any,
  watchlistId: string,
  projectId:   string,
  data: {
    label?:               string;
    active?:              boolean;
    intervalHours?:       number;
    similarityThreshold?: number;
  }
) {
  return prisma.watchlistEntry.updateMany({
    where: { id: watchlistId, projectId },
    data,
  });
}

export async function deleteWatchlistEntry(
  prisma:     any,
  watchlistId: string,
  projectId:   string
) {
  return prisma.watchlistEntry.deleteMany({
    where: { id: watchlistId, projectId },
  });
}

export async function triggerScan(
  prisma:any,
  watchlistId: string,
  projectId:   string
) {
  // Mark nextRunAt as now so the scheduler picks it up immediately
  const result = await prisma.watchlistEntry.updateMany({
    where: { id: watchlistId, projectId },
    data:  { nextRunAt: new Date(), lastScanStatus: "running" },
  });
  return result.count > 0;
}

// ─── Candidates ───────────────────────────────────────────────────────────────

export async function listCandidates(
  prisma:      any,
  watchlistId: string,
  projectId:   string
) {
  // Verify ownership first
  const entry = await prisma.watchlistEntry.findFirst({
    where: { id: watchlistId, projectId },
    select: { id: true },
  });
  if (!entry) return null;

  return prisma.candidateDomain.findMany({
    where:   { watchlistEntryId: watchlistId },
    orderBy: [{ similarityScore: "desc" }, { createdAt: "desc" }],
    select: {
      id: true, domain: true, source: true,
      similarityScore: true, tld: true, isActive: true,
      rdapRegistered: true, rdapCheckedAt: true,
      riskLevel: true, createdAt: true,
    },
  });
}

export async function addManualCandidates(
  prisma:      any,
  watchlistId: string,
  projectId:   string,
  domains:     string[]
) {
  const entry = await prisma.watchlistEntry.findFirst({
    where: { id: watchlistId, projectId },
    select: { id: true },
  });
  if (!entry) return null;

  const created = await prisma.candidateDomain.createMany({
    data:           domains.map((d) => ({
      watchlistEntryId: watchlistId,
      domain:           d.toLowerCase().trim(),
      source:           "MANUAL",
      similarityScore:  0,
      tld:              d.split(".").pop() ?? "",
    })),
    skipDuplicates: true,
  });

  return created.count;
}

// ─── Scan logs ────────────────────────────────────────────────────────────────

export async function listScanLogs(
  prisma:      any,
  watchlistId: string,
  projectId:   string
) {
  const entry = await prisma.watchlistEntry.findFirst({
    where: { id: watchlistId, projectId },
    select: { id: true },
  });
  if (!entry) return null;

  return prisma.domainScanLog.findMany({
    where:   { watchlistEntryId: watchlistId },
    orderBy: { scannedAt: "desc" },
    take:    50,
  });
}

export async function listFindings(
  prisma: any,
  watchlistId: string,
  projectId: string,
  options: {
    page: number;
    pageSize: number;
    sort: "similarity_desc" | "similarity_asc" | "created_desc" | "created_asc";
  },
) {
  const entry = await prisma.watchlistEntry.findFirst({
    where: { id: watchlistId, projectId },
    select: { id: true },
  });
  if (!entry) return null;

  const page = Math.max(1, options.page);
  const pageSize = Math.min(100, Math.max(1, options.pageSize));
  const skip = (page - 1) * pageSize;

  const orderBy =
    options.sort === "similarity_asc" ? [{ similarityScore: "asc" }] :
    options.sort === "created_asc" ? [{ createdAt: "asc" }] :
    options.sort === "created_desc" ? [{ createdAt: "desc" }] :
    [{ similarityScore: "desc" }, { createdAt: "desc" }];

  const [total, items] = await Promise.all([
    prisma.candidateDomain.count({ where: { watchlistEntryId: watchlistId } }),
    prisma.candidateDomain.findMany({
      where: { watchlistEntryId: watchlistId },
      orderBy,
      skip,
      take: pageSize,
      select: {
        id: true,
        domain: true,
        source: true,
        similarityScore: true,
        tld: true,
        isActive: true,
        rdapRegistered: true,
        rdapCheckedAt: true,
        riskLevel: true,
        createdAt: true,
      },
    }),
  ]);

  return {
    items,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    },
  };
}