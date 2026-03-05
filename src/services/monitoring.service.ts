import type { PrismaClient } from "@prisma/client";
import type { FastifyBaseLogger } from "fastify";
import { fetchMentions } from "./x.service.js";
import { scoreContent } from "./risk-scoring.service.js";

export interface ScanResult {
  projectId: string;
  mentionsFound: number;
  newMentions: number;
  highRiskCount: number;
  error?: string | null;
}

/**
 * Runs a full brand-mention scan for one project.
 * Accepts prisma as a parameter so it uses the existing
 * decorated fastify.prisma instance — no second connection opened.
 */
export async function scanProject(
  prisma: PrismaClient,
  projectId: string,
  logger: FastifyBaseLogger
): Promise<ScanResult> {
  logger.info({ projectId }, "[SocialMonitoring] Starting scan");

  // 1. Load the X handler
  const handler = await prisma.socialHandler.findUnique({
    where: { projectId_platform: { projectId, platform: "X" } },
  });

  if (!handler?.isValid) {
    logger.warn({ projectId }, "[SocialMonitoring] No valid X handler — skipping");
    return { projectId, mentionsFound: 0, newMentions: 0, highRiskCount: 0 };
  }

  // 2. Load active keywords
  const keywordRows = await prisma.monitoringKeyword.findMany({
    where: { projectId, isActive: true },
  });

  if (keywordRows.length === 0) {
    logger.warn({ projectId }, "[SocialMonitoring] No active keywords — skipping");
    return { projectId, mentionsFound: 0, newMentions: 0, highRiskCount: 0 };
  }

  let mentionsFound = 0;
  let newMentions = 0;
  let highRiskCount = 0;
  let scanStatus: "SUCCESS" | "FAILED" | "PARTIAL" = "SUCCESS";
  let errorMessage: string | null = null;

  try {
    // 3. Fetch last 50 tweets (requirement: last 50 feeds per scan)
    const tweets = await fetchMentions(
      handler.bearerTokenEncrypted,
      keywordRows.map((k) => k.keyword),
      50
    );
    mentionsFound = tweets.length;

    // 4. Score and upsert each tweet
    for (const tweet of tweets) {
      const { score, level, flags } = scoreContent(tweet.text);

      const mention = await prisma.brandMention.upsert({
        where: { projectId_externalId: { projectId, externalId: tweet.id } },
        update: { likeCount: tweet.likeCount, retweetCount: tweet.retweetCount },
        create: {
          projectId,
          platform: "X",
          externalId: tweet.id,
          content: tweet.text,
          authorUsername: tweet.authorUsername,
          authorId: tweet.authorId,
          tweetUrl: tweet.url,
          likeCount: tweet.likeCount,
          retweetCount: tweet.retweetCount,
          riskScore: score,
          riskLevel: level,
          riskFlags: flags,
          status: "NEW",
          publishedAt: tweet.publishedAt,
        },
      });

      // Newly created records have identical createdAt/updatedAt
      if (mention.createdAt.getTime() === mention.updatedAt.getTime()) {
        newMentions++;
      }
      if (level === "HIGH" || level === "CRITICAL") highRiskCount++;
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error({ projectId, err: msg }, "[SocialMonitoring] Scan failed");
    scanStatus = "FAILED";
    errorMessage = msg;
  }

  // 5. Write scan audit log
  await prisma.scanLog.create({
    data: { projectId, platform: "X", scanStatus, mentionsFound, highRiskCount, errorMessage },
  });

  logger.info({ projectId, mentionsFound, newMentions, highRiskCount }, "[SocialMonitoring] Scan complete");
  return { projectId, mentionsFound, newMentions, highRiskCount, error: errorMessage };
}

/**
 * Scans all projects that have a valid X handler + active keywords.
 * Called by the 6-hour cron job.
 */
export async function scanAllProjects(
  prisma: PrismaClient,
  logger: FastifyBaseLogger
): Promise<void> {
  logger.info("[SocialMonitoring] Cron: starting all-project scan");

  const projects = await prisma.project.findMany({
    where: {
      socialHandlers: { some: { isValid: true, platform: "X" } },
      keywords: { some: { isActive: true } },
    },
    select: { id: true },
  });

  logger.info({ count: projects.length }, "[SocialMonitoring] Projects to scan");

  for (const project of projects) {
    await scanProject(prisma, project.id, logger);
  }

  logger.info("[SocialMonitoring] Cron: all scans complete");
}