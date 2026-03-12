import type { FastifyReply, FastifyRequest } from "fastify";
import { isInSubnet } from "is-in-subnet";
import { prisma } from "../plugins/prisma.js";

// ── Safe JSON helpers ──────────────────────────────────
const safeJsonArray = (raw: any): any[] => {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if (typeof raw === "string") {
    try { const p = JSON.parse(raw); return Array.isArray(p) ? p : []; }
    catch { return []; }
  }
  return [];
};

const safeJsonObject = (raw: any): Record<string, any> => {
  if (!raw) return {};
  if (typeof raw === "object" && !Array.isArray(raw)) return raw;
  if (typeof raw === "string") {
    try { const p = JSON.parse(raw); return typeof p === "object" && !Array.isArray(p) ? p : {}; }
    catch { return {}; }
  }
  return {};
};

type WhitelistEntry = { name: string; type: string; value: string };

// ── Whitelist matchers ─────────────────────────────────

const matchIp = (ip: string, entry: WhitelistEntry): boolean => {
  if (entry.type !== "IP Address") return false;
  return ip === entry.value;
};

const matchSubnet = (ip: string, entry: WhitelistEntry): boolean => {
  if (entry.type !== "Subnet") return false;
  try { return isInSubnet(ip, entry.value); }
  catch { return false; }
};

const matchUserAgent = (ua: string, entry: WhitelistEntry): boolean => {
  if (entry.type !== "User Agent" && entry.type !== "Search Crawler") return false;
  // Case-insensitive partial match — "Googlebot/2.1" matches "Googlebot"
  return ua.toLowerCase().includes(entry.value.toLowerCase());
};

const isWhitelisted = (
  ip:        string,
  ua:        string,
  whitelist: WhitelistEntry[]
): WhitelistEntry | null => {
  for (const entry of whitelist) {
    if (matchIp(ip, entry))        return entry;
    if (matchSubnet(ip, entry))    return entry;
    if (matchUserAgent(ua, entry)) return entry;
  }
  return null;
};

// ── Middleware ─────────────────────────────────────────

export const ruleMiddleware = async (
  request: FastifyRequest,
  reply:   FastifyReply
): Promise<void> => {

  // Default — no rule applied
  request.cyno = {
    whitelisted:   false,
    skipChallenge: false,
    rule:          null,
    matchedEntry:  null,
  };

  // apiKeyId is injected by your existing onRequest auth hook
  const apiKeyId = request.apiKeyId;
  if (!apiKeyId) return; // auth hook will reject anyway

  try {
    const ruleRow = await prisma.apiKeyRule.findUnique({
      where: { apiKeyId },
    });

    if (!ruleRow) return; // no rule configured → use defaults in handler

    const rule = {
      strictness:  ruleRow.strictness,
      persistence: ruleRow.persistence,
      signals:     safeJsonObject(ruleRow.signals),
      whitelist:   safeJsonArray(ruleRow.whitelist) as WhitelistEntry[],
    };

    request.cyno.rule = rule;

    // Extract IP and UA from request
    const ip = (
      (request.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
      request.ip ||
      ""
    );
    const ua = request.headers["user-agent"] ?? "";

    // Check whitelist
    const matchedEntry = isWhitelisted(ip, ua, rule.whitelist);

    if (matchedEntry) {
      request.cyno.whitelisted   = true;
      request.cyno.skipChallenge = true;
      request.cyno.matchedEntry  = matchedEntry;

      request.log.info(
        { ip, ua, entry: matchedEntry.name },
        "cynoguard: whitelisted entity — bypassing detection"
      );
    } else if (rule.strictness === "passive") {
      // Passive mode — log only, never challenge
      request.cyno.skipChallenge = true;
    }

  } catch (err) {
    request.log.error(err, "ruleMiddleware: failed to load rule");
    // Don't block request on middleware failure — fail open
  }
};