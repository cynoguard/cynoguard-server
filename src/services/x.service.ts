import { TwitterApi, type TwitterApiReadOnly } from "twitter-api-v2";
import { decrypt } from "../lib/encryption.js";

// ─── Client Cache ─────────────────────────────────────────────────
const clientCache = new Map<string, TwitterApiReadOnly>();

function getClient(encryptedToken: string): TwitterApiReadOnly {
  if (clientCache.has(encryptedToken)) {
    return clientCache.get(encryptedToken)!;
  }
  const client = new TwitterApi(decrypt(encryptedToken)).readOnly;
  clientCache.set(encryptedToken, client);
  return client;
}

// ─── Validate ─────────────────────────────────────────────────────

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export async function validateBearerToken(
  encryptedToken: string
): Promise<ValidationResult> {
  try {
    const client = getClient(encryptedToken);
    await client.v2.search("test", { max_results: 10, "tweet.fields": ["id"] });
    return { isValid: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("429")) return { isValid: true }; // rate-limited but valid
    if (msg.includes("401") || msg.includes("403") || msg.includes("Unauthorized")) {
      return { isValid: false, error: "Invalid bearer token (401/403)" };
    }
    return { isValid: false, error: msg };
  }
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
 * Default: last 50 results (as per project requirement).
 */
export async function fetchMentions(
  encryptedToken: string,
  keywords: string[],
  maxResults = 50
): Promise<FetchedTweet[]> {
  if (keywords.length === 0) return [];

  const client = getClient(encryptedToken);

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