# ✅ Fix Checklist - Social Media Monitoring Feature

Use this checklist to track fixes needed before PR can be merged.

---

## 🔴 PHASE 1: CRITICAL FIXES (Must Complete First)

### [ ] Fix #1: Cron Schedule (2 minutes → 6 hours)
- **File:** `src/lib/processing.scheduler.ts`
- **Line:** 5
- **Change:** `"*/2 * * * *"` → `"0 */6 * * *"`
- **Time Est:** 15 minutes
- **Priority:** 🔴 CRITICAL
- **Acceptance:** Cron runs exactly 4 times per day (every 6 hours)

```typescript
// BEFORE:
cron.schedule("*/2 * * * *", async () => {

// AFTER:
cron.schedule("0 */6 * * *", async () => {
```

**Verification:**
- [ ] Schedule matches `0 */6 * * *`
- [ ] No migrations or restarts needed
- [ ] Tested that cron triggers at correct times

---

### [ ] Fix #2: Tweet Fetch Limit (20 → 50)
- **File:** `src/services/x.service.ts`
- **Line:** 10-12
- **Change:** `max_results: 20` → `max_results: 50`
- **Time Est:** 5 minutes
- **Priority:** 🔴 CRITICAL
- **Acceptance:** Fetches exactly 50 tweets per search

```typescript
// BEFORE:
const response = await client.v2.search(keyword, {
  max_results: 20,
})

// AFTER:
const response = await client.v2.search(keyword, {
  max_results: 50,
})
```

**Verification:**
- [ ] Method fetches 50 results
- [ ] No API errors for increased limit
- [ ] Tested with actual API call

---

### [ ] Fix #3: Add Social Media Handler Setup Endpoint
- **Files:** 
  - Create: `src/routes/social-media-monitoring/handler.routes.ts`
  - Create: `src/services/social-media-handler.service.ts`
  - Update: `src/server.ts` (register routes)
  - Update: `prisma/schema.prisma` (new model)
- **Time Est:** 2-3 hours
- **Priority:** 🔴 CRITICAL
- **Acceptance:** Can setup and validate X credentials per project

**Endpoint Spec:**

```typescript
// POST /projects/:projectId/social-media-handlers
Request Body: {
  platform: "X",
  bearerToken: "xxxxxxxxxxxxxxxx"
}

Response (201): {
  id: "handler-uuid",
  projectId: "project-uuid",
  platform: "X",
  isValidated: true,
  lastValidatedAt: "2026-02-26T00:00:00Z",
  createdAt: "2026-02-26T00:00:00Z"
}

Error Response (400): {
  error: "Invalid bearer token",
  message: "Failed to authenticate with X API"
}
```

**Implementation Steps:**
1. [ ] Create `SocialMediaHandler` Prisma model
2. [ ] Create handler setup route with auth
3. [ ] Create service with credential validation
4. [ ] Validate credentials by making test API call
5. [ ] Store credentials encrypted
6. [ ] Add error handling for invalid tokens
7. [ ] Register route in `server.ts`
8. [ ] Test with valid and invalid credentials

**Validation Logic:**
- [ ] Make sample API call (search "test")
- [ ] Check for authentication error 
- [ ] Store only if validation succeeds
- [ ] Set `isValidated: true` on success

---

### [ ] Fix #4: Add Authentication to All Routes
- **Files:** All 6 files in `src/routes/social-media-monitoring/`
- **Time Est:** 1-2 hours
- **Priority:** 🔴 CRITICAL (SECURITY)
- **Acceptance:** Routes require valid JWT token and proper ownership

**Implementation Steps:**
1. [ ] Create auth middleware `src/lib/auth.middleware.ts`
2. [ ] Verify JWT token validity
3. [ ] Extract user from token
4. [ ] Check user belongs to organization
5. [ ] Check organization owns project
6. [ ] Return 401 if not authorized
7. [ ] Apply middleware to all social-media-monitoring routes

**Auth Flow:**
```
User Request
    ↓
Check JWT token exists
    ↓
Decode JWT (validate signature)
    ↓
Get user from Prisma
    ↓
Get organization memberships
    ↓
Get projects in organization
    ↓
Check if requested project in list
    ↓
Allow/Deny request
```

**Test Cases:**
- [ ] Missing auth token → 401
- [ ] Invalid JWT → 401
- [ ] User not in organization → 401
- [ ] Organization doesn't own project → 401
- [ ] Valid token + correct project → 200
- [ ] Apply to all 6 route files

---

## 🟠 PHASE 2: MAJOR FIXES (High Priority)

### [ ] Fix #5: Add Input Validation Schemas
- **Files:** All 6 route files in `src/routes/social-media-monitoring/`
- **Time Est:** 1 hour
- **Priority:** 🟠 MAJOR
- **Acceptance:** All routes have Fastify schema validation

**Apply to routes:**
- [ ] `keyword.routes.ts` - POST keyword validation (required: value)
- [ ] `keyword.routes.ts` - PATCH keyword validation (required: isActive)
- [ ] `mention.routes.ts` - GET query validation (optional: sentiment)
- [ ] `alert.routes.ts` - PATCH readAlert validation
- [ ] All others with any input

**Example Schema:**
```typescript
import { Type } from "@sinclair/typebox";

const createKeywordSchema = {
  body: Type.Object({
    value: Type.String({
      minLength: 1,
      maxLength: 255,
      description: "Keyword to monitor"
    })
  }),
  response: {
    201: Type.Object({
      id: Type.String(),
      projectId: Type.String(),
      value: Type.String(),
      isActive: Type.Boolean(),
      createdAt: Type.String({ format: "date-time" })
    })
  }
};

app.post(
  "/projects/:projectId/keywords",
  { schema: createKeywordSchema },
  async (req) => {
    // req.body is now type-safe!
  }
);
```

**Validation:**
- [ ] All POST endpoints have body schema
- [ ] All GET endpoints validate params/query
- [ ] All PATCH endpoints validate body
- [ ] All schemas have response types
- [ ] OpenAPI docs auto-generated

---

### [ ] Fix #6: Improve Scam/Fraud Detection
- **Files:** `src/services/social-media-monitoring.service.ts`
- **Time Est:** 1-2 hours
- **Priority:** 🟠 MAJOR
- **Options:** Quick-fix OR Long-term

**Option A: Quick-Fix (Expand Keywords)**
```typescript
// Expand from 4 to 50+ keywords
const scamKeywords = [
  // Crypto scams
  "airdrop", "giveaway", "claim free", "lambo", "moon",
  "rug pull", "exit scam", "pump and dump",
  // Phishing
  "verify account", "confirm identity", "re-authenticate",
  "update payment", "click here immediately",
  // Spam
  "dm for", "work from home", "make money fast",
  // Fake endorsements
  "elon endorses", "i recommend this", "@elonmusk approved"
];
```

**Option B: External API (Recommended)**
- Use `OpenAI Moderation API` or
- Use `Azure Content Moderator` or
- Use `Perspective API`

**Option C: ML Model (Long-term)**
- Use pre-trained sentiment analysis
- Train custom classifier on labeled data

**Action:** Decide which approach with tech lead
- [ ] Discuss approach with team
- [ ] Document decision
- [ ] Implement chosen approach

**Test Cases:**
- [ ] Detects known scam keywords
- [ ] Has ~90% precision/recall
- [ ] Can be customized per project

---

### [ ] Fix #7: Add Error Handling & Logging
- **Files:** Multiple service files
- **Time Est:** 1-2 hours
- **Priority:** 🟠 MAJOR
- **Acceptance:** No silent failures, proper logging

**Apply to:**
- [ ] `src/services/x.service.ts` - fetchXMentions
- [ ] `src/services/social-media-monitoring.service.ts` - saveMention
- [ ] `src/lib/processing.worker.ts` - job processing
- [ ] All API routes

**Error Handling Pattern:**
```typescript
import logger from "../lib/logger";

export async function fetchXMentions(
  projectId: string,
  keyword: string
): Promise<NormalizedMention[]> {
  try {
    logger.info(`Fetching mentions`, { projectId, keyword });
    
    const response = await client.v2.search(keyword, {
      max_results: 50,
    });

    if (!response.data?.data) {
      logger.warn(`No mentions found`, { keyword });
      return [];
    }

    logger.info(`Fetched ${response.data.data.length} mentions`, { keyword });
    return response.data.data.map(/* ... */);

  } catch (error) {
    logger.error(`Failed to fetch mentions`, { 
      projectId, 
      keyword, 
      error: error.message 
    });
    throw new Error(`Failed to fetch mentions: ${error.message}`);
  }
}
```

**Logging Requirements:**
- [ ] Log API calls with method, endpoint, params
- [ ] Log before/after data modifications
- [ ] Log errors with full context
- [ ] Include user/project context
- [ ] Use structured logging format

---

### [ ] Fix #8: Add Rate Limiting
- **Files:** `src/services/x.service.ts`
- **Time Est:** 1 hour
- **Priority:** 🟠 MAJOR
- **Acceptance:** Respects X API rate limits

**Implementation:**
```typescript
import Bottleneck from "bottleneck";

const limiter = new Bottleneck({
  minTime: 1000, // Wait 1s between requests
  maxConcurrent: 1
});

export async function fetchXMentions(keyword: string) {
  return limiter.schedule(async () => {
    return await client.v2.search(keyword, { max_results: 50 });
  });
}
```

**Verification:**
- [ ] Rate limiter installed
- [ ] Respects 1 request per second minimum
- [ ] Tested with rapid requests
- [ ] Returns 429 when appropriate

---

### [ ] Fix #9: Update Database Schema
- **File:** `prisma/schema.prisma`
- **Time Est:** 1 hour
- **Priority:** 🟠 MAJOR

**Add Models:**

```prisma
model SocialMediaHandler {
  id               String   @id @default(uuid())
  projectId        String   @map("project_id")
  platform         String   // "X"
  credentialHash   String   @unique @map("credential_hash")
  isValidated      Boolean  @default(false)
  lastValidatedAt  DateTime? @map("last_validated_at")
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt
  
  project Project @relation(fields: [projectId], references: [id])
  
  @@unique([projectId, platform])
  @@map("social_media_handlers")
}

model AlertKeyword {
  id        String   @id @default(uuid())
  projectId String   @map("project_id")
  keyword   String
  pattern   String?  // Regex support
  severity  String   @default("MEDIUM")
  type      String   // SCAM, PHISHING, HATE, etc
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  
  project Project @relation(fields: [projectId], references: [id])
  
  @@unique([projectId, keyword])
  @@map("alert_keywords")
}
```

**Update Mention Model:**
```prisma
model Mention {
  // ... existing fields
  processingStatus String? @default("PENDING")
  retryCount      Int     @default(0)
  lastProcessedAt DateTime? @map("last_processed_at")
  updatedAt       DateTime @updatedAt
}
```

**Actions:**
- [ ] Create migration: `npx prisma migrate dev --name add_handler_and_keywords`
- [ ] Update Project relation to include handlers
- [ ] Backfill processing status for existing mentions
- [ ] Test queries work correctly

---

## 🟡 PHASE 3: TESTING & POLISH (Nice to Have)

### [ ] Add Unit Tests
- **Location:** `src/__tests__/`
- **Time Est:** 2-3 hours
- **Priority:** 🟡 MEDIUM
- **Acceptance:** >80% code coverage

**Test Files Needed:**
- [ ] `sentiment.service.test.ts`
- [ ] `social-media-monitoring.service.test.ts`
- [ ] `x.service.test.ts`
- [ ] `keyword.service.test.ts`
- [ ] Route tests with auth

---

### [ ] Add Integration Tests
- **Location:** `src/__tests__/integration/`
- **Time Est:** 2-3 hours
- **Priority:** 🟡 MEDIUM

**Test Scenarios:**
- [ ] End-to-end keyword creation → fetch → storage
- [ ] Alert detection pipeline
- [ ] Handler setup and validation
- [ ] Auth enforcement on all routes

---

### [ ] Add Performance Testing
- **Time Est:** 1 hour
- **Priority:** 🟡 MEDIUM

**Tests:**
- [ ] Cron job completes in <5 min
- [ ] API calls stay within rate limits
- [ ] Database queries are optimized
- [ ] Memory usage is stable

---

### [ ] Create API Documentation
- **Format:** OpenAPI/Swagger
- **Time Est:** 1-2 hours
- **Priority:** 🟡 MEDIUM

**Document:**
- [ ] All endpoints with examples
- [ ] Auth requirements
- [ ] Error responses
- [ ] Rate limiting info

---

## 📊 Progress Tracker

### Phase 1: Critical (4 items)
- [ ] Fix #1: Cron Schedule
- [ ] Fix #2: Tweet Limit
- [ ] Fix #3: Setup Endpoint
- [ ] Fix #4: Authentication

**Estimated Time:** 4-6 hours  
**Target Date:** 2-3 days from now

### Phase 2: Major (5 items)
- [ ] Fix #5: Input Validation
- [ ] Fix #6: Scam Detection
- [ ] Fix #7: Error Handling & Logging
- [ ] Fix #8: Rate Limiting
- [ ] Fix #9: Database Schema

**Estimated Time:** 5-8 hours  
**Target Date:** 3-5 days from now (after Phase 1)

### Phase 3: Polish (4 items)
- [ ] Unit Tests
- [ ] Integration Tests
- [ ] Performance Testing
- [ ] API Documentation

**Estimated Time:** 6-8 hours  
**Target Date:** After Phase 1-2 complete

---

## 🎯 Merge Criteria

PR can only be merged when ALL of these are checked:

### Must Have (Blocking)
- [ ] Fix #1: Cron corrected to 6 hours
- [ ] Fix #2: Tweet limit corrected to 50
- [ ] Fix #3: Setup endpoint implemented with validation
- [ ] Fix #4: Authentication on all routes
- [ ] All code review comments addressed
- [ ] Tests pass locally
- [ ] No console errors in logs

### Should Have (Expected)
- [ ] Fix #5-9: Major fixes completed
- [ ] Inline code comments in difficult areas
- [ ] Clear error messages to users
- [ ] Logging implemented

### Nice to Have (Future)
- [ ] Full test suite
- [ ] Performance benchmarks
- [ ] Comprehensive API docs

---

## 📞 Communication

### Daily Standup Update
Use this template:
```
**Date:** [date]
**Status:** [In Progress / Blocked / Complete]
**Completed Today:** [list of items]
**Planned Tomorrow:** [list of items]
**Blockers:** [if any, describe]
**Questions:** [if any, ask]
```

### Request Changes/Questions
Use GitHub comments on the code review docs:
- Ask @kaveesh if approach unclear
- Share progress updates
- Flag blockers early

### Next Review Meeting
Schedule when all Phase 1 fixes are complete.

---

## 📋 Summary

**Total Time Estimate:**
- Phase 1 (Critical): 4-6 hours
- Phase 2 (Major): 5-8 hours  
- Phase 3 (Polish): 6-8 hours
- **Total: 15-22 hours**

**Work Distribution:**
- Can be done by 1 person in 3-4 days
- Can be split across 2 people in 2-3 days

**Dependency Order:**
1. Phase 1 must be done first (blocking)
2. Phase 2 can start after Phase 1
3. Phase 3 can be done in parallel with Phase 2

**Risk Level:** HIGH if merged without Phase 1 fixes

---

**Status:** 🔴 IN PROGRESS  
**Last Updated:** February 26, 2026  
**Owner:** @kaveesh  
**Ready for Merge:** ❌ NO (requires fixes)
