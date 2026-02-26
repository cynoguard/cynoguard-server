import { Queue } from "bullmq"
import { Redis } from "ioredis"

const connection = new Redis({ maxRetriesPerRequest: null })
   

export const ingestionQueue = new Queue("ingestion", {
  connection: connection as any,
})