// src/modules/social-monitoring/social-monitoring.service.ts
// Everything the monitoring engine needs:
//   1. X API client (singleton, env token)
//   2. Risk scoring + sentiment heuristics
//   3. scanProject  — scans one project, upserts mentions, writes scan log
//   4. scanAllProjects — called by the cron scheduler

import type { PrismaClient } from "@prisma/client";
import type { FastifyBaseLogger } from "fastify";
import { TwitterApi, type TwitterApiReadOnly } from "twitter-api-v2";

// ─── X Client ─────────────────────────────────────────────────────────────────
// CynoGuard owns one shared bearer token. Never stored in DB.

let _xClient: TwitterApiReadOnly | null = null;

function getXClient(): TwitterApiReadOnly {
  if (_xClient) return _xClient;
  const token = process.env.X_BEARER_TOKEN;
  if (!token) throw new Error("X_BEARER_TOKEN is not set. Add it to your .env file.");
  _xClient = new TwitterApi(token).readOnly;
  return _xClient;
}

// ─── X Fetch ──────────────────────────────────────────────────────────────────

interface FetchedTweet {
  id:             string;
  text:           string;
  authorId:       string;
  authorUsername: string;
  likeCount:      number;
  retweetCount:   number;
  publishedAt:    Date | null;
  url:            string;
}

async function fetchTweets(keywords: string[], maxResults = 50): Promise<FetchedTweet[]> {
  if (keywords.length === 0) return [];

  const client = getXClient();
  const query  = `(${keywords.map((k) => `"${k}"`).join(" OR ")}) -is:retweet -is:reply lang:en`;
  const count  = Math.min(Math.max(maxResults, 10), 100);

  const response = await client.v2.search(query, {
    max_results:   count,
    "tweet.fields": ["id", "text", "author_id", "created_at", "public_metrics"],
    expansions:    ["author_id"],
    "user.fields": ["username"],
  });

  const userMap = new Map((response.includes?.users ?? []).map((u) => [u.id, u.username]));

  return (response.data.data ?? []).map((tweet) => {
    const username = userMap.get(tweet.author_id ?? "") ?? "unknown";
    return {
      id:             tweet.id,
      text:           tweet.text,
      authorId:       tweet.author_id ?? "",
      authorUsername: username,
      likeCount:      tweet.public_metrics?.like_count ?? 0,
      retweetCount:   tweet.public_metrics?.retweet_count ?? 0,
      publishedAt:    tweet.created_at ? new Date(tweet.created_at) : null,
      url:            `https://twitter.com/${username}/status/${tweet.id}`,
    };
  });
}

// ─── Risk Scoring ─────────────────────────────────────────────────────────────

const PHISHING_SIGNALS = [
  "free", "click here", "verify", "urgent", "account suspended",
  "limited time", "winner", "claim", "password", "login",
];

function scoreRisk(text: string): { score: number; flags: string[] } {
  const lower = text.toLowerCase();
  const flags: string[] = [];
  let score = 0;

  for (const signal of PHISHING_SIGNALS) {
    if (lower.includes(signal)) { flags.push(signal); score += 20; }
  }
  if (/https?:\/\/\S+/i.test(text)) { flags.push("contains_url");    score += 10; }
  if (/@\w{1,3}\b/.test(text))      { flags.push("short_username");   score += 10; }

  return { score: Math.min(score, 100), flags };
}

function toRiskLevel(score: number): "LOW" | "MEDIUM" | "HIGH" {
  if (score >= 60) return "HIGH";
  if (score >= 30) return "MEDIUM";
  return "LOW";
}

// ─── Sentiment ────────────────────────────────────────────────────────────────

const POSITIVE_WORDS = ["great", "love", "good", "amazing", "best", "excellent", "trusted"];
const NEGATIVE_WORDS = ["scam", "fake", "fraud", "phishing", "spam", "stolen", "hack", "warning"];

function detectSentiment(text: string): "POSITIVE" | "NEGATIVE" | "NEUTRAL" {
  const lower = text.toLowerCase();
  const pos   = POSITIVE_WORDS.filter((w) => lower.includes(w)).length;
  const neg   = NEGATIVE_WORDS.filter((w) => lower.includes(w)).length;
  if (neg > pos) return "NEGATIVE";
  if (pos > neg) return "POSITIVE";
  return "NEUTRAL";
}

function matchKeyword(text: string, keywords: string[]): string | null {
  const lower = text.toLowerCase();
  return keywords.find((k) => lower.includes(k.toLowerCase())) ?? null;
}

// ─── Scan ─────────────────────────────────────────────────────────────────────

export interface ScanResult {
  mentionsFound: number;
  highRiskCount: number;
  newMentions:   number;
}

export async function scanProject(
  prisma:    PrismaClient,
  projectId: string,
  logger:    FastifyBaseLogger
): Promise<ScanResult> {
  const activeKeywords = await prisma.monitoringKeyword.findMany({
    where:  { projectId, isActive: true },
    select: { keyword: true },
  });

  if (activeKeywords.length === 0) {
    logger.info({ projectId }, "[SocialMonitoring] No active keywords — skipping");
    return { mentionsFound: 0, highRiskCount: 0, newMentions: 0 };
  }

  const keywords = activeKeywords.map((k) => k.keyword);
  let mentionsFound = 0, highRiskCount = 0, newMentions = 0;
  let scanStatus: "SUCCESS" | "FAILED" | "PARTIAL" = "SUCCESS";
  let errorMessage: string | null = null;

  try {
    const tweets = await fetchTweets(keywords);
    mentionsFound = tweets.length;

    for (const tweet of tweets) {
      const { score, flags } = scoreRisk(tweet.text);
      const riskLevel        = toRiskLevel(score);
      const sentiment        = detectSentiment(tweet.text);
      const matchedKeyword   = matchKeyword(tweet.text, keywords);

      if (riskLevel === "HIGH") highRiskCount++;

      const saved = await prisma.brandMention.upsert({
        where:  { projectId_externalId: { projectId, externalId: tweet.id } },
        update: { likeCount: tweet.likeCount, retweetCount: tweet.retweetCount, riskScore: score, riskLevel, riskFlags: flags, sentiment, matchedKeyword },
        create: {
          projectId, externalId: tweet.id, platform: "X",
          content: tweet.text, authorUsername: tweet.authorUsername, authorId: tweet.authorId,
          tweetUrl: tweet.url, likeCount: tweet.likeCount, retweetCount: tweet.retweetCount,
          riskScore: score, riskLevel, riskFlags: flags, sentiment, matchedKeyword,
          publishedAt: tweet.publishedAt, status: "NEW",
        },
        select: { status: true },
      });

      if (saved.status === "NEW") newMentions++;
    }
  } catch (err) {
    scanStatus   = "FAILED";
    errorMessage = err instanceof Error ? err.message : "Unknown error";
    logger.error({ err, projectId }, "[SocialMonitoring] Scan failed");
  }

  await prisma.scanLog.create({
    data: { projectId, scanStatus, mentionsFound, highRiskCount, errorMessage },
  });

  logger.info({ projectId, mentionsFound, highRiskCount, newMentions }, "[SocialMonitoring] Scan complete");
  return { mentionsFound, highRiskCount, newMentions };
}

export async function scanAllProjects(prisma: PrismaClient, logger: FastifyBaseLogger): Promise<void> {
  const rows = await prisma.monitoringKeyword.findMany({
    where:    { isActive: true },
    select:   { projectId: true },
    distinct: ["projectId"],
  });

  logger.info(`[SocialMonitoring] Scanning ${rows.length} project(s)`);

  for (const { projectId } of rows) {
    await scanProject(prisma, projectId, logger).catch((err) =>
      logger.error({ err, projectId }, "[SocialMonitoring] Project scan failed")
    );
  }
}