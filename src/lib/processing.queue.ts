import { Queue } from "bullmq"
import { Redis } from "ioredis"

const connection = new Redis({ maxRetriesPerRequest: null })

export const processingQueue = new Queue("processing", {
  connection: connection as any,
})