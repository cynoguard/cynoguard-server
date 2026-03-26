import geoip from "geoip-lite";
import { UAParser } from "ua-parser-js";
import { prisma } from "../plugins/prisma.js";
// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────
const resolveGeo = (ip) => {
    // geoip-lite returns null for localhost / private IPs
    const geo = geoip.lookup(ip);
    return {
        countryCode: geo?.country ?? null,
        city: geo?.city ?? null,
    };
};
const resolveDeviceType = (ua) => {
    const parser = new UAParser(ua);
    const device = parser.getDevice();
    if (!device.type)
        return "DESKTOP"; // UAParser returns undefined for desktop
    if (device.type === "mobile")
        return "MOBILE";
    if (device.type === "tablet")
        return "TABLET";
    // catch common bot UAs
    if (/bot|crawl|spider|slurp|mediapartners/i.test(ua))
        return "BOT";
    return "UNKNOWN";
};
const resolveRiskLevel = (score) => {
    if (score < 30)
        return "HIGH";
    if (score < 71)
        return "MEDIUM";
    return "LOW";
};
// ─────────────────────────────────────────────
// CHALLENGE BANK
// ─────────────────────────────────────────────
export const getBotChallenge = async () => {
    const count = await prisma.challengeBank.count({ where: { isActive: true } });
    if (count === 0)
        return null;
    let randomCount = Math.floor(Math.random() * count);
    return await prisma.challengeBank.findFirst({
        skip: randomCount,
        where: { isActive: true },
    });
};
// ─────────────────────────────────────────────
// DETECTION WRITE — called via onResponse hook
// Populates all flat derived columns at write time
// so dashboard queries never have to unpack JSON
// ─────────────────────────────────────────────
export const updateSessionData = async (signals) => {
    const ua = signals.signals?.ua ?? "";
    const ip = signals.ipAddress ?? "";
    const { countryCode, city } = resolveGeo(ip);
    const deviceType = resolveDeviceType(ua);
    const riskLevel = resolveRiskLevel(signals.score);
    return await prisma.detection.create({
        data: {
            id: signals.id,
            projectId: signals.projectId,
            sessionId: signals.signals?.sessionId ?? null, // client sends cg_sid cookie value
            ipAddress: ip,
            countryCode,
            city,
            userAgent: ua,
            deviceType,
            isHeadless: signals.signals?.isHeadless ?? false,
            score: signals.score,
            riskLevel,
            action: signals.action,
            isHuman: signals.isHuman,
            challengeCount: signals.challengeHistory?.filter(Boolean).length ?? 0,
            challengeSolved: false, // updated later via updateStats
            timeToSolve: 0,
            signals: signals.signals,
        },
    });
};
// ─────────────────────────────────────────────
// CHALLENGE ATTEMPT — write timeline entry
// + update denormalized summary on Detection
// ─────────────────────────────────────────────
export const updateStats = async (challengeId, isChallengeSuccess, detectionId, timeToSolve) => {
    const now = new Date();
    return await prisma.$transaction(async (tx) => {
        // 1. Write the ChallengeAttempt timeline entry
        await tx.challengeAttempt.create({
            data: {
                detectionId,
                challengeId,
                answeredAt: now,
                success: isChallengeSuccess,
                timeToSolve: timeToSolve ?? null,
            },
        });
        // 2. Update ChallengeBank success/fail counters
        if (isChallengeSuccess) {
            await tx.challengeBank.update({
                where: { id: challengeId },
                data: { successCount: { increment: 1 } },
            });
        }
        else {
            await tx.challengeBank.update({
                where: { id: challengeId },
                data: { failCount: { increment: 1 } },
            });
        }
        // 3. Update denormalized summary columns on Detection
        // challengeCount increments on every attempt
        // challengeSolved + isHuman only flip true on success
        await tx.detection.update({
            where: { id: detectionId },
            data: {
                challengeCount: { increment: 1 },
                ...(isChallengeSuccess && {
                    challengeSolved: true,
                    isHuman: true,
                    timeToSolve: timeToSolve ?? 0,
                }),
            },
        });
    });
};
// ─────────────────────────────────────────────
// RETAKE — update Detection with new challenge attempt ref
// ─────────────────────────────────────────────
export const updateDetectionData = async (signals) => {
    // Write the new issued challenge as an attempt with no answeredAt yet
    return await prisma.challengeAttempt.create({
        data: {
            detectionId: signals.detectionId,
            challengeId: signals.challengeId,
            success: false,
            // answeredAt left null — will be updated when they answer
        },
    });
};
// ─────────────────────────────────────────────
// API KEY LOOKUP
// ─────────────────────────────────────────────
export const getApiKeyWithHashKey = async (hashedKey) => {
    return await prisma.apiKey.findFirst({
        where: { keyHash: hashedKey },
    });
};
