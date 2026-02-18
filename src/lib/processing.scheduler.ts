import cron from "node-cron"
import { prisma } from "../plugins/prisma.js"
import { processingQueue } from "./processing.queue.js"

cron.schedule("*/2 * * * *", async () => {
  const unprocessed = await prisma.mention.findMany({
    where: {
      sentiment: null,
    },
    take: 50,
  })

  for (const mention of unprocessed) {
    await processingQueue.add("analyze", {
      mentionId: mention.id,
    })
  }
})