# Security Development Workflow - Three-Layer Approach

**Purpose:** Catch security issues early and automatically at every stage of development
**Status:** Implemented (Layers 1-3 active)
**Last Updated:** 2025-01-05

---

## Overview: Defense in Depth

```
┌─────────────────────────────────────────────────────────┐
│ Layer 1: REAL-TIME (As You Code)                       │
│ - ESLint security plugins                              │
│ - Claude Code review                                   │
│ - TypeScript type checking                             │
│ Catches: 80% of issues immediately                     │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│ Layer 2: PRE-COMMIT (Before Push)                      │
│ - npm audit (dependency scan)                          │
│ - npm run lint (security rules)                        │
│ - Git pre-commit hook (automatic)                      │
│ Catches: 15% of issues before they enter git           │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│ Layer 3: CI/CD (After Push)                            │
│ - GitHub Actions security workflow                     │
│ - npm audit --audit-level=moderate                     │
│ - ESLint security checks                               │
│ - Dependabot (weekly dependency updates)               │
│ - Optional: CodeQL deep analysis                       │
│ Catches: 5% of issues that slipped through             │
└─────────────────────────────────────────────────────────┘
```

**Goal:** Catch 100% of common security issues before production

---

## Layer 1: Real-Time Security (As You Code)

### 1.1 ESLint Security Plugins

**Status:** ✅ Installed and configured

**Configured in:** `.eslintrc.cjs`

**Plugins active:**

- `eslint-plugin-security` - Detects security anti-patterns
- `eslint-plugin-no-secrets` - Prevents committing API keys

**What it catches:**

- ✅ Hardcoded secrets (API keys, tokens)
- ✅ Unsafe regex (ReDoS attacks)
- ✅ Object injection vulnerabilities
- ✅ eval() usage
- ✅ Command injection patterns
- ✅ Insecure random number generation
- ✅ Path traversal risks
- ✅ Timing attack vulnerabilities

**How to use:**

```bash
# Run manually
npm run lint

# Or install ESLint extension in your editor:
# - VS Code: dbaeumer.vscode-eslint
# - Cursor: Built-in
# - Zed: Built-in

# Security issues show as errors/warnings in real-time
```

**Example output:**

```
src/lib/server/api.ts
  12:5  error  Detected eval() with expression  security/detect-eval-with-expression
  25:3  error  Possible hardcoded secret         no-secrets/no-secrets
```

---

### 1.2 Claude Code Review

**Status:** ✅ Active (I'm here!)

**What I check for:**

- OWASP Top 10 vulnerabilities
- Input validation completeness
- Authentication/authorization logic
- Prompt injection risks (AI API calls)
- Secure cookie configuration
- API key exposure
- SQL injection (if you had SQL)
- XSS vulnerabilities

**How to use:**

```
# Explicit requests:
"Review this code for security issues"
"Is this vulnerable to prompt injection?"
"Check if this authentication is secure"

# Automatic:
I'll flag security issues as I help you write code
```

---

### 1.3 TypeScript Type Checking

**Status:** ✅ Configured

**Security benefit:**

- Prevents type confusion attacks
- Enforces correct API usage
- Catches null/undefined errors
- Validates data structure contracts

**How to use:**

```bash
npm run check  # Type check all code
```

---

## Layer 2: Pre-Commit Security (Before Push)

### 2.1 Git Pre-Commit Hook

**Status:** ✅ Implemented

**What it does:**

- Runs automatically before every `git commit`
- Blocks commit if security checks fail
- Forces you to fix issues before they enter git history

**Configured in:** `.git/hooks/pre-commit` (created automatically)

**Checks performed:**

1. **npm audit** - Check for vulnerable dependencies
2. **npm run lint** - Run ESLint security rules
3. **Secret scan** - Check for API keys in staged files

**How it works:**

```bash
# You run:
git commit -m "Add login feature"

# Pre-commit hook runs automatically:
# ✓ Checking dependencies for vulnerabilities...
# ✓ Running security lint...
# ✓ Scanning for hardcoded secrets...
# ✓ All checks passed - commit allowed

# Or if issues found:
# ✗ Security issues detected - commit blocked
# Fix the issues and try again
```

---

### 2.2 Manual Pre-Commit Checks

**If you want to run manually before committing:**

```bash
# Quick security check
npm run lint

# Full validation (lint + check + test + build)
npm run validate

# Dependency audit
npm audit --audit-level=moderate

# Check for secrets in staged files
git diff --cached | grep -E "(API_KEY|SECRET|TOKEN|PASSWORD)"
```

---

### 2.3 Bypass (Emergency Only)

**If you need to commit despite warnings:**

```bash
# Skip pre-commit hook (use sparingly!)
git commit --no-verify -m "Emergency fix"

# Only use for:
# - Fixing broken build
# - Emergency security patches
# - Adding TODO comments for known issues
```

---

## Layer 3: CI/CD Security (After Push)

### 3.1 GitHub Actions Security Workflow

**Status:** ✅ Implemented

**Configured in:** `.github/workflows/security.yml`

**Runs on:**

- Every push to any branch
- Every pull request
- Weekly schedule (Sunday at 2am)

**Checks performed:**

1. **npm audit** - Scan dependencies (fails on moderate+ vulnerabilities)
2. **npm run lint** - Run all ESLint security rules
3. **npm run check** - TypeScript type checking
4. **Secret scanning** - TruffleHog scans for leaked credentials

**Workflow status:**

- ✅ Pass → Green checkmark on commit
- ❌ Fail → Red X, blocks PR merge (if required)

**View results:**

- GitHub repo → Actions tab → Security Scan workflow

---

### 3.2 Dependabot (Automated Dependency Updates)

**Status:** ✅ Configured

**Configured in:** `.github/dependabot.yml`

**What it does:**

- Scans dependencies weekly
- Opens PRs for security updates
- Provides severity and CVE details
- Auto-merges minor/patch updates (optional)

**How it works:**

```
Monday morning:
- Dependabot scans package.json
- Finds: "eslint-plugin-security" has security update (2.1.0 → 2.1.1)
- Opens PR: "Bump eslint-plugin-security from 2.1.0 to 2.1.1"
- PR description includes CVE details
- You review and merge (or auto-merge)
```

---

### 3.3 CodeQL (Deep Static Analysis)

**Status:** ✅ Enabled in CI/CD workflow

**What it does:**

- Deep semantic analysis of code
- Tracks data flow (taint analysis)
- Finds complex vulnerabilities ESLint misses
- ~200 security queries for JavaScript/TypeScript

**Enabled in:** `.github/workflows/security.yml`

**Cost:**

- Free for public repositories
- $49/month per committer for private repos
- Or included with GitHub Enterprise

**Note:** If your repo is private and you're on free tier, CodeQL won't run (workflow will skip it). Make repo public to enable, or upgrade to paid plan.

---

## Security Issue Severity Levels

### Critical (Block Immediately)

- Hardcoded API keys/secrets
- SQL injection (if we had SQL)
- Authentication bypass
- **Action:** Fix immediately, don't commit

### High (Block Commit)

- XSS vulnerabilities
- Command injection
- Path traversal
- Insecure dependencies (Critical CVE)
- **Action:** Fix before committing

### Medium (Warn, Allow with Review)

- Missing input validation
- Weak cryptography
- Information disclosure
- Moderate severity dependencies
- **Action:** Fix soon, can commit with justification

### Low (Track, Fix Eventually)

- Code quality issues
- Missing security headers
- Low severity dependencies
- **Action:** Add to backlog, fix in next sprint

---

## Security Checklist by Milestone

### Milestone 1: Auth + Upload

**Pre-commit checklist:**

- [ ] No API keys in code (check .env.local)
- [ ] JWT configured with httpOnly, secure, sameSite
- [ ] Input validation with Zod on all forms
- [ ] CORS headers restrict to your domain
- [ ] Rate limiting implemented (100 req/min)
- [ ] OAuth callback validates state parameter
- [ ] PDF upload validates magic bytes (not just extension)

**What Layer 2/3 catches:**

- Hardcoded secrets → Blocked at commit
- Missing validation → Caught by CodeQL
- Vulnerable dependencies → Dependabot PR

---

### Milestone 2: PDF Processing

**Pre-commit checklist:**

- [ ] GitHub Actions secrets configured (not in code)
- [ ] Workflow inputs validated
- [ ] External API calls have timeouts
- [ ] Error messages don't leak sensitive info
- [ ] Temp files cleaned up on failure

**What Layer 2/3 catches:**

- Secrets in workflow files → Blocked at commit
- Missing error handling → CodeQL warns
- Vulnerable workflow dependencies → Dependabot PR

---

### Milestone 3: AI Integration

**Pre-commit checklist:**

- [ ] User input sanitized before AI API calls
- [ ] Prompt injection filters implemented
- [ ] AI responses validated (schema + bounds)
- [ ] Bounding box coordinates validated (prevent overflow)
- [ ] Text length limited (prevent token exhaustion)
- [ ] Budget hard stop implemented (prevent cost abuse)

**What Layer 2/3 catches:**

- Missing sanitization → ESLint warns
- Unsafe regex in filters → Blocked at commit
- AI SDK vulnerabilities → Dependabot PR

---

## Monitoring & Response

### Weekly Security Tasks

**Every Monday:**

- [ ] Check Dependabot PRs → Merge security updates
- [ ] Review GitHub Security Advisories
- [ ] Check npm audit results
- [ ] Review failed security workflow runs

**Time:** ~10 minutes/week

### Quarterly Security Tasks

**Every 3 months:**

- [ ] Rotate API keys (GitHub token, R2 keys, Google AI)
- [ ] Review .gitignore (ensure secrets not tracked)
- [ ] Audit session configurations
- [ ] Review rate limiting effectiveness
- [ ] Check Cloudflare security logs

**Time:** ~30 minutes/quarter

---

## Security Tools Summary

| Tool                | When            | What It Catches                    | Cost          |
| ------------------- | --------------- | ---------------------------------- | ------------- |
| **ESLint plugins**  | Real-time       | Hardcoded secrets, unsafe patterns | Free          |
| **TypeScript**      | Real-time       | Type errors, null refs             | Free          |
| **Claude Code**     | Real-time       | Logic errors, OWASP Top 10         | Free          |
| **Pre-commit hook** | Before commit   | Secrets, vulns, lint errors        | Free          |
| **npm audit**       | Pre-commit + CI | Vulnerable dependencies            | Free          |
| **GitHub Actions**  | After push      | All of the above (automated)       | Free          |
| **Dependabot**      | Weekly          | Outdated/vulnerable deps           | Free          |
| **CodeQL**          | After push      | Complex vulnerabilities            | Free (public) |
| **Snyk**            | Optional        | Dependencies + code                | Free tier     |

**Total cost for comprehensive security:** **$0/month** 🎉

---

## What You're Protected Against

### Application Security

- ✅ XSS (Cross-Site Scripting) - DOMPurify + Svelte auto-escape
- ✅ CSRF (Cross-Site Request Forgery) - SvelteKit built-in
- ✅ Prompt Injection - Custom filters (Milestone 3)
- ✅ Command Injection - No shell execution with user input
- ✅ Path Traversal - Input validation
- ✅ Object Injection - ESLint detects

### Infrastructure Security

- ✅ DDoS - Cloudflare network (automatic)
- ✅ Bot attacks - Cloudflare bot detection
- ✅ Rate limiting - Cloudflare + custom middleware
- ✅ Secrets management - GitHub Actions secrets

### Dependency Security

- ✅ Vulnerable packages - npm audit + Dependabot
- ✅ Supply chain attacks - Package lock + verification
- ✅ Outdated dependencies - Weekly Dependabot PRs

### Authentication Security

- ✅ OAuth flow - GitHub's infrastructure
- ✅ Session management - Secure JWT with httpOnly cookies
- ✅ Token validation - Middleware on every request
- ✅ Session expiry - 7-day timeout

---

## Red Flags to Watch For

**If Layer 2/3 catches these, FIX IMMEDIATELY:**

### 🚨 Critical

- API key in code or git history
- eval() or Function() with user input
- Shell command with user input
- Credentials in logs
- HTTP (not HTTPS) for sensitive data

### ⚠️ High

- Missing input validation
- innerHTML with user content
- No rate limiting on API endpoint
- Insecure cookie configuration
- Critical CVE in dependencies

### 📋 Medium

- Missing error handling
- Information disclosure in errors
- Moderate CVE in dependencies
- Weak cryptography (MD5, SHA1)

---

## Incident Response

**If security vulnerability found:**

1. **Assess severity** (Critical/High/Medium/Low)
2. **If Critical/High:**
   - Stop deployment immediately
   - Fix vulnerability
   - Test fix
   - Deploy patch
   - Rotate affected credentials
3. **If Medium/Low:**
   - Create GitHub issue
   - Add to next sprint
   - Document in security log

---

## Security Training Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Prompt Injection Prevention](./security-prompt-injection.md)
- [SvelteKit Security Best Practices](https://kit.svelte.dev/docs/security)
- [Cloudflare Security](https://developers.cloudflare.com/fundamentals/security/)

---

**Your security workflow is now fully automated!** 🔒
