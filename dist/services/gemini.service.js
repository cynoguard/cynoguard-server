/**
 * Gemini AI service for generating candidate typo/variant domains.
 * Uses structured JSON output from the Gemini API.
 */
import { GoogleGenerativeAI } from "@google/generative-ai";
import { normalizeDomain } from "../lib/domain-normalize.js";
const GEMINI_MODEL = "gemini-2.0-flash";
/**
 * Generate candidate domains using Gemini API.
 * Returns an array of raw domain strings (already validated/normalized).
 */
export async function generateGeminiCandidates(watchDomain, count, existingCandidates) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.warn("[GeminiService] GEMINI_API_KEY not set, skipping AI generation");
        return [];
    }
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });
    const prompt = buildPrompt(watchDomain, count);
    try {
        const result = await model.generateContent(prompt);
        const text = result.response.text();
        // Parse JSON from response (may be wrapped in markdown code blocks)
        const candidates = parseGeminiResponse(text);
        // Normalize, validate, and deduplicate
        const validCandidates = [];
        for (const raw of candidates) {
            try {
                const normalized = normalizeDomain(raw);
                // Skip if it's the watch domain itself or already exists
                if (normalized === watchDomain)
                    continue;
                if (existingCandidates.has(normalized))
                    continue;
                if (validCandidates.includes(normalized))
                    continue;
                validCandidates.push(normalized);
            }
            catch {
                // Skip invalid domains from Gemini
            }
        }
        return validCandidates.slice(0, count);
    }
    catch (error) {
        console.error("[GeminiService] Error generating candidates:", error);
        return [];
    }
}
function buildPrompt(watchDomain, count) {
    return `You are a cybersecurity domain monitoring assistant. Generate exactly ${count} realistic typosquatting and lookalike domain variants for the brand domain "${watchDomain}".

Include these types of variants:
- Typos (missing characters, swapped characters, doubled characters)
- Homoglyphs (o→0, l→1, i→l, rn→m)
- Added prefixes/suffixes (login, verify, support, secure, account, help, update)
- Hyphenated variants (example-login.com, my-example.com)
- Common TLD swaps (.com, .net, .org, .xyz, .top, .click, .info, .io, .co)
- Subdomain-style tricks as standalone domains

IMPORTANT: Output ONLY valid JSON in this exact format, no explanations:
{
  "candidates": [
    { "domain": "example-login.com" },
    { "domain": "examp1e.com" }
  ]
}

Generate ${count} unique domains. Each must be a plausible domain name with a valid TLD.`;
}
function parseGeminiResponse(text) {
    try {
        // Try direct JSON parse first
        const parsed = JSON.parse(text);
        if (parsed.candidates && Array.isArray(parsed.candidates)) {
            return parsed.candidates
                .map((c) => c.domain)
                .filter((d) => typeof d === "string");
        }
    }
    catch {
        // Try extracting JSON from markdown code block
        const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (jsonMatch && jsonMatch[1]) {
            try {
                const parsed = JSON.parse(jsonMatch[1].trim());
                if (parsed.candidates && Array.isArray(parsed.candidates)) {
                    return parsed.candidates
                        .map((c) => c.domain)
                        .filter((d) => typeof d === "string");
                }
            }
            catch {
                // Fall through
            }
        }
    }
    console.warn("[GeminiService] Could not parse Gemini response as JSON");
    return [];
}
