# PageSage v1 - Requirements & Implementation Plan

**Project:** Ancient Text OCR & Annotation Platform
**Tech Stack:** SvelteKit + TypeScript, Cloudflare Pages + GitHub Actions
**Storage:** Cloudflare R2 (binary) + GitHub (metadata)
**Cost Target:** $0-2/month hosting (free tier)
**Timeline:** 6 weeks to MVP
**Status:** Ready for implementation

---

## Quick Links

- **Architecture:** [`docs/deployment-architecture-cloudflare-github.md`](docs/deployment-architecture-cloudflare-github.md)
- **Data Schemas:** [`docs/data-schemas.md`](docs/data-schemas.md)
- **Detailed Use Cases:** [`docs/use-cases.md`](docs/use-cases.md)
- **Editor Implementation:** [`docs/annotation-editor-implementation-plan.md`](docs/annotation-editor-implementation-plan.md)

---

## Development Milestones

### Milestone 1: Auth + Upload + View (Weeks 1-2)

**Value:** User can log in, upload PDFs, see what's been uploaded, log out

### Milestone 2: PDF Processing + Quality Comparison (Weeks 3-4)

**Value:** Split PDFs into pages, conditionally enhance images, compare before/after

### Milestone 3: AI Integration + Annotation Editor (Weeks 5-6)

**Value:** Run AI layout detection, manually review and correct bounding boxes

---

# Milestone 1: Auth + Upload + View

**Timeline:** Weeks 1-2
**Goal:** Complete authentication and project management foundation

---

## 1.1 Environment Setup

### Prerequisites (Manual - Do First)

#### GitHub OAuth App

1. Go to https://github.com/settings/developers
2. Click "New OAuth App"
3. Fill in:
   - Application name: "PageSage Development"
   - Homepage URL: `http://localhost:5173`
   - Authorization callback URL: `http://localhost:5173/auth/callback`
4. Copy Client ID and Client Secret

#### Cloudflare R2 Bucket

1. Sign up at https://cloudflare.com
2. Navigate to R2 Object Storage
3. Create bucket: `pagesage-storage`
4. Generate R2 API token:
   - Go to R2 → Manage R2 API Tokens
   - Create API Token with "Edit" permissions
   - Copy Access Key ID and Secret Access Key
5. Note your Account ID (in R2 dashboard URL)

#### Environment Variables

Create `.env.local`:

```bash
# GitHub OAuth
GITHUB_CLIENT_ID=your_client_id_here
GITHUB_CLIENT_SECRET=your_client_secret_here
GITHUB_TOKEN=your_personal_access_token  # For API operations

# Cloudflare R2
R2_ACCESS_KEY_ID=your_r2_access_key
R2_SECRET_ACCESS_KEY=your_r2_secret_key
R2_BUCKET_NAME=pagesage-storage
R2_ACCOUNT_ID=your_account_id
R2_ENDPOINT=https://{account_id}.r2.cloudflarestorage.com

# Session
JWT_SECRET=generate_random_32_character_string

# Application
PUBLIC_URL=http://localhost:5173

# Production domain: https://pagesage.app (registered on Cloudflare)
```

Generate JWT_SECRET:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### Tasks

- [ ] Create Google Cloud project (for Milestone 3)
- [ ] Set up GitHub OAuth app
- [ ] Create Cloudflare account + R2 bucket
- [ ] Create `.env.local` with all credentials
- [ ] Verify environment with test script

---

## 1.2 SvelteKit Project Structure

### Directory Structure

```
src/
├── lib/
│   ├── components/
│   │   └── UserProfile.svelte
│   ├── server/
│   │   ├── auth.ts              # JWT utilities
│   │   ├── github.ts            # GitHub API client
│   │   └── r2.ts                # Cloudflare R2 client
│   ├── stores/
│   │   └── user.ts              # User session store
│   └── types/
│       ├── project.ts           # Project types
│       └── user.ts              # User types
├── routes/
│   ├── +layout.svelte           # Root layout
│   ├── +page.svelte             # Home/landing page
│   ├── auth/
│   │   ├── login/+server.ts     # Initiate OAuth
│   │   ├── callback/+server.ts  # Handle OAuth callback
│   │   └── logout/+server.ts    # Logout handler
│   ├── projects/
│   │   ├── +page.svelte         # Project list
│   │   ├── +page.server.ts      # Load projects
│   │   ├── new/
│   │   │   ├── +page.svelte     # Create project form
│   │   │   └── +page.server.ts  # Form handler
│   │   └── [id]/
│   │       ├── +page.svelte     # Project detail/dashboard
│   │       └── +page.server.ts  # Load project data
│   └── api/
│       └── projects/
│           └── [id]/
│               └── upload/
│                   └── +server.ts  # PDF upload endpoint
└── hooks.server.ts              # JWT validation middleware
```

### Tasks

- [ ] Create `src/` directory structure
- [ ] Set up routes (/, /login, /projects, /projects/new, /projects/[id])
- [ ] Configure SvelteKit adapter for Cloudflare Pages
- [ ] Set up TypeScript path aliases
- [ ] Create basic layout and navigation shell
- [ ] **Security:** Install ESLint security plugins
- [ ] **Security:** Install Zod for input validation
- [ ] **Security:** Install DOMPurify for text sanitization
- [ ] **Security:** Configure ESLint with security rules
- [ ] **Security:** Add npm audit to CI/CD

---

## 1.3 Authentication (UC-2)

### Features

- User can log in with GitHub
- User can see their profile (avatar, name, username)
- User can log out
- Protected routes require authentication
- Sessions persist for 7 days

### Acceptance Criteria

**Positive Tests:**

- ✅ User clicks "Login with GitHub" → redirected to GitHub OAuth
- ✅ User authorizes app → redirected back with code
- ✅ Backend exchanges code for access token → creates JWT
- ✅ User profile fetched from GitHub → displayed in UI
- ✅ JWT cookie set with httpOnly, secure, sameSite
- ✅ Session persists across page refreshes
- ✅ User clicks logout → JWT deleted, redirected to home

**Negative Tests:**

- ❌ User denies authorization → error message shown
- ❌ Invalid OAuth code → error handled gracefully
- ❌ GitHub API timeout → retry with error message
- ❌ Expired JWT → user redirected to login
- ❌ Tampered JWT → rejected, user logged out
- ❌ Unauthenticated user accesses /projects → redirected to login

### Data Requirements

**User session (JWT payload):**

```typescript
interface UserSession {
  userId: string; // Generated UUID
  githubId: number; // GitHub user ID
  githubUsername: string; // GitHub username
  name: string; // Display name
  email: string; // Primary email
  avatarUrl: string; // GitHub avatar
  role: "admin"; // v1 only has admin
  iat: number; // Issued at (timestamp)
  exp: number; // Expires (timestamp)
}
```

See [`docs/data-schemas.md`](docs/data-schemas.md) for complete schema.

### Tasks

- [ ] Create login page (`/routes/+page.svelte`)
- [ ] Implement OAuth initiation (`/auth/login/+server.ts`)
- [ ] Implement OAuth callback (`/auth/callback/+server.ts`)
- [ ] Create JWT utilities (`/lib/server/auth.ts`)
- [ ] Add session validation middleware (`hooks.server.ts`)
- [ ] Create user profile component (`/lib/components/UserProfile.svelte`)
- [ ] Implement logout (`/auth/logout/+server.ts`)
- [ ] Add protected route guards
- [ ] **Security:** Configure httpOnly, secure, sameSite cookies for JWT
- [ ] **Security:** Add rate limiting middleware (100 req/min per IP)
- [ ] **Security:** Set CORS headers (restrict to your domain)
- [ ] Test: Full OAuth flow works locally

---

## 1.4 Project Management (UC-3)

### Features

- User can create new book project with metadata
- Each project gets a GitHub repository
- User can view list of all their projects
- User can view project details
- Projects stored with version control

### Acceptance Criteria

**Positive Tests:**

- ✅ Authenticated user accesses /projects/new → form displayed
- ✅ User fills title, authors, languages → form validates
- ✅ User submits → unique project ID generated (`proj_{random12}`)
- ✅ GitHub repository created: `pagesage-books/book-{id}-{slug}`
- ✅ `metadata.json` committed to repository
- ✅ Project appears in user's project list
- ✅ User clicks project → redirected to detail page
- ✅ Project detail shows all metadata

**Negative Tests:**

- ❌ Unauthenticated user accesses /projects/new → redirected to login
- ❌ Empty title submitted → validation error
- ❌ No languages selected → validation error
- ❌ GitHub API failure → error message, retry option
- ❌ Project ID collision → regenerate automatically

### Data Requirements

**Project metadata (stored in GitHub repo):**

```typescript
interface ProjectMetadata {
  projectId: string; // "proj_abc123"
  title: string; // "Bhagavad Gita"
  authors: string[]; // ["Vyasa"]
  languages: Language[]; // ["sanskrit", "english"]
  sourceDocument?: {
    r2Path: string; // R2 object key
    fileName: string;
    fileSizeBytes: number;
    sha256: string;
    uploadedAt: string; // ISO 8601
  };
  pages: {
    total: number;
    processed: number;
    annotated: number;
  };
  status: ProjectStatus; // "created" | "uploaded" | "processing" | etc.
  repositoryUrl: string; // GitHub repo URL
  createdBy: UserAttribution;
  createdAt: string;
  updatedAt: string;
}
```

See [`docs/data-schemas.md`](docs/data-schemas.md) for complete schema.

### Tasks

- [ ] Create project form page (`/projects/new/+page.svelte`)
- [ ] Implement form validation (client + server)
- [ ] **Security:** Use Zod schema validation for all form inputs
- [ ] **Security:** Sanitize project title and metadata (DOMPurify)
- [ ] Create project ID generator utility
- [ ] Implement GitHub repo creation (`/lib/server/github.ts`)
- [ ] Create `metadata.json` initializer
- [ ] Build project list page (`/projects/+page.svelte`)
- [ ] Build project detail page (`/projects/[id]/+page.svelte`)
- [ ] Add project list API (load all user's projects)
- [ ] Test: Create project, see in list, view details

---

## 1.5 PDF Upload (UC-4)

### Features

- User can upload PDF to existing project
- File size limited to 500MB
- SHA-256 checksum calculated for integrity
- Upload progress displayed
- PDF stored in Cloudflare R2
- Project metadata updated

### Acceptance Criteria

**Positive Tests:**

- ✅ User clicks "Upload PDF" → file picker opens
- ✅ User selects PDF < 500MB → file accepted
- ✅ Upload progress bar shows 0-100%
- ✅ PDF uploaded to R2 → fileId/path returned
- ✅ SHA-256 checksum calculated
- ✅ Project metadata updated with PDF info
- ✅ Project status changes to "uploaded"
- ✅ Metadata committed to GitHub with attribution

**Negative Tests:**

- ❌ File > 500MB → rejected before upload starts
- ❌ Non-PDF file → validation error
- ❌ Corrupted PDF → validation error
- ❌ Network failure during upload → retry option shown
- ❌ R2 quota exceeded → clear error message
- ❌ Duplicate upload → warning + replace confirmation

### Data Requirements

**Updated in `metadata.json`:**

```typescript
{
  sourceDocument: {
    r2Path: "projects/proj_abc123/original.pdf",
    fileName: "bhagavad-gita.pdf",
    fileSizeBytes: 52428800,  // 50MB
    sha256: "abc123def456...",
    uploadedAt: "2025-01-05T10:30:00Z"
  },
  status: "uploaded"
}
```

### Tasks

- [ ] Create R2 client service (`/lib/server/r2.ts`)
- [ ] Build file upload component with drag-and-drop
- [ ] Add client-side validation (file type, size)
- [ ] **Security:** Implement server-side PDF validation (magic bytes, not just extension)
- [ ] **Security:** Scan PDF for malicious content (basic checks)
- [ ] **Security:** Validate file size on server (don't trust client)
- [ ] Calculate SHA-256 checksum
- [ ] Upload to R2 with progress tracking
- [ ] Update project metadata in GitHub
- [ ] Create upload API route (`/api/projects/[id]/upload/+server.ts`)
- [ ] Add upload progress UI
- [ ] Test: Upload PDF, verify in R2, check metadata

---

## 1.6 Project Dashboard (UC-5)

### Features

- Display project metadata
- Show PDF information
- Display status badge
- Link to GitHub repository
- Link to R2 storage
- Show user attribution
- Action buttons based on status

### Acceptance Criteria

**Positive Tests:**

- ✅ User navigates to /projects/{id} → dashboard displayed
- ✅ Project metadata shown (title, authors, languages)
- ✅ PDF info shown (filename, size, upload date)
- ✅ Status badge displays current state
- ✅ GitHub repository link works
- ✅ R2 link accessible (with auth)
- ✅ Creator attribution displayed
- ✅ Action buttons context-aware (e.g., "Upload PDF" if no PDF)

**Negative Tests:**

- ❌ Non-existent project ID → 404 page
- ❌ Unauthorized access → 403 forbidden
- ❌ Missing metadata fields → show "N/A" gracefully
- ❌ Corrupted metadata.json → error page with recovery options

### Tasks

- [ ] Build dashboard UI (`/projects/[id]/+page.svelte`)
- [ ] Create status badge component
- [ ] Display PDF information section
- [ ] Add GitHub and R2 links
- [ ] Show user attribution
- [ ] Context-aware action buttons
- [ ] Test: View dashboard, all info displayed correctly

---

## Milestone 1 Deliverables

**What you'll be able to do:**

- ✅ Visit http://localhost:5173
- ✅ Click "Login with GitHub" and authenticate
- ✅ See your profile (avatar, username)
- ✅ Click "Create New Project"
- ✅ Fill in title (e.g., "Bhagavad Gita"), authors, languages
- ✅ Submit → project created with GitHub repo
- ✅ See project in your project list
- ✅ Click project → view dashboard
- ✅ Upload a PDF file (drag-and-drop or file picker)
- ✅ Watch upload progress bar
- ✅ See PDF info on dashboard after upload
- ✅ Log out

**Definition of Done:**

- [ ] All authentication tests pass
- [ ] Can create projects and see GitHub repos created
- [ ] Can upload PDFs to R2 successfully
- [ ] Dashboard displays all project information
- [ ] No console errors, all TypeScript checks pass
- [ ] Code committed to main branch

---

# Milestone 2: PDF Processing + Quality Comparison

**Timeline:** Weeks 3-4
**Goal:** Process PDFs into individual pages and optionally enhance image quality

---

## 2.1 GitHub Actions Workflow Setup

### Features

- Trigger long-running PDF processing from UI
- Monitor real-time progress via SSE
- Store results in R2 and GitHub
- Handle errors and retries

### Acceptance Criteria

**Positive Tests:**

- ✅ Click "Start Processing" → workflow triggered via GitHub API
- ✅ Workflow starts within 30 seconds
- ✅ Progress updates stream to frontend via SSE
- ✅ Workflow can run for 15-20 minutes without timeout
- ✅ Results stored in R2 (images) and GitHub (metadata)
- ✅ Workflow completion detected automatically
- ✅ Error logs accessible if workflow fails

**Negative Tests:**

- ❌ GitHub API failure → error message with retry
- ❌ Workflow fails mid-execution → error logged, status updated
- ❌ Network disconnection → reconnect to SSE stream
- ❌ Invalid GitHub token → authentication error

### Tasks

- [ ] Create `.github/workflows/process-pdf.yml`
- [ ] Configure GitHub secrets:
  - R2_ACCESS_KEY_ID
  - R2_SECRET_ACCESS_KEY
  - R2_ENDPOINT
  - GOOGLE_AI_API_KEY (for Milestone 3)
- [ ] Set up `workflow_dispatch` trigger with inputs
- [ ] Implement progress webhook callbacks
- [ ] Create API route to trigger workflow (`/api/projects/[id]/process/+server.ts`)
- [ ] Build SSE endpoint for progress streaming (`/api/jobs/[id]/stream/+server.ts`)
- [ ] Test: Trigger workflow from UI, see it run in GitHub Actions

---

## 2.2 PDF Splitting (UC-6)

### Features

- Download PDF from R2
- Split into individual page images (300 DPI PNG)
- Upload page images back to R2
- Create page metadata for each page
- Update project with page count

### Acceptance Criteria

**Positive Tests:**

- ✅ Workflow downloads PDF from R2
- ✅ PDF split into page images (one per page)
- ✅ Images are 300 DPI resolution
- ✅ Page images uploaded to R2
- ✅ Page metadata JSON created for each page
- ✅ Project metadata updated with page count
- ✅ Progress updates sent every 50 pages
- ✅ Status changes to "preprocessing-complete"

**Negative Tests:**

- ❌ Corrupted PDF → error detected early
- ❌ PDF with 0 pages → rejected
- ❌ PDF with >2000 pages → rejected
- ❌ Insufficient disk space → graceful failure
- ❌ R2 upload failure → retry 3 times

### Data Requirements

**Page metadata (stored in GitHub):**

```typescript
interface PageMetadata {
  pageId: string; // "page-001"
  pageNumber: number; // 1
  image: {
    r2Path: string; // "projects/proj_abc/pages/page-001.png"
    width: number; // 2480
    height: number; // 3508
    dpi: number; // 300
    sha256: string;
    isPreprocessed: boolean; // false (no preprocessing yet)
  };
  currentState: {
    boundingBoxes: []; // Empty until AI processing
  };
  versionHistory: []; // Empty until AI processing
}
```

### Tasks

- [ ] Install Poppler in GitHub Actions workflow
- [ ] Implement PDF download from R2
- [ ] Implement PDF splitting with `pdftoppm`
- [ ] Extract image metadata with Sharp
- [ ] Batch upload pages to R2
- [ ] Create page-NNN.json files
- [ ] Commit page metadata to GitHub
- [ ] Update project metadata with page count
- [ ] Emit progress events (webhook to backend)
- [ ] Test: Process 10-page PDF, verify all pages in R2 and GitHub

---

## 2.3 Quality Check (UC-7)

### Features

- Analyze 5 sample pages from middle of book
- Measure skew, contrast, brightness, noise
- Generate quality report
- Recommend whether to preprocess
- User decides: enable or skip preprocessing

### Acceptance Criteria

**Positive Tests:**

- ✅ 5 sample pages selected (at 25%, 40%, 50%, 60%, 75% positions)
- ✅ Skew angle detected (±45° range)
- ✅ Contrast measured (0-1 score)
- ✅ Brightness measured (0-1 score)
- ✅ Noise level measured (0-1 score)
- ✅ Overall quality rating computed (excellent/good/fair/poor)
- ✅ Recommendation made (skip/optional/recommended)
- ✅ User sees visual quality report with color coding
- ✅ User can enable or skip preprocessing
- ✅ Decision saved to metadata

**Negative Tests:**

- ❌ Book with <5 pages → analyze all available pages
- ❌ Completely unreadable image → flagged as "unreadable"
- ❌ Quality analysis timeout (>30s) → skip with warning

### Tasks

- [ ] Implement sample page selection algorithm
- [ ] Install ImageMagick (or use Sharp-only)
- [ ] Implement skew detection
- [ ] Implement contrast measurement
- [ ] Implement brightness measurement
- [ ] Implement noise detection
- [ ] Create quality rating algorithm
- [ ] Build recommendation logic
- [ ] Create quality report UI page
- [ ] Add user decision buttons (Enable/Skip)
- [ ] Save decision to metadata
- [ ] Test: Analyze sample pages, see report, make decision

---

## 2.4 Image Preprocessing (Conditional)

### Features

- Deskew (rotation correction)
- Color normalization
- Noise reduction
- Border cropping
- Keep original images (upload both)

### Acceptance Criteria

**Positive Tests (if preprocessing enabled):**

- ✅ Original images kept in R2
- ✅ Enhanced images created with preprocessing
- ✅ Deskew applied (rotation corrected)
- ✅ Color normalized (better contrast)
- ✅ Noise reduced
- ✅ Borders cropped
- ✅ Enhanced images uploaded to R2
- ✅ Metadata tracks which preprocessing applied

### Tasks

- [ ] Install ImageMagick in GitHub Actions
- [ ] Implement deskew (ImageMagick `-deskew 40%`)
- [ ] Implement color correction (Sharp `.normalize()`)
- [ ] Implement noise reduction (Sharp `.median(3)`)
- [ ] Implement border crop (Sharp `.trim()`)
- [ ] Upload enhanced images to R2
- [ ] Update page metadata with preprocessing info
- [ ] Test: Process with preprocessing, compare before/after

---

## 2.5 Before/After Comparison UI

### Features

- Side-by-side viewer for original vs enhanced
- Toggle between versions
- Display quality metrics
- Navigate through sample pages

### Acceptance Criteria

**Positive Tests:**

- ✅ Sample pages displayed side-by-side (original | enhanced)
- ✅ Toggle switch works (swap left/right images)
- ✅ Quality metrics overlay shows skew, contrast, brightness, noise
- ✅ Prev/Next navigation works through 5 samples
- ✅ Images load quickly (<2s per page)
- ✅ Visual indicators show which preprocessing was applied

**Negative Tests:**

- ❌ Missing enhanced image (preprocessing skipped) → show original only
- ❌ Image load failure → placeholder with retry button

### Tasks

- [ ] Create ImageComparison.svelte component
- [ ] Display original and enhanced images side-by-side
- [ ] Add toggle switch to swap views
- [ ] Overlay quality metrics
- [ ] Add prev/next navigation for samples
- [ ] Test: View comparison, toggle works, metrics visible

---

## Milestone 2 Deliverables

**What you'll be able to do:**

- ✅ Open a project with uploaded PDF
- ✅ Click "Start Processing"
- ✅ Watch real-time progress:
  - "Splitting PDF... 350/700 pages"
  - "Analyzing quality..."
  - "Preprocessing page 200/700" (if enabled)
- ✅ See quality analysis report for 5 sample pages
- ✅ Make decision: "Enable Preprocessing" or "Skip"
- ✅ View before/after comparison of sample pages
- ✅ Navigate through all processed pages
- ✅ See processing complete status

**Definition of Done:**

- [ ] GitHub Actions workflow runs successfully
- [ ] PDF splits into correct number of pages
- [ ] All pages uploaded to R2
- [ ] Quality check produces accurate metrics
- [ ] Preprocessing works (if enabled)
- [ ] Before/after comparison UI functional
- [ ] Progress updates stream to frontend in real-time
- [ ] All error cases handled gracefully

---

# Milestone 3: AI Integration + Annotation Editor

**Timeline:** Weeks 5-6
**Goal:** AI layout detection + manual bounding box editing

---

## 3.1 Google AI Integration (UC-8)

### Features

- Send page images to Document AI or Gemini
- Parse bounding boxes from API response
- Extract OCR text with confidence scores
- Detect content types and languages
- Determine reading order
- Log API costs

### Acceptance Criteria

**Positive Tests:**

- ✅ Page image sent to AI API
- ✅ Bounding boxes returned with coordinates
- ✅ Text extracted (Devanagari preserved)
- ✅ Content types detected (paragraph/heading/footnote)
- ✅ Languages identified (sanskrit/hindi/english)
- ✅ Confidence scores provided (0-1)
- ✅ Reading order determined
- ✅ Results saved to `page-NNN.json` in GitHub
- ✅ API cost logged to `costs.jsonl`
- ✅ Version history entry created

**Negative Tests:**

- ❌ Invalid API key → authentication error
- ❌ API rate limit → exponential backoff retry
- ❌ API timeout (>60s) → error with retry option
- ❌ Blank page → empty boxes or warning
- ❌ Malformed API response → parsing error handled

### Data Requirements

**Page annotations (stored in GitHub):**

```typescript
interface PageAnnotations {
  pageId: string;
  pageNumber: number;
  image: {
    r2Path: string;
    width: number;
    height: number;
    dpi: number;
    isPreprocessed: boolean;
  };
  currentState: {
    boundingBoxes: BoundingBox[]; // AI-detected boxes
  };
  versionHistory: VersionHistoryEntry[];
}

interface BoundingBox {
  boxId: string;
  coordinates: { x: number; y: number; width: number; height: number };
  contentType:
    | "verse"
    | "commentary"
    | "footnote"
    | "translation"
    | "heading"
    | etc;
  language: "sanskrit" | "hindi" | "english" | "iast";
  text: {
    ocr: string; // Original AI-extracted text
    corrected: string; // User-corrected text (starts same as OCR)
  };
  confidence: number; // 0-1
  readingOrder: number;
  source: "ai" | "user";
  createdBy: UserAttribution;
}
```

See [`docs/data-schemas.md`](docs/data-schemas.md) for complete schemas.

### Tasks

- [ ] Implement Document AI Layout Parser integration
- [ ] Implement Gemini 2.5 Flash integration (for comparison)
- [ ] Create AI API client (`/lib/server/ai-api.ts`)
- [ ] **Security:** Implement prompt injection filters (sanitize user input before AI API)
- [ ] **Security:** Use structured prompts with clear boundaries
- [ ] **Security:** Configure Gemini safety settings (block harmful content)
- [ ] **Security:** Use JSON mode to force structured output
- [ ] **Security:** Validate AI responses (schema validation, bounds checking)
- [ ] **Security:** Limit text length in prompts (prevent token exhaustion)
- [ ] Implement response parser (AI format → BoundingBox schema)
- [ ] Implement reading order algorithm
- [ ] Create cost calculator utility
- [ ] Implement cost logging (append to costs.jsonl)
- [ ] Add AI processing to GitHub Actions workflow
- [ ] Store results in page-NNN.json files
- [ ] Test: Process page, verify bounding boxes accurate
- [ ] **Security Test:** Try prompt injection in annotation text, verify filtered

---

## 3.2 Annotation Editor - Canvas Core (UC-9, UC-10, UC-11)

### Features

- Display page image with bounding boxes overlaid
- Visual distinction: AI boxes (blue) vs user-edited (green)
- Click to select boxes
- Drag to move boxes
- Drag handles to resize boxes
- Smooth <100ms interaction with 30-40 boxes

### Acceptance Criteria

**Positive Tests:**

- ✅ Page image loads and displays
- ✅ AI-detected boxes render correctly
- ✅ Click box → box selected (highlighted)
- ✅ Drag box → box moves smoothly
- ✅ Drag corner handle → box resizes
- ✅ Coordinates stay accurate across zoom levels
- ✅ Selection state persists
- ✅ Multiple boxes render without lag

**Negative Tests:**

- ❌ Large image (>5MB) → loads progressively
- ❌ 100+ boxes on page → still responsive
- ❌ Rapid mouse movements → no coordinate drift

### Implementation Details

**Coordinate system (3 spaces):**

```
IMAGE COORDINATES (stored in JSON)
  ↓ imageToCanvas(coords, transform)
CANVAS COORDINATES (for rendering)
  ↓ screenToCanvas(mouseEvent, canvas)
SCREEN COORDINATES (mouse events)
```

**Component architecture:**

```
AnnotationEditor.svelte (container)
├── AnnotationCanvas.svelte (HTML5 Canvas)
├── BoxMetadataPanel.svelte (sidebar)
├── PageNavigation.svelte (prev/next)
└── VersionHistoryPanel.svelte (edit history)
```

See [`docs/annotation-editor-implementation-plan.md`](docs/annotation-editor-implementation-plan.md) for complete implementation details.

### Tasks

- [ ] Create coordinate transformation utilities (`/lib/services/coordinateService.ts`)
- [ ] Build AnnotationCanvas.svelte with HTML5 Canvas
- [ ] Implement canvas rendering pipeline:
  - Draw page image
  - Draw bounding boxes (color-coded)
  - Draw selection highlights
  - Draw 8 resize handles (4 corners + 4 edges)
  - Draw reading order numbers
- [ ] Implement mouse event handlers:
  - onMouseDown (select or start drag/resize)
  - onMouseMove (update drag/resize)
  - onMouseUp (commit changes, convert to image coords)
- [ ] Implement hit testing (`/lib/utils/hitTest.ts`)
- [ ] Create canvas renderer utility (`/lib/utils/canvasRenderer.ts`)
- [ ] Set up editor state store (`/lib/stores/editorStore.ts`)
- [ ] Test: Load page, select box, move it, resize it

---

## 3.3 Annotation Editor - Metadata Panel

### Features

- Edit OCR text
- Select content type (dropdown)
- Select language (dropdown)
- Delete box
- Display confidence score
- Show box ID and coordinates

### Acceptance Criteria

**Positive Tests:**

- ✅ Select box → metadata panel populates with box data
- ✅ Edit text in textarea → box text updates in real-time
- ✅ Change content type dropdown → box type updates
- ✅ Change language dropdown → box language updates
- ✅ Click delete → confirmation dialog → box deleted
- ✅ Confidence score displayed with color coding
- ✅ Box coordinates shown for debugging

**Negative Tests:**

- ❌ No box selected → panel shows "Select a box to edit"
- ❌ Empty text → warning shown (text required)
- ❌ Delete with unsaved changes → confirm save first

### Tasks

- [ ] Create BoxMetadataPanel.svelte component
- [ ] Add text editor (textarea for OCR text)
- [ ] Create content type dropdown (verse/commentary/footnote/translation/heading/pageNumber)
- [ ] Create language dropdown (sanskrit/hindi/english/iast)
- [ ] Add delete button with confirmation
- [ ] Display confidence score with color coding
- [ ] Show box ID and coordinates (for debugging)
- [ ] Test: Select box, edit text, change type/language, delete

---

## 3.4 Annotation Editor - Drawing & Operations

### Features

- Draw new boxes (for missed content)
- Split boxes (horizontal/vertical)
- Merge boxes (multi-select)
- Adjust reading order

### Acceptance Criteria

**Positive Tests:**

- ✅ Click "Draw Mode" → cursor changes, ready to draw
- ✅ Click and drag → preview rectangle shown
- ✅ Release mouse → new box created with default type/language
- ✅ Select box, click "Split Horizontal" → two boxes created (50/50 split)
- ✅ Select box, click "Split Vertical" → two boxes created (50/50 split)
- ✅ Shift+Click multiple boxes → all selected (highlighted)
- ✅ Click "Merge" → single box created, text concatenated
- ✅ Drag reading order numbers → sequence updated

**Negative Tests:**

- ❌ Draw mode: click without drag → no box created
- ❌ Split box with no text → split coordinates only, text empty
- ❌ Merge with no boxes selected → button disabled
- ❌ Merge boxes with conflicting types → use first box's type, show warning

### Tasks

- [ ] Implement draw mode (click-and-drag to create rectangle)
- [ ] Add "Draw Mode" toggle button
- [ ] Show preview rectangle while drawing
- [ ] Implement split box:
  - "Split Horizontal" button → 50/50 split
  - "Split Vertical" button → 50/50 split
  - Text divided between halves
- [ ] Implement merge boxes:
  - Shift+Click for multi-select
  - "Merge" button → bounding rectangle
  - Text concatenated in reading order
- [ ] Create reading order adjustment UI (drag to reorder list)
- [ ] Test: Draw box, split box, merge boxes, reorder

---

## 3.5 Data Persistence (UC-12)

### Features

- Load page data from GitHub
- Auto-save every 30 seconds
- Manual save button
- Version history tracking
- Git commit for each save

### Acceptance Criteria

**Positive Tests:**

- ✅ Page loads from GitHub with all data
- ✅ Edits tracked in memory
- ✅ Auto-save triggers after 30s of inactivity
- ✅ Manual save button works
- ✅ Version history entry created with changes
- ✅ GitHub commit created with user attribution
- ✅ "Saving..." indicator shown
- ✅ Last saved timestamp displayed

**Negative Tests:**

- ❌ GitHub API failure → retry with backoff
- ❌ Network disconnection → queue save, retry when online
- ❌ Concurrent edits (two tabs) → last write wins (v1 acceptable)

### Data Requirements

**Version history entry:**

```typescript
interface VersionHistoryEntry {
  version: number;
  timestamp: string;
  editedBy: UserAttribution;
  changeType: "ai_generated" | "manual_edit" | "box_split" | "boxes_merged";
  changes: {
    action:
      | "created"
      | "deleted"
      | "moved"
      | "resized"
      | "text_edited"
      | "type_changed";
    boxId: string;
    before?: Partial<BoundingBox>;
    after?: Partial<BoundingBox>;
  }[];
  commitSha: string; // GitHub commit SHA
  note?: string;
}
```

### Tasks

- [ ] Create annotation service (`/lib/services/annotationService.ts`)
- [ ] Implement load page data (GET from GitHub)
- [ ] Implement save page data (PUT to GitHub, create commit)
- [ ] Create version service (`/lib/services/versionService.ts`)
- [ ] Implement change tracking (diff current vs original)
- [ ] Implement auto-save logic (30s debounced timer)
- [ ] Add manual save button
- [ ] Create API routes (GET/PUT `/api/projects/[id]/pages/[page]`)
- [ ] Display save status indicator
- [ ] Test: Edit box, wait 30s, verify auto-save commits to GitHub

---

## 3.6 Navigation & Polish

### Features

- Navigate between pages (Prev/Next)
- Jump to specific page
- Zoom and pan
- Keyboard shortcuts
- Visual improvements
- Performance optimization

### Acceptance Criteria

**Positive Tests:**

- ✅ Click "Next" → next page loads
- ✅ Click "Prev" → previous page loads
- ✅ Enter page number + Enter → jumps to page
- ✅ Mouse wheel up → zoom in (centered on cursor)
- ✅ Mouse wheel down → zoom out
- ✅ Space + drag → pan around image
- ✅ Arrow keys → move selected box 1px
- ✅ Delete key → delete selected box
- ✅ Ctrl+S → manual save
- ✅ Escape → deselect box
- ✅ Low confidence boxes (<0.7) → red outline
- ✅ Medium confidence (0.7-0.9) → yellow outline
- ✅ High confidence (>0.9) → green outline
- ✅ Hover box → outline brightens
- ✅ 30-40 boxes render smoothly (<100ms interaction)

**Negative Tests:**

- ❌ Navigate beyond last page → button disabled
- ❌ Navigate before first page → button disabled
- ❌ Invalid page number → validation error
- ❌ Keyboard shortcut while typing → not triggered (focus check)

### Tasks

- [ ] Create PageNavigation.svelte (Prev/Next, jump)
- [ ] Implement zoom (mouse wheel, centered on cursor)
- [ ] Implement pan (space+drag)
- [ ] Add keyboard shortcuts:
  - Arrow keys: move box 1px
  - Delete: delete box
  - Ctrl+S: manual save
  - Escape: deselect
- [ ] Add confidence color coding (red/yellow/green)
- [ ] Add hover effects on boxes
- [ ] Optimize canvas rendering (RAF batching)
- [ ] Debounce drag updates (50ms)
- [ ] Create VersionHistoryPanel.svelte
- [ ] Test: Navigate pages, zoom/pan, use keyboard shortcuts

---

## 3.7 Cost Tracking (UC-14)

### Features

- Display total API costs
- Show budget progress bar
- Breakdown by operation type
- Real-time cost updates
- Monthly budget tracking

### Data Requirements

**Cost log entry (appended to costs.jsonl):**

```typescript
interface CostLogEntry {
  timestamp: string;
  projectId: string;
  operation: "layout-detection" | "ocr-extraction" | "quality-check";
  apiService: "document-ai" | "gemini";
  itemsProcessed: number; // Pages processed
  totalCost: number; // USD
  currency: "USD";
}
```

### Tasks

- [ ] Implement cost calculator utility
- [ ] Append costs to costs.jsonl after each operation
- [ ] Create cost aggregation service (read + parse JSONL)
- [ ] Build cost tracker UI component
- [ ] Display total spent vs budget
- [ ] Show breakdown by operation type
- [ ] Add budget warning (>80%)
- [ ] Test: Process pages, verify costs logged accurately

---

## Milestone 3 Deliverables

**What you'll be able to do:**

- ✅ Click "Run AI Detection" on processed project
- ✅ Watch AI process all pages (progress bar)
- ✅ Open annotation editor for any page
- ✅ See AI-detected bounding boxes overlaid (blue outlines)
- ✅ Click box to select it
- ✅ Drag box to move it
- ✅ Drag corners/edges to resize it
- ✅ Edit OCR text in sidebar
- ✅ Change box type (verse/commentary/footnote)
- ✅ Change box language (sanskrit/hindi/english)
- ✅ Delete incorrect boxes
- ✅ Enable "Draw Mode" and create new boxes
- ✅ Split boxes (horizontal/vertical)
- ✅ Merge multiple boxes (Shift+Click + Merge)
- ✅ Reorder boxes (adjust reading order)
- ✅ Auto-save changes every 30s
- ✅ Click "Save" to force save
- ✅ Navigate to next/previous page
- ✅ Zoom in/out with mouse wheel
- ✅ Pan with space+drag
- ✅ Use keyboard shortcuts (arrows, delete, Ctrl+S)
- ✅ View version history of edits
- ✅ See API costs in real-time
- ✅ Export to markdown (final feature)

**Definition of Done:**

- [ ] All AI integration tests pass
- [ ] Annotation editor fully functional
- [ ] All box operations work (move, resize, draw, split, merge)
- [ ] Auto-save and version tracking working
- [ ] Cost tracking accurate
- [ ] Performance <100ms for interactions
- [ ] No memory leaks with 30-40 boxes
- [ ] All features tested with real book data

---

## Technical Requirements Summary

### Storage Architecture

- **Binary files (PDFs, images):** Cloudflare R2
- **Metadata (JSON):** GitHub repositories
- **Session state:** JWT in httpOnly cookies (stateless)
- **Job queue:** In-memory or file-based (GitHub Actions handles execution)

### Data Schemas

All schemas defined in [`docs/data-schemas.md`](docs/data-schemas.md):

1. ProjectMetadata
2. PageMetadata
3. BoundingBox
4. VersionHistoryEntry
5. UserAttribution
6. CostLogEntry
7. ImageMetadata
8. QualityMetrics
9. ExportConfiguration

### Performance Requirements

- Annotation editor: <100ms interaction latency
- Canvas rendering: 30-40 boxes without lag
- Auto-save: 30-second debounce
- API response: <2s for page load
- Image loading: Progressive (show placeholder)

### Scale Limits

- Max PDF size: 500MB
- Max pages per book: 2000
- Max image dimensions: 10,000 x 10,000 pixels
- Max bounding boxes per page: 500
- Max concurrent jobs: 2 (cost control)

### Security Requirements

**Authentication & Sessions:**

- GitHub OAuth only (no password auth)
- JWT sessions: 7-day expiry, HS256 algorithm
- httpOnly, secure, sameSite cookies
- Session validation on every request

**API Protection:**

- API keys in environment variables only (never in code/client)
- Rate limiting: 100 requests/minute per IP (Cloudflare)
- CSRF protection on state-changing operations (SvelteKit built-in)
- Input validation on all endpoints (file type, size, format)
- PDF validation: Check magic bytes, not just extension

**DDoS Protection:**

- Cloudflare's network DDoS mitigation (automatic)
- WAF (Web Application Firewall) for common attacks
- Bot detection and challenge pages

**Secrets Management:**

- GitHub Actions secrets for workflow credentials
- Cloudflare environment variables for API keys
- `.env.local` git-ignored (never committed)
- Rotate tokens regularly (quarterly recommended)

**Content Security:**

- Content Security Policy (CSP) headers
- Sanitize user input (project titles, notes)
- Validate bounding box coordinates (prevent injection)
- No eval() or innerHTML with user data

See [`docs/security-threat-model.md`](docs/security-threat-model.md) for complete security requirements.

---

## Cost Projections

**Hosting (monthly):**

- Cloudflare Pages: $0 (100k requests/day free)
- GitHub Actions: $0 (2,000 min/month free = ~100 books)
- Cloudflare R2: $0-2 (10GB free, then $0.015/GB)
- GitHub Storage: $0 (unlimited for metadata)
- **Total: $0-2/month**

**APIs (per book, 700 pages):**

- Document AI Layout Parser: $7.00 per book
- OR Gemini 2.5 Flash: $0-0.27 per book (free tier available)
- **Decision pending** - test both with sample data

**Annual projection (10 books):**

- Hosting: $0-24/year
- APIs: $2.70-70/year (depends on Gemini vs Document AI choice)
- **Total: $3-94/year** (well under $120/year budget)

---

## Dependencies & Tools

### Development

- Node.js 18+
- npm 9+
- Git
- GitHub CLI (`gh`)

### External Services

- GitHub account (OAuth + storage)
- Cloudflare account (Pages + R2)
- Google Cloud account (Document AI or Gemini API)

### GitHub Actions Dependencies

- Poppler (`pdftoppm`) - PDF splitting
- ImageMagick - Image preprocessing (optional)
- Sharp (Node.js) - Image metadata
- AWS CLI - R2 uploads (S3-compatible)

---

## Testing Strategy

### Test Coverage Target

- Minimum: 80% code coverage
- Preferred: 90%+ coverage

### Test Types

- **Unit tests:** Business logic (coordinate transformations, validation)
- **Integration tests:** API workflows (GitHub, R2, AI API)
- **E2E tests:** Critical user flows (login → upload → annotate → export)

### Mock Strategy

- Mock external APIs (Google AI, GitHub, R2) in tests
- Use real integration tests for critical paths (with test accounts)
- Sample test data in `test-samples/` directory

See [`docs/test-specifications.md`](docs/test-specifications.md) for complete testing strategy.

---

## Next Steps

### Immediate (Before Starting Development)

1. **Set up environment** (~30 min)
   - Register GitHub OAuth app
   - Create Cloudflare account + R2 bucket
   - Create `.env.local`

2. **Test AI APIs** (~1-2 hours)
   - Run Document AI on sample pages
   - Run Gemini on same pages
   - Compare accuracy and cost
   - Make final API selection decision

3. **Create project structure** (~30 min)
   - Create `src/` directories
   - Set up basic routes
   - Install dependencies

### Then Start Milestone 1 Implementation

Begin with authentication and project management features.

**Security Note:** No additional MCP servers needed for security. Your architecture (Cloudflare + GitHub) includes enterprise-grade DDoS protection, WAF, and bot mitigation automatically. Focus on implementing rate limiting, input validation, and proper secret management as outlined in the Security Requirements section above.

---

## Documentation Map

- **This file (REQUIREMENTS.md):** Master requirements and task list
- **[docs/deployment-architecture-cloudflare-github.md](docs/deployment-architecture-cloudflare-github.md):** Deployment and storage architecture
- **[docs/data-schemas.md](docs/data-schemas.md):** All TypeScript interfaces and data structures
- **[docs/use-cases.md](docs/use-cases.md):** Detailed use cases (UC-1 through UC-15) with comprehensive test scenarios
- **[docs/annotation-editor-implementation-plan.md](docs/annotation-editor-implementation-plan.md):** Canvas editor implementation details
- **[docs/README.md](docs/README.md):** Documentation index

---

**Last Updated:** 2025-01-05
**Status:** Ready for implementation
