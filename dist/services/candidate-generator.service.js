/**
 * Candidate generation orchestrator.
 * Combines ALGO + Gemini generation, computes similarity, and stores candidates.
 */
import { prisma } from "../plugins/prisma.js";
import { getTld } from "../lib/domain-normalize.js";
import { computeSimilarityScore } from "../lib/similarity.js";
import { generateAlgoCandidates, buildTldList } from "./algo-generator.service.js";
import { generateGeminiCandidates } from "./gemini.service.js";
const MAX_ALGO_CANDIDATES = 50;
const DEFAULT_CANDIDATE_COUNT = 100;
/**
 * Generate and store candidates for a watch domain.
 * 1. Run ALGO generator (up to 50)
 * 2. Run Gemini for the remainder (up to candidateCount total)
 * 3. Compute similarity scores
 * 4. Store in DB
 */
export async function generateAndStoreCandidates(watchDomainId, watchDomain, tldAllowlist, tldSuspicious, tldStrategy, candidateCount = DEFAULT_CANDIDATE_COUNT) {
    // Cap at 100 for MVP
    const maxCount = Math.min(candidateCount, 100);
    // Build TLD list for algo generator
    const tlds = buildTldList(watchDomain, tldAllowlist, tldSuspicious, tldStrategy);
    // 1. Generate ALGO candidates
    const algoCandidates = generateAlgoCandidates(watchDomain, tlds, MAX_ALGO_CANDIDATES);
    // Track all candidates for deduplication
    const allCandidates = [];
    const seenDomains = new Set();
    // Process ALGO candidates
    for (const domain of algoCandidates) {
        if (seenDomains.has(domain))
            continue;
        seenDomains.add(domain);
        allCandidates.push({
            domain,
            tld: getTld(domain),
            source: "ALGO",
            similarityScore: computeSimilarityScore(watchDomain, domain),
        });
    }
    // 2. Generate Gemini candidates for remaining slots
    const remaining = maxCount - allCandidates.length;
    if (remaining > 0) {
        const geminiDomains = await generateGeminiCandidates(watchDomain, remaining, seenDomains);
        for (const domain of geminiDomains) {
            if (seenDomains.has(domain))
                continue;
            seenDomains.add(domain);
            allCandidates.push({
                domain,
                tld: getTld(domain),
                source: "GEMINI",
                similarityScore: computeSimilarityScore(watchDomain, domain),
            });
            if (allCandidates.length >= maxCount)
                break;
        }
    }
    // 3. Store in DB (skip duplicates via upsert-like logic)
    let storedCount = 0;
    for (const candidate of allCandidates) {
        try {
            await prisma.candidateDomain.create({
                data: {
                    watchDomainId,
                    domain: candidate.domain,
                    tld: candidate.tld,
                    source: candidate.source,
                    similarityScore: candidate.similarityScore,
                    isActive: true,
                },
            });
            storedCount++;
        }
        catch (error) {
            // Skip duplicates (unique constraint violation)
            if (error?.code === "P2002") {
                continue;
            }
            console.error(`[CandidateGenerator] Error storing candidate ${candidate.domain}:`, error);
        }
    }
    return storedCount;
}
