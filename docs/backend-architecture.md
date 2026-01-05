# PageSage v1 - Backend Architecture Analysis

**Status:** ⚠️ PARTIALLY SUPERSEDED - See note below
**Last Updated:** 2025-12-05

> **NOTE:** The deployment architecture sections in this document (Architecture Options 1-3, Recommendations) are OUTDATED. For current deployment decisions, see [`deployment-architecture-cloudflare-github.md`](deployment-architecture-cloudflare-github.md).
>
> **Still Relevant:** Sample analysis, backend responsibilities, real-time patterns, cost tracking implementation.

This document analyzes backend architecture options for PageSage v1 to inform critical design decisions.

---

## Sample File Analysis

### Sample 1: `san with hindi-ch4 mahanirvana.pdf` (17 pages)

**Layout characteristics:**

- ✅ Single-column layout (no multi-column complexity)
- ✅ Clear verse structure (centered/indented Sanskrit)
- ✅ Hindi commentary in paragraph form
- ✅ Chapter headers and page numbers
- ✅ Verse numbers (|| १ ||, || २ || format)
- ✅ Dense Devanagari text with diacritical marks
- ❌ No footnotes in this sample
- ❌ No English text in this sample
- ❌ No multi-column layout

**Complexity:** MODERATE (Representative of simpler Sanskrit texts)

---

### Sample 2: `kalika few pgs.pdf` (13 pages) ⚠️ COMPLEX

**Layout characteristics:**

**Pages 1-4 (Introduction):**

- 🔴 **Two-column layout** with distinct left/right columns
- 🔴 **Extensive footnotes** (10+ per page) at bottom of EACH column
- 🔴 **Footnote references:** Superscript numbers (¹, ², ³) embedded in text
- 🔴 **Three languages mixed in same paragraph:**
  - English (main text)
  - IAST transliteration in italics (_puruṣa_, _itihāsa_, _smṛti_, _dharmashāstras_)
  - Sanskrit Devanagari inline
- 🔴 **Complex reading flow:** Left column top → bottom, then right column

**Page 8 (Chapter 88):**

- 🔴 **Parallel text (side-by-side):**
  - Left column: English translation
  - Right column: Sanskrit Devanagari with verse numbers
- 🔴 **Verse alignment:** English verse 1 ↔ Sanskrit verse || १ ||
- 🔴 **Semantic linking required** (not just spatial)

**Pages 11-13 (Śloka Index):**

- 🔴 **3-4 column dense layout**
- 🔴 **Thousands of index entries** (Sanskrit + page numbers)
- 🔴 **Extremely small text** (6-8pt font size)
- 🔴 **Complex page number references** (e.g., "६१२", "५१३१")

**Complexity:** VERY HIGH (Most challenging layout in ancient text digitization)

### Key Differences

| Feature       | Sample 1 (Simple)   | Sample 2 (Complex)          |
| ------------- | ------------------- | --------------------------- |
| Columns       | 1                   | 2-4                         |
| Languages     | 2 (Sanskrit, Hindi) | 3 (English, Sanskrit, IAST) |
| Footnotes     | None                | Extensive (10+/page)        |
| Parallel text | No                  | Yes (English ↔ Sanskrit)   |
| Index pages   | No                  | Yes (3-4 columns, dense)    |
| Reading order | Simple              | Complex (column-aware)      |
| Text styles   | Normal              | Normal + Italic (IAST)      |

**Impact on AI requirements:**

- Sample 1: Any modern OCR can handle
- Sample 2: Requires **strong layout detection** and **multi-language support**

---

## What the Backend Must Do

### Core Responsibilities

**1. Processing Pipeline (CPU/Memory Intensive)**

- PDF splitting (500MB files → 1000+ page images)
- Image preprocessing (deskew, color correction, noise reduction, crop)
- API orchestration (call Google AI APIs)
- Result processing (parse AI responses, create bounding boxes)

**2. Data Management**

- GitHub operations (create repos, commits, version control)
- Google Drive operations (upload PDFs/images, retrieve for display)
- Session/auth management (OAuth, secure cookies)
- Cost tracking (log API calls, calculate budgets)

**3. Real-Time Communication**

- Job status updates ("Processing page 350/700")
- Progress notifications
- Validation results
- Cost updates ("$67/$100 used")

**4. API Layer**

- CRUD for projects, pages, annotations
- Inline reference management
- Validation endpoints
- Export generation

### Processing Characteristics

**Job durations (estimated):**

- PDF split: 1-3 seconds per 100 pages
- Image preprocessing: 2-5 seconds per page
- AI layout detection: 1-3 seconds per page (API call)
- OCR extraction: 1-2 seconds per page (API call)
- Export generation: 5-10 seconds for 700-page book

**Total for 700-page book:**

- Sequential: ~2-3 hours
- Parallel (10 concurrent): ~15-20 minutes

**Memory requirements:**

- PDF processing: 500MB file in memory
- Image processing: 5-10MB per page
- Concurrent: 50-100MB per parallel job

---

## Architecture Option 1: Serverless (Vercel/Netlify)

### Stack

- **Frontend + API:** SvelteKit (TypeScript)
- **Functions:** Vercel Serverless Functions (Node.js)
- **Database:** PlanetScale (MySQL) or Turso (SQLite) or Supabase (Postgres)
- **Job Queue:** Database-backed (pg-boss or custom)
- **Image Processing:** Sharp (Node.js) or external service

### How It Works

```
User Request → SvelteKit Route → API Endpoint (Serverless Function)
                                        ↓
                                  Queue Job in Database
                                        ↓
                              Background Function (triggered)
                                        ↓
                              Process → Update DB → Notify User
```

**Real-time updates:** Server-Sent Events (SSE) from API route

```typescript
// +server.ts (API route)
export async function GET({ params }) {
  return new Response(
    new ReadableStream({
      async start(controller) {
        // Stream job status updates
        const job = await getJob(params.jobId);

        while (!job.isComplete) {
          const status = await job.getStatus();
          controller.enqueue(`data: ${JSON.stringify(status)}\n\n`);
          await sleep(1000);
        }
      },
    }),
    { headers: { "Content-Type": "text/event-stream" } },
  );
}
```

### Pros

✅ **Zero cost at low volume** (Vercel free tier: 100GB bandwidth, 100 hours serverless)
✅ **Auto-scaling** (handle spikes automatically)
✅ **Simple deployment** (`git push` to deploy)
✅ **Global CDN** (fast worldwide)
✅ **SvelteKit native** (unified stack)
✅ **No server management**
✅ **PlanetScale free tier:** 5GB storage, 1 billion row reads/month

### Cons

❌ **15-minute function timeout** (Vercel hobby, 300s on Pro)

- Risk: Long-running jobs (1000-page preprocessing) may timeout
- Mitigation: Break into smaller jobs (50 pages at a time)
  ❌ **Cold starts** (1-3 second delay on first request)
  ❌ **Stateless** (can't hold queue in memory)
  ❌ **Database required** for job queue (added complexity)
  ❌ **Limited parallel processing** (Vercel: 1 concurrent execution on free tier)

### Cost Estimate (Vercel Free Tier)

- Hosting: $0/month
- Database: $0/month (PlanetScale free tier)
- Bandwidth: Free up to 100GB/month
- Functions: Free up to 100 hours/month (enough for ~100 books/month)

**Good for:** v1 single-user, process 1-2 books/month

---

## Architecture Option 2: Always-On VPS

### Stack

- **Frontend + Backend:** SvelteKit (TypeScript)
- **Server:** Railway, Fly.io, or DigitalOcean ($5-10/month)
- **Database:** SQLite (local) or Postgres (included)
- **Job Queue:** BullMQ + Redis or in-memory queue
- **Image Processing:** Sharp (Node.js)

### How It Works

```
User Request → SvelteKit Route → API Endpoint
                                        ↓
                                  Queue Job (Redis or in-memory)
                                        ↓
                              Worker Process (always running)
                                        ↓
                              Process → Update DB → WebSocket notify
```

**Real-time updates:** WebSocket or SSE from long-running connection

```typescript
// WebSocket server (running continuously)
wss.on("connection", (ws, req) => {
  const userId = getUserFromSession(req);

  jobQueue.on("progress", (job) => {
    if (job.userId === userId) {
      ws.send(
        JSON.stringify({
          type: "job-progress",
          jobId: job.id,
          progress: job.progress,
        }),
      );
    }
  });
});
```

### Pros

✅ **No execution timeouts** (run jobs for hours if needed)
✅ **True real-time** (WebSockets, persistent connections)
✅ **In-memory queue option** (simpler, faster)
✅ **Full control** (any dependencies, any tools)
✅ **Better for parallel processing** (run multiple jobs simultaneously)
✅ **Predictable performance** (no cold starts)
✅ **Local SQLite option** (zero database cost)

### Cons

❌ **Always paying** ($5-10/month even when idle)
❌ **Server management** (monitoring, restarts, updates)
❌ **More complex deployment** (Docker, SSH, etc.)
❌ **Single point of failure** (need health checks, restart policies)
❌ **Manual scaling** (need to upgrade if load increases)

### Cost Estimate (Railway/Fly.io)

- Server: $5-10/month (1GB RAM, 1 vCPU)
- Redis (optional): $3-5/month or use in-memory
- Database: $0 (SQLite) or included in server
- Total: **$5-10/month**

**Good for:** v1-v4, predictable costs, long-running jobs

---

## Architecture Option 3: Hybrid (Serverless + Background Worker)

### Stack

- **Frontend + API:** SvelteKit on Vercel (serverless)
- **Background Worker:** Railway/Fly.io ($5/month) or Cloudflare Workers (cron)
- **Database:** Shared Postgres (PlanetScale or Railway)
- **Job Queue:** Database-backed (pg-boss)
- **Real-time:** SSE from serverless functions

### How It Works

```
User Request → Vercel API → Create job in DB → Return immediately
                                    ↓
                         Background Worker polls DB
                                    ↓
                         Process job → Update DB
                                    ↓
                         User polls /api/jobs/status (SSE)
```

### Pros

✅ **Best of both worlds** (cheap API, reliable background processing)
✅ **No timeout on workers** (process for hours)
✅ **Scale independently** (API vs workers)
✅ **Cheaper than full VPS** ($5/month for worker only)

### Cons

❌ **Two deployments** (frontend + worker)
❌ **Coordination complexity** (DB as communication layer)
❌ **More moving parts** (harder to debug)

### Cost Estimate

- Vercel: $0/month (free tier)
- Worker: $5/month (Railway Hobby plan)
- Database: $0/month (PlanetScale free tier)
- Total: **$5/month**

**Good for:** v1-v4, cost-conscious with scalability

---

## Backend Language Analysis

### Option A: TypeScript/Node.js (SvelteKit) ⭐ RECOMMENDED

**What it means:**

- Same codebase for frontend and backend
- SvelteKit handles both in one unified application
- API routes live alongside frontend routes

**Pros:**
✅ **Unified stack** (one language, one codebase)
✅ **Share types** (TypeScript interfaces used everywhere)
✅ **Simpler mental model** (developers know one system)
✅ **Great ecosystem:**

- `pdf-lib` or `pdf.js` for PDF manipulation
- `sharp` for image processing (very fast, uses libvips)
- Google AI SDKs available
- GitHub Octokit for Git operations
  ✅ **SvelteKit advantages:**
- Built-in API routes (`+server.ts`)
- Form actions for mutations
- SSR + client-side rendering
- Great DX (developer experience)

**Cons:**
❌ **Slower for heavy compute** (vs Go/Rust, but Sharp is C++ under the hood)
❌ **Higher memory usage** (vs Go)
❌ **Image processing limitations** (Node.js not ideal for CV tasks)

**Image processing with Sharp:**

```typescript
import sharp from "sharp";

async function preprocessImage(inputPath: string): Promise<Buffer> {
  return await sharp(inputPath)
    .rotate() // Auto-deskew
    .normalize() // Color correction
    .median(3) // Noise reduction
    .trim() // Crop borders
    .toBuffer();
}
```

**Good for:** v1-v4, unified stack, moderate processing needs

---

### Option B: Python Backend

**What it means:**

- SvelteKit frontend (TypeScript)
- FastAPI/Flask backend (Python)
- Communication via REST API

**Pros:**
✅ **Best image processing** (OpenCV, Pillow, scikit-image)
✅ **Best AI/ML libraries** (if we add custom models later)
✅ **Excellent Google AI SDK** (google-cloud-documentai, google-generativeai)
✅ **Better for computer vision:**

```python
import cv2
import numpy as np

def preprocess_image(image_path):
    img = cv2.imread(image_path)
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    deskewed = deskew(gray)  # OpenCV has excellent deskew
    denoised = cv2.fastNlMeansDenoising(deskewed)
    return cropped_borders(denoised)
```

**Cons:**
❌ **Two languages** (TypeScript + Python)
❌ **Separate deployment** (frontend + backend)
❌ **API layer overhead** (need REST API between them)
❌ **Type safety gap** (TypeScript types don't transfer to Python)
❌ **More complex dev setup** (two dev servers)

**Good for:** Heavy image processing, custom ML models, computer vision focus

---

### Option C: Go Backend

**What it means:**

- SvelteKit frontend
- Go HTTP server backend
- Communication via REST API

**Pros:**
✅ **Extremely fast** (compiled, concurrent)
✅ **Low memory** (efficient garbage collection)
✅ **Great for APIs** (net/http, goroutines)
✅ **Single binary deployment** (easy Docker)
✅ **Excellent concurrency** (goroutines for parallel processing)

**Cons:**
❌ **Limited image processing libraries** (not as good as Python/Node)
❌ **Smaller ecosystem** for document processing
❌ **Separate language** from frontend
❌ **Steeper learning curve**

**Good for:** High-performance APIs, many concurrent users (v4+)

---

### Option D: Backend-as-a-Service (Supabase/Firebase)

**What it means:**

- Supabase/Firebase handles: database, auth, storage, real-time
- You write minimal backend code (just business logic)
- SvelteKit calls Supabase APIs directly

**Pros:**
✅ **Minimal backend code** (Supabase handles infrastructure)
✅ **Real-time built-in** (Supabase Realtime)
✅ **Auth built-in** (but we use GitHub OAuth)
✅ **Free tier:** Supabase free tier is generous
✅ **Fast development**

**Cons:**
❌ **Still need custom functions** for image processing
❌ **Vendor lock-in**
❌ **Less control** over infrastructure
❌ **Not ideal for heavy processing** (still need worker for long jobs)

**Cost:**

- Supabase: $0/month free tier (500MB database, 1GB file storage)
- Cloudflare Workers: $0/month free tier (100k requests/day)
- Total: **$0/month** (for low volume)

**Good for:** Rapid prototyping, minimal ops, database-heavy apps

---

## Real-Time Communication Patterns

### Pattern 1: Polling (Simplest)

**How it works:**

```typescript
// Frontend
let status = $state({ progress: 0 });

setInterval(async () => {
  status = await fetch("/api/jobs/abc123/status").then((r) => r.json());
}, 2000); // Poll every 2 seconds
```

**Pros:** Works everywhere, simple
**Cons:** Wasteful (many unnecessary requests), 2-second delay

**Cost:** Moderate (lots of API calls)

---

### Pattern 2: Server-Sent Events (SSE) ⭐ RECOMMENDED

**How it works:**

```typescript
// Backend (SvelteKit API route)
export async function GET({ params }) {
  const { jobId } = params;

  return new Response(
    new ReadableStream({
      async start(controller) {
        // Subscribe to job updates
        const unsubscribe = jobQueue.subscribe(jobId, (update) => {
          controller.enqueue(
            new TextEncoder().encode(`data: ${JSON.stringify(update)}\n\n`)
          );
        });

        // Cleanup on disconnect
        return () => unsubscribe();
      }
    }),
    {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      }
    }
  );
}

// Frontend (Svelte component)
<script lang="ts">
  import { onMount } from 'svelte';

  let progress = $state(0);
  let status = $state('');

  onMount(() => {
    const eventSource = new EventSource(`/api/jobs/${jobId}/stream`);

    eventSource.onmessage = (event) => {
      const update = JSON.parse(event.data);
      progress = update.progress;
      status = update.status;
    };

    return () => eventSource.close();
  });
</script>

<div>
  <p>Status: {status}</p>
  <progress value={progress} max="100" />
</div>
```

**Pros:**
✅ **Real-time** (no polling delay)
✅ **Efficient** (server pushes only when changes)
✅ **Works with serverless** (keeps connection open)
✅ **Native browser API** (EventSource)
✅ **Auto-reconnect** (browser handles reconnection)

**Cons:**
⚠️ **One-way only** (server → client)
⚠️ **Connection limits** (browser limits to 6 SSE connections per domain)

**Cost:** Low (one connection per active user)

---

### Pattern 3: WebSockets (Bidirectional)

**How it works:**

```typescript
// Backend (requires always-on server or adapter)
import { WebSocketServer } from "ws";

const wss = new WebSocketServer({ port: 8080 });

wss.on("connection", (ws) => {
  jobQueue.on("update", (data) => {
    ws.send(JSON.stringify(data));
  });

  ws.on("message", (message) => {
    // Handle client commands
    const cmd = JSON.parse(message);
    if (cmd.type === "cancel-job") {
      jobQueue.cancel(cmd.jobId);
    }
  });
});

// Frontend
const ws = new WebSocket("ws://localhost:8080");
ws.onmessage = (event) => {
  const update = JSON.parse(event.data);
  progress = update.progress;
};

// Send commands to server
ws.send(JSON.stringify({ type: "cancel-job", jobId: "123" }));
```

**Pros:**
✅ **True bidirectional** (client can send commands)
✅ **Lower latency** than SSE
✅ **Binary data support** (if needed)

**Cons:**
❌ **Doesn't work well with serverless** (needs persistent connection)
❌ **Requires always-on server** or adapter (more cost)
❌ **More complex** (reconnection logic, heartbeats)
❌ **Not needed for v1** (we don't need client→server commands during processing)

**Cost:** Requires VPS ($5-10/month)

---

### Pattern 4: Database Polling (Hybrid)

**How it works:**

```typescript
// Frontend polls DB for job status
let job = $state(null);

setInterval(async () => {
  job = await fetch(`/api/jobs/${jobId}`).then((r) => r.json());

  if (job.status === "completed") {
    clearInterval(interval);
  }
}, 5000);
```

**Pros:**
✅ **Simple** (no SSE/WebSocket complexity)
✅ **Works anywhere**
✅ **Stateless backend**

**Cons:**
❌ **5-second delay** (polling interval)
❌ **Database load** (constant queries)
❌ **Not truly real-time**

**Good for:** Fallback when SSE unavailable

---

## Cost Tracking & Display

### How User Sees Current Costs

**Pattern: Real-time cost aggregation from logs**

```typescript
// API endpoint
export async function GET({ params }) {
  const { projectId } = params;

  // Read costs.jsonl and aggregate
  const costLog = await readCostLog(projectId);
  const thisMonth = costLog
    .filter(entry => isThisMonth(entry.timestamp))
    .reduce((sum, entry) => sum + entry.totalCost, 0);

  const budget = await getMonthlyBudget();

  return json({
    spent: thisMonth,
    budget: budget,
    percentage: (thisMonth / budget) * 100,
    breakdown: aggregateByOperation(costLog)
  });
}

// Frontend (reactive)
<script lang="ts">
  import { onMount } from 'svelte';

  let costData = $state(null);

  onMount(async () => {
    // Load initial data
    costData = await fetch('/api/costs/current').then(r => r.json());

    // Subscribe to updates (SSE)
    const events = new EventSource('/api/costs/stream');
    events.onmessage = (e) => {
      costData = JSON.parse(e.data);
    };

    return () => events.close();
  });
</script>

<div class="cost-widget">
  <h3>Monthly Budget</h3>
  <p>${costData.spent} / ${costData.budget}</p>
  <progress value={costData.percentage} max="100" />

  {#if costData.percentage > 80}
    <div class="warning">⚠️  Budget at {costData.percentage}%</div>
  {/if}
</div>
```

**Update frequency:**

- **After each API call:** Append to `costs.jsonl`
- **Trigger SSE event:** Notify all connected clients
- **Dashboard updates:** Real-time (via SSE) or every 30s (polling)

---

## Google AI API Research

### Option 1: Google Document AI

**Two processors available:**

**A) Document OCR Processor** (Text extraction only)

- **Pricing:** $1.50 per 1,000 pages
- **Capabilities:** OCR only (200+ languages including Devanagari)
- **Cost for 700-page book:** $1.05
- **Limitation:** ❌ No multi-column layout detection

**B) Layout Parser Processor** (OCR + Layout structure)

- **Pricing:** $10 per 1,000 pages
- **Capabilities:** OCR + layout detection (columns, tables, lists, chunks)
- **Cost for 700-page book:** $7.00
- **Advantage:** ✅ Handles multi-column, complex layouts

**For complex kalika sample:** Need Layout Parser = **$7.00/book**

**Annual cost (10 books/year):**

- Simple texts (OCR only): ~$10.50
- Complex texts (Layout Parser): ~$70.00

**Devanagari support:** ✅ Confirmed (200+ languages)

---

### Option 2: Gemini 2.0 Flash ⭐ RECOMMENDED

**Pricing:**

- **FREE tier:** Unlimited (rate-limited)
- **Paid tier:** $0.10 per 1M tokens
- **Image tokens:** ~1290 tokens per standard page
- **Batch mode:** 50% discount ($0.05 per 1M tokens)

**Capabilities:**

- Modern vision model with OCR built-in
- Document understanding and layout analysis
- 95%+ accuracy for printed text
- 100+ languages supported
- Can extract structure (tables, lists, etc.)

**Cost for 700-page book:**

- Tokens: 700 × 1290 = 903,000 tokens (~0.9M)
- **FREE tier:** $0.00
- **Paid tier:** 0.9M × $0.10/1M = **$0.09** (10x cheaper than Document AI!)
- **Batch mode:** $0.045 (20x cheaper!)

**Annual cost (10 books/year):**

- Free tier: **$0.00** 🎉
- Paid tier: **$0.90**

**Devanagari support:** ✅ Likely (100+ languages), needs testing

---

### Option 3: Gemini 2.5 Flash

**Pricing:**

- **FREE tier:** Unlimited (rate-limited)
- **Paid tier:** $0.30 per 1M tokens (3x more than 2.0)

**Cost for 700-page book:**

- **FREE tier:** $0.00
- **Paid tier:** $0.27

**Better quality** than 2.0 Flash, but likely overkill for OCR

---

### Option 4: Open Source (Tesseract)

**Pricing:** $0 (self-hosted)

**Capabilities:**

- Devanagari support via hin.traineddata
- No layout detection (need separate solution)
- Lower accuracy (~85-90% vs 95%+)

**Cons:**
❌ **Worse accuracy** (85-90% vs 95%+)
❌ **No layout detection** (need custom solution)
❌ **More work** (self-hosted, training)

**Good for:** Offline processing, zero API cost tolerance

---

### Option 5: Hybrid Approach

**Strategy:** Use Gemini for most tasks, Document AI for quality-critical pages

```typescript
async function processPage(page: Page): Promise<AnnotationResult> {
  // Try Gemini first (cheap/free)
  const geminiResult = await gemini.analyzeDocument(page.image);

  // If confidence < 85%, use Document AI
  if (geminiResult.confidence < 0.85) {
    return await documentAI.processDocument(page.image);
  }

  return geminiResult;
}
```

**Cost optimization:** 90% Gemini ($0), 10% Document AI ($0.15)

---

## My Recommendations

### For v1 (Single User, Cost-Conscious)

**Backend Architecture:** Hybrid Serverless + Small Worker

**Stack:**

```
Frontend: SvelteKit on Vercel (free tier)
API: SvelteKit API routes (serverless)
Database: Turso SQLite (free tier, edge-replicated)
Job Queue: Database-backed (custom simple queue)
Worker: Railway Hobby ($5/month) - Node.js
Image Processing: Sharp (Node.js)
Real-time: Server-Sent Events (SSE)
Language: TypeScript (unified stack)
```

**Why:**
✅ **Low cost:** $5/month total (free for low volume, $5 for worker if needed)
✅ **Unified language:** TypeScript everywhere
✅ **No timeouts:** Worker handles long jobs
✅ **Real-time:** SSE for progress
✅ **Simple:** One codebase, minimal ops

---

**AI API:** Gemini 2.0 Flash (Primary) + Document AI (Fallback)

**Strategy:**

1. **Start with Gemini 2.0 Flash:**
   - FREE tier for testing and low volume
   - 10x cheaper than Document AI when paying
   - Modern vision model with document understanding

2. **Test with your sample files:**
   - Process "san with hindi-ch4 mahanirvana.pdf"
   - Check Devanagari accuracy
   - Verify layout detection quality
   - Compare confidence scores

3. **Fallback to Document AI if needed:**
   - If Gemini accuracy < 90% for Sanskrit
   - For quality-critical pages
   - Hybrid approach: 90% Gemini, 10% Document AI

**Why:**
✅ **FREE tier:** Process many books at $0 cost
✅ **10-20x cheaper:** $0.09 vs $1.05 per book when paying
✅ **Modern AI:** Gemini 2.0 is state-of-the-art vision model
✅ **Flexibility:** Can switch or hybrid if needed

---

**Cost projection for v1:**

**Scenario 1: Light use (1-5 books/year)**

- API: $0 (Gemini free tier)
- Hosting: $0 (Vercel free tier)
- Storage: $0 (Google Drive 15GB free)
- **Total: $0/month** 🎉

**Scenario 2: Moderate use (10-20 books/year, testing)**

- API: ~$1-2/month (Gemini paid tier)
- Hosting: $0 or $5/month (if need worker)
- Storage: $1.99/month (100GB Google Drive)
- **Total: $3-9/month**

**Scenario 3: Heavy use (50+ books/year)**

- API: ~$5/month (Gemini)
- Hosting: $5/month (worker needed)
- Storage: $1.99/month
- **Total: ~$12/month**

**All scenarios under your $10/month budget for moderate use!**

---

## Critical Finding: Layout Complexity

Your samples reveal **two difficulty tiers:**

**Tier 1 (Simple):** Sanskrit-Hindi single column

- Any modern OCR will work
- Gemini 2.0 Flash likely sufficient

**Tier 2 (Complex):** Multi-column with footnotes

- **Requires specialized layout detection**
- May need Document AI's layout processor
- Critical features:
  - Multi-column boundary detection
  - Reading order across columns
  - Footnote-per-column handling
  - Parallel text alignment
  - Mixed language in same paragraph

### Hybrid Strategy Recommendation

```typescript
async function processPage(page: Page): Promise<AnnotationResult> {
  // Analyze layout complexity first (simple heuristic)
  const complexity = await analyzeComplexity(page);

  if (complexity === "simple") {
    // Use Gemini 2.0 Flash (free/cheap)
    return await gemini.analyzeDocument(page.image);
  } else {
    // Use Document AI Layout Processor (specialized, more expensive)
    return await documentAI.processLayout(page.image);
  }
}

function analyzeComplexity(page: Page): "simple" | "complex" {
  // Simple checks:
  // - Detect multiple columns (image analysis)
  // - Count potential footnote regions
  // - Detect mixed scripts

  // For v1: Let user choose per-project
  return page.projectSettings.layoutComplexity;
}
```

**Cost optimization:**

- Simple pages (70% of books?): Gemini $0.00-0.09 per book
- Complex pages (30% of books?): Document AI $1.05 per book
- Blended: **~$0.30 per book** (67% savings!)

### Updated Recommendations

**AI API Strategy:** Three-tier approach

**Tier 1: Gemini 2.0 Flash (Free tier first)**

- Use for: Simple single-column Sanskrit/Hindi texts
- Cost: **$0.00** (free tier) or **$0.09/book** (paid)
- Quality: Test and validate

**Tier 2: Gemini 2.5 Flash (if 2.0 insufficient)**

- Use for: Complex multi-column layouts
- Cost: **$0.27/book** (still cheaper than Document AI)
- Quality: Better than 2.0 for complex documents

**Tier 3: Document AI (fallback for quality-critical)**

- Use for: Pages where Gemini fails or low confidence
- Cost: **$1.05/book**
- Quality: Specialized for documents, proven accuracy

**Testing priority:**

1. Test Gemini 2.0 Flash with **simple sample** (san-with-hindi)
2. Test Gemini 2.5 Flash with **complex sample** (kalika)
3. Test Document AI with **complex sample** as baseline
4. Compare accuracy, layout detection, footnote handling
5. Make data-driven decision

---

## Next Steps: Comprehensive Testing Plan

Before committing to any API, we MUST test with both samples:

### Phase 1: Simple Sample Test

**File:** `san with hindi-ch4 mahanirvana.pdf`
**Test with:** Gemini 2.0 Flash

**Validation:**

- ✅ Devanagari OCR accuracy (manual spot-check 20 verses)
- ✅ Hindi commentary accuracy
- ✅ Verse structure detection
- ✅ Reading order correctness
- ✅ Page numbers and headers

**Success criteria:** >95% accuracy

---

### Phase 2: Complex Sample Test ⚠️ CRITICAL

**File:** `kalika few pgs.pdf`
**Test with:** Gemini 2.5 Flash AND Document AI

**Validation:**

- ✅ Multi-column boundary detection (columns correctly identified?)
- ✅ Reading order across columns (proper flow?)
- ✅ Footnote detection (all 10+ footnotes found?)
- ✅ Footnote reference linking (superscripts linked to footnotes?)
- ✅ IAST detection (italic text recognized as transliteration?)
- ✅ English OCR accuracy
- ✅ Sanskrit Devanagari accuracy
- ✅ Parallel text alignment (English ↔ Sanskrit verses linked?)
- ✅ Index page handling (3-4 columns, thousands of entries)

**Success criteria:** >90% accuracy for both OCR and layout structure

**If Gemini 2.5 fails:**

- Fall back to Document AI Layout Processor
- Accept higher cost for quality

---

### Phase 3: Cost-Benefit Analysis

**After testing, calculate:**

| Scenario          | API Choice       | Accuracy | Cost/Book  | Cost/10 Books |
| ----------------- | ---------------- | -------- | ---------- | ------------- |
| All Gemini 2.0    | Gemini 2.0 Flash | TBD      | $0.00-0.09 | $0.00-0.90    |
| All Gemini 2.5    | Gemini 2.5 Flash | TBD      | $0.27      | $2.70         |
| All Document AI   | Document AI      | 95%+     | $1.05      | $10.50        |
| Hybrid (70/30)    | Gemini/DocAI     | TBD      | ~$0.35     | ~$3.50        |
| Per-page decision | Best for each    | Highest  | Variable   | $2-8          |

**Decision criteria:**

- If Gemini 2.5 ≥ 92% accuracy → Use Gemini (save $7-10/year)
- If Gemini 2.5 < 92% accuracy → Use Document AI (quality > cost)
- If mixed results → Hybrid approach per project complexity

---

## Alternative: Using Claude Code for OCR?

### Can Claude Code (Sonnet 4.5) Be Used for OCR?

**Short answer:** Yes for small-scale validation, **No for production bulk processing**.

### What Claude CAN Do

**Strengths:**
✅ **Multimodal vision** - Can see images and extract text
✅ **Understands layout** - Can identify columns, verses, footnotes
✅ **Follows complex instructions** - "Extract text from left column only"
✅ **Mixed language** - Handles English + IAST + Devanagari simultaneously
✅ **Nuanced detection** - Can distinguish IAST (italic) from emphasis
✅ **Structured output** - Can output JSON with bounding boxes
✅ **Quality validation** - Can review AI-generated annotations
✅ **Error correction** - Can fix OCR mistakes interactively

**Example usage:**

```typescript
// Ask Claude to process a page
const response = await claude.messages.create({
  model: "claude-sonnet-4.5",
  messages: [
    {
      role: "user",
      content: [
        {
          type: "image",
          source: {
            type: "base64",
            media_type: "image/png",
            data: pageImageBase64,
          },
        },
        {
          type: "text",
          text: "Extract all text from this page. Identify: 1) Column boundaries, 2) Verse text vs commentary, 3) Footnotes and their references, 4) Languages (English, IAST, Sanskrit). Return as JSON with bounding boxes.",
        },
      ],
    },
  ],
  max_tokens: 4096,
});
```

### What Claude CANNOT Do Well

**Limitations:**
❌ **Not optimized for batch processing** - Designed for interactive use
❌ **Slower than specialized OCR** (2-5 seconds per page vs <1 second)
❌ **Context limits** - Can't process 700 pages in one request
❌ **Cost at scale:**

- Sonnet 4.5: ~$3 per 1M input tokens
- One page image: ~1,500 tokens
- 700 pages: ~1M tokens = **$3 per book**
- Compare: Gemini $0.09, Document AI $1.05
  ❌ **Rate limits** - API has request rate limits
  ❌ **No bounding box coordinates** - Claude describes layout but doesn't give pixel coordinates
  ❌ **Manual process** - Need human to prompt for each page

### Cost Comparison

| API                           | Cost per Book (700 pages) | Annual (10 books) |
| ----------------------------- | ------------------------- | ----------------- |
| Gemini 2.0 Flash              | $0.00-0.09                | $0.00-0.90        |
| Gemini 2.5 Flash              | $0.27                     | $2.70             |
| **Claude Sonnet 4.5**         | **~$3.00**                | **~$30.00**       |
| Document AI OCR only          | $1.05                     | $10.50            |
| **Document AI Layout Parser** | **$7.00**                 | **$70.00**        |

**For complex layouts:**

- Document AI Layout Parser: $7.00/book (proven, specialized)
- Gemini 2.5 Flash: $0.27/book (unproven, 26x cheaper)
- Testing is critical to validate if Gemini can match Document AI quality

### Best Use of Claude Code for PageSage

**Instead of bulk OCR, use Claude for:**

**1. Quality Assurance & Validation**

```typescript
// After Gemini processes a page, ask Claude to validate
async function validateOCR(
  page: PageImage,
  geminiResult: OcrResult,
): Promise<ValidationReport> {
  const claudeReview = await claude.validate({
    image: page,
    ocrResult: geminiResult,
    prompt:
      "Review this OCR output. Check for: 1) Missed footnote references, 2) Incorrect column boundaries, 3) Wrong language detection, 4) IAST transliteration errors. Provide specific corrections.",
  });

  return claudeReview;
}
```

**2. Complex Layout Decision-Making**

```typescript
// For pages where Gemini has low confidence
if (geminiResult.confidence < 0.85) {
  const claudeAnalysis = await claude.analyzeLayout({
    image: page,
    prompt:
      "This page has complex layout. Identify: 1) Number of columns, 2) Footnote regions, 3) Parallel text pairs. Is this a standard two-column layout or something more complex?",
  });

  // Use Claude's analysis to guide manual annotation
}
```

**3. Annotation Review & Correction**

```typescript
// User asks Claude to review their annotations
const review = await claude.reviewAnnotations({
  image: page,
  annotations: userAnnotations,
  prompt:
    "I've annotated this page. Are there any boxes I missed? Are the content types correct? Check especially for footnote references.",
});
```

**4. Handling Edge Cases**

- Pages with unusual layouts
- Damaged/poor quality scans
- Ambiguous text regions
- Quality-critical passages

### Recommended Hybrid Approach

```
Bulk Processing Pipeline:
━━━━━━━━━━━━━━━━━━━━━━━
1. Gemini 2.0/2.5 Flash → Process all pages (fast, cheap/free)
2. Low confidence pages → Flag for review
3. User reviews → Fix obvious errors
4. [Optional] Claude validation → Spot-check 10% of pages for quality
5. User final review → Approve for export

Quality Assurance:
━━━━━━━━━━━━━━━━━━━━━━━
- User can ask Claude Code: "Review page 45 annotations"
- Claude provides detailed feedback
- User makes corrections
- Repeat as needed

Interactive Assistance:
━━━━━━━━━━━━━━━━━━━━━━━
- User: "Claude, is this IAST or emphasized English?"
- Claude: "That's IAST transliteration. The italic *puruṣa* should be marked as language: 'iast'"
```

### Conclusion: Use Both!

**Gemini/Document AI:** Bulk OCR (automated, fast, cheap)
**Claude Code:** QA, validation, edge cases (interactive, high-quality)

**Benefits:**

- Best cost efficiency (Gemini free tier)
- Best quality (Claude validates)
- Best UX (Claude helps user during annotation)
- Flexible (use Claude when needed, not for every page)

---

## Quality-First Analysis (Cost Aside)

### If Cost Were Not a Constraint, Which API Is Best?

**For your specific content (complex Sanskrit texts with multi-column, footnotes, IAST):**

---

### Winner: Google Document AI Layout Parser 🥇

**Why it's the best for complex documents:**

**1. Purpose-Built for Complex Layout Detection**

- **Specialized processor** designed specifically for document layout analysis
- Trained on millions of documents with multi-column layouts
- **Column detection is a core feature** (not an afterthought)
- Reading order algorithm specifically designed for documents
- Understands document hierarchy (header, body, footer, footnotes)

**2. Precise Bounding Box Coordinates**

```json
// Document AI output
{
  "pages": [
    {
      "blocks": [
        {
          "layout": {
            "boundingPoly": {
              "vertices": [
                { "x": 100, "y": 200 },
                { "x": 500, "y": 200 },
                { "x": 500, "y": 320 },
                { "x": 100, "y": 320 }
              ]
            },
            "confidence": 0.98,
            "orientation": "PAGE_UP"
          },
          "blockType": "PARAGRAPH"
        }
      ]
    }
  ]
}
```

- **Pixel-perfect coordinates** - exactly what we need for annotation editor
- Claude gives descriptions ("left column"), not coordinates
- Gemini gives general regions, Document AI gives precise polygons

**3. Document Structure Understanding**

- Detects: paragraphs, lines, tokens, symbols
- Classifies: header, footer, footnote, page number, title
- **Reading order:** Built-in Z-order across columns
- **Table detection:** Handles index pages (3-4 column tables)

**4. Handles Your Specific Challenges**

For the **kalika sample complexity:**

| Challenge               | Document AI                     | Gemini 2.5           | Claude                       |
| ----------------------- | ------------------------------- | -------------------- | ---------------------------- |
| Multi-column (2-4)      | ✅ Core feature                 | ⚠️ May work          | ❌ No coordinates            |
| Column reading order    | ✅ Built-in algorithm           | ⚠️ Uncertain         | ✅ Understands but imprecise |
| Footnote detection      | ✅ Footnote classifier          | ⚠️ General detection | ✅ Understands concept       |
| Footnote references     | ⚠️ May need custom logic        | ⚠️ May detect        | ✅ Can identify              |
| IAST (italic) detection | ⚠️ Detects italic, not semantic | ⚠️ Detects italic    | ✅ Semantic understanding    |
| Parallel text linking   | ❌ Spatial only                 | ❌ Spatial only      | ✅ Semantic linking          |
| Precise coordinates     | ✅ Pixel-level                  | ✅ Region-level      | ❌ Descriptive only          |
| Batch processing        | ✅ Optimized                    | ✅ Fast              | ❌ Interactive               |

**5. Production-Ready**

- Proven reliability (used by enterprises)
- Consistent output format
- Well-documented API
- SLA guarantees
- Rate limits for scale

---

### Runner-Up: Claude Sonnet 4.5 🥈

**Why Claude is excellent for UNDERSTANDING but not PROCESSING:**

**Strengths:**
✅ **Best semantic understanding:**

- "This italic _puruṣa_ is IAST transliteration, not emphasis"
- "These English and Sanskrit verses are parallel translations"
- "This footnote references verse 2.11 on page 50"

✅ **Nuanced detection:**

- Can distinguish subtle differences (IAST vs emphasis)
- Understands context (why verses are paired)
- Explains reasoning

✅ **Flexible instructions:**

- Can follow complex multi-step prompts
- Adapts to different document styles
- Handles edge cases intelligently

**Critical weakness:**
❌ **No pixel-level bounding boxes**

- Claude describes: "The left column contains..."
- PageSage needs: `{x: 100, y: 200, width: 400, height: 600}`
- Could estimate from descriptions, but imprecise

**Best use:** Quality validation, not primary OCR

---

### Third Place: Gemini 2.5 Flash 🥉

**Why it's middle-ground:**

**Strengths:**
✅ **Modern vision model** (state-of-the-art as of 2024)
✅ **Document understanding** built-in
✅ **OCR quality** 95%+ for printed text
✅ **Provides bounding boxes** (region-level)
✅ **Fast** (optimized for speed)

**Unknowns for complex Sanskrit documents:**
⚠️ **Multi-column detection** - General vision model, not document-specific
⚠️ **Footnote handling** - May detect as separate regions, but linking?
⚠️ **Reading order** - Has algorithm, but optimized for complex documents?
⚠️ **Devanagari accuracy** - Supports 100+ languages, but Sanskrit-specific training?

**Risk:** Gemini is a **general vision model**, not specialized for documents.

- Like using a Swiss Army knife instead of a scalpel
- May work well, may miss nuances
- **Needs testing to validate**

---

## The Hybrid Gold Standard

**If quality is paramount, use ALL THREE:**

```typescript
async function processPage(page: PageImage): Promise<Annotations> {
  // 1. Get precise layout from Document AI
  const layout = await documentAI.detectLayout(page);
  // Returns: precise bounding boxes, column boundaries, reading order

  // 2. Get OCR text from Gemini (fast, good quality)
  const ocr = await gemini.extractText(page, { regions: layout.boundingBoxes });
  // Returns: text for each region with confidence

  // 3. Validate with Claude (spot-check critical pages)
  if (page.isCritical || layout.confidence < 0.9) {
    const validation = await claude.review({
      image: page,
      layout: layout,
      ocr: ocr,
      prompt:
        "Validate: 1) Column boundaries correct? 2) All footnotes found? 3) IAST detected? 4) Parallel verses aligned?",
    });

    // Apply Claude's corrections
    applyCorrections(layout, validation);
  }

  return mergeResults(layout, ocr);
}
```

**Cost:** $7.00 (Document AI Layout Parser) + $0.09 (Gemini OCR) + $0.30 (Claude validation) = **~$7.39/book**

**Quality:** Maximum - each AI does what it's best at

**Alternative:** Use Gemini 2.5 for both layout + OCR = **$0.27/book** (26x cheaper, quality TBD)

---

## My Honest Recommendation

**Quality ranking for complex Sanskrit documents:**

### For Layout Detection (Multi-column, Reading Order):

1. **Document AI Layout Parser** - Purpose-built, proven
2. Gemini 2.5 Flash - May work, needs testing
3. Claude - Understands but imprecise

### For OCR Accuracy (Devanagari, IAST):

1. **Document AI OCR** - Proven 97% for Sanskrit (2019 data)
2. Gemini 2.5 Flash - 95%+ general, unknown for Sanskrit
3. Claude - Good but not optimized

### For Semantic Understanding (Parallel Text, IAST vs Emphasis):

1. **Claude Sonnet 4.5** - Best reasoning
2. Document AI - Rule-based only
3. Gemini 2.5 - Good but not specialized

### For Production Pipeline:

1. **Document AI** - Designed for this exact use case
2. Gemini 2.5 - Fast, good, unproven for complexity
3. Claude - Not suitable for batch processing

---

## The Honest Truth

**If I were building this for a client and quality was the top priority:**

I'd use **Google Document AI** because:

- It's **purpose-built** for complex document layout detection
- It has **proven accuracy** for Devanagari (97% from 2019 research)
- It provides **precise coordinates** needed for annotation editor
- It's a **known quantity** - no surprises

**Gemini is unproven for this specific use case.** It might be great! But we don't know:

- How well does it handle 3-4 column index pages?
- Can it reliably detect footnote references?
- Does it maintain reading order across complex columns?
- What's the accuracy for Sanskrit specifically?

**Claude is amazing for understanding** but not designed for bulk coordinate extraction.

## My Final Recommendation

**For v1 production system focused on quality:**

```
Primary: Google Document AI Layout Parser + OCR
Validation: Claude Code (spot-check 10% of pages)
Fallback: Gemini 2.5 (if Document AI has issues)
```

**Cost:**

- Layout Parser: ~$7.00/book, ~$70/year for 10 books
- OCR only: ~$1.05/book, ~$10.50/year for 10 books

**Quality:** Highest confidence for production use

**Trade-off:** 26x more expensive than Gemini, but proven for complex layouts

**Recommendation:** Test Gemini 2.5 first - if it achieves >90% accuracy, use it and save $67/year!

### Immediate: API Testing (CRITICAL)

**Must test with both complexity levels:**

1. **Create Gemini test script** (Node.js/TypeScript)
2. **Process simple sample** (san-with-hindi) with Gemini 2.0 Flash
3. **Process complex sample** (kalika) with Gemini 2.5 Flash
4. **Document results:**
   - OCR accuracy (spot-check 50 words per sample)
   - Layout detection quality (columns, footnotes, reading order)
   - Footnote reference detection
   - Language detection (English, Sanskrit, IAST)
5. **Compare against Document AI** (if available)
6. **Make informed decision** and document in ADR 002

**Timeline:** 1-2 hours for testing, 30 min for documentation

---

### Then: Backend Architecture Decision

**Based on test results, choose:**

**Option A: Pure Serverless** (if processing time acceptable)

- Vercel free tier
- Database-backed queue
- SSE for real-time
- Cost: $0-3/month

**Option B: Hybrid** (if need long-running workers)

- Vercel frontend (free)
- Railway worker ($5/month)
- SSE for real-time
- Cost: $5-7/month

**Document in:** ADR 003 - Backend Architecture

---

### Finally: Update TODO.md

Mark complete:

- #4: Google AI API Selection (after testing)
- Update remaining items based on architecture choice

---

## Sources

- [Google Document AI Pricing](https://cloud.google.com/document-ai/pricing)
- [Gemini API Pricing](https://ai.google.dev/gemini-api/docs/pricing)
- [Google OCR for Sanskrit (2018 analysis)](http://www.prakrit.info/blog/google-ocr-for-sanskrit/)
- [Tesseract Hindi/Sanskrit](https://sourceforge.net/projects/tesseracthindi/)
- [Sanskrit OCR Research (2025)](https://aclanthology.org/2025.wsc-csdh.5.pdf)
- [Document AI vs Azure comparison](https://didikmulyadi.medium.com/should-i-switch-lets-compare-google-document-ai-and-azure-document-ai-1b5d722a605b)
