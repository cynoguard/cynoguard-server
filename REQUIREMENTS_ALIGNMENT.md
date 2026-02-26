# 🔍 Requirements vs Implementation Analysis

## Core Requirement vs Reality

### ✅ Requirement 1: "Setup social media (X/Twitter) handler"

| Aspect | Requirement | Implementation | Status |
|--------|-------------|-----------------|--------|
| Setup Endpoint | Can configure X handler | No endpoint exists | ❌ MISSING |
| Credentials | Accept API credentials | Hardcoded bearer token | ❌ WRONG |
| Validation | Validate credentials work | No validation | ❌ MISSING |
| Storage | Store per project | Global constant | ❌ WRONG |
| Security | Encrypted storage | Plain environment variable | ❌ INSECURE |

**Current Code:**
```typescript
// src/services/x.service.ts
const client = new TwitterApi(process.env.X_BEARER_TOKEN!)  // ❌ Global, hardcoded
```

**What's Missing:**
- POST `/projects/:projectId/social-media/setup` endpoint
- Credential validation by testing API call
- Encrypted storage in database
- Per-project credential management

---

### ❌ Requirement 2: "Check if it valid"

| Aspect | Requirement | Implementation | Status |
|--------|-------------|-----------------|--------|
| Validation | Validate handler is working | No validation logic | ❌ MISSING |
| Testing | Test with actual API call | Not implemented | ❌ MISSING |
| Error Messages | Clear error feedback | Not applicable | ❌ N/A |
| Retry Logic | Handle validation failures | Not implemented | ❌ MISSING |

**What's Needed:**
- Validation endpoint to test credentials
- Test API call (e.g., search with sample keyword)
- Store validation status and timestamp
- Provide validation error details

---

### ❌ Requirement 3: "Every 6 hrs via cron job check is there any bad or scammy content posts on last 50 feeds"

| Aspect | Requirement | Implementation | Status |
|--------|-------------|-----------------|--------|
| **Schedule** | Every 6 hours | Every 2 minutes | ❌ **WRONG** |
| **Mention Count** | Last 50 feeds | Fetches only 20 | ❌ **WRONG** |
| **Content Type** | Bad/scammy posts | All mentions | ❌ **INCOMPLETE** |
| **Processing** | Regular checks | Runs too frequently | ❌ **EXCESSIVE** |

**Current Code:**
```typescript
// src/lib/processing.scheduler.ts
cron.schedule("*/2 * * * *", async () => {  // ❌ Every 2 min, should be 6 hrs
  
// src/services/x.service.ts
max_results: 20,  // ❌ Should be 50
```

**Issues:**
- 🔴 **180x TOO FREQUENT** - Runs 180 times per day instead of 4
- 🔴 **40% FEWER TWEETS** - Checks 20 instead of 50
- 💰 **API COST EXPLOSION** - Massive unnecessary API charges
- 🚫 **RATE LIMIT HITS** - Will exceed X API rate limits

**Calculation:**
- Current: Every 2 minutes = 720 checks/day × 20 tweets = 14,400 API calls/day
- Required: Every 6 hours = 4 checks/day × 50 tweets = 200 API calls/day
- **72x more API calls than needed!**

---

### ⚠️ Requirement 4: "Check is there any bad or scammy content"

| Aspect | Requirement | Implementation | Status |
|--------|-------------|-----------------|--------|
| **Keywords** | Comprehensive scam detection | 4 hardcoded keywords | ❌ **VERY WEAK** |
| **Coverage** | Fraud, phishing, scams | Only "scam" + "fraud" | ❌ **INCOMPLETE** |
| **Configurability** | Customizable per brand | Hardcoded | ❌ **NOT FLEXIBLE** |
| **Intelligence** | Smart detection | Simple string matching | ❌ **TOO BASIC** |

**Current Detection:**
```typescript
// src/services/social-media-monitoring.service.ts
if (lower.includes("scam") || lower.includes("fraud")) { /* HIGH */ }
if (lower.includes("worst") || lower.includes("hate")) { /* MEDIUM */ }
```

**Missing Keywords:**
- ❌ Phishing, pump & dump, fake crypto giveaways
- ❌ Suspicious links, bit.ly redirection patterns
- ❌ "follow @xyz for benefits", "DM for investment"
- ❌ Urgency tactics: "limited time", "act now"
- ❌ Celebrity/influencer impersonation
- ❌ Spelling variations: "sc@m", "fr@ud", etc.

**Detection Issues:**
- Simple word matching = NO context awareness
- "I hate that this scam happened" = Both NEGATIVE and BRAND_RISK ✓ (lucky)
- "This is not a scam" = No alert ❌ (false negative)

---

## 🚨 Security Gaps vs Requirement

### Original Implied Requirement: "Multi-tenant system"

| Aspect | Required | Implementation | Status |
|--------|----------|-----------------|--------|
| Auth Check | Verify user owns project | No checks | ❌ MISSING |
| Auth Scope | User can only see their data | Any user can access any project | ❌ BROKEN |
| API Keys | Per-project credentials | Single global token | ❌ SHARED |
| Audit Trail | Log who did what | No logging | ❌ MISSING |

**Current Security:**
```typescript
// src/routes/social-media-monitoring/keyword.routes.ts
fastify.get("/projects/:projectId/keywords", async (req) => {
  // ❌ NO AUTH CHECK - Anyone can access any project!
  return getProjectKeywords(projectId);
});
```

**Exploit Example:**
```bash
curl http://localhost:4000/projects/competitor-id/keywords
# Returns all competitor's keywords with no authentication!
```

---

## 📊 Requirements Alignment Score

```
Domain                     Required    Implemented    Coverage
═════════════════════════════════════════════════════════════════
Setup Endpoint             ✅ YES      ❌ NO           0%
Credential Validation      ✅ YES      ❌ NO           0%
6-Hour Schedule            ✅ YES      ❌ WRONG        0%
Last 50 Feeds              ✅ YES      ❌ ONLY 20      40%
Bad Content Detection      ✅ YES      ⚠️  WEAK         20%
Security/Auth              ✅ YES      ❌ MISSING      0%
Error Handling             ✅ YES      ❌ MISSING      0%
Logging/Audit Trail        ✅ YES      ❌ MISSING      0%
Input Validation           ✅ YES      ❌ MISSING      0%
═════════════════════════════════════════════════════════════════
OVERALL ALIGNMENT:                                    ~12% ❌
```

---

## 🎯 What Would Be Needed to Pass Requirements

### To Meet Core Requirement 1 (Setup Handler):
- [ ] `POST /api/v1/projects/:projectId/social-media-handlers`
  - Request: `{ platform: "X", bearerToken: "..." }`
  - Response: `{ id, isValid: boolean, error?: string }`
- [ ] `GET /api/v1/projects/:projectId/social-media-handlers`
  - List configured handlers with status
- [ ] `DELETE /api/v1/projects/:projectId/social-media-handlers/:id`
  - Remove handler

### To Meet Core Requirement 2 (Validate Handler):
- [ ] Validate logic in setup endpoint
- [ ] Test endpoint: `POST /api/v1/social-media-handlers/:id/validate`
- [ ] Store `isValidated`, `lastValidatedAt`, `validationError`
- [ ] Return clear error messages

### To Meet Core Requirement 3 (6hr Schedule, 50 Feeds):
- [ ] Change cron: `"0 */6 * * *"` (6 hours)
- [ ] Change fetch limit: `max_results: 50`
- [ ] Verify: 4 API calls/day × 50 tweets = 200/day
- [ ] No more than 200 API calls per day

### To Meet Core Requirement 4 (Bad Content Detection):
**Option A: Expand Keywords (Quick-Fix)**
- Expand from 4 to 50+ keywords
- Add regex patterns
- Make configurable per project

**Option B: External API (Recommended)**
- Use Azure Content Moderator
- Or AWS Comprehend
- Or OpenAI moderation endpoint

**Option C: ML Model (Long-term)**
- Train classification model
- Requires labeled data
- More maintenance overhead

---

## 🔴 Risk Assessment

### If Merged As-Is:

| Risk | Severity | Impact |
|------|----------|--------|
| No auth checks | CRITICAL | Data breach, compete exposure |
| Wrong cron schedule | CRITICAL | 180x excess API calls, budget blown |
| Missing setup endpoint | CRITICAL | Can't configure per project |
| Wrong fetch limit (20 vs 50) | CRITICAL | Incomplete threat detection |
| Weak scam detection | HIGH | Low effectiveness of core feature |
| No error handling | HIGH | Silent failures, production issues |
| No logging | HIGH | Can't debug problems |
| No tests | HIGH | Regression risks |

---

## ✅ Minimum Viable Changes for MVP

To make this production-ready, at minimum:

1. **Fix Cron (CRITICAL)** - 15 minutes
   ```diff
   - cron.schedule("*/2 * * * *", ...
   + cron.schedule("0 */6 * * *", ...
   ```

2. **Fix Tweet Limit (CRITICAL)** - 5 minutes
   ```diff
   - max_results: 20,
   + max_results: 50,
   ```

3. **Add Auth (CRITICAL)** - 1-2 hours
   - Middleware to check JWT
   - Verify user owns project
   - Apply to all routes

4. **Add Setup Endpoint (CRITICAL)** - 2-3 hours
   - POST endpoint with credential validation
   - Store per-project credentials
   - Simple bearer token support initially

5. **Improve Scam Detection (HIGH)** - 1-2 hours
   - Expand keyword list to 50+ keywords
   - Add configurable keywords table
   - Or integrate external API

**Total Time:** ~5-8 hours for MVP-ready code

---

## 📋 Handoff to @kaveesh

**Status:** 🔴 DO NOT MERGE

Please address items in this order:

### Phase 1: Requirements Alignment (2-3 days)
1. Fix cron schedule (6 hrs)
2. Fix tweet limit (50)
3. Add setup endpoint
4. Add credential validation

### Phase 2: Security & Quality (2-3 days)
5. Add authentication to routes
6. Add error handling & logging
7. Add input validation
8. Improve scam detection algorithm

### Phase 3: Production Readiness (1-2 days)
9. Add tests (unit + integration)
10. Performance testing with rate limits
11. Documentation

**Target Merge Date:** After Phase 1 minimum

---

**Analysis Generated:** February 26, 2026  
**By:** GitHub Copilot Code Review  
**For:** @kaveesh
