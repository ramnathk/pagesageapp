# PageSage Deployment Guide

**Production URL:** https://pagesage.app
**Domain Registrar:** Cloudflare
**Hosting:** Cloudflare Pages (automatic deployment from GitHub)
**Repository:** Public on GitHub (https://github.com/your-username/pagesageapp)

---

## Production Architecture

```
https://pagesage.app (Cloudflare Pages)
├── Frontend: SvelteKit SSR
├── API: Cloudflare Pages Functions
└── Storage: Cloudflare R2 + GitHub

Background Processing:
└── GitHub Actions workflows (triggered from UI)

Security Scanning:
└── CodeQL (free for public repos) ✓
```

---

## Cloudflare Pages Setup

### 1. Connect Repository

1. Log in to Cloudflare Dashboard
2. Navigate to: Pages → Create a project
3. Connect to GitHub → Select `pagesageapp` repository
4. Configure build:
   - **Project name:** `pagesage`
   - **Production branch:** `main`
   - **Build command:** `npm run build`
   - **Build output directory:** `.svelte-kit/cloudflare`
   - **Framework preset:** SvelteKit

### 2. Configure Custom Domain

1. Pages → pagesage → Custom domains
2. Click "Set up a custom domain"
3. Enter: `pagesage.app`
4. Cloudflare will automatically configure DNS (since domain is on Cloudflare)
5. SSL certificate: Automatic (Cloudflare Universal SSL)

**DNS records created automatically:**

```
CNAME   pagesage.app   →  pagesage.pages.dev
CNAME   www             →  pagesage.app
```

### 3. Environment Variables

**Pages → pagesage → Settings → Environment variables**

Add these (copy from `.env.example`):

**Production values:**

```bash
PUBLIC_URL=https://pagesage.app
GITHUB_CLIENT_ID=<production_oauth_app_client_id>
GITHUB_CLIENT_SECRET=<production_oauth_secret>
GITHUB_CALLBACK_URL=https://pagesage.app/auth/callback
GITHUB_TOKEN=<service_account_token>
GITHUB_ORG=pagesage-books
R2_ACCESS_KEY_ID=<r2_access_key>
R2_SECRET_ACCESS_KEY=<r2_secret>
R2_BUCKET_NAME=pagesage-storage
R2_ACCOUNT_ID=<your_account_id>
R2_ENDPOINT=https://<account_id>.r2.cloudflarestorage.com
JWT_SECRET=<generate_new_random_32_chars>
GOOGLE_AI_API_KEY=<your_gemini_key>
MONTHLY_BUDGET_USD=100
```

**Important:**

- ✅ Use different OAuth app for production (not same as dev)
- ✅ Generate new JWT_SECRET (don't reuse dev secret)
- ✅ Never commit these values to git

---

## R2 Bucket Setup for Production

### 1. Create Production Bucket

```bash
# In Cloudflare dashboard:
R2 → Create bucket → "pagesage-storage"
```

### 2. Configure Public Access (for images)

**R2 → pagesage-storage → Settings → Public access:**

- Enable public access (for serving images to browsers)
- Custom domain: `cdn.pagesage.app` (optional)

**Or use R2 built-in domain:**

```
https://pagesage-storage.<account_id>.r2.cloudflarestorage.com
```

### 3. CORS Configuration

**Allow your domain to fetch images:**

```json
[
  {
    "AllowedOrigins": ["https://pagesage.app"],
    "AllowedMethods": ["GET", "HEAD"],
    "AllowedHeaders": ["*"],
    "MaxAgeSeconds": 3600
  }
]
```

---

## GitHub OAuth App (Production)

**Register separate OAuth app for production:**

1. GitHub → Settings → Developer settings → OAuth Apps → New
2. Fill in:
   ```
   Application name: PageSage (Production)
   Homepage URL: https://pagesage.app
   Authorization callback URL: https://pagesage.app/auth/callback
   ```
3. Copy Client ID and Client Secret
4. Add to Cloudflare Pages environment variables

**Why separate app?**

- Different callback URLs (localhost vs production)
- Better security (isolate dev from prod)
- Easier to revoke if needed

---

## GitHub Actions Secrets (for Workflows)

**Repository → Settings → Secrets and variables → Actions**

Add these secrets:

- `R2_ACCESS_KEY_ID` - For uploading processed images
- `R2_SECRET_ACCESS_KEY` - R2 credentials
- `R2_ENDPOINT` - R2 endpoint URL
- `GOOGLE_AI_API_KEY` - For AI layout detection
- `CLOUDFLARE_API_TOKEN` - For deployment (optional)

**These are used by:** `.github/workflows/process-pdf.yml`

---

## Deployment Process

### Automatic Deployment (Recommended)

```bash
# 1. Push to main branch
git push origin main

# 2. Cloudflare Pages auto-deploys
# - Runs: npm install → npm run build
# - Deploys to: https://pagesage.app
# - Takes: ~2-3 minutes

# 3. Check deployment
# Cloudflare dashboard → Pages → pagesage → Deployments
```

**Preview deployments:**

- Every branch push gets preview URL
- Format: `<branch-name>.pagesage.pages.dev`
- Perfect for testing before merging

### Manual Deployment (if needed)

```bash
# Install Wrangler CLI
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Deploy manually
npx wrangler pages deploy .svelte-kit/cloudflare
```

---

## Domain Configuration

### Production: pagesage.app

**DNS (managed by Cloudflare):**

```
Type    Name                Value                       Proxy
CNAME   pagesage.app        pagesage.pages.dev          ✓ Proxied
CNAME   www                 pagesage.app                ✓ Proxied
CNAME   cdn                 pagesage-storage.<id>.r2... ✓ Proxied
```

**SSL/TLS:**

- Mode: Full (strict)
- Certificate: Cloudflare Universal SSL (automatic)
- HTTPS: Always use HTTPS (redirect HTTP → HTTPS)

**Security settings:**

- DDoS protection: ✓ Enabled (automatic)
- WAF: ✓ Enabled
- Bot Fight Mode: ✓ Enabled
- Rate limiting: Configure in Cloudflare dashboard

---

## Monitoring & Operations

### Health Checks

**Add to Cloudflare:**

- Endpoint: `https://pagesage.app/api/health`
- Interval: 60 seconds
- Alert on: 3 consecutive failures

### Analytics

**Cloudflare Analytics (free):**

- Traffic patterns
- Cache hit rates
- Security threats blocked
- Response times

**Access:** Cloudflare dashboard → Analytics & Logs

### Logs

**Cloudflare Pages logs:**

- Real-time logs: `wrangler pages deployment tail`
- Historical: Cloudflare dashboard → Pages → Logs

**GitHub Actions logs:**

- Workflow runs: Repository → Actions
- Failed jobs send email notifications

---

## Rollback Procedure

**If deployment breaks:**

1. **Quick rollback:**

   ```
   Cloudflare dashboard → Pages → pagesage → Deployments
   → Find last working deployment
   → Click "Rollback to this deployment"
   ```

2. **Or revert code:**
   ```bash
   git revert <bad-commit-sha>
   git push origin main
   # Auto-deploys previous version
   ```

---

## Pre-Launch Checklist

### Before Going Live

- [ ] Test full workflow locally (login → upload → process → annotate)
- [ ] Register production OAuth app on GitHub
- [ ] Generate production JWT_SECRET (new, random)
- [ ] Configure all environment variables in Cloudflare Pages
- [ ] Set up R2 bucket with CORS
- [ ] Configure custom domain (pagesage.app)
- [ ] Test OAuth flow with production domain
- [ ] Verify GitHub Actions workflows run successfully
- [ ] Check CodeQL scan passes (Security tab)
- [ ] Test SSL certificate (https://pagesage.app)
- [ ] Configure rate limiting rules
- [ ] Set up monitoring and alerts
- [ ] Document admin credentials securely

### Post-Launch

- [ ] Monitor Cloudflare Analytics
- [ ] Review CodeQL security alerts
- [ ] Check Dependabot PRs weekly
- [ ] Verify SSL certificate auto-renewal
- [ ] Monitor R2 storage usage
- [ ] Track API costs (budget alerts)

---

## Cost Breakdown (Production)

**Domain:**

- `pagesage.app` - $0 (already registered on Cloudflare)

**Hosting:**

- Cloudflare Pages - $0 (100k requests/day free)
- GitHub Actions - $0 (2,000 min/month free)
- Cloudflare R2 - $0-2/month (10GB free)
- GitHub Storage - $0 (unlimited)

**Security:**

- CodeQL - $0 (free for public repos) ✓
- Dependabot - $0 (free for all repos)
- DDoS protection - $0 (Cloudflare automatic)

**APIs (variable):**

- Gemini: $0-0.27/book
- Document AI: $7/book
- Depends on choice

**Total hosting:** **$0-2/month**
**Total with APIs (10 books/year):** **$3-94/year**

---

## Support & Troubleshooting

### Common Issues

**OAuth callback fails:**

- Check callback URL matches OAuth app registration
- Verify `GITHUB_CALLBACK_URL` environment variable
- Check browser console for errors

**Images don't load:**

- Verify R2 bucket public access enabled
- Check CORS configuration
- Verify R2_PUBLIC_URL is correct

**GitHub Actions workflow fails:**

- Check secrets are configured
- Verify token has correct permissions
- Review workflow logs in Actions tab

**CodeQL not running:**

- Confirm repository is public (required for free tier)
- Check workflow file syntax
- Verify permissions in workflow

---

## Repository Info

**Status:** Public repository
**URL:** https://github.com/your-username/pagesageapp
**Benefits of public repo:**

- ✅ Free CodeQL security scanning ($49/month value)
- ✅ Free GitHub Actions (unlimited minutes for public repos)
- ✅ Community contributions welcome
- ✅ Showcases your work

**Note:** All book content is public domain, so public repo is appropriate.

---

**Production domain:** https://pagesage.app 🚀
