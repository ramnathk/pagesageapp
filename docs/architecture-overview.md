# PageSage v1 - Architecture Overview (Database-Free)

**Status:** Proposed Architecture
**Last Updated:** 2025-12-05
**Constraint:** No database - all data in files (GitHub + Google Drive)

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                         USER (Browser)                       │
│  SvelteKit Frontend (Svelte 5 + TypeScript)                 │
└───────────────┬─────────────────────────────────────────────┘
                │
                │ HTTPS / SSE
                ↓
┌─────────────────────────────────────────────────────────────┐
│              SVELTEKIT API ROUTES (Serverless)              │
│  • Authentication (GitHub OAuth → JWT in cookie)            │
│  • Project CRUD (read/write GitHub files)                   │
│  • Job management (in-memory queue)                         │
│  • Real-time updates (SSE streams)                          │
└─────┬───────────┬────────────┬──────────────┬──────────────┘
      │           │            │              │
      ↓           ↓            ↓              ↓
┌──────────┐ ┌─────────┐ ┌──────────┐ ┌────────────────┐
│  GitHub  │ │ Google  │ │  Gemini  │ │ Background     │
│  API     │ │ Drive   │ │  2.5     │ │ Worker         │
│          │ │ API     │ │  Flash   │ │ (Railway)      │
│ Repos,   │ │         │ │          │ │                │
│ Commits, │ │ PDFs,   │ │ OCR +    │ │ Long-running   │
│ Files    │ │ Images  │ │ Layout   │ │ jobs           │
└──────────┘ └─────────┘ └──────────┘ └────────────────┘
```

---

## Tech Stack (Database-Free)

### Frontend
- **Framework:** SvelteKit (Svelte 5 with runes)
- **Language:** TypeScript
- **State:** Svelte stores + local component state
- **Styling:** Scoped CSS (component-level)
- **Canvas:** HTML5 Canvas for annotation editor

### Backend
- **Framework:** SvelteKit API routes (`+server.ts`)
- **Language:** TypeScript (same as frontend)
- **Runtime:** Node.js 18+
- **Session:** JWT tokens in httpOnly cookies (stateless, no DB)
- **Job Queue:** In-memory BullMQ or file-based queue
- **Image Processing:** Sharp (fast, C++ backed)

### Storage (File-Based, No Database)
- **Structured data:** GitHub repositories (JSON files)
- **Binary assets:** Google Drive (PDFs, images)
- **Sessions:** JWT in encrypted cookies
- **Job queue:** In-memory (lost on restart) or file-based (`jobs/*.json`)
- **Costs:** JSONL append-only file (`costs.jsonl`)

### External Services
- **Authentication:** GitHub OAuth
- **OCR/Layout:** Gemini 2.5 Flash API (or Document AI)
- **Validation:** Claude API (optional, for QA)

### Deployment
- **Frontend + API:** Vercel (serverless, free tier)
- **Background Worker:** Railway Hobby ($5/month) or Fly.io
- **CI/CD:** GitHub Actions

---

## Data Flow: Complete Project Lifecycle

### Flow 1: User Authentication (OAuth → JWT)

```
User clicks "Login with GitHub"
    ↓
SvelteKit redirects to GitHub OAuth
    ↓
User authorizes on GitHub
    ↓
GitHub redirects back with code
    ↓
SvelteKit exchanges code for access token
    ↓
Create JWT with user info:
  {
    userId: "user_abc123",
    githubId: 123456,
    role: "admin",
    exp: timestamp + 7 days
  }
    ↓
Store JWT in httpOnly, secure, sameSite cookie
    ↓
Return to frontend (cookie auto-sent on requests)

All subsequent requests:
  Frontend → API (cookie auto-included)
       ↓
  API validates JWT (no DB lookup needed)
       ↓
  Proceed if valid, 401 if expired
```

**No database needed:** JWT is self-contained, stateless validation

---

### Flow 2: Create Project & Upload PDF

```
User fills form + uploads PDF (500MB max)
    ↓
POST /api/projects/create
    ↓
Backend validates PDF (format, size, not corrupted)
    ↓
Create project ID: "proj_abc123"
    ↓
┌─────────────────────────────────────┐
│ Parallel Operations:                │
├─────────────────────────────────────┤
│ 1. Upload PDF to Google Drive       │
│    └─> Store fileId, checksum       │
│                                     │
│ 2. Create GitHub repository         │
│    pagesage-books/book-{id}-{slug}/ │
│                                     │
│ 3. Extract PDF metadata             │
│    └─> Title, author, page count    │
└─────────────────────────────────────┘
    ↓
Create metadata.json:
  {
    projectId: "proj_abc123",
    title: "...",
    sourceDocument: {
      driveFileId: "...",
      sha256: "..."
    },
    pages: {total: 700, processed: 0},
    costs: {totalSpent: 0},
    boxIndex: {}  // Empty, populated during processing
  }
    ↓
Commit to GitHub: "Initial project setup"
    ↓
Return project info to frontend
    ↓
Frontend redirects to project page
```

**Storage:** GitHub (metadata.json) + Google Drive (PDF)
**No database:** All metadata in JSON file in git

---

### Flow 3: PDF Processing & AI Layout Detection

**UPDATED:** Now includes quality check and optional preprocessing

```
User clicks "Start Processing"
    ↓
POST /api/projects/{id}/process
    ↓
Backend creates job record (in-memory or file):
  jobs/job-abc123.json:
  {
    jobId: "job-abc123",
    projectId: "proj_abc123",
    type: "pdf-processing",
    phases: ["quality-check", "preprocessing?", "ai-layout-detection"],
    status: "queued",
    totalPages: 700,
    processedPages: 0,
    createdAt: "..."
  }
    ↓
Return job ID to frontend
    ↓
Frontend connects to SSE stream:
  EventSource('/api/jobs/job-abc123/stream')
    ↓
┌────────────────────────────────────────────────────────────────┐
│   BACKGROUND WORKER (Railway/Fly.io)                           │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│ PHASE 1: QUALITY CHECK (~20 seconds)                          │
│ ──────────────────────────────────────────                   │
│ 1. Download PDF from Google Drive                            │
│ 2. Extract 5 sample pages from MIDDLE of book:               │
│    └─> Pages at 25%, 40%, 50%, 60%, 75% (not first 5!)      │
│ 3. Analyze quality of each sample:                           │
│    - Skew angle (rotation)                                   │
│    - Contrast level                                          │
│    - Brightness                                              │
│    - Noise level                                             │
│    - Border detection                                        │
│ 4. Make recommendation:                                      │
│    - Skip: 0-1 pages need work (excellent quality)          │
│    - Optional: 2 pages need work (good quality)             │
│    - Recommended: 3+ pages need work (fair/poor quality)    │
│ 5. Emit SSE event with recommendation → frontend shows UI   │
│                                                              │
│ ⏸️  WAIT FOR USER DECISION                                   │
│                                                              │
│ PHASE 2A: PREPROCESSING (if enabled, ~10-15 min)            │
│ ────────────────────────────────────────────────            │
│ For each page (1 to 700):                                   │
│   1. Extract page from PDF → original-page-NNN.png          │
│      (pdftoppm -png -r 300)                                 │
│   2. Preprocess image → enhanced-page-NNN.png:              │
│      - Deskew (ImageMagick -deskew 40%)                     │
│      - Color correct (Sharp .normalize())                   │
│      - Denoise (Sharp .median(3))                           │
│      - Crop borders (Sharp .trim())                         │
│   3. Upload enhanced-page-NNN.png to Google Drive           │
│   4. Save metadata:                                         │
│      {                                                      │
│        driveFileId: "...",                                  │
│        isPreprocessed: true,                                │
│        preprocessingApplied: ["deskew", "color", ...]       │
│      }                                                      │
│   5. Emit progress: "Preprocessed 350/700 pages"            │
│                                                              │
│ PHASE 2B: NO PREPROCESSING (if skipped, ~5 min)             │
│ ────────────────────────────────────────────────            │
│ For each page (1 to 700):                                   │
│   1. Extract page from PDF → page-NNN.png                   │
│      (pdftoppm -png -r 300)                                 │
│   2. Upload page-NNN.png to Google Drive (no processing)    │
│   3. Save metadata:                                         │
│      {                                                      │
│        driveFileId: "...",                                  │
│        isPreprocessed: false                                │
│      }                                                      │
│   4. Emit progress: "Extracted 350/700 pages"               │
│                                                              │
│ PHASE 3: AI LAYOUT DETECTION (~5-10 min)                    │
│ ─────────────────────────────────────────                   │
│ For each page (1 to 700):                                   │
│   1. Download enhanced-page-NNN.png from Drive              │
│      (or page-NNN.png if preprocessing was skipped)         │
│   2. Call Gemini 2.5 Flash API with image:                  │
│      └─> Get layout + OCR from ENHANCED/ORIGINAL image      │
│   3. Parse AI response:                                     │
│      - Extract bounding boxes                               │
│      - Detect columns, verses, footnotes                    │
│      - Extract text with confidence scores                  │
│      - Detect inline footnote references                    │
│   4. Create page-NNN.json:                                  │
│      {                                                      │
│        pageId: "page-001",                                  │
│        image: {                                             │
│          driveFileId: "...",        ← Enhanced image ID     │
│          isPreprocessed: true,                              │
│          preprocessingApplied: [...]                        │
│        },                                                   │
│        currentState: {                                      │
│          boundingBoxes: [...]                               │
│        },                                                   │
│        versionHistory: [{                                   │
│          version: 1,                                        │
│          changeType: "ai_generated",                        │
│          processedFrom: "enhanced-image" | "original-image" │
│        }]                                                   │
│      }                                                      │
│   5. Update boxIndex in metadata.json                       │
│   6. Commit page-NNN.json to GitHub                         │
│   7. Append to costs.jsonl:                                 │
│      {"operation": "layout-detection", cost: 0.00038, ...}  │
│   8. Update job progress                                    │
│   9. Emit SSE event → "Processing page 350/700"             │
│                                                              │
│ Job complete!                                                │
└────────────────────────────────────────────────────────────────┘
    ↓
Frontend shows: "Processing complete! 700 pages analyzed"
```

**Storage:**
- Jobs: In-memory queue (or `jobs/*.json` files if need persistence)
- Results: GitHub (page-NNN.json files)
- Images in Google Drive:
  - `original.pdf` (uploaded by user)
  - `enhanced-page-NNN.png` (preprocessed images for OCR) OR
  - `page-NNN.png` (original pages if preprocessing skipped)
- Costs: costs.jsonl (append-only file)
- No database

**Key insight:** All OCR/layout detection runs on enhanced images (or original if preprocessing skipped), NOT on the original PDF pages directly.

**Real-time updates:** SSE stream emits progress events for all 3 phases

---

### Flow 4: Manual Annotation Review

```
User navigates to page 45
    ↓
GET /api/projects/{id}/pages/45
    ↓
Backend reads from GitHub:
  - pages/page-045.json (annotations + version history)
    ↓
Backend reads image URL from annotation:
  - imageDriveId: "1a2b3c..."
    ↓
Generate Google Drive download URL (or use cached)
    ↓
Return to frontend:
  {
    page: {annotations, versionHistory, ...},
    imageUrl: "https://drive.google.com/..."
  }
    ↓
Frontend renders:
  - Canvas with page image
  - Overlaid bounding boxes
  - Version history panel
    ↓
User edits:
  - Moves box-001
  - Resizes box-002
  - Adds inline footnote reference
    ↓
Auto-save (every 30 seconds):
  PUT /api/projects/{id}/pages/45
    ↓
Backend:
  1. Read current page-045.json from GitHub
  2. Apply edits to currentState
  3. Create new version entry:
     {
       version: 2,
       timestamp: "...",
       editedBy: {user info from JWT},
       changeType: "manual_edit",
       changes: {action: "moved", boxId: "box-001", ...}
     }
  4. Update inline reference offsets if text changed
  5. Run validation (check orphaned refs)
  6. Commit to GitHub: "Updated page 45 annotations"
  7. Append to costs.jsonl (if any API calls)
    ↓
Return updated page to frontend
```

**Storage:** GitHub (page-045.json updated)
**No database:** Read file → Modify → Commit back to GitHub

---

### Flow 5: Real-Time Progress Updates (SSE)

```
Frontend (when job starts):
  const events = new EventSource('/api/jobs/job-abc123/stream');

  events.onmessage = (event) => {
    const update = JSON.parse(event.data);
    // update = {progress: 350, total: 700, cost: 2.45, status: "processing"}

    progressBar.value = update.progress;
    costDisplay.textContent = `$${update.cost}`;
  };

Backend API Route (+server.ts):
  export async function GET({ params }) {
    return new Response(
      new ReadableStream({
        async start(controller) {
          const job = await getJob(params.jobId);  // From memory or file

          // Subscribe to job updates
          job.on('progress', (data) => {
            controller.enqueue(
              `data: ${JSON.stringify(data)}\n\n`
            );
          });

          // Poll until complete
          while (!job.isComplete) {
            await sleep(1000);
          }

          controller.close();
        }
      }),
      { headers: { 'Content-Type': 'text/event-stream' } }
    );
  }

Worker (background process):
  while (processing) {
    processPage(page);

    // Emit progress event
    jobQueue.emit('progress', {
      jobId: "job-abc123",
      progress: currentPage,
      total: totalPages,
      cost: calculateCost(),
      status: "processing"
    });
  }
```

**No database:** Job state in memory (or jobs/*.json files), SSE streams to frontend

---

### Flow 6: Cost Tracking & Budget Display

```
GET /api/costs/current
    ↓
Backend reads costs.jsonl file:
  - Parse all lines (JSONL format)
  - Filter to current month
  - Aggregate by operation type
    ↓
Calculate:
  thisMonth = sum of all costs in current month
  budget = 100 (from env or metadata.json)
  percentage = (thisMonth / budget) * 100
    ↓
Return:
  {
    spent: 67.50,
    budget: 100,
    percentage: 67.5,
    breakdown: {
      "layout-detection": 35.00,
      "ocr-extraction": 32.50
    }
  }
    ↓
Frontend displays:
  Budget widget: "$67.50 / $100 (67%)"
  Progress bar (visual)
  Warning if >80%
```

**Storage:** costs.jsonl (append-only file in GitHub)
**No database:** Read file, parse, aggregate in-memory

**Real-time cost updates:**
```
Frontend: EventSource('/api/costs/stream')
    ↓
Backend: When new cost logged
  1. Append to costs.jsonl
  2. Emit SSE event with updated totals
    ↓
Frontend: Update cost display immediately
```

---

### Flow 7: Export to Markdown

```
User clicks "Export Project"
    ↓
POST /api/projects/{id}/export
    ↓
Backend:
  1. Read metadata.json (project info)
  2. Read all pages/page-*.json files (700 files)
  3. Load in reading order (page 1 → 700)
  4. For each page:
     - Get bounding boxes in reading order
     - Extract text (corrected or OCR)
     - Apply markdown formatting:
       - Verses → ::: {.verse lang="sa"}
       - Commentary → ::: {.commentary}
       - Footnotes → [^1] format
       - Inline references → [^n] syntax
  5. Generate YAML frontmatter (project metadata)
  6. Compile into single markdown file
  7. Write to exports/markdown/book.md
  8. Commit to GitHub: "Generated markdown export"
    ↓
Return download URL to frontend
    ↓
Frontend triggers download
```

**Storage:** GitHub (exports/markdown/book.md)
**No database:** Read all JSON files, process in memory, write output file

---

## File-Based Architecture Details

### Session Management (No Database)

**Using JWT (JSON Web Tokens):**

```typescript
// After GitHub OAuth success
import jwt from 'jsonwebtoken';

const token = jwt.sign(
  {
    userId: 'user_abc123',
    githubId: 123456,
    githubUsername: 'yourusername',
    role: 'admin',
    iat: Date.now() / 1000,
    exp: Date.now() / 1000 + (7 * 24 * 60 * 60)  // 7 days
  },
  process.env.JWT_SECRET,
  { algorithm: 'HS256' }
);

// Store in httpOnly cookie
cookies.set('session', token, {
  httpOnly: true,
  secure: true,
  sameSite: 'lax',
  maxAge: 7 * 24 * 60 * 60,
  path: '/'
});
```

**On every request:**
```typescript
// Middleware in hooks.server.ts
export async function handle({ event, resolve }) {
  const token = event.cookies.get('session');

  if (token) {
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      event.locals.user = payload;  // Available in all routes
    } catch (err) {
      // Invalid or expired token
      event.cookies.delete('session');
    }
  }

  return resolve(event);
}
```

**Benefits:**
- ✅ No database needed
- ✅ Stateless (scales infinitely)
- ✅ Fast (no DB lookup)
- ✅ Secure (signed, httpOnly)

**Limitation:**
- ⚠️ Can't invalidate tokens server-side (logout just deletes cookie)
- ⚠️ Token remains valid until expiry (acceptable for v1 single-user)

---

### Job Queue (No Database)

**Option A: In-Memory Queue** (Recommended for v1)

```typescript
// Simple in-memory queue
class JobQueue {
  private jobs: Map<string, Job> = new Map();
  private processing: Set<string> = new Set();

  async addJob(job: Job): Promise<string> {
    const jobId = generateId();
    this.jobs.set(jobId, job);
    this.processNext();  // Start processing
    return jobId;
  }

  async processNext(): Promise<void> {
    const pendingJobs = Array.from(this.jobs.values())
      .filter(j => j.status === 'queued');

    if (pendingJobs.length > 0 && this.processing.size < MAX_CONCURRENT) {
      const job = pendingJobs[0];
      this.processing.add(job.id);
      await this.processJob(job);
      this.processing.delete(job.id);
    }
  }

  getJob(jobId: string): Job | undefined {
    return this.jobs.get(jobId);
  }
}

// Singleton instance (lives in memory)
export const jobQueue = new JobQueue();
```

**Pros:**
- ✅ Simple, no external dependencies
- ✅ Fast
- ✅ No database

**Cons:**
- ❌ Lost on server restart (acceptable for v1)
- ❌ No persistence across deployments

**Mitigation:** On startup, check for incomplete jobs in GitHub and resume

---

**Option B: File-Based Queue** (if need persistence)

```typescript
// Queue stored in filesystem
class FileBasedQueue {
  private queueDir = './jobs';

  async addJob(job: Job): Promise<string> {
    const jobId = generateId();
    const jobFile = `${this.queueDir}/${jobId}.json`;

    await fs.writeFile(jobFile, JSON.stringify(job));
    return jobId;
  }

  async getNextJob(): Promise<Job | null> {
    const files = await fs.readdir(this.queueDir);
    const jobs = await Promise.all(
      files.map(f => fs.readFile(`${this.queueDir}/${f}`, 'utf-8'))
    );

    const parsed = jobs.map(JSON.parse).filter(j => j.status === 'queued');
    return parsed[0] || null;
  }

  async updateJob(jobId: string, updates: Partial<Job>): Promise<void> {
    const jobFile = `${this.queueDir}/${jobId}.json`;
    const job = JSON.parse(await fs.readFile(jobFile, 'utf-8'));
    await fs.writeFile(jobFile, JSON.stringify({...job, ...updates}));
  }
}
```

**Pros:**
- ✅ Persists across restarts
- ✅ No database
- ✅ Git-friendly (can commit job logs)

**Cons:**
- ⚠️ Slower than in-memory (file I/O)
- ⚠️ Potential race conditions (multiple workers)

---

### Project Data (GitHub as Database)

**Reading project metadata:**
```typescript
async function getProject(projectId: string): Promise<ProjectMetadata> {
  const repoName = `book-${projectId}`;

  // Use GitHub API to read metadata.json
  const response = await octokit.rest.repos.getContent({
    owner: 'pagesage-books',
    repo: repoName,
    path: 'metadata.json'
  });

  const content = Buffer.from(response.data.content, 'base64').toString();
  return JSON.parse(content);
}
```

**Updating project metadata:**
```typescript
async function updateProject(
  projectId: string,
  updates: Partial<ProjectMetadata>
): Promise<void> {
  const repoName = `book-${projectId}`;

  // 1. Get current metadata
  const current = await getProject(projectId);

  // 2. Merge updates
  const updated = {...current, ...updates, updatedAt: new Date().toISOString()};

  // 3. Commit to GitHub
  await octokit.rest.repos.createOrUpdateFileContents({
    owner: 'pagesage-books',
    repo: repoName,
    path: 'metadata.json',
    message: 'Update project metadata',
    content: Buffer.from(JSON.stringify(updated, null, 2)).toString('base64'),
    sha: currentFileSha  // For update
  });
}
```

**Pros:**
- ✅ Full version control (every change tracked)
- ✅ No database needed
- ✅ Human-readable (can open files directly)
- ✅ Backup built-in (git history)

**Cons:**
- ⚠️ Slower than database queries
- ⚠️ Can't do complex queries (need to load and filter)
- ⚠️ GitHub API rate limits (5000 req/hour authenticated)

**Mitigation:** Cache metadata in memory, refresh periodically

---

### Cost Aggregation (File-Based)

**Reading costs:**
```typescript
async function getCurrentMonthCosts(projectId: string): Promise<CostSummary> {
  const repoName = `book-${projectId}`;

  // Read costs.jsonl from GitHub
  const costsFile = await octokit.rest.repos.getContent({
    owner: 'pagesage-books',
    repo: repoName,
    path: 'costs.jsonl'
  });

  const content = Buffer.from(costsFile.data.content, 'base64').toString();

  // Parse JSONL (one JSON per line)
  const lines = content.split('\n').filter(l => l.trim());
  const entries: CostLogEntry[] = lines.map(JSON.parse);

  // Filter to current month
  const now = new Date();
  const thisMonth = entries.filter(e => {
    const entryDate = new Date(e.timestamp);
    return entryDate.getMonth() === now.getMonth() &&
           entryDate.getFullYear() === now.getFullYear();
  });

  // Aggregate
  const total = thisMonth.reduce((sum, e) => sum + e.totalCost, 0);

  return {
    spent: total,
    budget: 100,
    breakdown: aggregateByOperation(thisMonth)
  };
}
```

**Writing costs:**
```typescript
async function logCost(projectId: string, entry: CostLogEntry): Promise<void> {
  // Append to costs.jsonl
  const newLine = JSON.stringify(entry) + '\n';

  // Read current file
  const current = await readCostsFile(projectId);

  // Append new entry
  const updated = current + newLine;

  // Commit back to GitHub
  await octokit.rest.repos.createOrUpdateFileContents({
    path: 'costs.jsonl',
    message: `Log cost: ${entry.operation} ($${entry.totalCost})`,
    content: Buffer.from(updated).toString('base64')
  });

  // Emit SSE event for real-time cost update
  costUpdateEmitter.emit('cost-update', {
    projectId,
    newTotal: calculateTotal(updated)
  });
}
```

**Pros:**
- ✅ Append-only (git-friendly diffs)
- ✅ Human-readable
- ✅ No database
- ✅ Full audit trail

**Cons:**
- ⚠️ Slower than database
- ⚠️ File grows indefinitely (need periodic cleanup/archival)

---

## Architecture Without Database: Summary

### What Replaces Database Functionality

| Database Use Case | File-Based Alternative |
|-------------------|------------------------|
| User sessions | JWT in cookies (stateless) |
| Project metadata | metadata.json in GitHub |
| Page annotations | page-NNN.json in GitHub |
| Version history | Embedded in page JSON + git commits |
| Cost tracking | costs.jsonl (append-only) |
| Job queue | In-memory queue or jobs/*.json files |
| Box index | boxIndex in metadata.json |
| Search/queries | Load files, filter in memory (cache results) |

### Performance Characteristics

**Read operations:**
- Project metadata: ~100-200ms (GitHub API + parse)
- Page annotations: ~100-200ms (GitHub API + parse)
- Cost aggregation: ~200-500ms (read + parse JSONL)
- Cached in memory: <10ms

**Write operations:**
- Save annotations: ~500-1000ms (GitHub commit)
- Log costs: ~300-500ms (append + commit)
- Update metadata: ~500-1000ms (GitHub commit)

**Good enough for v1 single-user!**

---

## Technology Choices

### Core Stack

```yaml
Frontend & Backend: SvelteKit + TypeScript
Hosting: Vercel (free tier) + Railway worker ($5/month)
Session: JWT (no database)
Job Queue: In-memory (BullMQ) or file-based
Storage: GitHub (structured data) + Google Drive (binaries)
Real-time: Server-Sent Events (SSE)
Image Processing: Sharp (Node.js)
AI API: Gemini 2.5 Flash (pending testing) or Document AI Layout Parser
Validation: Claude API (optional, for QA)
```

### Why No Database?

**Advantages:**
1. ✅ **Simpler architecture** - One less system to manage
2. ✅ **Lower cost** - No DB hosting fees
3. ✅ **Full version control** - All data in git
4. ✅ **Portable** - Clone repo = full backup
5. ✅ **Git-friendly** - Meaningful diffs on every change
6. ✅ **Human-readable** - Open any file to inspect

**Acceptable trade-offs for v1:**
- ⚠️ Slower queries (100-500ms vs 10-50ms)
- ⚠️ No complex SQL queries (filter in memory)
- ⚠️ GitHub API rate limits (5000/hour - enough for single user)
- ⚠️ Job queue lost on restart (resume from GitHub state)

**When to add database (future):**
- v4: Multi-user (need fast user queries, concurrent access)
- Scale: 100+ books (file I/O becomes bottleneck)
- Complex search: Full-text search across all annotations

---

## Deployment Architecture

### Development

```
Local machine:
  - npm run dev
  - SvelteKit dev server (port 5173)
  - Hot reload
  - Uses .env.local for secrets
```

### Production

```
Vercel (Frontend + API):
  ┌────────────────────────────────┐
  │  Frontend (Static + SSR)       │
  │  API Routes (Serverless)       │
  │  - Auth endpoints              │
  │  - Project CRUD                │
  │  - SSE streams                 │
  │  Timeout: 15 minutes (Hobby)   │
  └────────────────────────────────┘

Railway (Background Worker):
  ┌────────────────────────────────┐
  │  Long-running Node.js process  │
  │  - Job queue worker            │
  │  - Image processing            │
  │  - API calls (Gemini/Doc AI)   │
  │  - GitHub commits              │
  │  No timeout (always-on)        │
  └────────────────────────────────┘

Communication:
  Vercel API → Creates job in queue (in-memory or Redis)
  Railway Worker → Processes job
  Worker → Commits to GitHub
  Vercel SSE → Streams updates to frontend
```

**Why this split:**
- Vercel: Great for API routes, free tier, global CDN
- Railway: Needed for long-running jobs (>15 min), cheap ($5/month)

---

## Data Flow Summary

```
┌─────────────┐
│    User     │
└──────┬──────┘
       │
       │ 1. Login (GitHub OAuth)
       ↓
┌─────────────────────┐
│  SvelteKit API      │  2. Exchange code → JWT → Cookie
└──────┬──────────────┘
       │
       │ 3. Create project
       ↓
┌─────────────────────┐
│  GitHub (create     │  4. Create repo, commit metadata.json
│  repository)        │
└─────────────────────┘
       │
       │ 5. Upload PDF
       ↓
┌─────────────────────┐
│  Google Drive       │  6. Store PDF, return fileId
└─────────────────────┘
       │
       │ 7. Queue processing job
       ↓
┌─────────────────────┐
│  Railway Worker     │  8. Process pages (Gemini API)
│  (Background)       │  9. Create page-NNN.json files
└──────┬──────────────┘
       │
       │ 10. Commit annotations to GitHub
       ↓
┌─────────────────────┐
│  GitHub (store      │  11. pages/page-001.json committed
│  results)           │
└─────────────────────┘
       │
       │ 12. Emit SSE event
       ↓
┌─────────────────────┐
│  Frontend (SSE)     │  13. Update progress bar
└─────────────────────┘
       │
       │ 14. User reviews annotations
       │ 15. Edit bounding boxes
       ↓
┌─────────────────────┐
│  SvelteKit API      │  16. Save edits
└──────┬──────────────┘
       │
       │ 17. Update page-NNN.json, commit
       ↓
┌─────────────────────┐
│  GitHub (version    │  18. New version in git history
│  control)           │
└─────────────────────┘
```

**No database at any step!** All data flows through GitHub and Google Drive.

---

## Environment Variables

```bash
# Application
NODE_ENV=production
PUBLIC_URL=https://pagesage.example.com

# GitHub (for auth + storage)
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
GITHUB_CALLBACK_URL=https://pagesage.example.com/auth/callback
GITHUB_SERVICE_ACCOUNT_TOKEN=  # For API operations
GITHUB_ORG=pagesage-books

# Google Drive (for binary storage)
GOOGLE_DRIVE_CLIENT_ID=
GOOGLE_DRIVE_CLIENT_SECRET=
GOOGLE_DRIVE_REFRESH_TOKEN=
GOOGLE_DRIVE_FOLDER_ID=  # Root PageSage folder

# AI API (choose one or both)
GOOGLE_AI_API_KEY=              # For Gemini
GOOGLE_CLOUD_PROJECT_ID=        # For Document AI (if needed)
GOOGLE_APPLICATION_CREDENTIALS= # Service account JSON path

# Sessions (stateless JWT)
JWT_SECRET=  # Random 32+ character string
JWT_EXPIRY=604800  # 7 days in seconds

# Cost tracking
MONTHLY_BUDGET_USD=100

# Optional: Claude for validation
ANTHROPIC_API_KEY=

# Worker configuration
MAX_CONCURRENT_JOBS=2
JOB_TIMEOUT_MS=3600000  # 1 hour per job
```

**No database connection strings needed!**

---

## Pros/Cons of Database-Free Architecture

### Advantages

✅ **Simplicity** - Fewer moving parts
✅ **Cost** - No DB hosting ($0 vs $5-20/month)
✅ **Version control** - Everything in git
✅ **Portability** - Clone repo = full backup
✅ **Transparency** - Open any file to inspect data
✅ **No migrations** - Schema changes = update TypeScript types
✅ **Offline-capable** - Can work with local git clone

### Limitations

⚠️ **Performance** - File I/O slower than DB queries (100-500ms vs 10-50ms)
⚠️ **Scalability** - Slower as data grows (fine for v1-v3, issue for v4+)
⚠️ **Queries** - Can't do complex searches (need to load and filter)
⚠️ **Concurrency** - File-based queue needs locking (v4 multi-user)
⚠️ **Job persistence** - In-memory queue lost on restart

### When to Add Database (Future)

**Triggers:**
- v4: Multi-user collaboration (need ACID transactions)
- Scale: >50 projects or >50,000 pages (file I/O bottleneck)
- Features: Full-text search, complex queries
- Real-time collab: Operational transforms, conflict resolution

**Migration path:** Add Postgres, keep GitHub as source of truth, use DB as cache

---

## Final Architecture Summary

```
┌──────────────────────────────────────────────────────────┐
│  FRONTEND (Browser)                                      │
│  - Svelte 5 components with TypeScript                  │
│  - Canvas-based annotation editor                       │
│  - Real-time SSE connections                            │
└────────────────────┬─────────────────────────────────────┘
                     │
                     │ HTTPS (API requests + SSE streams)
                     ↓
┌──────────────────────────────────────────────────────────┐
│  BACKEND (SvelteKit on Vercel - Serverless)             │
│  - API routes (+server.ts)                              │
│  - JWT session management (stateless)                   │
│  - GitHub API client (read/write repos)                 │
│  - Google Drive API client (upload/download)            │
│  - SSE event emitters                                   │
│  - In-memory job queue (or file-based)                  │
│  Timeout: 15 min (enough for API orchestration)         │
└────────┬──────────────┬──────────────┬─────────────────┘
         │              │              │
         ↓              ↓              ↓
┌─────────────┐ ┌─────────────┐ ┌────────────────────────┐
│   GitHub    │ │ Google      │ │ Railway Worker         │
│   Repos     │ │ Drive       │ │ (Background)           │
│             │ │             │ │                        │
│ metadata.   │ │ original.   │ │ - PDF splitting        │
│ json        │ │ pdf         │ │ - Image preprocessing  │
│             │ │             │ │ - Gemini API calls     │
│ pages/      │ │ pages/      │ │ - Long jobs (no limit) │
│  page-001.  │ │  page001.   │ │ - Commits to GitHub    │
│  json       │ │  png        │ │ - Emits progress       │
│             │ │             │ │   events               │
│ costs.      │ │             │ │                        │
│ jsonl       │ │             │ │ Always-on: $5/month    │
└─────────────┘ └─────────────┘ └────────────────────────┘
```

**No database anywhere in the stack!**

---

## Cost Projection (Database-Free)

**Monthly hosting:**
- Vercel: $0 (free tier, sufficient for v1)
- Railway worker: $5 (Hobby plan, 512MB RAM)
- GitHub: $0 (unlimited public/private repos)
- Google Drive: $0 (15GB free tier)
- Total: **$5/month**

**API costs (per book):**
- Gemini 2.5 Flash: $0.27 (or FREE on free tier)
- Document AI Layout Parser: $7.00 (if needed)

**Annual projection (10 books/year):**
- Hosting: $60/year ($5 × 12 months)
- API (Gemini): $2.70 or FREE
- API (Document AI): $70 (if needed)
- **Total: $60-130/year** (well under $120 budget)

---

## Next Steps

1. ✅ Architecture defined (database-free)
2. ⏳ Test Gemini 2.5 with samples
3. ⏳ Make API decision (ADR 002)
4. ⏳ Begin implementation (scaffold SvelteKit app)

**Ready to build!**
