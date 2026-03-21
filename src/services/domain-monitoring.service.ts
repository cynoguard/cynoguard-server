
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

  return prisma.watchlistEntry.create({
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