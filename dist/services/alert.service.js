/**
 * Alert service — create, list, and mark-read operations.
 * Includes 24-hour deduplication logic.
 */
import { prisma } from "../plugins/prisma.js";
import { getSocketIo } from "../plugins/websocket.js";
const ALERT_DEDUPE_HOURS = 24;
/**
 * Create an alert with 24-hour deduplication.
 * Returns the alert if created, null if deduplicated.
 */
export async function createAlert(input) {
    // Check for existing alert within the dedupe window
    const dedupeWindowStart = new Date(Date.now() - ALERT_DEDUPE_HOURS * 60 * 60 * 1000);
    const existing = await prisma.alert.findFirst({
        where: {
            watchDomainId: input.watchDomainId,
            candidateDomainId: input.candidateDomainId,
            type: "SUSPICIOUS_DOMAIN",
            createdAt: { gte: dedupeWindowStart },
        },
    });
    if (existing) {
        return null; // Deduplicated — skip
    }
    // Create alert
    const alert = await prisma.alert.create({
        data: {
            tenantId: input.tenantId,
            userId: input.userId,
            watchDomainId: input.watchDomainId,
            candidateDomainId: input.candidateDomainId,
            type: "SUSPICIOUS_DOMAIN",
            severity: input.severity,
            message: input.message,
            isRead: false,
        },
    });
    // Emit WebSocket event
    try {
        const io = getSocketIo();
        if (io) {
            io.of("/ws")
                .to(`user:${input.userId}`)
                .emit("domain.alert.created", {
                alertId: alert.id,
                watchDomainId: input.watchDomainId,
                watchDomain: input.watchDomain,
                candidateDomain: input.candidateDomain,
                similarityScore: input.similarityScore,
                tld: input.tld,
                severity: alert.severity,
                createdAt: alert.createdAt.toISOString(),
            });
        }
    }
    catch (error) {
        console.error("[AlertService] WebSocket emit error:", error);
    }
    return alert;
}
/**
 * List alerts for a user, with optional filters.
 */
export async function listAlerts(tenantId, userId, filters) {
    const where = { tenantId, userId };
    if (filters.unread !== undefined) {
        where.isRead = !filters.unread;
    }
    if (filters.watchDomainId) {
        where.watchDomainId = filters.watchDomainId;
    }
    const alerts = await prisma.alert.findMany({
        where,
        include: {
            candidateDomain: { select: { domain: true } },
        },
        orderBy: { createdAt: "desc" },
    });
    return {
        items: alerts.map((a) => ({
            id: a.id,
            watchDomainId: a.watchDomainId,
            candidateDomainId: a.candidateDomainId,
            candidateDomain: a.candidateDomain.domain,
            severity: a.severity,
            message: a.message,
            isRead: a.isRead,
            createdAt: a.createdAt.toISOString(),
        })),
    };
}
/**
 * Mark an alert as read. Scoped by tenantId for security.
 */
export async function markAlertRead(alertId, tenantId) {
    const alert = await prisma.alert.findFirst({
        where: { id: alertId, tenantId },
    });
    if (!alert) {
        throw new Error("Alert not found or access denied");
    }
    await prisma.alert.update({
        where: { id: alertId },
        data: { isRead: true },
    });
    return { ok: true };
}
