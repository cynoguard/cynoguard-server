/**
 * TLD strategy evaluation and alert severity computation.
 */

import type { SuspiciousnessResult } from "../types/domain-monitoring.js";

type TldStrategyType = "SAME_TLD_ONLY" | "ALLOWLIST" | "MIXED";
type Severity = "INFO" | "WARNING" | "CRITICAL";

/**
 * Evaluate whether a candidate passes the TLD strategy check.
 */
export function evaluateTldStrategy(
    candidateTld: string,
    watchTld: string,
    strategy: TldStrategyType,
    allowlist: string[]
): boolean {
    switch (strategy) {
        case "SAME_TLD_ONLY":
            return candidateTld === watchTld;
        case "ALLOWLIST":
            return allowlist.includes(candidateTld);
        case "MIXED":
            return true; // Always passes in MIXED
        default:
            return true;
    }
}

/**
 * Compute alert severity based on TLD and similarity score.
 * Only called when the candidate is already deemed suspicious.
 */
export function computeSeverity(
    candidateTld: string,
    watchTld: string,
    tldSuspicious: string[],
    similarityScore: number,
    threshold: number
): Severity {
    const criticalThreshold = Math.min(1.0, threshold + 0.07);

    if (
        tldSuspicious.includes(candidateTld) &&
        similarityScore >= criticalThreshold
    ) {
        return "CRITICAL";
    }

    if (candidateTld !== watchTld && similarityScore >= threshold) {
        return "WARNING";
    }

    return "INFO";
}

/**
 * Determine if a candidate is suspicious based on similarity + TLD strategy.
 */
export function isSuspicious(
    similarityScore: number,
    threshold: number,
    tldPasses: boolean
): boolean {
    return similarityScore >= threshold && tldPasses;
}

/**
 * Full suspiciousness evaluation combining all rules.
 */
export function evaluateSuspiciousness(
    candidateTld: string,
    watchTld: string,
    strategy: TldStrategyType,
    allowlist: string[],
    tldSuspicious: string[],
    similarityScore: number,
    threshold: number
): SuspiciousnessResult {
    const tldPasses = evaluateTldStrategy(
        candidateTld,
        watchTld,
        strategy,
        allowlist
    );
    const suspicious = isSuspicious(similarityScore, threshold, tldPasses);

    if (!suspicious) {
        return { isSuspicious: false, severity: "INFO" };
    }

    const severity = computeSeverity(
        candidateTld,
        watchTld,
        tldSuspicious,
        similarityScore,
        threshold
    );

    return { isSuspicious: true, severity };
}
