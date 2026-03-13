import type { PrismaClient } from "@prisma/client";
import type { FastifyBaseLogger } from "fastify";
import { findMatchedKeyword, scoreContent } from "./risk-scoring.service.js";
import { fetchMentions } from "./x.service.js";

export interface ScanResult {
  projectId: string;
  mentionsFound: number;
  newMentions: number;
  highRiskCount: number;
  error?: string | null;
}

/**
 * Scans one project.
 * - Loads active keywords from DB
 * - Uses CynoGuard's shared X token (from env) to search
 * - Scores each tweet and saves to BrandMention table
 * - Writes a ScanLog record
 */
export async function scanProject(
  prisma: PrismaClient,
  projectId: string,
  logger: FastifyBaseLogger
): Promise<ScanResult> {
  logger.info({ projectId }, "[SocialMonitoring] Starting scan");

  // Load active keywords — no handler check needed anymore
  const keywordRows = await prisma.monitoringKeyword.findMany({
    where: { projectId, isActive: true },
  });

  if (keywordRows.length === 0) {
    logger.warn({ projectId }, "[SocialMonitoring] No active keywords — skipping");
    return { projectId, mentionsFound: 0, newMentions: 0, highRiskCount: 0 };
  }

  const keywords = keywordRows.map((k) => k.keyword);

  let mentionsFound = 0;
  let newMentions = 0;
  let highRiskCount = 0;
  let scanStatus: "SUCCESS" | "FAILED" | "PARTIAL" = "SUCCESS";
  let errorMessage: string | null = null;

  try {
    // Use CynoGuard's shared X token — no encrypted token from DB
    const tweets = await fetchMentions(keywords, 50);
    mentionsFound = tweets.length;

    for (const tweet of tweets) {
      const { score, level, flags, sentiment } = scoreContent(tweet.text);
      const matchedKeyword = findMatchedKeyword(tweet.text, keywords);

      const mention = await prisma.brandMention.upsert({
        where: { projectId_externalId: { projectId, externalId: tweet.id } },
        // On repeat scans — only refresh engagement counts
        update: {
          likeCount: tweet.likeCount,
          retweetCount: tweet.retweetCount,
        },
        // New mention — save everything
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
          sentiment,
          matchedKeyword,
          status: "NEW",
          publishedAt: tweet.publishedAt,
        },
      });

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

  await prisma.scanLog.create({
    data: {
      projectId,
      platform: "X",
      scanStatus,
      mentionsFound,
      highRiskCount,
      errorMessage,
    },
  });

  logger.info(
    { projectId, mentionsFound, newMentions, highRiskCount },
    "[SocialMonitoring] Scan complete"
  );

  return { projectId, mentionsFound, newMentions, highRiskCount, error: errorMessage };
}

/**
 * Scans ALL projects that have at least one active keyword.
 * Called by the cron scheduler every 6 hours.
 */
export async function scanAllProjects(
  prisma: PrismaClient,
  logger: FastifyBaseLogger
): Promise<void> {
  logger.info("[SocialMonitoring] Cron: starting all-project scan");

  // Get every project that has at least one active keyword
  // No handler check — CynoGuard's token works for everyone
  const projects = await prisma.project.findMany({
    where: {
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