import { prisma } from "../plugins/prisma.js";
function evaluateAlert(content) {
    const lower = content.toLowerCase();
    if (lower.includes("scam") || lower.includes("fraud")) {
        return {
            type: "BRAND_RISK",
            severity: "HIGH",
            message: "Potential scam or fraud mention detected",
        };
    }
    if (lower.includes("worst") || lower.includes("hate")) {
        return {
            type: "NEGATIVE_SENTIMENT",
            severity: "MEDIUM",
            message: "Negative sentiment detected",
        };
    }
    return null;
}
export async function saveMention(projectId, mention) {
    const savedMention = await prisma.mention.upsert({
        where: {
            platform_externalId: {
                platform: "X",
                externalId: mention.externalId,
            },
        },
        update: {
            content: mention.content,
            metadata: mention.metadata,
            author: mention.author ?? null,
        },
        create: {
            projectId,
            externalId: mention.externalId,
            platform: "X",
            author: mention.author ?? null,
            content: mention.content,
            keyword: mention.keyword,
            metadata: mention.metadata,
        },
    });
    // 🔔 Evaluate alert
    const alert = evaluateAlert(mention.content);
    if (alert) {
        await prisma.alert.create({
            data: {
                projectId,
                mentionId: savedMention.id,
                type: alert.type,
                severity: alert.severity,
                message: alert.message,
            },
        });
    }
    return savedMention;
}
