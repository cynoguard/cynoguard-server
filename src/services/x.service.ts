import { TwitterApi } from "twitter-api-v2"
import type{ NormalizedMention } from "../types/social-media-monitoring.js"

const client = new TwitterApi(process.env.X_BEARER_TOKEN!)

export async function fetchXMentions(
  keyword: string
): Promise<NormalizedMention[]> {
  const response = await client.v2.search(keyword, {
    max_results: 20,
  })

  if (!response.data?.data) return []

  return response.data.data.map(tweet => ({
    externalId: tweet.id,
    platform: "X",
    content: tweet.text,
    keyword,
    metadata: tweet,
  }))
}