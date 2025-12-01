# PageSage v1 - Security Threat Model

**Generated:** 2025-12-01
**Methodology:** STRIDE + OWASP Top 10 (2021)
**Status:** Pre-implementation

---

## Executive Summary

This document identifies security threats for all 11 user flows in PageSage v1 using STRIDE methodology and maps them to OWASP Top 10 vulnerabilities.

**Critical Findings:**
- 6 HIGH PRIORITY security gaps that must be addressed in requirements
- 4 MEDIUM PRIORITY gaps for implementation phase
- Performance target (<100ms) is achievable with proper security controls

---

## STRIDE Analysis by User Flow

### Flow 1: User Authentication & Authorization

#### Threats Identified

**S - Spoofing Identity**
- **Threat:** Attacker impersonates admin user
- **Attack Vector:** OAuth token theft, session hijacking
- **Current Mitigation:** httpOnly cookies ✓, 7-day timeout ✓
- **Gap:** OAuth state parameter validation not explicitly specified
- **Recommendation:** Add OAuth state validation to requirements
- **Severity:** HIGH

**T - Tampering with Data**
- **Threat:** Session cookie modification
- **Attack Vector:** User modifies session cookie to gain/maintain access
- **Current Mitigation:** None specified
- **Gap:** Session signing/encryption not mentioned
- **Recommendation:** Specify signed session cookies (HMAC-SHA256)
- **Severity:** MEDIUM

**R - Repudiation**
- **Threat:** Cannot prove who attempted unauthorized access
- **Attack Vector:** Failed login attempts not logged
- **Current Mitigation:** Auth event logging mentioned but not detailed
- **Gap:** No audit logging specification
- **Recommendation:** Log all auth events (success, failure, token refresh)
- **Severity:** MEDIUM

**I - Information Disclosure**
- **Threat:** GitHub service account token exposure
- **Attack Vector:** Token leaked in logs, error messages, code
- **Current Mitigation:** Environment variables ✓
- **Gap:** No token rotation strategy
- **Recommendation:** Document token rotation policy (90-day maximum)
- **Severity:** HIGH

**D - Denial of Service**
- **Threat:** Brute force login attempts
- **Current Mitigation:** Rate limiting on auth endpoints ✓
- **Status:** GOOD - Already specified
- **Severity:** LOW (mitigated)

**E - Elevation of Privilege**
- **Threat:** Second user gains admin access
- **Current Mitigation:** System blocks additional users ✓
- **Status:** GOOD - Already handled
- **Severity:** LOW (mitigated)

---

### Flow 2: Project Setup (PDF Upload)

#### Threats Identified

**T - Tampering**
- **Threat:** Malicious PDF upload containing malware
- **Attack Vector:** PDF contains executable code, exploits
- **Current Mitigation:** File validation mentioned ✓
- **Gap:** No virus/malware scanning specified
- **Recommendation:** Add malware scanning requirement (ClamAV or cloud service)
- **Severity:** HIGH

**I - Information Disclosure**
- **Threat:** Sensitive information in PDF metadata
- **Attack Vector:** PDF properties contain PII, internal paths
- **Current Mitigation:** Metadata extraction ✓
- **Gap:** No sanitization of extracted metadata
- **Recommendation:** Strip/sanitize PDF metadata before storage
- **Severity:** MEDIUM

**D - Denial of Service**
- **Threat:** Extremely large PDF upload
- **Current Mitigation:** 500MB file size limit ✓
- **Status:** GOOD - Already specified
- **Severity:** LOW (mitigated)

**Injection Attacks**
- **Threat:** Malicious filename (path traversal)
- **Attack Vector:** Filename like `../../etc/passwd` or `<script>alert()</script>`
- **Current Mitigation:** None specified
- **Gap:** No filename sanitization
- **Recommendation:** Sanitize filenames (alphanumeric + hyphen/underscore only)
- **Severity:** HIGH

---

### Flows 3-4: Image Processing & AI Layout Detection

#### Threats Identified

**I - Information Disclosure**
- **Threat:** Google AI API key exposure
- **Attack Vector:** API keys in logs, error messages, client-side code
- **Current Mitigation:** Environment variables ✓
- **Gap:** No key rotation, no secrets management tool
- **Recommendation:** Use secrets manager (HashiCorp Vault or cloud KMS)
- **Severity:** HIGH

**T - Tampering**
- **Threat:** Man-in-the-middle attack on API calls
- **Attack Vector:** Intercept/modify Google AI API requests
- **Current Mitigation:** Assumed HTTPS (not specified)
- **Gap:** No TLS/SSL requirements explicit
- **Recommendation:** Add HTTPS/TLS enforcement to requirements
- **Severity:** MEDIUM

**D - Denial of Service**
- **Threat:** Runaway API usage (cost explosion)
- **Current Mitigation:** Budget cap ✓, cost preview ✓
- **Status:** GOOD - Flow 10 handles this well
- **Severity:** LOW (mitigated)

---

### Flow 5: Annotation Editor (CRITICAL SECURITY SURFACE)

#### Threats Identified

**Cross-Site Scripting (XSS)**
- **Threat:** Script injection via annotation notes
- **Attack Vector:** User enters `<script>alert('XSS')</script>` in notes field
- **Current Mitigation:** Svelte auto-escapes ✓ (per CLAUDE.md)
- **Gap:** Should explicitly forbid `@html` directive in requirements
- **Recommendation:** Add "Never use @html in annotation fields" to security requirements
- **Severity:** HIGH

**Injection**
- **Threat:** Invalid coordinates crash browser or corrupt data
- **Attack Vector:** Enter coordinates like `-999999` or `NaN` or `Infinity`
- **Current Mitigation:** None specified
- **Gap:** No coordinate validation
- **Recommendation:** Validate: positive numbers, within image bounds, reasonable precision
- **Severity:** MEDIUM

**D - Denial of Service**
- **Threat:** Create thousands of bounding boxes to crash browser
- **Attack Vector:** Script or manual creation of 10,000+ boxes
- **Current Mitigation:** None specified (TODO #8 suggests 500 max)
- **Gap:** Not in requirements yet
- **Recommendation:** Add limit: 500 boxes per page, enforce in backend
- **Severity:** MEDIUM

---

### Flow 6: Version Tracking & History

#### Threats Identified

**T - Tampering**
- **Threat:** Admin modifies version history to hide changes
- **Attack Vector:** Direct git history manipulation
- **Current Mitigation:** Git immutability ✓
- **Status:** GOOD - Git provides tamper-evidence
- **Severity:** LOW (mitigated)

**R - Repudiation**
- **Threat:** False attribution of edits
- **Attack Vector:** Admin claims someone else made the edit
- **Current Mitigation:** GitHub commit attribution ✓
- **Gap:** No GPG commit signing mentioned
- **Recommendation:** Optional: GPG signing for extra verification (defer to v4)
- **Severity:** LOW (v1 is single user)

**I - Information Disclosure**
- **Threat:** Version data exposed publicly
- **Current Mitigation:** Private repository ✓
- **Status:** GOOD - Repository is private
- **Severity:** LOW (mitigated)

---

### Flows 7-8: OCR & Text Correction

#### Threats Identified

**Injection**
- **Threat:** OCR extracts malicious content from PDF
- **Attack Vector:** PDF contains `<script>` tags, OCR preserves them
- **Current Mitigation:** None specified
- **Gap:** No OCR output sanitization
- **Recommendation:** Sanitize OCR output before storage (HTML entity encoding)
- **Severity:** MEDIUM

**Data Integrity**
- **Threat:** Text encoding corruption (Devanagari characters)
- **Current Mitigation:** UTF-8 everywhere ✓ (CLAUDE.md)
- **Status:** GOOD - Already specified
- **Severity:** LOW (mitigated)

---

### Flow 9: Export to Markdown

#### Threats Identified

**Injection**
- **Threat:** YAML frontmatter injection
- **Attack Vector:** Special characters in book metadata break YAML parser
- **Current Mitigation:** None specified
- **Gap:** TODO #13 mentions edge cases but not in requirements
- **Recommendation:** YAML escape special characters (: [ ] { } etc.)
- **Severity:** MEDIUM

---

### Flow 11: Repository Management (CRITICAL)

#### Threats Identified

**E - Elevation of Privilege**
- **Threat:** GitHub service account token compromised
- **Attack Vector:** Token stolen from environment or logs
- **Impact:** Full access to all repositories, data loss
- **Current Mitigation:** Environment variables ✓
- **Gap:** No token rotation, permissions not specified
- **Recommendation:**
  - Least privilege: Only repo scope needed
  - Token rotation every 90 days
  - Never log token (scrub from logs)
- **Severity:** CRITICAL

---

## OWASP Top 10 (2021) Mapping

### A01: Broken Access Control
- **Status:** ✅ GOOD
- **Mitigation:** Single user, OAuth, session management, auth checks
- **Gap:** Need to verify EVERY API endpoint checks authentication

### A02: Cryptographic Failures
- **Status:** ⚠️ NEEDS WORK
- **Gaps:**
  - Session encryption not specified
  - Data-at-rest encryption not mentioned
  - Token storage security unclear
- **Recommendation:** Add cryptographic requirements section

### A03: Injection
- **Status:** ⚠️ NEEDS WORK
- **Gaps:**
  - No SQL injection (no SQL database) ✓
  - Command injection possible (git commits, filenames)
  - XSS prevention mentioned but not comprehensive
- **Recommendation:** Comprehensive input validation requirements

### A04: Insecure Design
- **Status:** ✅ GOOD
- **Note:** This threat modeling exercise addresses insecure design!

### A05: Security Misconfiguration
- **Status:** ❌ CRITICAL GAP
- **Missing:**
  - Content-Security-Policy (CSP) headers
  - Strict-Transport-Security (HSTS) headers
  - X-Frame-Options header
  - X-Content-Type-Options header
- **Note:** CLAUDE.md mentions CSP but not in REQUIREMENTS-v1.md
- **Recommendation:** Add "Security Headers" section to requirements

### A06: Vulnerable and Outdated Components
- **Status:** ✅ GOOD
- **Mitigation:** npm audit mentioned in CLAUDE.md ✓
- **Gap:** Not in REQUIREMENTS-v1.md
- **Recommendation:** Add to requirements

### A07: Identification and Authentication Failures
- **Status:** ✅ GOOD
- **Mitigation:** OAuth ✓, rate limiting ✓, session timeout ✓

### A08: Software and Data Integrity Failures
- **Status:** ✅ GOOD
- **Mitigation:** Git provides integrity ✓
- **Gap:** No SRI (Subresource Integrity) for CDN assets
- **Recommendation:** Use SRI for any external scripts/styles

### A09: Security Logging and Monitoring Failures
- **Status:** ⚠️ NEEDS WORK
- **Gap:** TODO #11 (Logging & Monitoring)
- **Recommendation:** Specify security event logging

### A10: Server-Side Request Forgery (SSRF)
- **Status:** ✅ LOW RISK
- **Note:** Only calls trusted Google AI APIs

---

## Critical Security Gaps Summary

### HIGH PRIORITY (Add to Requirements NOW)

#### 1. Security Headers
**Missing from REQUIREMENTS-v1.md:**
```
Content-Security-Policy: default-src 'self'; script-src 'self'; object-src 'none';
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: geolocation=(), microphone=(), camera=()
```

#### 2. Input Validation
**Systematically validate:**
- PDF filenames (path traversal prevention)
- Bounding box coordinates (bounds checking)
- Annotation notes (XSS prevention)
- Metadata fields (injection prevention)
- OCR output (sanitization)

#### 3. Secrets Management
**Specify:**
- Token rotation policy (90-day maximum)
- Secrets management tool (Vault, KMS, or SvelteKit $env/static/private)
- Never log sensitive values
- Least privilege permissions

#### 4. Audit Logging
**Log security events:**
- Authentication: login, logout, failures, token refresh
- Authorization: access denied attempts
- Data changes: all edits (git provides this ✓)
- Security events: suspicious activity, rate limit hits

#### 5. Rate Limiting
**Apply to:**
- Auth endpoints ✓ (already specified)
- Upload endpoints (NEW)
- API endpoints (NEW)
- Export endpoints (NEW)

#### 6. HTTPS/TLS Enforcement
**Specify:**
- HTTPS required for all connections
- TLS 1.2+ only
- Redirect HTTP → HTTPS
- Secure cookie flag enforced

---

### MEDIUM PRIORITY (Implementation Phase)

1. Malware scanning for PDF uploads
2. Session encryption specification
3. GPG commit signing (defer to v4)
4. YAML injection prevention
5. Coordinate validation
6. Box count limits (500 per page)

---

## Recommendations for REQUIREMENTS-v1.md

### Add New Section: "Security Requirements"

```markdown
## Security Requirements (v1)

### Authentication & Authorization
- GitHub OAuth only (no password authentication)
- Session management: httpOnly, secure, SameSite cookies
- 7-day session timeout with automatic refresh
- OAuth state parameter validation (CSRF prevention)
- Rate limiting: 5 attempts per minute per IP
- Authorization check on EVERY API endpoint

### Security Headers
- Content-Security-Policy (CSP)
- Strict-Transport-Security (HSTS)
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- (See security-threat-model.md for full spec)

### Input Validation
- PDF filename sanitization (alphanumeric + - _ . only)
- Bounding box coordinate validation (positive, in-bounds)
- Annotation note sanitization (never use @html)
- Metadata escaping (YAML-safe)
- OCR output sanitization (HTML entity encoding)

### Secrets Management
- All secrets in environment variables
- Token rotation: 90-day maximum
- Least privilege GitHub token (repo scope only)
- Never log sensitive values

### Audit Logging
- All authentication events
- Failed authorization attempts
- Security events (rate limits, suspicious activity)
- Version history via git (already specified)

### Network Security
- HTTPS/TLS 1.2+ required
- Redirect HTTP → HTTPS
- Secure and httpOnly flags on all cookies

### File Upload Security
- PDF validation before processing
- File size limit: 500MB (already specified)
- Malware scanning (ClamAV or cloud service)
- Reject executable content

### Data Security
- UTF-8 encoding everywhere (already specified)
- Private GitHub repositories only
- No sensitive data in logs
```

---

## Testing Requirements

Each threat should have corresponding security tests:

- SEC-AUTH-001: httpOnly cookie prevents XSS access
- SEC-AUTH-002: Secure flag prevents non-HTTPS transmission
- SEC-AUTH-003: CSRF token prevents cross-site requests
- SEC-AUTH-004: Session fixation attack prevented
- SEC-UPLOAD-001: Malicious filename rejected
- SEC-ANNOT-001: XSS in annotation notes prevented
- SEC-ANNOT-002: Invalid coordinates rejected
- SEC-ANNOT-003: Box count limit enforced

(See test-specifications.md for complete list)

---

## Tools & MCPs Recommended

### During Implementation:
- **SAST:** Semgrep, ESLint security plugins
- **Dependency Scanning:** npm audit, Snyk
- **Secret Scanning:** git-secrets, trufflehog

### Pre-deployment:
- **DAST:** OWASP ZAP
- **Penetration Testing:** Manual security review

---

## References

- STRIDE Threat Modeling: https://learn.microsoft.com/en-us/azure/security/develop/threat-modeling-tool-threats
- OWASP Top 10 (2021): https://owasp.org/Top10/
- OWASP Testing Guide: https://owasp.org/www-project-web-security-testing-guide/

---

## Change Log

- **2025-12-01:** Initial threat model created from REQUIREMENTS-v1.md
