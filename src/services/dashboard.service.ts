import { prisma } from "../plugins/prisma.js";

export const getDashboardData = async (projectId: string) => {

  // Total mentions
  const totalMentions = await prisma.mention.count({
    where: { projectId }
  });

  // Sentiment breakdown
  const sentiment = await prisma.mention.groupBy({
    by: ["sentiment"],
    where: { projectId },
    _count: true
  });

  // Platform distribution
  const platformDistribution = await prisma.mention.groupBy({
    by: ["platform"],
    where: { projectId },
    _count: true
  });

  // Mentions per day (Postgres DATE grouping)
  const mentionsPerDay = await prisma.$queryRaw`
    SELECT DATE("created_at") as date,
           COUNT(*) as count
    FROM mentions
    WHERE project_id = ${projectId}
    GROUP BY DATE("created_at")
    ORDER BY DATE("created_at") ASC;
  `;

  // Recent mentions
  const recentMentions = await prisma.mention.findMany({
    where: { projectId },
    orderBy: { createdAt: "desc" },
    take: 10
  });

  return {
    totalMentions,
    sentiment,
    platformDistribution,
    mentionsPerDay,
    recentMentions
  };
};