# PageSage v1 - Test Specifications

**Generated:** 2025-12-01
**Target Coverage:** 80% minimum (85%+ preferred)
**Total Test Cases:** 206
**Status:** Pre-implementation

---

## Test Summary

| Category           | Count   | % of Total |
| ------------------ | ------- | ---------- |
| Unit Tests         | 87      | 42%        |
| Integration Tests  | 63      | 31%        |
| E2E Tests          | 39      | 19%        |
| Performance Tests  | 6       | 3%         |
| Security Tests     | 8       | 4%         |
| Data Quality Tests | 3       | 1%         |
| **Total**          | **206** | **100%**   |

---

## Test Cases by User Flow

### Flow 1: User Authentication & Authorization (18 tests)

#### Unit Tests

**UT-AUTH-001: OAuth callback validation**

- **Input:** Valid OAuth callback with code and state
- **Expected:** Session created, user redirected to dashboard
- **Coverage:** OAuth flow validation logic

**UT-AUTH-002: Session creation with valid OAuth response**

- **Input:** Valid GitHub OAuth response
- **Expected:** Session token created, stored in cookie
- **Coverage:** Session creation function

**UT-AUTH-003: Session rejection with invalid OAuth state**

- **Input:** OAuth callback with mismatched state parameter
- **Expected:** Error thrown, no session created
- **Coverage:** CSRF protection

**UT-AUTH-004: Session timeout after 7 days**

- **Input:** Session created 7 days + 1 second ago
- **Expected:** Session invalidated, auth check fails
- **Coverage:** Session expiration logic

**UT-AUTH-005: First user becomes admin**

- **Input:** No existing users, OAuth login completes
- **Expected:** User role set to "admin"
- **Coverage:** Admin assignment logic

**UT-AUTH-006: Second user blocked with error**

- **Input:** Admin exists, second user attempts OAuth login
- **Expected:** Error: "This is a single-user tool"
- **Coverage:** Single-user enforcement

#### Integration Tests

**IT-AUTH-001: Complete OAuth flow**

- **Steps:**
  1. Initiate GitHub OAuth
  2. User authorizes on GitHub
  3. Callback received
  4. Session created
  5. Redirect to dashboard
- **Expected:** User authenticated and on dashboard
- **Coverage:** End-to-end OAuth integration

**IT-AUTH-002: Session persists across requests**

- **Steps:**
  1. Log in
  2. Make 10 API requests
  3. Verify session valid for all
- **Expected:** All requests authenticated
- **Coverage:** Session persistence

**IT-AUTH-003: Session cleanup on logout**

- **Steps:**
  1. Log in
  2. Log out
  3. Attempt API request
- **Expected:** Request returns 401 Unauthorized
- **Coverage:** Logout functionality

**IT-AUTH-004: Rate limiting on auth endpoints**

- **Steps:**
  1. Attempt login 10 times in 1 minute
  2. Verify blocked after 5 attempts
- **Expected:** Rate limit error after 5 attempts
- **Coverage:** Rate limiting integration

#### E2E Tests

**E2E-AUTH-001: New user first-time setup**

- **Scenario:** Brand new deployment, no users
- **Steps:**
  1. Navigate to app URL
  2. Redirected to login
  3. Click "Sign in with GitHub"
  4. Authorize on GitHub
  5. Redirected to dashboard
- **Expected:** Admin user created, dashboard shown
- **Coverage:** Complete first-time setup flow

**E2E-AUTH-002: Admin login and dashboard access**

- **Scenario:** Existing admin user
- **Steps:**
  1. Navigate to app URL
  2. Sign in with GitHub
  3. Access dashboard
- **Expected:** Dashboard loads with project list
- **Coverage:** Standard login flow

**E2E-AUTH-003: Unauthenticated access redirects**

- **Scenario:** No active session
- **Steps:**
  1. Navigate directly to /projects
  2. Verify redirect to /login
- **Expected:** Redirected to login page
- **Coverage:** Auth middleware protection

**E2E-AUTH-004: Session expiry redirects**

- **Scenario:** Expired session
- **Steps:**
  1. Mock expired session (7+ days old)
  2. Attempt to access protected route
  3. Verify redirect to login
- **Expected:** Redirected with "Session expired" message
- **Coverage:** Session expiration handling

#### Security Tests

**SEC-AUTH-001: httpOnly cookie prevents XSS**

- **Test:** Attempt to access session cookie via JavaScript
- **Expected:** Cookie not accessible from client-side JS
- **Tool:** Browser DevTools

**SEC-AUTH-002: Secure flag prevents non-HTTPS**

- **Test:** Attempt to send session cookie over HTTP
- **Expected:** Cookie not sent over HTTP connection
- **Tool:** Network inspection

**SEC-AUTH-003: CSRF protection**

- **Test:** Submit auth request without CSRF token
- **Expected:** Request rejected
- **Tool:** Custom test script

**SEC-AUTH-004: Session fixation prevention**

- **Test:** Attempt to fixate session ID before login
- **Expected:** New session ID generated after login
- **Tool:** Session inspection

---

### Flow 2: Project Setup - PDF Upload (12 tests)

#### Unit Tests

**UT-PROJ-001: PDF validation**

- **Input:** Valid PDF file
- **Expected:** Validation passes
- **Coverage:** PDF format validation

**UT-PROJ-002: PDF size validation**

- **Input:** 600MB PDF file
- **Expected:** Validation fails with "File too large (max 500MB)"
- **Coverage:** File size limits

**UT-PROJ-003: PDF metadata extraction**

- **Input:** PDF with title, author, page count in properties
- **Expected:** Metadata extracted correctly
- **Coverage:** Metadata parsing

**UT-PROJ-004: Filename sanitization**

- **Input:** Filename with path traversal: `../../etc/passwd.pdf`
- **Expected:** Sanitized to `etc-passwd.pdf`
- **Coverage:** Security - filename sanitization

**UT-PROJ-005: Duplicate project name handling**

- **Input:** Project name that already exists
- **Expected:** Error or auto-increment name
- **Coverage:** Uniqueness validation

#### Integration Tests

**IT-PROJ-001: Upload to storage**

- **Steps:**
  1. Upload 50MB PDF
  2. Extract metadata
  3. Create project
  4. Store PDF in repository
- **Expected:** Project created, PDF stored
- **Coverage:** Full upload pipeline

**IT-PROJ-002: Large PDF upload succeeds**

- **Input:** 450MB PDF (under limit)
- **Expected:** Upload completes, project created
- **Coverage:** Large file handling

**IT-PROJ-003: Oversized PDF rejected**

- **Input:** 600MB PDF (over limit)
- **Expected:** Upload rejected before processing
- **Coverage:** Size limit enforcement

**IT-PROJ-004: Corrupted PDF rejected**

- **Input:** Corrupted/invalid PDF file
- **Expected:** Clear error message, no project created
- **Coverage:** Error handling

#### E2E Tests

**E2E-PROJ-001: Create project from 100-page PDF**

- **Scenario:** Full project creation workflow
- **Steps:**
  1. Log in
  2. Click "New Project"
  3. Upload 100-page PDF
  4. Fill in metadata
  5. Click "Create"
- **Expected:** Project created, redirected to project page
- **Coverage:** Complete project creation

**E2E-PROJ-002: Non-ASCII title (Sanskrit)**

- **Input:** Project title with Devanagari characters
- **Expected:** Title stored and displayed correctly
- **Coverage:** UTF-8 handling

**E2E-PROJ-003: Missing metadata prompts user**

- **Input:** PDF with no title/author metadata
- **Expected:** Form prompts user to enter metadata
- **Coverage:** Metadata fallback

---

### Flow 5: Annotation Editor (27 tests) - MOST CRITICAL

#### Unit Tests

**UT-ANNOT-001: Create bounding box**

- **Input:** Start coordinates (100, 200), end coordinates (300, 400)
- **Expected:** Box created with correct dimensions
- **Coverage:** Box creation logic

**UT-ANNOT-002: Move bounding box**

- **Input:** Existing box, drag delta (+50, +30)
- **Expected:** Box coordinates updated
- **Coverage:** Box movement logic

**UT-ANNOT-003: Resize bounding box**

- **Input:** Existing box, resize handle drag
- **Expected:** Box dimensions updated
- **Coverage:** Resize logic

**UT-ANNOT-004: Delete bounding box**

- **Input:** Box ID to delete
- **Expected:** Box removed from state
- **Coverage:** Deletion logic

**UT-ANNOT-005: Undo operation**

- **Input:** Action history with 3 actions
- **Expected:** Last action reversed, state restored
- **Coverage:** Undo/redo logic

**UT-ANNOT-006: Coordinate validation (negative)**

- **Input:** Box with negative X coordinate: (-100, 200)
- **Expected:** Validation error: "Coordinates must be positive"
- **Coverage:** Input validation

**UT-ANNOT-007: Coordinate validation (out of bounds)**

- **Input:** Box coordinates exceed image dimensions
- **Expected:** Validation error or clamp to bounds
- **Coverage:** Bounds checking

**UT-ANNOT-008: Reading order calculation**

- **Input:** 5 boxes with different positions
- **Expected:** Reading order calculated correctly (top-to-bottom, left-to-right)
- **Coverage:** Reading order algorithm

**UT-ANNOT-009: Visual distinction (AI vs user)**

- **Input:** Box with `source: "ai"` vs `source: "user"`
- **Expected:** Different styles applied
- **Coverage:** Visual styling logic

#### Performance Tests (CRITICAL - <100ms requirement)

**PERF-ANNOT-001: Box drag response time**

- **Test:** Drag box 100 times, measure response time
- **Target:** <100ms average, <150ms p99
- **Tool:** Performance.now() timing

**PERF-ANNOT-002: Box resize response time**

- **Test:** Resize box 100 times, measure response time
- **Target:** <100ms average, <150ms p99
- **Tool:** Performance.now() timing

**PERF-ANNOT-003: Create new box**

- **Test:** Create 50 boxes, measure creation time
- **Target:** <100ms per creation
- **Tool:** Performance.now() timing

**PERF-ANNOT-004: Pan canvas**

- **Test:** Pan canvas 100 times, measure response
- **Target:** <100ms, 60fps maintained
- **Tool:** Chrome DevTools Performance

**PERF-ANNOT-005: Zoom in/out**

- **Test:** Zoom 50 times, measure response
- **Target:** <100ms per zoom operation
- **Tool:** Chrome DevTools Performance

**PERF-ANNOT-006: Heavy load (500 boxes)**

- **Test:** Render page with 500 bounding boxes
- **Target:** Initial render <1000ms, interactions <100ms
- **Tool:** Lighthouse, Performance profiler

#### Integration Tests

**IT-ANNOT-001: Edit creates version**

- **Steps:**
  1. Edit bounding box
  2. Verify new version record created
  3. Check version history
- **Expected:** Version 2 created with change details
- **Coverage:** Version tracking integration

**IT-ANNOT-002: Autosave triggers**

- **Steps:**
  1. Make edit
  2. Wait 30 seconds
  3. Verify autosave triggered
- **Expected:** Changes saved to backend
- **Coverage:** Autosave logic

**IT-ANNOT-003: Changes committed to GitHub**

- **Steps:**
  1. Make annotation changes
  2. Trigger save
  3. Verify git commit created
- **Expected:** Commit with proper message in GitHub repo
- **Coverage:** GitHub integration

**IT-ANNOT-004: Version history loads**

- **Steps:**
  1. Create 5 versions
  2. Load version history
  3. Verify all versions present
- **Expected:** All 5 versions shown with details
- **Coverage:** History loading

#### E2E Tests

**E2E-ANNOT-001: Complete annotation workflow**

- **Scenario:** Annotate one full page
- **Steps:**
  1. Open page in editor
  2. View AI-generated boxes
  3. Move 2 boxes
  4. Create 1 new box
  5. Delete 1 box
  6. Mark page as reviewed
- **Expected:** All changes saved, page marked reviewed
- **Coverage:** Complete annotation flow

**E2E-ANNOT-002: Mark page as reviewed**

- **Steps:**
  1. Complete page edits
  2. Click "Mark as Reviewed"
  3. Verify status changes
- **Expected:** Page status = "reviewed"
- **Coverage:** Review workflow

**E2E-ANNOT-003: Page navigation preserves state**

- **Steps:**
  1. Make changes on page 1
  2. Navigate to page 2
  3. Navigate back to page 1
- **Expected:** Page 1 changes preserved
- **Coverage:** State management

**E2E-ANNOT-004: Concurrent tabs warning**

- **Steps:**
  1. Open editor in tab A
  2. Open same page in tab B
  3. Verify warning shown
- **Expected:** Warning about concurrent editing
- **Coverage:** Concurrent access handling

#### Security Tests

**SEC-ANNOT-001: XSS in annotation notes**

- **Test:** Enter `<script>alert('XSS')</script>` in notes field
- **Expected:** Script not executed, displayed as text
- **Tool:** Manual testing

**SEC-ANNOT-002: Invalid coordinates rejected**

- **Test:** Submit box with coordinates: `{"x": "'; DROP TABLE boxes; --"}`
- **Expected:** Validation error, no injection
- **Tool:** API testing tool

**SEC-ANNOT-003: Box count limit enforced**

- **Test:** Attempt to create 501 boxes on one page
- **Expected:** Error after 500: "Maximum boxes per page reached"
- **Tool:** Test script

---

### Flows 7-8: OCR & Text Correction (17 tests)

#### Unit Tests

**UT-OCR-001: Devanagari OCR engine selection**

- **Input:** Text box labeled "language: hindi"
- **Expected:** Devanagari OCR engine selected
- **Coverage:** Engine selection logic

**UT-OCR-002: IAST OCR engine selection**

- **Input:** Text box labeled "language: iast"
- **Expected:** IAST transliteration OCR engine
- **Coverage:** IAST handling

**UT-OCR-003: English OCR engine selection**

- **Input:** Text box labeled "language: english"
- **Expected:** English OCR engine
- **Coverage:** Multi-language support

**UT-OCR-004: Confidence score storage**

- **Input:** OCR result with confidence: 0.87
- **Expected:** Confidence stored with text
- **Coverage:** Metadata storage

**UT-OCR-005: UTF-8 text encoding validation**

- **Input:** OCR text with Devanagari characters
- **Expected:** Text stored as valid UTF-8
- **Coverage:** Encoding handling

**UT-OCR-006: Preserve original OCR**

- **Input:** OCR result, then user correction
- **Expected:** Original OCR preserved in separate field
- **Coverage:** Data integrity

**UT-OCR-007: Text correction version record**

- **Input:** User corrects OCR text
- **Expected:** New version created with before/after
- **Coverage:** Version tracking

#### Integration Tests

**IT-OCR-001: Mixed-language page OCR**

- **Input:** Page with Sanskrit, Hindi, and English
- **Expected:** Correct engine used for each box
- **Coverage:** Multi-language processing

**IT-OCR-002: Cost tracking for OCR**

- **Input:** OCR 100 pages
- **Expected:** Cost logged for each page
- **Coverage:** Cost tracking integration

**IT-OCR-003: Failed OCR retry**

- **Input:** OCR request that fails (timeout)
- **Expected:** Retry 3 times with backoff
- **Coverage:** Error handling

**IT-OCR-004: Batch OCR processing**

- **Input:** 50 pages queued for OCR
- **Expected:** All processed, status tracked
- **Coverage:** Batch processing

#### E2E Tests

**E2E-OCR-001: Extract text from 10 pages**

- **Steps:**
  1. Select pages 1-10
  2. Click "Extract Text"
  3. Wait for completion
  4. Verify text extracted
- **Expected:** All 10 pages have OCR text
- **Coverage:** Full OCR workflow

**E2E-OCR-002: Correct low-confidence results**

- **Steps:**
  1. View OCR results
  2. Filter by low confidence (<80%)
  3. Correct 5 text boxes
  4. Save corrections
- **Expected:** Corrections saved, versions created
- **Coverage:** Correction workflow

**E2E-OCR-003: Preview before full OCR**

- **Steps:**
  1. Select "Preview with 10 pages"
  2. Review cost estimate
  3. View sample results
  4. Decide to proceed
- **Expected:** Cost shown, samples accurate
- **Coverage:** Preview feature

#### Data Quality Tests

**DQ-OCR-001: Devanagari preservation**

- **Input:** OCR text: "धर्मक्षेत्रे कुरुक्षेत्रे"
- **Expected:** All characters preserved correctly
- **Tool:** Character-by-character comparison

**DQ-OCR-002: IAST diacritic preservation**

- **Input:** OCR text: "dharmakṣetre kurukṣetre"
- **Expected:** All diacritics (ṣ, ṛ, etc.) preserved
- **Tool:** Unicode codepoint validation

**DQ-OCR-003: Special character handling**

- **Input:** OCR text with quotes, dashes, ellipses
- **Expected:** Special characters preserved
- **Tool:** Character validation

---

## Additional Test Categories

### Flow 3: Image Processing (16 tests)

- 8 unit tests (deskew, crop, denoise algorithms)
- 5 integration tests (batch processing, retry logic)
- 3 E2E tests (full page preprocessing)

### Flow 4: AI Layout Detection (20 tests)

- 10 unit tests (detection algorithms, labeling)
- 6 integration tests (API integration, cost tracking)
- 4 E2E tests (multi-column layouts, footnotes)

### Flow 6: Version Tracking (25 tests)

- 12 unit tests (version creation, diff, revert)
- 8 integration tests (git operations)
- 5 E2E tests (history UI, comparisons)

### Flow 9: Export (15 tests)

- 8 unit tests (markdown generation, YAML)
- 4 integration tests (export to repo)
- 3 E2E tests (preview, download)

### Flow 10: Cost Tracking (20 tests)

- 10 unit tests (calculations, budget checks)
- 6 integration tests (real-time tracking)
- 4 E2E tests (budget enforcement)

### Flow 11: Repository Management (23 tests)

- 8 unit tests (commit messages)
- 10 integration tests (GitHub API)
- 5 E2E tests (repo operations)

---

## Test Coverage Requirements

### Minimum Coverage Targets

| Category   | Target |
| ---------- | ------ |
| Statements | 80%    |
| Branches   | 75%    |
| Functions  | 85%    |
| Lines      | 80%    |

### Critical Paths (Must be 100%)

- Authentication flow
- Annotation editor core functions
- Version tracking
- Cost calculation
- GitHub commit operations

---

## Testing Tools & Framework

### Unit & Integration Tests

- **Framework:** Vitest ✓ (vitest-runner MCP available)
- **Mocking:** vi.mock() for external APIs
- **Assertions:** expect() with custom matchers

### E2E Tests

- **Framework:** Playwright
- **Browsers:** Chromium, Firefox, WebKit
- **Headless:** Yes (for CI/CD)

### Performance Tests

- **Tool:** Lighthouse, Chrome DevTools
- **Metrics:** FCP, LCP, TBT, CLS
- **Custom:** Performance.now() for <100ms validation

### Security Tests

- **SAST:** Semgrep, ESLint security plugins
- **DAST:** OWASP ZAP (pre-deployment)
- **Manual:** Penetration testing

---

## Test Data Requirements

### Sample PDFs Needed

1. **Small (10 pages):** Quick testing
2. **Medium (100 pages):** Standard workflow
3. **Large (500 pages):** Performance/scale testing
4. **Sanskrit/Hindi:** Devanagari script testing
5. **English:** Roman script testing
6. **Mixed-language:** Multi-language testing
7. **Complex layout:** Multi-column, footnotes
8. **Corrupted:** Error handling testing

### Mock Data

- GitHub API responses
- Google AI API responses (OCR, layout detection)
- User authentication tokens
- Cost tracking data

---

## CI/CD Integration

### Pre-commit

- Run unit tests
- Run linting
- Check test coverage

### Pull Request

- Run all tests (unit + integration)
- Generate coverage report
- Block merge if coverage <80%

### Pre-deployment

- Run E2E tests
- Run security tests
- Run performance tests

---

## Test Priorities

### Phase 1 (MVP)

1. Authentication tests ✓
2. Annotation editor tests ✓
3. Version tracking tests ✓

### Phase 2 (Core Features)

4. OCR tests ✓
5. Cost tracking tests ✓
6. GitHub integration tests ✓

### Phase 3 (Polish)

7. Performance tests ✓
8. Security tests ✓
9. Data quality tests ✓

---

## Success Metrics

- ✅ 80%+ test coverage achieved
- ✅ All critical paths at 100% coverage
- ✅ <100ms performance target validated
- ✅ Zero high-severity security vulnerabilities
- ✅ All E2E tests passing on CI/CD

---

## References

- Vitest Documentation: https://vitest.dev/
- Playwright Documentation: https://playwright.dev/
- Testing Library: https://testing-library.com/
- Test-Driven Development (TDD): https://martinfowler.com/bliki/TestDrivenDevelopment.html

---

## Change Log

- **2025-12-01:** Initial test specifications created (206 test cases)
