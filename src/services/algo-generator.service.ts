/**
 * Algorithmic candidate domain generator.
 * Produces typo/variant domains from a watch domain's SLD.
 */

import { getTld, getSld, normalizeDomain } from "../lib/domain-normalize.js";

// Homoglyph replacement map
const HOMOGLYPHS: Record<string, string[]> = {
    o: ["0"],
    "0": ["o"],
    l: ["1"],
    "1": ["l"],
    i: ["l"],
};

/**
 * Generate algorithmic candidate domains from a watch domain.
 * Methods: 1-char deletion, swap adjacent, homoglyph replacement.
 * Returns up to `limit` unique candidate domains.
 */
export function generateAlgoCandidates(
    watchDomain: string,
    tlds: string[],
    limit: number = 50
): string[] {
    const sld = getSld(watchDomain);
    const variants = new Set<string>();

    // 1-char deletion
    for (let i = 0; i < sld.length; i++) {
        const variant = sld.slice(0, i) + sld.slice(i + 1);
        if (variant.length > 0) variants.add(variant);
    }

    // Swap adjacent characters
    for (let i = 0; i < sld.length - 1; i++) {
        const chars = sld.split("");
        [chars[i], chars[i + 1]] = [chars[i + 1]!, chars[i]!];
        const variant = chars.join("");
        if (variant !== sld) variants.add(variant);
    }

    // Homoglyph replacements
    for (let i = 0; i < sld.length; i++) {
        const char = sld[i]!;
        const replacements = HOMOGLYPHS[char];
        if (replacements) {
            for (const rep of replacements) {
                const variant = sld.slice(0, i) + rep + sld.slice(i + 1);
                if (variant !== sld) variants.add(variant);
            }
        }
    }

    // Combine variants with TLDs
    const candidates = new Set<string>();
    const uniqueTlds = [...new Set(tlds)];

    for (const variant of variants) {
        for (const tld of uniqueTlds) {
            const candidate = `${variant}.${tld}`;
            // Skip if it matches the original watch domain
            if (candidate !== watchDomain) {
                candidates.add(candidate);
            }
            if (candidates.size >= limit) break;
        }
        if (candidates.size >= limit) break;
    }

    // Validate each generated domain (some combos might be invalid)
    const valid: string[] = [];
    for (const c of candidates) {
        try {
            normalizeDomain(c);
            valid.push(c);
        } catch {
            // Skip invalid generated domains
        }
        if (valid.length >= limit) break;
    }

    return valid;
}

/**
 * Build the list of TLDs to use for candidate generation based on watch domain config.
 */
export function buildTldList(
    watchDomain: string,
    tldAllowlist: string[],
    tldSuspicious: string[],
    strategy: string
): string[] {
    const watchTld = getTld(watchDomain);
    const tlds = new Set<string>([watchTld]);

    // Add allowlist TLDs
    for (const tld of tldAllowlist) {
        tlds.add(tld);
    }

    // For MIXED strategy, also add suspicious TLDs
    if (strategy === "MIXED" && tldSuspicious.length > 0) {
        for (const tld of tldSuspicious) {
            tlds.add(tld);
        }
    }

    return [...tlds];
}
