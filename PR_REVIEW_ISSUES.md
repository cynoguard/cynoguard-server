# 🚨 Social Media Monitoring - Code Review Issues

## Quick Summary

**Branch:** `feature/social-media-monitoring`  
**Status:** ❌ NEEDS SIGNIFICANT CHANGES  
**Blockers:** 4 Critical Issues  
**Major Issues:** 11  

---

## CRITICAL ISSUES (Must Fix Before Merge)

### ❌ Issue #1: Wrong Cron Schedule (Every 2 min instead of 6 hours)
- **File:** `src/lib/processing.scheduler.ts:5`
- **Impact:** API rate limit exceeded, violates requirement
- **Fix:** Change `*/2 * * * *` → `0 */6 * * *`

### ❌ Issue #2: Missing Social Media Handler Setup Endpoint
- **File:** N/A (Missing Feature)
- **Impact:** Can't configure X credentials, can't validate handler
- **Fix:** Create `POST /projects/:projectId/social-media/setup` endpoint with credential validation

### ❌ Issue #3: No Authentication/Authorization on Routes
- **Files:** All routes in `src/routes/social-media-monitoring/`
- **Impact:** Security vulnerability - any user can access any project's data
- **Fix:** Add auth middleware to validate JWT and check authorization

### ❌ Issue #4: Tweet Fetch Limit is 20 instead of 50
- **File:** `src/services/x.service.ts:10`
- **Impact:** Doesn't meet requirement to "check last 50 feeds"
- **Fix:** Change `max_results: 20` → `max_results: 50`

---

## MAJOR ISSUES (Should Fix Before Merge)

### ⚠️ Issue #5: No Input Validation on Routes
**Files:** 
- `src/routes/social-media-monitoring/keyword.routes.ts`
- `src/routes/social-media-monitoring/alert.routes.ts`
- `src/routes/social-media-monitoring/mention.routes.ts`

**Problem:** Fastify schemas missing, no type-safe validation
**Example:**
```typescript
// ❌ Current - no validation
app.post("/projects/:projectId/keywords", async (req) => {
  const { value } = req.body as { value: string };
  return createKeyword(projectId, value);
});

// ✅ Should be
app.post(
  "/projects/:projectId/keywords",
  {
    schema: {
      body: Type.Object({
        value: Type.String({ minLength: 1, maxLength: 255 })
      })
    }
  },
  async (req) => {...}
);
```

### ⚠️ Issue #6: Weak Content Moderation (Only 4 Keywords)
**File:** `src/services/social-media-monitoring.service.ts:4-25`

**Problem:** Only checks for "scam", "fraud", "worst", "hate"  
**Missing:** phishing, pump & dump, fake links, suspicious URLs, common scam language

**Options:**
1. Expand keyword list (quick fix)
2. Use external API (Azure Content Moderator, OpenAI)
3. Train ML model (long-term)

### ⚠️ Issue #7: No Error Handling or Logging
**Affected Functions:**
- `fetchXMentions()` - No try-catch
- `saveMention()` - No logging
- Worker job processing - Silent failures

**Impact:** Can't debug issues, no audit trail

### ⚠️ Issue #8: No Rate Limiting on X API Calls
**File:** `src/services/x.service.ts`

**Problem:** Will hit X API rate limits
**Solution:** Add throttling/rate limiting with exponential backoff

### ⚠️ Issue #9: Global X Client (Not Multi-Tenant)
**File:** `src/services/x.service.ts:4`

**Problem:** Hardcoded bearer token, can't support multiple X accounts
**Solution:** Store credentials per-project, create client per-request

### ⚠️ Issue #10: Alert Keywords Hardcoded (Not Configurable)
**File:** `src/services/social-media-monitoring.service.ts:4-25`

**Solution:** Create `AlertKeyword` table, allow per-project keyword management

### ⚠️ Issue #11: Insufficient Mention Deduplication
**Problem:** Duplicate processing possible if jobs fail
**Solution:** Add `processingStatus`, `lastProcessedAt` fields to Mention model

### ⚠️ Issue #12: Weak Sentiment Analysis
**File:** `src/services/sentiment.service.ts`

**Problem:** Simple keyword matching, no context awareness
**Issues:** "not good" = POSITIVE ❌, "I hate it but..." = NEGATIVE ❌
**Solution:** Use external API or ML model for better accuracy

### ⚠️ Issue #13: Missing Database Fields
**Schema Issues:**
- No `processingStatus` field for mention status tracking
- No `retryCount` for failed jobs
- No `updatedAt` on Mention for tracking changes
- No `SocialMediaHandler` model for per-project credentials

### ⚠️ Issue #14: No Tests
**Missing:**
- Unit tests for sentiment analysis
- Integration tests for X API service
- Route tests with authentication
- Worker/scheduler tests

### ⚠️ Issue #15: Mention Filtering Incomplete
**File:** `src/services/mention.service.ts`

**Problem:** Can't filter by keyword, dates, or paginate results
**Solution:** Add filtering and pagination parameters

---

## REQUEST FOR CHANGES

@kaveesh - Based on the code review above, please address the following:

### BEFORE NEXT REVIEW:
1. **Implement Social Media Handler Setup Endpoint**
   - Create endpoint to add/validate X credentials per project
   - Store encrypted credentials in database
   - Test credentials with API call before saving
   - Return validation result

2. **Fix Cron Schedule**
   - Change from `*/2 * * * *` to `0 */6 * * *`
   - Add configuration option for schedule interval
   - Document the schedule clearly

3. **Add Authentication to All Routes**
   - Middleware to check JWT token
   - Verify user belongs to organization
   - Verify organization owns project
   - Add auth checks to all social-media routes

4. **Update X Service**
   - Change `max_results` from 20 to 50
   - Add per-project credential support
   - Add error handling and logging
   - Add rate limiting

5. **Add Input Validation**
   - Use `@sinclair/typebox` schemas on all routes
   - Validate projectId format
   - Validate keyword constraints
   - Document schemas in OpenAPI

### DISCUSS WITH TEAM:
6. **Content Moderation Approach**
   - Should we expand keyword list (quick)?
   - Should we use external API (scalable)?
   - Should we implement ML model (long-term)?
   - What scam/phishing keywords are most relevant to your users?

7. **Sentiment Analysis**
   - Current approach too simplistic
   - Recommend using external API for better accuracy
   - Or switch to open-source ML model

### NICE TO HAVE:
8. Add comprehensive error handling throughout
9. Add logging for audit trail
10. Add integration tests
11. Make alert keywords configurable per project

---

## File-by-File Inline Comments

### `src/services/x.service.ts`
```
Line 4:  ❌ Global hardcoded client - should be per-project
Line 10: ❌ max_results should be 50, not 20
Line ?   ❌ Missing error handling (try-catch)
Line ?   ❌ Missing rate limiting
Line ?   ❌ Missing logging
```

### `src/lib/processing.scheduler.ts`
```
Line 5: ❌ CRITICAL - Should be "0 */6 * * *" (6 hours), not "*/2 * * * *" (2 minutes)
```

### `src/services/social-media-monitoring.service.ts`
```
Line 4-25: ⚠️ Only 4 hardcoded keywords - insufficient for scam/phishing detection
Line 28:   ❌ No logging or error handling
Line 35:   ❌ Missing validation of mention data
```

### `src/routes/social-media-monitoring/keyword.routes.ts`
```
Line 14: ❌ No Fastify schema validation on POST body
Line 14: ❌ No authentication/authorization check
ALL:     ❌ Missing request/response schemas for OpenAPI documentation
```

### All Route Files
```
❌ MISSING: Authentication middleware to check JWT and authorization
❌ MISSING: Input validation with @sinclair/typebox schemas
❌ MISSING: Error handling
```

---

## Database Schema Changes Needed

```prisma
// Add to schema.prisma

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

// Update Mention model
model Mention {
  // ... existing fields
  processingStatus String? @default("PENDING") // PENDING, PROCESSING, SUCCESS, FAILED
  retryCount      Int     @default(0)
  lastProcessedAt DateTime? @map("last_processed_at")
  updatedAt       DateTime @updatedAt
}

// Add configurable keywords
model AlertKeyword {
  id        String   @id @default(uuid())
  projectId String   @map("project_id")
  keyword   String
  pattern   String?  // Regex
  severity  String   // "HIGH", "MEDIUM", "LOW"
  type      String   // "SCAM", "PHISHING", "HATE"
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  
  project Project @relation(fields: [projectId], references: [id])
  
  @@unique([projectId, keyword])
  @@map("alert_keywords")
}
```

---

## Next Steps for @kaveesh

1. **Review** this document completely
2. **Prioritize** - Focus on CRITICAL issues first
3. **Plan** content moderation approach (discuss with team)
4. **Implement** fixes in order of priority
5. **Add tests** for new functionality
6. **Request review** when ready

**Timeline Goal:** Have P0 fixes completed within 2-3 days before next review

---

## Acceptance Criteria for PR Merge

- [ ] Cron schedule corrected to 6 hours
- [ ] Social media handler setup endpoint implemented
- [ ] All routes have authentication/authorization
- [ ] X service fetches 50 tweets (not 20)
- [ ] Input validation on all routes
- [ ] Error handling added to critical paths
- [ ] Tests written (at least for critical functions)
- [ ] Code reviewed by @kaveesh
- [ ] All comments addressed or documented

---

**Status:** 🔴 BLOCKED - Awaiting Changes
