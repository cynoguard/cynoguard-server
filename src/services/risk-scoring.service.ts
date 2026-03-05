export type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface RiskResult {
  score: number;
  level: RiskLevel;
  flags: string[];
}

// ─── Keyword Registry ─────────────────────────────────────────────

const CRITICAL_KEYWORDS = [
  "scam", "sc@m", "fraud", "fr@ud", "ponzi", "pyramid scheme",
  "phishing", "credential harvest", "account suspended", "verify your account",
  "confirm your identity", "click here to restore", "your account has been locked",
  "update payment info", "crypto giveaway", "bitcoin giveaway", "eth giveaway",
  "send btc", "double your crypto", "pump and dump", "rug pull",
  "guaranteed profit", "100x returns", "free bitcoin", "free eth",
  "dm for investment", "dm to invest", "dm your wallet", "seed phrase",
  "private key", "money laundering", "blackmail", "extortion",
];

const HIGH_KEYWORDS = [
  "fake account", "impersonating", "pretending to be", "not the real",
  "scammer alert", "beware of", "act now", "limited time", "expires today",
  "last chance", "urgent:", "final warning", "account will be deleted",
  "get rich quick", "easy money", "passive income guaranteed",
  "make money fast", "100% safe investment", "send me money",
  "wire transfer", "western union", "gift card",
];

const MEDIUM_KEYWORDS = [
  "hate", "worst", "terrible", "horrible", "disgusting", "awful",
  "rip off", "ripoff", "cheated", "lied", "never trust",
  "do not use", "stay away", "avoid", "data breach", "hacked account",
  "fake reviews", "paid reviews",
];

const SUSPICIOUS_LINK_PATTERNS = [
  /bit\.ly\//i, /tinyurl\.com\//i, /ow\.ly\//i,
  /rb\.gy\//i, /cutt\.ly\//i, /is\.gd\//i,
  /free.*token/i, /claim.*reward/i, /wallet.*connect/i,
];

// ─── Helpers ──────────────────────────────────────────────────────

function normalise(text: string): string {
  return text
    .toLowerCase()
    .replace(/@/g, "a").replace(/0/g, "o")
    .replace(/1/g, "i").replace(/3/g, "e")
    .replace(/\$/g, "s").replace(/5/g, "s");
}

function hasExcessiveCaps(text: string): boolean {
  const words = text.split(/\s+/).filter((w) => w.length > 3);
  if (words.length < 3) return false;
  return words.filter((w) => w === w.toUpperCase()).length / words.length > 0.5;
}

// ─── Main Export ──────────────────────────────────────────────────

export function scoreContent(text: string): RiskResult {
  const flags: string[] = [];
  let score = 0;
  const lower = text.toLowerCase();
  const norm = normalise(text);

  // Critical keywords (+35, break on first match)
  for (const kw of CRITICAL_KEYWORDS) {
    if (norm.includes(kw)) {
      score += 35;
      flags.push(`CRITICAL_KEYWORD: "${kw}"`);
      break;
    }
  }

  // High keywords (+20 each, max 2)
  const highMatches = HIGH_KEYWORDS.filter((kw) => norm.includes(kw));
  if (highMatches.length > 0) {
    score += 20 * Math.min(highMatches.length, 2);
    flags.push(`HIGH_KEYWORDS: ${highMatches.slice(0, 3).join(", ")}`);
  }

  // Medium keywords (+10 each, max 2)
  const medMatches = MEDIUM_KEYWORDS.filter((kw) => lower.includes(kw));
  if (medMatches.length > 0) {
    score += 10 * Math.min(medMatches.length, 2);
    flags.push(`MEDIUM_KEYWORDS: ${medMatches.slice(0, 3).join(", ")}`);
  }

  // Suspicious links
  const suspLinks = SUSPICIOUS_LINK_PATTERNS.filter((p) => p.test(text));
  if (suspLinks.length === 1) { score += 25; flags.push("SUSPICIOUS_LINK"); }
  else if (suspLinks.length > 1) { score += 35; flags.push("MULTIPLE_SUSPICIOUS_LINKS"); }

  // Obfuscated text (l33t speak)
  const wasObfuscated = CRITICAL_KEYWORDS.some(
    (kw) => norm.includes(kw) && !lower.includes(kw)
  );
  if (wasObfuscated) { score += 15; flags.push("OBFUSCATED_TEXT"); }

  // Excessive caps (urgency tactic)
  if (hasExcessiveCaps(text)) { score += 10; flags.push("EXCESSIVE_CAPS"); }

  score = Math.min(score, 100);

  const level: RiskLevel =
    score >= 70 ? "CRITICAL" :
    score >= 45 ? "HIGH" :
    score >= 20 ? "MEDIUM" : "LOW";

  return { score, level, flags };
}