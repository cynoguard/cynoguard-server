import { PrismaClient } from "@prisma/client"
import type{ NormalizedMention } from "../types/social-media-monitoring.js"

const prisma = new PrismaClient()

export async function saveMention(
  projectId: string,
  mention: NormalizedMention
) {
  await prisma.mention.upsert({
    where: {
      platform_externalId: {
        platform: mention.platform,
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
      platform: mention.platform,
      author: mention.author ?? null,
      content: mention.content,
      keyword: mention.keyword,
      metadata: mention.metadata,
    },
  })
}