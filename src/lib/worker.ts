import { Worker } from "bullmq"
import { Redis } from "ioredis"
import { fetchXMentions } from "../services/x.service.js"
import { saveMention } from "../services/social-media-monitoring.service.js"

const connection = new Redis({
  maxRetriesPerRequest: null,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000)
    return delay
  },
  reconnectOnError: (err) => {
    const targetError = "READONLY"
    if (err.message.includes(targetError)) {
      return true
    }
    return false
  },
})

connection.on("error", (err) => {
  console.error("Redis connection error:", err.message)
})

connection.on("connect", () => {
  console.log("Redis connected successfully")
})

new Worker(
  "ingestion",
  async job => {
    const { projectId, keyword } = job.data

    
    const x = await fetchXMentions(keyword)

    const mentions = [ ...x]

    for (const mention of mentions) {
      await saveMention(projectId, mention)
    }
  },
  { connection: connection as any }
)