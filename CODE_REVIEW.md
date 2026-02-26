# Code Review: Social Media Monitoring Feature

**Date:** February 26, 2026  
**Branch:** `feature/social-media-monitoring`  
**Reviewer:** GitHub Copilot  
**Priority:** HIGH ⚠️

---

## 📋 Executive Summary

The social-media-monitoring feature is **partially implemented** but has several **critical gaps** between the intended functionality and actual implementation. While the foundation is solid, there are significant issues that prevent the feature from meeting the core requirements.

### Requirement Alignment: ❌ INCOMPLETE

**Core Requirement:**
1. ✅ Setup social media (X/Twitter) handler
2. ❌ Check if handler is valid
3. ❌ Every 6 hours via cron job check last 50 feeds
4. ❌ Detect bad/scammy content

---

## 🐛 Critical Issues Found

### 1. **Missing Social Media Handler Setup API** ❌ CRITICAL

**File:** N/A (Feature Missing)  
**Severity:** CRITICAL

**Issue:** There is **no API endpoint to setup/configure** the X/Twitter handler with credentials and validation.

**Current State:**
- X client is hardcoded with a global bearer token: `new TwitterApi(process.env.X_BEARER_TOKEN!)`
- No per-project or per-user configuration
- No way to validate the handler credentials

**Required Implementation:**
```typescript
// Missing: POST /projects/:projectId/social-media/setup
// Should:
// 1. Accept X API credentials (Bearer token)
// 2. Validate credentials by testing API call
// 3. Store encrypted credentials per project
// 4. Return validation result
```

**Action Items:**
- [ ] Create `POST /projects/:projectId/social-media/setup` endpoint
- [ ] Create `social-media.handler.service.ts` to manage credentials
- [ ] Add credential validation logic
- [ ] Store API keys securely in database (encrypted or use Firebase Secret Manager)
- [ ] Add request schema validation with `@sinclair/typebox`

---

### 2. **Wrong Cron Job Schedule** ❌ CRITICAL

**File:** [src/lib/processing.scheduler.ts](src/lib/processing.scheduler.ts#L5)  
**Severity:** CRITICAL

**Issue:** Cron job runs every **2 minutes** instead of every **6 hours**

```typescript
// ❌ WRONG - Runs every 2 minutes
cron.schedule("*/2 * * * *", async () => {
```

**Should be:**
```typescript
// ✅ CORRECT - Runs every 6 hours
cron.schedule("0 */6 * * *", async () => {
```

**Impact:**
- API rate limits will be exceeded
- Unnecessary database load every 2 minutes
- High AWS costs from constant API calls
- Does not meet the 6-hour requirement

**Action Items:**
- [ ] Change cron schedule from `*/2 * * * *` to `0 */6 * * *`

---

### 3. **Fetch Limit Mismatch** ❌ MAJOR

**File:** [src/services/x.service.ts](src/services/x.service.ts#L10-L12)  
**Severity:** MAJOR

**Issue:** Fetches only **20 tweets** instead of **50**

```typescript
export async function fetchXMentions(
  keyword: string
): Promise<NormalizedMention[]> {
  const response = await client.v2.search(keyword, {
    max_results: 20,  // ❌ Should be 50
  })
```

**Action Items:**
- [ ] Change `max_results` from 20 to 50
- [ ] Add pagination support for large result sets

---

### 4. **Insufficient Content Moderation** ❌ MAJOR

**File:** [src/services/social-media-monitoring.service.ts](src/services/social-media-monitoring.service.ts#L4-L25)  
**Severity:** MAJOR

**Issue:** Alert detection uses only **4 hardcoded keywords** which is insufficient for "bad/scammy content" detection

```typescript
function evaluateAlert(content: string) {
  const lower = content.toLowerCase()

  // ❌ Only checks for 4 keywords
  if (lower.includes("scam") || lower.includes("fraud")) {
    return { type: "BRAND_RISK", severity: "HIGH", ... }
  }

  if (lower.includes("worst") || lower.includes("hate")) {
    return { type: "NEGATIVE_SENTIMENT", severity: "MEDIUM", ... }
  }

  return null
}
```

**Problems:**
- Missing common scam keywords (phishing, crypto scams, fake links, etc.)
- No support for regex or pattern matching
- Not configurable per project
- No machine learning or external API for content moderation

**Action Items:**
- [ ] Expand keyword list with more scam/fraud indicators
- [ ] Add support for regex patterns
- [ ] Consider external API (OpenAI, Azure Content Moderator, or Perspective API)
- [ ] Make keyword list configurable per project via database
- [ ] Add confidence scores to alerts

---

### 5. **Missing Input Validation** ❌ MAJOR

**Files:**
- [src/routes/social-media-monitoring/keyword.routes.ts](src/routes/social-media-monitoring/keyword.routes.ts#L14-L18)
- [src/routes/social-media-monitoring/alert.routes.ts](src/routes/social-media-monitoring/alert.routes.ts#L5-L10)
- [src/routes/social-media-monitoring/mention.routes.ts](src/routes/social-media-monitoring/mention.routes.ts#L6-L14)

**Severity:** MAJOR

**Issue:** Routes lack **Fastify request/response schema validation**

```typescript
// ❌ No schema validation
app.post("/projects/:projectId/keywords", async (req) => {
  const { projectId } = req.params as { projectId: string };
  const { value } = req.body as { value: string };
  return createKeyword(projectId, value);
});
```

**Missing:**
- Request body validation
- Response schema documentation
- Auto-generated OpenAPI schemas
- Type safety at runtime

**Action Items:**
- [ ] Add `@sinclair/typebox` schemas to all routes
- [ ] Validate projectId format (UUID)
- [ ] Validate keyword value (non-empty, max length)
- [ ] Add OpenAPI documentation
- [ ] Add response schemas for all endpoints

**Example Implementation:**
```typescript
import { Type } from "@sinclair/typebox";

const keywordSchema = Type.Object({
  value: Type.String({ minLength: 1, maxLength: 255 }),
});

app.post(
  "/projects/:projectId/keywords",
  {
    schema: {
      body: keywordSchema,
      response: {
        201: Type.Object({ id: Type.String(), value: Type.String() }),
      },
    },
  },
  async (req) => {
    // Safe to access req.body.value
  }
);
```

---

### 6. **Missing Authentication & Authorization** ❌ CRITICAL

**Files:** All route files in [src/routes/social-media-monitoring/](src/routes/social-media-monitoring/)  
**Severity:** CRITICAL

**Issue:** No authentication or authorization checks on routes

```typescript
// ❌ Any user can access any project's data
fastify.get("/projects/:projectId/keywords", async (req) => {
  const { projectId } = req.params as { projectId: string };
  return getProjectKeywords(projectId);
});
```

**Security Risks:**
- Data exposure across organizations
- Unauthorized mention/alert viewing
- Keyword manipulation by other users
- No audit trail

**Action Items:**
- [ ] Add auth middleware to validate JWT token
- [ ] Check user belongs to target organization
- [ ] Check organization owns the project
- [ ] Add role-based access control (RBAC)
- [ ] Log all sensitive operations for audit trail

---

### 7. **Weak Sentiment Analysis** ⚠️ MAJOR

**File:** [src/services/sentiment.service.ts](src/services/sentiment.service.ts)  
**Severity:** MAJOR

**Issue:** Sentiment analysis uses basic **keyword matching** instead of proper NLP

```typescript
const positiveWords = ["good", "great", "love", "excellent", "amazing"]
const negativeWords = ["bad", "terrible", "hate", "worst", "awful"]

export function analyzeSentiment(text: string): SentimentType {
  const lower = text.toLowerCase()
  let score = 0
  // Simple word matching - no context awareness
```

**Limitations:**
- No context awareness (e.g., "not good" = POSITIVE ⚠️)
- Limited vocabulary
- No negation handling
- Can't detect sarcasm

**Action Items:**
- [ ] Replace with external sentiment API (Azure Text Analytics, AWS Comprehend, or Hugging Face)
- [ ] Or use a pre-trained ML model (natural.js library)
- [ ] Add confidence scores to sentiment results
- [ ] Include sentiment for mentions in responses

---

### 8. **No Error Handling & Logging** ⚠️ MAJOR

**Files:** Multiple files  
**Severity:** MAJOR

**Issues:**

1. **No Try-Catch blocks** in service functions:
```typescript
// ❌ No error handling
export async function fetchXMentions(keyword: string) {
  const response = await client.v2.search(keyword, {
    max_results: 20,
  })
  // What if API call fails? Timeout? Rate limit?
```

2. **No logging** of important operations:
```typescript
// ❌ No audit trail
export async function saveMention(projectId: string, mention: NormalizedMention) {
  // No logging before/after operations
}
```

3. **Worker doesn't handle errors properly**:
```typescript
// ❌ Silent failures
new Worker("processing", async job => {
  const mention = await prisma.mention.findUnique(...)
  if (!mention || mention.sentiment) return
  // Job fails silently if database error occurs
```

**Action Items:**
- [ ] Add try-catch blocks to all async functions
- [ ] Use structured logging (Winston, Pino, or Bunyan)
- [ ] Log API calls with latency metrics
- [ ] Log data modifications with user context
- [ ] Add error recovery and retry logic
- [ ] Monitor worker job failures

---

### 9. **No Rate Limiting** ⚠️ MAJOR

**File:** [src/services/x.service.ts](src/services/x.service.ts)  
**Severity:** MAJOR

**Issue:** No rate limiting checks before calling X API

```typescript
// ❌ Can hit rate limits instantly
export async function fetchXMentions(keyword: string) {
  const response = await client.v2.search(keyword, {
    max_results: 20,
  })
```

**Action Items:**
- [ ] Implement rate limiting with exponential backoff
- [ ] Track X API rate limit headers
- [ ] Return 429 when approaching limits
- [ ] Queue failed requests for retry

**Example:**
```typescript
import { RateLimiter } from "bottleneck";

const limiter = new RateLimiter({
  minTime: 1000, // 1 second between requests
  maxConcurrent: 1,
});

export async function fetchXMentions(keyword: string) {
  return limiter.schedule(() => client.v2.search(keyword, { max_results: 50 }));
}
```

---

### 10. **Non-Configurable Alert Detection** ⚠️ MAJOR

**File:** [src/services/social-media-monitoring.service.ts](src/services/social-media-monitoring.service.ts#L4)  
**Severity:** MAJOR

**Issue:** Alert keywords and rules are hardcoded, not configurable

```typescript
// ❌ Hardcoded - can't customize per brand
if (lower.includes("scam") || lower.includes("fraud")) {
```

**Action Items:**
- [ ] Create `AlertKeyword` model in Prisma schema
- [ ] Allow projects to configure custom keywords
- [ ] Add configurable severity levels
- [ ] Support regex patterns
- [ ] Add admin panel for keyword management

---

### 11. **Insufficient Mention Deduplication** ⚠️ MEDIUM

**File:** [src/services/social-media-monitoring.service.ts](src/services/social-media-monitoring.service.ts#L28-L46)  
**Severity:** MEDIUM

**Issue:** Uses `upsert` but doesn't prevent duplicate processing in scheduler

**Problem:**
1. Scheduler fetches all unprocessed mentions every 2 minutes
2. If processing fails, mention stays `sentiment: null`
3. Next cron job adds it again, causing duplicate work
4. Could queue the same job multiple times

**Action Items:**
- [ ] Add `lastProcessedAt` timestamp to prevent re-processing
- [ ] Add maximum retry count
- [ ] Add dead-letter queue for permanently failed items
- [ ] Track processing status (PENDING, PROCESSING, SUCCESS, FAILED)

---

### 12. **Global X Client - Not Multi-Tenant** ⚠️ MEDIUM

**File:** [src/services/x.service.ts](src/services/x.service.ts#L1-L4)  
**Severity:** MEDIUM

**Issue:** X client is global and hardcoded with one bearer token

```typescript
// ❌ Hard-coded global client
const client = new TwitterApi(process.env.X_BEARER_TOKEN!)
```

**Problem:**
- Can't support multiple X accounts per brand
- Can't support different API tiers
- Can't rotate credentials

**Action Items:**
- [ ] Support per-project X credentials (via setup endpoint)
- [ ] Pass project context to service functions
- [ ] Store credentials in database (encrypted)
- [ ] Create client per-request based on credentials

---

### 13. **Missing Mention Filtering by Keyword** ⚠️ MEDIUM

**File:** [src/services/mention.service.ts](src/services/mention.service.ts)  
**Severity:** MEDIUM

**Issue:** `getMentionsByBrand` can't filter by keyword

```typescript
export async function getMentionsByBrand(
  projectId: string,
  sentiment?: string
) {
  // No keyword filter
  return prisma.mention.findMany({...})
}
```

**Action Items:**
- [ ] Add `keyword` filter parameter
- [ ] Add `dateRange` filter
- [ ] Add pagination (limit/offset)
- [ ] Add sorting options

---

### 14. **Missing Tests** ⚠️ MAJOR

**Severity:** MAJOR

**Issue:** No test files for social-media-monitoring feature

**Action Items:**
- [ ] Add unit tests for sentiment analysis
- [ ] Add integration tests for X API service
- [ ] Add route tests with authentication
- [ ] Add job tests for worker and scheduler
- [ ] Add at least 80% code coverage

---

### 15. **Database Structure Concerns** ⚠️ MEDIUM

**File:** [prisma/schema.prisma](prisma/schema.prisma)  
**Severity:** MEDIUM

**Issues:**

1. **No `updatedAt` on mentions** - Useful for tracking modifications
2. **No processing status field** - Can't track if mention is being processed
3. **No retry count** - Can't limit retries on failed processing
4. **No external handler ID** - Need to link back to configured handler
5. **Metadata is JSON** - No type safety, could be unstructured

**Action Items:**
- [ ] Add `updatedAt` field to Mention model
- [ ] Add `processingStatus` enum (PENDING, PROCESSING, SUCCESS, FAILED)
- [ ] Add `retryCount` integer field
- [ ] Add `socialMediaHandlerId` foreign key
- [ ] Create `SocialMediaHandler` model to store per-project credentials

---

## 📊 Code Quality Issues

### Missing Features Summary

| Feature | Status | Notes |
|---------|--------|-------|
| Setup API endpoint | ❌ Missing | No way to configure X API credentials |
| Credential validation | ❌ Missing | Can't test if credentials work |
| 6-hour cron job | ❌ Wrong | Currently every 2 minutes |
| Last 50 feeds | ❌ Mismatch | Only fetches 20 tweets |
| Bad content detection | ⚠️ Weak | Only 4 hardcoded keywords |
| Error handling | ❌ Missing | No try-catch blocks |
| Logging | ❌ Missing | No audit trail |
| Authentication | ❌ Missing | No auth checks on routes |
| Input validation | ❌ Missing | No schema validation |
| Rate limiting | ❌ Missing | Will hit API limits |
| Tests | ❌ Missing | No test coverage |
| Documentation | ⚠️ Minimal | Missing API docs |

---

## ✅ What's Working Well

1. ✅ Database schema is well-structured for mentions and alerts
2. ✅ Queue/Worker/Scheduler architecture is appropriate
3. ✅ Sentiment storage to mentions is efficient
4. ✅ Alert creation logic is functional
5. ✅ Basic routing structure exists

---

## 🎯 Recommended Priority Order

### P0 (Block MVP)
1. [ ] Add social media handler setup endpoint with validation
2. [ ] Fix cron schedule (6 hours instead of 2 minutes)
3. [ ] Add authentication to all routes
4. [ ] Increase tweet fetch from 20 to 50

### P1 (Before Production)
5. [ ] Add input validation with schemas
6. [ ] Improve content moderation algorithm
7. [ ] Add error handling and logging
8. [ ] Add rate limiting

### P2 (Nice to Have)
9. [ ] Improve sentiment analysis with ML
10. [ ] Add configurable alert keywords
11. [ ] Add comprehensive tests
12. [ ] Add detailed monitoring/metrics

---

## 📝 Detailed Recommendations

### 1. Create Social Media Handler Model
Add to Prisma schema:
```prisma
model SocialMediaHandler {
  id               String   @id @default(uuid())
  projectId        String   @map("project_id")
  platform         String   // "X", "INSTAGRAM", etc.
  credentialHash   String   @unique @map("credential_hash") // Encrypted
  isValidated      Boolean  @default(false)
  lastValidatedAt  DateTime? @map("last_validated_at")
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt
  
  project Project @relation(fields: [projectId], references: [id])
  
  @@unique([projectId, platform])
  @@map("social_media_handlers")
}
```

### 2. Create Alert Keyword Configuration
```prisma
model AlertKeyword {
  id        String   @id @default(uuid())
  projectId String   @map("project_id")
  keyword   String
  pattern   String?  // Regex support
  severity  String   // "HIGH", "MEDIUM", "LOW"
  type      String   // "SCAM", "PHISHING", "HATE", etc.
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  
  project Project @relation(fields: [projectId], references: [id])
  
  @@unique([projectId, keyword])
  @@map("alert_keywords")
}
```

### 3. Add Error Handling Pattern
```typescript
import logger from "../lib/logger"; // Implement logging

export async function fetchXMentions(
  projectId: string,
  keyword: string
): Promise<NormalizedMention[]> {
  try {
    logger.info(`Fetching mentions for keyword: ${keyword}`, { projectId });
    
    const response = await client.v2.search(keyword, {
      max_results: 50,
    });

    if (!response.data?.data) {
      logger.warn("No mentions found", { keyword });
      return [];
    }

    logger.info(`Fetched ${response.data.data.length} mentions`, { keyword });

    return response.data.data.map(tweet => ({
      externalId: tweet.id,
      platform: "X" as const,
      content: tweet.text,
      keyword,
      metadata: tweet,
    }));
  } catch (error) {
    logger.error("Failed to fetch X mentions", { keyword, error });
    throw new Error(`Failed to fetch mentions for keyword "${keyword}": ${error}`);
  }
}
```

---

## 🔒 Security Checklist

- [ ] Add authentication middleware to all routes
- [ ] Validate authorization (user belongs to org/project)
- [ ] Encrypt API credentials in database
- [ ] Use environment variables for secrets (not hardcoded)
- [ ] Add rate limiting to prevent abuse
- [ ] Sanitize user input in keywords
- [ ] Add CORS properly (currently allows localhost)
- [ ] Add request signing/verification

---

## 📞 Contact & Next Steps

Please address the **P0 issues** before merging.  
For questions or clarifications, please reach out.

**Request for Changes:** @kaveesh - Please review and address the issues listed above. Focus on P0 items first. Let's discuss the content moderation approach in detail.

---

**Generated by:** GitHub Copilot Code Review  
**Status:** 🔴 NEEDS CHANGES
