/**
 * RDAP provider — checks domain registration status via RDAP protocol.
 * Uses p-limit for concurrency control.
 */
const RDAP_TIMEOUT_MS = 8000;
const CONCURRENCY_LIMIT = 5;
// Simple semaphore using p-limit (ESM dynamic import)
let limiterInstance = null;
async function getLimiter() {
    if (!limiterInstance) {
        const pLimit = (await import("p-limit")).default;
        limiterInstance = pLimit(CONCURRENCY_LIMIT);
    }
    return limiterInstance;
}
function getRdapBaseUrl() {
    return process.env.RDAP_BASE_URL || "https://rdap.org/domain/";
}
/**
 * Look up a domain's registration status via RDAP.
 * - 200 → registered=true, parse status array
 * - 404 → registered=false
 * - any error/timeout → registered=null
 */
export async function rdapLookup(domain) {
    const limiter = await getLimiter();
    return limiter(async () => {
        const url = `${getRdapBaseUrl()}${domain}`;
        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), RDAP_TIMEOUT_MS);
            const response = await fetch(url, {
                signal: controller.signal,
                headers: { Accept: "application/rdap+json" },
            });
            clearTimeout(timeout);
            if (response.status === 200) {
                const data = await response.json();
                const status = Array.isArray(data.status) ? data.status : [];
                return {
                    registered: true,
                    status,
                    raw: data,
                };
            }
            if (response.status === 404) {
                return { registered: false };
            }
            // Other status codes
            return { registered: null };
        }
        catch (error) {
            // Timeout, network error, etc.
            return { registered: null };
        }
    });
}
