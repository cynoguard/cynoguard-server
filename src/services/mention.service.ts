import { prisma } from "../plugins/prisma.js";

export async function getMentionsByBrand(
  projectId: string,
  sentiment?: string
) {
  return prisma.mention.findMany({
    where: {
      projectId,
      ...(sentiment && { sentiment }),
    },
    orderBy: { createdAt: "desc" },
  });
}