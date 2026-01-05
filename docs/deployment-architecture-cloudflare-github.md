# PageSage Deployment Architecture: Cloudflare + GitHub Actions

**Status:** Recommended Architecture (Free Tier)
**Last Updated:** 2025-01-05
**Cost:** $0-2/month (hosting only, excludes Google AI API costs)

---

## Architecture Overview

```
┌─────────────────────────────────────┐
│     USER BROWSER                    │
└──────────────┬──────────────────────┘
               │
               ↓
┌─────────────────────────────────────┐
│  CLOUDFLARE PAGES                   │
│  (Frontend + Lightweight API)       │
│  - SvelteKit SSR                    │
│  - Pages Functions (API routes)     │
│  - SSE for progress streaming       │
│  - FREE (100k requests/day)         │
└──────────────┬──────────────────────┘
               │
               ↓ (trigger workflow)
┌─────────────────────────────────────┐
│  GITHUB ACTIONS                     │
│  (Background Compute)               │
│  - PDF processing (15-20 min jobs) │
│  - Image preprocessing              │
│  - Google AI API calls              │
│  - Result storage orchestration     │
│  - FREE (2,000 min/month)           │
│  - 6-hour timeout ✓                 │
└──────────────┬──────────────────────┘
               │
               ↓ (store results)
┌─────────────────────────────────────┐
│  STORAGE LAYER (Hybrid)             │
│                                     │
│  CLOUDFLARE R2:                     │
│  - PDFs (binary, large)             │
│  - Page images (PNG files)          │
│  - 10GB free/month                  │
│  - Zero egress fees ✓               │
│                                     │
│  GITHUB REPOSITORY:                 │
│  - Project metadata (JSON)          │
│  - AI output (bounding boxes)       │
│  - Cost logs (JSONL)                │
│  - Version control ✓                │
└─────────────────────────────────────┘
```

---

## Storage Strategy: What Goes Where

### Critical Principle: Separate Binary from Metadata

**The Split:**

- **Binary/large files → Cloudflare R2**
- **Structured metadata → GitHub repository**

This architecture leverages the strengths of each platform while keeping costs at $0.

---

## 📦 Cloudflare R2 (Binary Storage)

**What Goes Here:**

- Original PDF files (uploaded by user)
- Page images extracted from PDF (`page-001.png`, `page-002.png`, etc.)
- Preprocessed/enhanced images (if using image preprocessing)
- Any large binary assets

**Why R2:**

- ✅ **Zero egress fees** - Critical for serving 1000+ images per book
- ✅ **10GB free tier** - Sufficient for ~5-10 books
- ✅ **S3-compatible API** - Easy programmatic access
- ✅ **CDN delivery** - Fast global image loading
- ✅ **Cheap beyond free tier** - $0.015/GB-month (vs Google Drive or S3)

**Cost Beyond Free Tier:**

- Storage: $0.015/GB-month
- Class A operations (write): $4.50 per million requests
- Class B operations (read): $0.36 per million requests
- Egress: **$0** (this is the killer feature!)

**Example R2 Structure:**

```
my-pagesage-bucket/
├── projects/
│   ├── proj_abc123/
│   │   ├── original.pdf              (50MB)
│   │   └── pages/
│   │       ├── page-001.png          (2MB)
│   │       ├── page-002.png          (2MB)
│   │       ├── ...
│   │       └── page-700.png          (2MB)
│   └── proj_def456/
│       └── ...
```

**Access Pattern:**

- **Upload:** GitHub Actions or Cloudflare Pages Functions
- **Read:** Frontend via CDN URL
- **API:** S3-compatible (use AWS SDK with custom endpoint)

---

## 📝 GitHub Repository (Metadata Storage)

**What Goes Here:**

- Project metadata (`metadata.json`)
- **Google AI API output** - Bounding boxes, OCR text, reading order
  - Stored as: `page-001.json`, `page-002.json`, etc.
- Cost logs (`costs.jsonl`)
- Version history (embedded in page JSON files)
- Application code (obviously)

**Why GitHub:**

- ✅ **Version control** - Every edit tracked with full git history
- ✅ **Human-readable** - JSON files, can inspect in browser
- ✅ **Free unlimited storage** - No size limits for text files
- ✅ **Searchable** - Can grep through annotations, search commit history
- ✅ **Collaboration-friendly** - PRs, issues, code review
- ✅ **Audit trail** - Who changed what, when, why

**Example GitHub Structure:**

```
pagesageapp/                          (application code)
data/                                 (separate repo or branch)
├── projects/
│   ├── proj_abc123/
│   │   ├── metadata.json             (5KB - project config)
│   │   ├── costs.jsonl               (10KB - cost tracking)
│   │   └── pages/
│   │       ├── page-001.json         (5KB - AI output + annotations)
│   │       ├── page-002.json         (5KB)
│   │       ├── ...
│   │       └── page-700.json         (5KB)
│   └── proj_def456/
│       └── ...
```

**Access Pattern:**

- **Write:** GitHub Actions commits, SvelteKit API commits via Octokit
- **Read:** SvelteKit API reads via Octokit/GitHub REST API
- **Version Control:** Full git history for every file

---

## Complete Data Flow: From Upload to Annotation

### Step 1: User Uploads PDF

```typescript
// Cloudflare Pages Function
// src/routes/api/projects/[id]/upload/+server.ts

export async function POST({ request, params, platform }) {
  const formData = await request.formData();
  const pdf = formData.get("pdf");

  // Store in R2 (binary file)
  await platform.env.R2_BUCKET.put(`projects/${params.id}/original.pdf`, pdf);

  // Update metadata in GitHub (JSON file)
  await octokit.repos.createOrUpdateFileContents({
    owner: "username",
    repo: "pagesage-data",
    path: `projects/${params.id}/metadata.json`,
    message: "Add uploaded PDF metadata",
    content: Buffer.from(
      JSON.stringify({
        projectId: params.id,
        sourceDocument: {
          r2Path: `projects/${params.id}/original.pdf`,
          uploadedAt: new Date().toISOString(),
        },
        status: "uploaded",
      }),
    ).toString("base64"),
  });

  return json({ success: true });
}
```

**Result:**

- ✅ **R2:** `projects/proj_abc/original.pdf` (50MB binary)
- ✅ **GitHub:** `data/projects/proj_abc/metadata.json` (5KB JSON)

---

### Step 2: Trigger GitHub Actions Workflow

```typescript
// Cloudflare Pages Function
// src/routes/api/projects/[id]/process/+server.ts

export async function POST({ params }) {
  const jobId = crypto.randomUUID();

  // Trigger GitHub Actions workflow
  await fetch(
    "https://api.github.com/repos/username/pagesageapp/actions/workflows/process-pdf.yml/dispatches",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ref: "main",
        inputs: {
          projectId: params.id,
          jobId: jobId,
          progressWebhook: `${API_URL}/api/jobs/${jobId}/progress`,
        },
      }),
    },
  );

  return json({ jobId });
}
```

---

### Step 3: GitHub Actions Processes PDF

```yaml
# .github/workflows/process-pdf.yml

name: Process PDF
on:
  workflow_dispatch:
    inputs:
      projectId:
        required: true
      jobId:
        required: true
      progressWebhook:
        required: true

jobs:
  process:
    runs-on: ubuntu-latest
    timeout-minutes: 30

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "18"

      - name: Install dependencies
        run: npm ci

      # =============================================
      # STEP 3A: Download PDF from R2 (binary)
      # =============================================
      - name: Download PDF from R2
        env:
          R2_ACCESS_KEY_ID: ${{ secrets.R2_ACCESS_KEY_ID }}
          R2_SECRET_ACCESS_KEY: ${{ secrets.R2_SECRET_ACCESS_KEY }}
          R2_ENDPOINT: ${{ secrets.R2_ENDPOINT }}
        run: |
          aws s3 cp \
            s3://my-bucket/projects/${{ inputs.projectId }}/original.pdf \
            ./temp/original.pdf \
            --endpoint-url $R2_ENDPOINT

      # =============================================
      # STEP 3B: Split PDF into page images (binary)
      # =============================================
      - name: Split PDF to images
        run: |
          pdftoppm -png -r 300 ./temp/original.pdf ./temp/pages/page

          # Progress update
          curl -X POST ${{ inputs.progressWebhook }} \
            -H "Content-Type: application/json" \
            -d '{"stage":"splitting","progress":25}'

      # =============================================
      # STEP 3C: Upload page images to R2 (binary)
      # =============================================
      - name: Upload page images to R2
        env:
          R2_ACCESS_KEY_ID: ${{ secrets.R2_ACCESS_KEY_ID }}
          R2_SECRET_ACCESS_KEY: ${{ secrets.R2_SECRET_ACCESS_KEY }}
          R2_ENDPOINT: ${{ secrets.R2_ENDPOINT }}
        run: |
          for file in ./temp/pages/*.png; do
            filename=$(basename $file)
            aws s3 cp $file \
              s3://my-bucket/projects/${{ inputs.projectId }}/pages/$filename \
              --endpoint-url $R2_ENDPOINT
          done

          curl -X POST ${{ inputs.progressWebhook }} \
            -d '{"stage":"upload-images","progress":40}'

      # =============================================
      # STEP 3D: Call Google AI API (get JSON)
      # =============================================
      - name: Process with Google AI
        env:
          GOOGLE_AI_API_KEY: ${{ secrets.GOOGLE_AI_API_KEY }}
        run: |
          node scripts/detect-layout.js \
            --project ${{ inputs.projectId }} \
            --input ./temp/pages \
            --output ./temp/results

          curl -X POST ${{ inputs.progressWebhook }} \
            -d '{"stage":"ai-detection","progress":75}'

      # =============================================
      # STEP 3E: Commit AI output JSON to GitHub (metadata)
      # =============================================
      - name: Commit results to GitHub
        run: |
          # Copy JSON results to data directory
          mkdir -p data/projects/${{ inputs.projectId }}/pages
          cp ./temp/results/*.json data/projects/${{ inputs.projectId }}/pages/

          # Update project metadata
          node scripts/update-metadata.js \
            --project ${{ inputs.projectId }} \
            --status "processing-complete"

          # Commit to GitHub
          git config user.name "PageSage Bot"
          git config user.email "bot@pagesage.app"
          git add data/projects/${{ inputs.projectId }}/
          git commit -m "Processed project ${{ inputs.projectId }}"
          git push

          curl -X POST ${{ inputs.progressWebhook }} \
            -d '{"stage":"complete","progress":100}'
```

**What Gets Stored Where:**

| Step | File Type       | Destination      | Example                                            |
| ---- | --------------- | ---------------- | -------------------------------------------------- |
| 3A   | Download PDF    | Temp (ephemeral) | `/tmp/original.pdf`                                |
| 3B   | Page images     | Temp → R2        | `s3://bucket/projects/proj_abc/pages/page-001.png` |
| 3C   | Upload images   | **R2** ✓         | Binary files stored in object storage              |
| 3D   | AI API response | Temp (JSON)      | `/tmp/results/page-001.json`                       |
| 3E   | AI output JSON  | **GitHub** ✓     | `data/projects/proj_abc/pages/page-001.json`       |

---

### Step 4: Frontend Loads Annotations

**Load Metadata from GitHub:**

```typescript
// src/routes/api/projects/[id]/pages/[page]/+server.ts

export async function GET({ params }) {
  // Fetch page JSON from GitHub (AI output + annotations)
  const response = await octokit.repos.getContent({
    owner: "username",
    repo: "pagesage-data",
    path: `projects/${params.id}/pages/page-${params.page.padStart(3, "0")}.json`,
  });

  const pageData = JSON.parse(
    Buffer.from(response.data.content, "base64").toString(),
  );

  // pageData contains:
  // - boundingBoxes (from Google AI API)
  // - image reference (R2 path)
  // - version history
  // - reading order

  return json(pageData);
}
```

**Load Image from R2:**

```svelte
<!-- src/routes/projects/[id]/annotate/[page]/+page.svelte -->

<script lang="ts">
  export let data; // pageData from GitHub

  // Image URL points to R2
  const imageUrl = `https://my-bucket.r2.dev/projects/${data.projectId}/pages/page-${data.pageNumber.toString().padStart(3, '0')}.png`;
</script>

<div class="annotation-editor">
  <img src={imageUrl} alt="Page {data.pageNumber}" />

  <!-- Render bounding boxes from GitHub JSON -->
  {#each data.currentState.boundingBoxes as box}
    <div class="box" style="left: {box.x}px; top: {box.y}px;">
      {box.text.corrected}
    </div>
  {/each}
</div>
```

---

### Step 5: User Edits Annotations

**Update Metadata in GitHub Only:**

```typescript
// src/routes/api/projects/[id]/pages/[page]/+server.ts

export async function PUT({ params, request }) {
  const updatedPage = await request.json();

  // Add version history entry
  updatedPage.versionHistory.push({
    version: updatedPage.versionHistory.length + 1,
    timestamp: new Date().toISOString(),
    editedBy: {
      /* user info */
    },
    changeType: "manual_edit",
    changes: {
      /* diff */
    },
  });

  // Commit updated JSON to GitHub
  await octokit.repos.createOrUpdateFileContents({
    owner: "username",
    repo: "pagesage-data",
    path: `projects/${params.id}/pages/page-${params.page.padStart(3, "0")}.json`,
    message: `Updated annotations for page ${params.page}`,
    content: Buffer.from(JSON.stringify(updatedPage, null, 2)).toString(
      "base64",
    ),
    sha: currentFileSha, // For update
  });

  return json({ success: true });
}
```

**Note:** Images in R2 are NOT modified - they remain unchanged. Only the metadata (bounding boxes, text corrections) in GitHub is updated.

---

## File Size Comparison

**Typical 700-page book:**

| Storage          | Content               | Size                 |
| ---------------- | --------------------- | -------------------- |
| **R2**           | Original PDF          | 50MB                 |
| **R2**           | 700 page images (PNG) | 1,400MB (1.4GB)      |
| **GitHub**       | 700 page JSON files   | 3.5MB (5KB each)     |
| **GitHub**       | metadata.json         | 5KB                  |
| **GitHub**       | costs.jsonl           | 10KB                 |
| **Total R2**     |                       | **~1.45GB per book** |
| **Total GitHub** |                       | **~3.5MB per book**  |

**Why this split makes sense:**

- R2 handles 99.7% of storage by size (binary images)
- GitHub handles 0.3% of storage by size (metadata)
- But GitHub content is the "source of truth" for annotations
- Images are derivatives that can be regenerated from PDF

---

## Cost Projection

**For 10 books (7,000 pages total):**

| Service              | Usage              | Free Tier      | Overage        | Cost            |
| -------------------- | ------------------ | -------------- | -------------- | --------------- |
| **Cloudflare R2**    | 14.5GB storage     | 10GB free      | 4.5GB × $0.015 | **$0.07/month** |
|                      | 7,000 writes       | 1M free        | None           | **$0**          |
|                      | 10,000 reads       | 10M free       | None           | **$0**          |
| **GitHub Actions**   | 160 min processing | 2,000 min free | None           | **$0**          |
| **Cloudflare Pages** | 10k requests       | 100k/day free  | None           | **$0**          |
| **GitHub Storage**   | 35MB               | Unlimited      | None           | **$0**          |
| **Total Hosting**    |                    |                |                | **$0.07/month** |

**Effectively free until you store 10+ books!**

---

## Advantages of This Architecture

✅ **Completely free** for MVP usage (10-100 books/month)
✅ **Zero egress fees** (Cloudflare R2 doesn't charge for downloads)
✅ **No function timeouts** (GitHub Actions supports up to 6 hours)
✅ **Simple architecture** (no separate worker service to manage)
✅ **Built-in version control** (Git history for all metadata)
✅ **Fast global delivery** (Cloudflare CDN)
✅ **Programmatic access** (S3-compatible API for R2)

---

## Limitations and Trade-offs

### GitHub Actions Limitations

⚠️ **~30 second start latency** - Workflows don't start instantly
⚠️ **2,000 min/month limit** - Covers ~100 books, then pay $0.008/min
⚠️ **No native streaming** - Must implement webhook callbacks for progress

### Cloudflare R2 Limitations

⚠️ **10GB free tier** - Covers ~7 books, then pay $0.015/GB-month
⚠️ **Not as mature as S3** - Fewer integrations, occasional bugs

### GitHub Storage Limitations

⚠️ **Large repo size** - 100+ books = large repo (>300MB)
⚠️ **Git history grows** - Every edit adds commit (can squash periodically)

**But these are acceptable for a free architecture!**

---

## Production Deployment

**Domain:** `pagesage.app` (registered on Cloudflare)
**Repository:** Public GitHub repository (enables free CodeQL security scanning)
**Deployment:** Cloudflare Pages (automatic on push to main)

### Deployment Steps

1. **Set up Cloudflare account** - Create R2 bucket ✓
2. **Configure Cloudflare Pages:**
   - Connect GitHub repository
   - Set production domain: `pagesage.app`
   - Configure environment variables (from .env.example)
   - Set build command: `npm run build`
   - Set output directory: `.svelte-kit/output`
3. **Configure GitHub Actions** - Add workflow files, set secrets
4. **Update storage service** - Use R2 for images
5. **Test with sample book** - Verify end-to-end flow

### Environment Variables (Production)

**Set in Cloudflare Pages dashboard:**

- `GITHUB_CLIENT_ID` - OAuth app (production)
- `GITHUB_CLIENT_SECRET` - OAuth secret
- `GITHUB_TOKEN` - Service account token
- `R2_ACCESS_KEY_ID` - R2 credentials
- `R2_SECRET_ACCESS_KEY` - R2 credentials
- `R2_BUCKET_NAME` - pagesage-storage
- `R2_ACCOUNT_ID` - Your Cloudflare account ID
- `JWT_SECRET` - Generate new for production
- `GOOGLE_AI_API_KEY` - Gemini or Document AI
- `PUBLIC_URL` - https://pagesage.app

**Note:** Never commit production secrets to git!

---

## References

- [Cloudflare R2 Documentation](https://developers.cloudflare.com/r2/)
- [Cloudflare Pages Documentation](https://developers.cloudflare.com/pages/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [GitHub Actions Workflow Dispatch](https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows#workflow_dispatch)
- [Cloudflare R2 Pricing](https://developers.cloudflare.com/r2/pricing/)
- [GitHub Actions Pricing](https://docs.github.com/en/billing/managing-billing-for-github-actions/about-billing-for-github-actions)

---

**Last Updated:** 2025-01-05
**Architecture Status:** Recommended for v1 deployment
