import Snoowrap from "snoowrap"
import type { NormalizedMention } from "../types/social-media-monitoring.js"

const reddit = new Snoowrap({
  userAgent: process.env.REDDIT_USER_AGENT!,
  clientId: process.env.REDDIT_CLIENT_ID!,
  clientSecret: process.env.REDDIT_CLIENT_SECRET!,
  refreshToken: process.env.REDDIT_REFRESH_TOKEN!,
})

export async function fetchRedditMentions(keyword: string): Promise<NormalizedMention[]> {
  const results = await reddit.search({
    query: keyword,
    sort: "new",
    limit: 20,
  })

  return results.map(post => ({
    externalId: post.id,
    platform: "REDDIT",
    author: post.author?.name,
    content: post.title + " " + post.selftext,
    keyword,
    metadata: post,
  }))
}