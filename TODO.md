# PageSage v1 - Requirements Gaps TODO

**Generated:** 2025-12-01
**Status:** Pre-implementation planning phase

This document tracks critical gaps identified in REQUIREMENTS-v1.md that must be addressed before or during implementation.

---

## 🚨 CRITICAL GAPS (Must Resolve Before Implementation)

### 1. Storage Architecture Decision
**Priority:** HIGHEST - BLOCKING
**Status:** ✅ COMPLETE (2025-12-02)

**Problem:**
- PDFs can be 500MB (GitHub has 100MB file limit per file)
- 1000-page book = 1000+ images @ 1-5MB each = potentially GBs of data
- GitHub repos have practical limits (~5GB recommended, 100GB hard limit)

**Tasks:**
- [x] Research GitHub LFS capabilities and pricing
- [x] Research S3/cloud storage options and costs
- [x] Decide: GitHub LFS vs S3 vs Local filesystem vs Hybrid
- [x] Document storage architecture decision in ADR
- [x] Update REQUIREMENTS-v1.md with storage strategy
- [x] Specify storage limits (max book size, max images, etc.)

**Decision: Hybrid Architecture (GitHub + Google Drive)**

**Chosen Approach:**
- **GitHub repositories** (free): JSON annotations, metadata, version history
- **Google Drive** (15GB free): PDFs and page images (immutable assets)

**Rationale:**
- Maximizes free tier storage (15GB vs 5GB for Google Cloud Storage)
- Cost-optimized: $0/month for ~6 large books
- Git-friendly diffs for annotations
- Simple OAuth setup
- Easy manual file inspection

**Documentation:**
- ADR: `docs/adr/001-storage-architecture.md`
- Requirements: REQUIREMENTS-v1.md § Storage Architecture

**Storage Limits:**
- Max PDF: 500MB
- Max pages per book: 2000
- Max image size: 5MB/page (typical: 2MB)
- Free tier capacity: ~6 large books (12GB used, 3GB buffer)

---

### 2. GitHub Service Account Setup Documentation
**Priority:** CRITICAL - BLOCKING
**Status:** ❌ Not Started

**Problem:**
- Flow 11 (Repository Management) mentions "service account" but zero setup docs
- Required for automated git commits and repository creation

**Tasks:**
- [ ] Document GitHub service account creation process
- [ ] Specify required permissions/scopes (repo, admin:org, etc.)
- [ ] Document token generation and secure storage
- [ ] Decide: GitHub Organization vs Personal Account strategy
- [ ] Create setup guide in docs/github-setup.md
- [ ] Add to "Next Steps" in REQUIREMENTS-v1.md
- [ ] Add to environment variable documentation

**Required Permissions:**
- repo (full control of private repositories)
- workflow (if using GitHub Actions)
- admin:org (if using organization)

---

### 3. Job Queue Infrastructure Selection
**Priority:** CRITICAL - BLOCKING
**Status:** ❌ Not Started

**Problem:**
- Image processing, OCR, and layout detection need async job processing
- No queue system specified in requirements

**Tasks:**
- [ ] Research SvelteKit job queue options
- [ ] Evaluate: Redis + BullMQ vs Database-backed vs In-memory
- [ ] Consider: pg-boss, BullMQ, Inngest, or SvelteKit native
- [ ] Document job queue architecture decision in ADR
- [ ] Update REQUIREMENTS-v1.md with job queue strategy
- [ ] Specify job retry logic and failure handling
- [ ] Document job monitoring and manual intervention

**Decision Criteria:**
- Persistence (survive server restarts?)
- Cost (Redis hosting vs included in existing services)
- Complexity (setup and maintenance)
- Observability (job status tracking)

---

### 4. Google AI API Service Selection
**Priority:** HIGH - AFFECTS COST ESTIMATES
**Status:** ❌ Not Started

**Problem:**
- Requirements say "Google Document AI or Gemini" - need to choose
- Different pricing, capabilities, quotas

**Tasks:**
- [ ] Compare Google Document AI vs Gemini Vision capabilities
- [ ] Compare pricing models and quotas
- [ ] Test both with sample Sanskrit/Hindi/English pages
- [ ] Evaluate OCR accuracy for Devanagari script
- [ ] Evaluate layout detection quality
- [ ] Document API choice decision in ADR
- [ ] Update cost estimates in REQUIREMENTS-v1.md Flow 10
- [ ] Update REQUIREMENTS-v1.md Flow 4 (AI Layout) and Flow 7 (OCR)

**Evaluation Points:**
- Cost per page
- Devanagari OCR accuracy
- IAST transliteration support
- Layout detection quality (multi-column, footnotes)
- Rate limits and quotas

---

### 5. Complete Data Schemas Definition
**Priority:** HIGH - NEEDED FOR IMPLEMENTATION
**Status:** ✅ COMPLETE (2025-12-05)

**Problem:**
- Only version history JSON example provided
- Need schemas for all data structures

**Tasks:**
- [x] Define `metadata.json` schema (project metadata)
- [x] Define user profile schema (for authentication)
- [x] Define cost tracking log schema (`costs.jsonl`)
- [x] Define bounding box coordinate system (origin, units, precision)
- [x] Define OCR result format schema
- [x] Define export configuration schema
- [x] Define image metadata schema (DPI, dimensions, format)
- [x] Add "Data Schemas" section to REQUIREMENTS-v1.md
- [x] Create TypeScript interfaces for all schemas
- [ ] Add JSON Schema validation files (implementation task)

**Completed:**
- Created comprehensive `docs/data-schemas.md` with all 9 schemas
- Defined TypeScript interfaces for all data structures
- Documented coordinate system (top-left origin, integer pixels)
- Specified JSONL format for cost logs (append-only, git-friendly)
- Included data integrity validation requirements
- Added examples for all schemas

**Schemas Needed:**
```
schemas/
  metadata.schema.json         # Project metadata
  user-profile.schema.json     # User authentication data
  cost-log.schema.json         # Cost tracking entries
  bounding-box.schema.json     # Annotation bounding boxes
  ocr-result.schema.json       # OCR output format
  export-config.schema.json    # Export settings
  image-metadata.schema.json   # Page image properties
```

---

## ⚠️ IMPORTANT GAPS (Address During Implementation)

### 6. Environment Configuration Documentation
**Priority:** HIGH
**Status:** ❌ Not Started

**Tasks:**
- [ ] Create `.env.example` file with all required variables
- [ ] Document each environment variable with comments
- [ ] Add environment validation on server startup
- [ ] Create setup documentation in docs/setup.md
- [ ] Add to "Next Steps" in REQUIREMENTS-v1.md

**Required Variables:**
```bash
# GitHub OAuth
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
GITHUB_CALLBACK_URL=
GITHUB_SERVICE_ACCOUNT_TOKEN=
GITHUB_ORG=

# Google AI
GOOGLE_AI_API_KEY=
GOOGLE_PROJECT_ID=
GOOGLE_AI_SERVICE=          # document-ai | gemini

# Sessions
SESSION_SECRET=
SESSION_TIMEOUT=604800      # 7 days in seconds

# Storage
STORAGE_BACKEND=            # github-lfs | s3 | local
STORAGE_PATH=               # For local storage
AWS_ACCESS_KEY_ID=          # For S3
AWS_SECRET_ACCESS_KEY=      # For S3
AWS_BUCKET=                 # For S3
AWS_REGION=                 # For S3

# Job Queue
REDIS_URL=                  # If using Redis for jobs
JOB_CONCURRENCY=2           # Max concurrent jobs

# Cost Tracking
MONTHLY_BUDGET_USD=100
CURRENCY=USD

# Application
NODE_ENV=development
PORT=3000
PUBLIC_URL=
```

---

### 7. Error Recovery Strategy Documentation
**Priority:** HIGH
**Status:** ❌ Not Started

**Tasks:**
- [ ] Document partial failure recovery strategy
- [ ] Document crash recovery (mid-processing)
- [ ] Document GitHub push failure handling
- [ ] Document network timeout strategies for all APIs
- [ ] Document transaction rollback strategy
- [ ] Add "Error Recovery" section to REQUIREMENTS-v1.md
- [ ] Implement job resumption logic
- [ ] Implement draft state recovery

**Scenarios to Handle:**
- Server crash during image processing
- GitHub API failure during commit
- Google AI API timeout during OCR
- Browser crash during annotation editing
- Network disconnection during upload
- Out of memory during large PDF processing

---

### 8. Scale Limits & Constraints Documentation
**Priority:** HIGH
**Status:** ❌ Not Started

**Tasks:**
- [ ] Define maximum pages per book
- [ ] Define maximum PDF file size
- [ ] Define maximum image dimensions
- [ ] Define maximum bounding boxes per page
- [ ] Define maximum concurrent processing jobs
- [ ] Define browser memory limits for annotation editor
- [ ] Add "Scale Limits" section to REQUIREMENTS-v1.md
- [ ] Implement validation for all limits
- [ ] Display limits in UI

**Proposed Limits (to validate):**
- Max pages per book: 2000 pages
- Max PDF size: 500MB (already specified)
- Max image dimensions: 10000x10000 pixels
- Max bounding boxes per page: 500 boxes
- Max concurrent jobs: 2 (single user, cost control)
- Max annotation editor memory: 2GB

---

### 9. Authentication Edge Cases Documentation
**Priority:** MEDIUM
**Status:** ❌ Not Started

**Tasks:**
- [ ] Document GitHub service downtime handling
- [ ] Document admin user change/reset process
- [ ] Document session cleanup/garbage collection
- [ ] Document authentication event logging
- [ ] Add auth monitoring dashboard
- [ ] Update Flow 1 in REQUIREMENTS-v1.md

**Edge Cases:**
- GitHub OAuth service is down
- Need to change admin user (transfer ownership)
- Session table grows indefinitely
- Suspicious login attempts
- OAuth token revoked

---

### 10. Browser State Management Specification
**Priority:** MEDIUM
**Status:** ❌ Not Started

**Tasks:**
- [ ] Document autosave strategy (already mentions 30s)
- [ ] Document draft state storage (localStorage? IndexedDB?)
- [ ] Document concurrent tab handling
- [ ] Document browser crash recovery
- [ ] Document unsaved changes warning
- [ ] Update Flow 5 in REQUIREMENTS-v1.md

**Scenarios:**
- User closes browser with unsaved changes
- User opens same project in 2 tabs
- Browser crashes during editing
- Autosave conflicts between tabs

---

### 11. Logging & Monitoring Strategy
**Priority:** MEDIUM
**Status:** ❌ Not Started

**Tasks:**
- [ ] Define logging format (JSON structured logs?)
- [ ] Define log destinations (stdout, file, cloud service?)
- [ ] Define log levels and filtering
- [ ] Document what events to log
- [ ] Create health check endpoints
- [ ] Define monitoring metrics
- [ ] Add "Operational Requirements" section to REQUIREMENTS-v1.md

**Events to Log:**
- Authentication (success, failure)
- API calls (Google AI, GitHub)
- Job processing (start, complete, fail)
- Cost tracking events
- Errors and exceptions
- Performance metrics

---

### 12. Deployment & Infrastructure Documentation
**Priority:** MEDIUM
**Status:** ❌ Not Started

**Tasks:**
- [ ] Choose deployment platform (Vercel, AWS, Railway, self-hosted)
- [ ] Document deployment process
- [ ] Create deployment checklist
- [ ] Document environment setup for production
- [ ] Document backup strategy beyond git
- [ ] Add "Deployment" section to REQUIREMENTS-v1.md

**Platform Considerations:**
- Vercel: Easy SvelteKit deployment, serverless functions
- AWS: Full control, higher complexity
- Railway: Simple, good for Docker
- Self-hosted: Complete control, more maintenance

---

## 📋 NICE-TO-HAVE (Can Document as Limitations)

### 13. Additional Edge Cases Documentation
**Priority:** LOW
**Status:** ❌ Not Started

**Tasks:**
- [ ] Document rotated page handling (90°, 180°, 270°)
- [ ] Document mixed orientation handling
- [ ] Document image-only page handling
- [ ] Document overlapping bounding box handling
- [ ] Document special character handling in metadata
- [ ] Update relevant flows in REQUIREMENTS-v1.md

---

### 14. Testing Strategy Documentation
**Priority:** LOW
**Status:** ❌ Not Started

**Tasks:**
- [ ] Document test data requirements (sample PDFs)
- [ ] Document external API mocking approach
- [ ] Document performance testing targets
- [ ] Create sample test PDFs (Sanskrit, Hindi, English)
- [ ] Add "Testing Strategy" section to REQUIREMENTS-v1.md

---

### 15. Admin Dashboard/Monitoring UI
**Priority:** LOW (v1 is single user)
**Status:** ❌ Not Started

**Tasks:**
- [ ] Design simple admin dashboard
- [ ] Show: active jobs, costs, storage usage
- [ ] Allow manual job intervention (cancel, retry)
- [ ] Add to REQUIREMENTS-v1.md as optional feature

---

## 📊 Summary

**Total Items:** 15
- **Critical (Blocking):** 5 ⛔ (2 complete, 3 remaining)
- **Important (High Priority):** 7 ⚠️
- **Nice-to-Have (Low Priority):** 3 📋

**Status:**
- ❌ Not Started: 13
- 🏗️ In Progress: 0
- ✅ Complete: 2

---

## 🎯 Recommended Implementation Order

### Phase 0: Pre-Implementation (Do First)
1. Storage Architecture Decision (#1)
2. GitHub Service Account Setup (#2)
3. Job Queue Infrastructure (#3)
4. Google AI API Selection (#4)
5. Complete Data Schemas (#5)

### Phase 1: Foundation
6. Environment Configuration (#6)
7. Authentication Implementation (with edge cases #9)
8. Error Recovery Strategy (#7)

### Phase 2: Core Features
9. Scale Limits Implementation (#8)
10. Browser State Management (#10)
11. Logging & Monitoring (#11)

### Phase 3: Deployment
12. Deployment & Infrastructure (#12)

### Phase 4: Polish
13. Additional Edge Cases (#13)
14. Testing Strategy (#14)
15. Admin Dashboard (#15) - optional

---

## 📝 Notes

- This TODO is based on thoughtbox analysis of REQUIREMENTS-v1.md
- Many items will result in updates to REQUIREMENTS-v1.md
- Consider creating Architecture Decision Records (ADRs) for major decisions
- Some items can be addressed incrementally during development
- v1 is single-user, so some complexities are deferred to v4

---

## 🔄 Update Log

- **2025-12-01:** Initial TODO created from requirements gap analysis
- **2025-12-02:** ✅ Completed #1 Storage Architecture Decision (Hybrid: GitHub + Google Drive)
- **2025-12-05:** ✅ Completed #5 Complete Data Schemas Definition (docs/data-schemas.md)
