/**
 * Levenshtein distance and similarity scoring.
 */
import { getSld } from "./domain-normalize.js";
/**
 * Compute Levenshtein edit distance between two strings.
 * Standard DP implementation.
 */
export function levenshtein(a, b) {
    const m = a.length;
    const n = b.length;
    // Create a (m+1) x (n+1) matrix
    const dp = [];
    for (let i = 0; i <= m; i++) {
        dp[i] = [i];
    }
    for (let j = 0; j <= n; j++) {
        dp[0][j] = j;
    }
    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            const cost = a[i - 1] === b[j - 1] ? 0 : 1;
            dp[i][j] = Math.min(dp[i - 1][j] + 1, // deletion
            dp[i][j - 1] + 1, // insertion
            dp[i - 1][j - 1] + cost // substitution
            );
        }
    }
    return dp[m][n];
}
/**
 * Compute normalized similarity score between two domains.
 * Compares SLD only: `example.com` vs `examp1e.net` → compare `example` vs `examp1e`
 * Returns a value in [0, 1] where 1 = identical.
 */
export function computeSimilarityScore(watchDomain, candidateDomain) {
    const a = getSld(watchDomain);
    const b = getSld(candidateDomain);
    const maxLen = Math.max(a.length, b.length);
    if (maxLen === 0)
        return 0;
    const dist = levenshtein(a, b);
    return 1 - dist / maxLen;
}
