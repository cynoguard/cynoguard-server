import { subDays } from "date-fns";
import { prisma } from "../plugins/prisma.js";
const getRangeStart = (range) => {
    const days = range === "30d" ? 30 : range === "24h" ? 1 : 7;
    return subDays(new Date(), days);
};
// ─────────────────────────────────────────────
// OVERVIEW KPIs + CHART DATA
// ─────────────────────────────────────────────
export const getOverviewKpis = async (projectId, range) => {
    const from = getRangeStart(range);
    const prevFrom = subDays(from, from.getDate()); // previous period for delta
    const [current, previous, chartData, actionBreakdown, avgScore] = await Promise.all([
        // Current period totals
        prisma.detection.groupBy({
            by: ["action"],
            where: { projectId, createdAt: { gte: from } },
            _count: { id: true },
        }),
        // Previous period totals for delta calculation
        prisma.detection.groupBy({
            by: ["action"],
            where: { projectId, createdAt: { gte: prevFrom, lt: from } },
            _count: { id: true },
        }),
        // Time-series for area chart — group by day
        prisma.$queryRaw `
      SELECT 
        DATE_TRUNC('day', created_at) AS date,
        action,
        COUNT(*) AS count
      FROM detections
      WHERE project_id = ${projectId}
        AND created_at >= ${from}
      GROUP BY date, action
      ORDER BY date ASC
    `,
        // Action breakdown for pie chart
        prisma.detection.groupBy({
            by: ["action"],
            where: { projectId, createdAt: { gte: from } },
            _count: { id: true },
        }),
        // Avg risk score
        prisma.detection.aggregate({
            where: { projectId, createdAt: { gte: from } },
            _avg: { score: true },
        }),
    ]);
    // Flatten totals
    const totals = { total: 0, allow: 0, challenge: 0, uncertain: 0 };
    current.forEach((r) => {
        totals.total += r._count.id;
        totals[r.action] = r._count.id;
    });
    const prevTotals = { total: 0, challenge: 0 };
    previous.forEach((r) => {
        prevTotals.total += r._count.id;
        if (r.action === "challenge")
            prevTotals.challenge += r._count.id;
    });
    // Active sessions = unique sessionIds in last 24h
    const activeSessions = await prisma.detection.findMany({
        where: {
            projectId,
            createdAt: { gte: subDays(new Date(), 1) },
            sessionId: { not: null },
        },
        select: { sessionId: true },
        distinct: ["sessionId"],
    });
    // Serialize BigInt from raw query
    const normalizedChart = chartData.map((r) => ({
        date: r.date,
        action: r.action,
        count: Number(r.count),
    }));
    return {
        kpis: {
            totalRequests: {
                value: totals.total,
                delta: prevTotals.total ? Math.round(((totals.total - prevTotals.total) / prevTotals.total) * 100) : 0,
            },
            botsBlocked: {
                value: totals.challenge + totals.uncertain,
                delta: prevTotals.challenge ? Math.round((((totals.challenge - prevTotals.challenge) / prevTotals.challenge) * 100)) : 0,
            },
            avgRiskScore: {
                value: Math.round(avgScore._avg.score ?? 0),
                delta: 0, // extend later with prev period avg if needed
            },
            activeSessions: {
                value: activeSessions.length,
                delta: 0,
            },
        },
        chart: normalizedChart,
        actionBreakdown: actionBreakdown.map((r) => ({
            action: r.action,
            count: r._count.id,
        })),
    };
};
// ─────────────────────────────────────────────
// DETECTION LOGS — PAGINATED
// ─────────────────────────────────────────────
export const getDetectionLogs = async (projectId, page, limit, search, action) => {
    const skip = (page - 1) * limit;
    const where = { projectId };
    if (action)
        where.action = action;
    if (search) {
        where.OR = [
            { ipAddress: { contains: search } },
            { id: { contains: search } },
        ];
    }
    const [rows, total] = await Promise.all([
        prisma.detection.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: "desc" },
            select: {
                id: true,
                ipAddress: true,
                countryCode: true,
                city: true,
                userAgent: true,
                deviceType: true,
                isHeadless: true,
                score: true,
                riskLevel: true,
                action: true,
                isHuman: true,
                sessionId: true,
                challengeCount: true,
                challengeSolved: true,
                timeToSolve: true,
                createdAt: true,
                signals: true,
            },
        }),
        prisma.detection.count({ where }),
    ]);
    return {
        rows,
        total,
        page,
        totalPages: Math.ceil(total / limit),
    };
};
// ─────────────────────────────────────────────
// SINGLE API KEY METRICS
// ─────────────────────────────────────────────
export const getApiKeyMetrics = async (keyId, range) => {
    const from = getRangeStart(range);
    const prevFrom = subDays(from, range === "30d" ? 30 : range === "24h" ? 1 : 7);
    // First resolve projectId from the key
    const apiKey = await prisma.apiKey.findUnique({
        where: { id: keyId },
        include: { rule: true },
    });
    if (!apiKey)
        return null;
    const keyWhere = { projectId: apiKey.projectId, createdAt: { gte: from } };
    // For now detections are project-scoped, not key-scoped
    // This is correct — one project = one script tag = one API key in use at a time
    // When you add per-key detection tracking later, add apiKeyId FK to Detection
    const [current, previous, chartData, actionBreakdown, avgScore, deviceBreakdown, riskBreakdown, topIps, topCountries, challengeStats, activeSessions,] = await Promise.all([
        // Current period action totals
        prisma.detection.groupBy({
            by: ["action"],
            where: keyWhere,
            _count: { id: true },
        }),
        // Previous period for delta
        prisma.detection.groupBy({
            by: ["action"],
            where: { projectId: apiKey.projectId, createdAt: { gte: prevFrom, lt: from } },
            _count: { id: true },
        }),
        // Time series
        prisma.$queryRaw `
      SELECT
        DATE_TRUNC('day', created_at) AS date,
        action,
        COUNT(*) AS count
      FROM detections
      WHERE project_id = ${apiKey.projectId}
        AND created_at >= ${from}
      GROUP BY date, action
      ORDER BY date ASC
    `,
        // Action breakdown for pie
        prisma.detection.groupBy({
            by: ["action"],
            where: keyWhere,
            _count: { id: true },
        }),
        // Avg score
        prisma.detection.aggregate({
            where: keyWhere,
            _avg: { score: true },
        }),
        // Device type breakdown
        prisma.detection.groupBy({
            by: ["deviceType"],
            where: keyWhere,
            _count: { id: true },
        }),
        // Risk level breakdown
        prisma.detection.groupBy({
            by: ["riskLevel"],
            where: keyWhere,
            _count: { id: true },
        }),
        // Top 5 IPs by request count
        prisma.$queryRaw `
      SELECT
        ip_address AS ip,
        COUNT(*) AS count
      FROM detections
      WHERE project_id = ${apiKey.projectId}
        AND created_at >= ${from}
      GROUP BY ip_address
      ORDER BY count DESC
      LIMIT 5
    `,
        // Top 5 countries
        prisma.$queryRaw `
      SELECT
        COALESCE(country_code, 'Unknown') AS country,
        COUNT(*) AS count
      FROM detections
      WHERE project_id = ${apiKey.projectId}
        AND created_at >= ${from}
      GROUP BY country_code
      ORDER BY count DESC
      LIMIT 5
    `,
        // Challenge stats
        prisma.detection.aggregate({
            where: keyWhere,
            _sum: { challengeCount: true, timeToSolve: true },
            _count: { challengeSolved: true },
            _avg: { timeToSolve: true },
        }),
        // Active sessions last 24h
        prisma.detection.findMany({
            where: {
                projectId: apiKey.projectId,
                createdAt: { gte: subDays(new Date(), 1) },
                sessionId: { not: null },
            },
            select: { sessionId: true },
            distinct: ["sessionId"],
        }),
    ]);
    // Flatten totals
    const totals = { total: 0, allow: 0, challenge: 0, uncertain: 0 };
    current.forEach((r) => {
        totals.total += r._count.id;
        totals[r.action] = r._count.id;
    });
    const prevTotals = { total: 0, challenge: 0 };
    previous.forEach((r) => {
        prevTotals.total += r._count.id;
        if (r.action === "challenge")
            prevTotals.challenge += r._count.id;
    });
    const humanRate = totals.total > 0
        ? Math.round((totals.allow / totals.total) * 100)
        : 0;
    const challengeSolveRate = (challengeStats._sum.challengeCount ?? 0) > 0
        ? Math.round((challengeStats._count.challengeSolved / (challengeStats._sum.challengeCount ?? 1)) * 100)
        : 0;
    return {
        apiKey: {
            id: apiKey.id,
            name: apiKey.name,
            status: apiKey.status,
            lastUsedAt: apiKey.lastUsedAt,
            createdAt: apiKey.createdAt,
            rule: apiKey.rule,
        },
        kpis: {
            totalRequests: {
                value: totals.total,
                delta: prevTotals.total
                    ? Math.round(((totals.total - prevTotals.total) / prevTotals.total) * 100)
                    : 0,
            },
            botsBlocked: {
                value: totals.challenge + totals.uncertain,
                delta: prevTotals.challenge
                    ? Math.round((((totals.challenge - prevTotals.challenge) / prevTotals.challenge) * 100))
                    : 0,
            },
            humanPassRate: {
                value: humanRate,
                delta: 0,
            },
            avgRiskScore: {
                value: Math.round(avgScore._avg.score ?? 0),
                delta: 0,
            },
            activeSessions: {
                value: activeSessions.length,
                delta: 0,
            },
            avgTimeToSolve: {
                value: Math.round(challengeStats._avg.timeToSolve ?? 0),
                delta: 0,
            },
            challengeSolveRate: {
                value: challengeSolveRate,
                delta: 0,
            },
        },
        chart: chartData.map((r) => ({ date: r.date, action: r.action, count: Number(r.count) })),
        actionBreakdown: actionBreakdown.map((r) => ({ action: r.action, count: r._count.id })),
        deviceBreakdown: deviceBreakdown.map((r) => ({ device: r.deviceType, count: r._count.id })),
        riskBreakdown: riskBreakdown.map((r) => ({ risk: r.riskLevel, count: r._count.id })),
        topIps: topIps.map((r) => ({ ip: r.ip, count: Number(r.count) })),
        topCountries: topCountries.map((r) => ({ country: r.country, count: Number(r.count) })),
    };
};
export const getGeoDistribution = async (projectId, range) => {
    const from = getRangeStart(range);
    const rows = await prisma.detection.groupBy({
        by: ["countryCode"],
        where: {
            projectId,
            createdAt: { gte: from },
            countryCode: { not: null },
        },
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
    });
    return rows.map((r) => ({
        country: r.countryCode,
        count: r._count.id,
    }));
};
// ─────────────────────────────────────────────
// HELPERS — safe JSON parsing for Prisma Json fields
// ─────────────────────────────────────────────
const safeJsonArray = (raw) => {
    if (!raw)
        return [];
    if (Array.isArray(raw))
        return raw;
    if (typeof raw === "string") {
        try {
            const p = JSON.parse(raw);
            return Array.isArray(p) ? p : [];
        }
        catch {
            return [];
        }
    }
    return [];
};
const safeJsonObject = (raw) => {
    if (!raw)
        return {};
    if (typeof raw === "object" && !Array.isArray(raw))
        return raw;
    if (typeof raw === "string") {
        try {
            const p = JSON.parse(raw);
            return typeof p === "object" && !Array.isArray(p) ? p : {};
        }
        catch {
            return {};
        }
    }
    return {};
};
// ─────────────────────────────────────────────
// RULES — READ (replace existing versions)
// ─────────────────────────────────────────────
export const getProjectApiKeysWithRules = async (projectId) => {
    const keys = await prisma.apiKey.findMany({
        where: { projectId },
        include: { rule: true },
        orderBy: { createdAt: "desc" },
    });
    return keys.map(key => ({
        id: key.id,
        name: key.name,
        status: key.status,
        lastUsedAt: key.lastUsedAt,
        createdAt: key.createdAt,
        rule: key.rule ? {
            strictness: key.rule.strictness,
            persistence: key.rule.persistence,
            signals: safeJsonObject(key.rule.signals),
            whitelist: safeJsonArray(key.rule.whitelist),
        } : null,
    }));
};
export const getApiKeyRule = async (keyId) => {
    const rule = await prisma.apiKeyRule.findUnique({
        where: { apiKeyId: keyId },
        include: { apiKey: { select: { name: true, status: true } } },
    });
    if (!rule)
        return null;
    return {
        ...rule,
        signals: safeJsonObject(rule.signals),
        whitelist: safeJsonArray(rule.whitelist),
    };
};
// ─────────────────────────────────────────────
// RULES — UPSERT (replace existing version)
// ─────────────────────────────────────────────
export const upsertApiKeyRules = async (keyIds, rules) => {
    const { strictness, persistence, signals, whitelist } = rules;
    return await prisma.$transaction(keyIds.map(keyId => prisma.apiKeyRule.upsert({
        where: { apiKeyId: keyId },
        create: {
            apiKeyId: keyId,
            strictness,
            persistence,
            signals: signals,
            whitelist: whitelist,
        },
        update: {
            strictness,
            persistence,
            signals: signals,
            whitelist: whitelist,
        },
    })));
};
// ─────────────────────────────────────────────
// WHITELIST — ADD (new)
// ─────────────────────────────────────────────
export const addWhitelistEntry = async (keyIds, entry) => {
    return await prisma.$transaction(async (tx) => {
        const results = [];
        for (const keyId of keyIds) {
            const existing = await tx.apiKeyRule.findUnique({
                where: { apiKeyId: keyId },
            });
            if (!existing) {
                const created = await tx.apiKeyRule.create({
                    data: { apiKeyId: keyId, whitelist: [entry] },
                });
                results.push(created);
                continue;
            }
            const current = safeJsonArray(existing.whitelist);
            // Deduplicate
            if (current.some(e => e.value === entry.value)) {
                results.push(existing);
                continue;
            }
            const updated = await tx.apiKeyRule.update({
                where: { apiKeyId: keyId },
                data: { whitelist: [...current, entry] },
            });
            results.push(updated);
        }
        return results;
    });
};
// ─────────────────────────────────────────────
// WHITELIST — REMOVE (new)
// ─────────────────────────────────────────────
export const removeWhitelistEntry = async (keyId, entryValue) => {
    const rule = await prisma.apiKeyRule.findUnique({
        where: { apiKeyId: keyId },
    });
    if (!rule)
        return null;
    const current = safeJsonArray(rule.whitelist);
    const updated = current.filter(e => e.value !== entryValue);
    return await prisma.apiKeyRule.update({
        where: { apiKeyId: keyId },
        data: { whitelist: updated },
    });
};
