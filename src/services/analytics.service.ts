import { prisma } from "../plugins/prisma.js";

export async function getBrandAnalytics(projectId: string) {
  const totalMentions = await prisma.mention.count({
    where: { projectId },
  });

  const sentimentBreakdown = await prisma.mention.groupBy({
    by: ["sentiment"],
    where: { projectId },
    _count: true,
  });

  const avgSentiment = await prisma.mention.aggregate({
    where: { projectId },
    _count: { sentiment: true },
  });

  return {
    totalMentions,
    sentimentBreakdown,
  };
}