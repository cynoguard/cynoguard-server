import { Worker } from "bullmq"
import { Redis } from "ioredis"
import { prisma } from "../plugins/prisma.js"
import { analyzeSentiment } from "../services/sentiment.service.js"

const connection = new Redis({ maxRetriesPerRequest: null })

new Worker(
  "processing",
  async job => {
    const { mentionId } = job.data

    const mention = await prisma.mention.findUnique({
      where: { id: mentionId },
    })

    if (!mention || mention.sentiment) return

    const sentiment = analyzeSentiment(mention.content)

    await prisma.mention.update({
      where: { id: mentionId },
      data: { sentiment },
    })
  },
  { connection: connection as any }
)