import { TwitterApi, type TwitterApiReadOnly } from "twitter-api-v2";


// ─── Singleton Client ─────────────────────────────────────────────
// CynoGuard owns one X API token shared across all projects.
// Token is loaded from env at startup — never stored in DB.

let _client: TwitterApiReadOnly | null = null;

function getClient(): TwitterApiReadOnly {
  if (_client) return _client;

  const token = process.env.X_BEARER_TOKEN;
  if (!token) {
    throw new Error(
      "X_BEARER_TOKEN is not set in environment variables. " +
      "Add it to your .env file."
    );
  }

  _client = new TwitterApi(token).readOnly;
  return _client;
}

// ─── Fetch Mentions ───────────────────────────────────────────────

export interface FetchedTweet {
  id: string;
  text: string;
  authorId: string;
  authorUsername: string;
  likeCount: number;
  retweetCount: number;
  publishedAt: Date | null;
  url: string;
}

/**
 * Fetches the most recent tweets mentioning any of the given keywords.
 * Uses CynoGuard's shared X bearer token from env.
 * Default: last 50 results per scan.
 */
export async function fetchMentions(
  keywords: string[],
  maxResults = 50
): Promise<FetchedTweet[]> {
  if (keywords.length === 0) return [];

  const client = getClient();

  // Build X search query: ("kw1" OR "kw2") -is:retweet -is:reply lang:en
  const queryParts = keywords.map((k) => `"${k}"`).join(" OR ");
  const query = `(${queryParts}) -is:retweet -is:reply lang:en`;

  // X API v2 clamps between 10–100
  const count = Math.min(Math.max(maxResults, 10), 100);

  const response = await client.v2.search(query, {
    max_results: count,
    "tweet.fields": ["id", "text", "author_id", "created_at", "public_metrics"],
    expansions: ["author_id"],
    "user.fields": ["username"],
  });

  const userMap = new Map(
    (response.includes?.users ?? []).map((u) => [u.id, u.username])
  );

  return (response.data.data ?? []).map((tweet) => {
    const username = userMap.get(tweet.author_id ?? "") ?? "unknown";
    return {
      id: tweet.id,
      text: tweet.text,
      authorId: tweet.author_id ?? "",
      authorUsername: username,
      likeCount: tweet.public_metrics?.like_count ?? 0,
      retweetCount: tweet.public_metrics?.retweet_count ?? 0,
      publishedAt: tweet.created_at ? new Date(tweet.created_at) : null,
      url: `https://twitter.com/${username}/status/${tweet.id}`,
    };
  });
}