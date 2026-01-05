# PageSage Milestones & Acceptance Criteria

**Quick Reference:** Clear success criteria for each development milestone
**Full Details:** See [REQUIREMENTS.md](REQUIREMENTS.md)

---

## Milestone 1: Auth + Upload + View (Weeks 1-2)

**Goal:** User can log in, upload PDFs, see what's been uploaded, log out

### What You'll Be Able To Do

- ✅ Visit http://localhost:5173 and see landing page
- ✅ Click "Login with GitHub" and authenticate via OAuth
- ✅ See your profile (avatar, name, username) in header
- ✅ Click "Create New Project" and fill in form (title, authors, languages)
- ✅ Submit form → project created with GitHub repository
- ✅ See project in your project list at /projects
- ✅ Click project → view dashboard with all metadata
- ✅ Click "Upload PDF" and select file (drag-and-drop or file picker)
- ✅ Watch upload progress bar (0-100%)
- ✅ See PDF info on dashboard after upload (filename, size, date, SHA-256)
- ✅ Click "Logout" and return to landing page

### Acceptance Criteria Summary

#### Authentication

**Pass if:**

- Login with GitHub works (OAuth flow complete)
- JWT session created and persists across refreshes
- Protected routes redirect to login when not authenticated
- Logout clears session and redirects home

**Fail if:**

- User denies OAuth → no error handling
- Expired JWT → no redirect to login
- Unauthenticated access to /projects → allowed (security issue)

#### Project Management

**Pass if:**

- Can create project with valid metadata
- Unique project ID generated (no collisions)
- GitHub repository created automatically
- metadata.json committed to repo
- Project appears in list immediately
- Project detail page shows all info

**Fail if:**

- Empty title accepted (validation missing)
- No languages selected → project created anyway
- GitHub API failure → no error message
- Duplicate project ID possible

#### PDF Upload

**Pass if:**

- PDF < 500MB uploads successfully to R2
- Upload progress bar shows accurate progress
- SHA-256 checksum calculated
- Project metadata updated in GitHub
- Status changes to "uploaded"

**Fail if:**

- File >500MB accepted (validation missing)
- Non-PDF file uploaded (no type checking)
- Corrupted PDF not detected
- No retry on network failure
- Duplicate upload without warning

#### Project Dashboard

**Pass if:**

- All metadata displayed correctly
- PDF information shown
- Status badge accurate
- GitHub and R2 links work
- Action buttons change based on state

**Fail if:**

- Non-existent project ID → no 404 page
- Unauthorized access allowed (security issue)
- Missing fields cause errors (no graceful handling)

### Definition of Done

- [ ] All positive tests pass
- [ ] All negative tests handled gracefully
- [ ] No console errors
- [ ] TypeScript checks pass
- [ ] Code reviewed and committed

---

## Milestone 2: PDF Processing + Quality Comparison (Weeks 3-4)

**Goal:** Split PDFs into pages, conditionally enhance images, compare before/after

### What You'll Be Able To Do

- ✅ Open project with uploaded PDF
- ✅ Click "Start Processing" button
- ✅ Watch real-time progress in UI:
  - "Triggering workflow..." (0%)
  - "Splitting PDF... 350/700 pages" (25%)
  - "Analyzing quality..." (40%)
  - "Preprocessing page 200/700" (if enabled) (50-75%)
  - "Processing complete!" (100%)
- ✅ See quality analysis report:
  - 5 sample pages with metrics (skew, contrast, brightness, noise)
  - Overall quality rating (excellent/good/fair/poor)
  - Recommendation (skip/optional/recommended preprocessing)
- ✅ Make decision: Click "Enable Preprocessing" or "Skip"
- ✅ View before/after comparison:
  - Side-by-side original vs enhanced images
  - Toggle to swap views
  - Quality metrics overlay
  - Navigate through 5 sample pages
- ✅ Browse all processed pages (thumbnails or list)
- ✅ See processing status: "Processing complete - 700 pages ready"

### Acceptance Criteria Summary

#### GitHub Actions Workflow

**Pass if:**

- Workflow triggers from UI within 30 seconds
- Progress updates stream via SSE
- Workflow runs 15-20 minutes without timeout
- Results stored in R2 and GitHub
- Completion detected automatically

**Fail if:**

- GitHub API fails with no retry
- Workflow timeout before completion
- No progress updates shown
- Results not accessible after completion

#### PDF Splitting

**Pass if:**

- PDF downloads from R2 successfully
- Split into correct number of page images
- All images are 300 DPI PNG
- All pages uploaded to R2
- Page metadata created for each page in GitHub
- Project metadata updated with accurate page count
- Progress emitted every 50 pages

**Fail if:**

- Corrupted PDF not detected early
- 0-page or >2000-page PDF accepted
- Wrong DPI or format
- Upload failures not retried
- Incomplete metadata

#### Quality Check

**Pass if:**

- 5 samples selected from middle (25%, 40%, 50%, 60%, 75%)
- All metrics measured accurately (skew ±2°, contrast/brightness/noise valid)
- Quality rating computed correctly
- Recommendation matches sample quality
- User can enable or skip preprocessing
- Decision saved to metadata

**Fail if:**

- Samples selected from start/end only (not representative)
- Metrics calculation errors
- No recommendation shown
- User decision not saved
- <5 page books fail (should analyze all available)

#### Image Preprocessing (if enabled)

**Pass if:**

- Both original AND enhanced images stored in R2
- Deskew, color correction, noise reduction, border crop all applied
- Metadata tracks which preprocessing used
- Enhanced images visible in comparison UI

**Fail if:**

- Original images overwritten (not kept)
- Preprocessing fails silently
- Metadata doesn't track what was applied

#### Comparison UI

**Pass if:**

- Side-by-side display works
- Toggle swap view works
- Quality metrics visible
- Navigation through samples works

**Fail if:**

- Only shows one image
- Toggle doesn't work
- Metrics not displayed

### Definition of Done

- [ ] GitHub Actions workflow runs end-to-end
- [ ] All pages split and uploaded correctly
- [ ] Quality check accurate
- [ ] Preprocessing works (if enabled)
- [ ] Comparison UI functional
- [ ] SSE progress streaming works
- [ ] All error cases handled

---

## Milestone 3: AI Integration + Annotation Editor (Weeks 5-6)

**Goal:** Run AI layout detection, manually review and correct bounding boxes

### What You'll Be Able To Do

- ✅ Click "Run AI Detection" on processed project
- ✅ Watch AI process all 700 pages (progress bar with cost tracking)
- ✅ See "AI Detection Complete - 700 pages analyzed"
- ✅ Click "Edit Page 1" → open annotation editor
- ✅ See page image with AI-detected bounding boxes overlaid (blue outlines)
- ✅ Click a box to select it (outline thickens, sidebar populates)
- ✅ Drag box to move it
- ✅ Drag corner/edge handle to resize it
- ✅ Edit OCR text in sidebar textarea
- ✅ Change box type: Select "verse" | "commentary" | "footnote" | etc from dropdown
- ✅ Change box language: Select "sanskrit" | "hindi" | "english" | "iast" from dropdown
- ✅ Click "Delete" to remove incorrect box
- ✅ Click "Draw Mode" → click and drag to create new box for missed content
- ✅ Select box → click "Split Horizontal" or "Split Vertical" → box splits in two
- ✅ Shift+Click multiple boxes → click "Merge" → boxes combine into one
- ✅ Drag reading order numbers to reorder boxes
- ✅ See "Auto-saving..." after 30 seconds of editing
- ✅ Click "Save" button to force immediate save
- ✅ See "Last saved: 2 minutes ago" indicator
- ✅ Click "Next Page" → move to page 2 with all edits saved
- ✅ Scroll mouse wheel → zoom in/out (centered on cursor)
- ✅ Hold space + drag → pan around zoomed image
- ✅ Press arrow keys → move selected box 1 pixel
- ✅ Press Delete → delete selected box
- ✅ Press Ctrl+S → manual save
- ✅ Press Escape → deselect box
- ✅ See confidence color coding (red <0.7, yellow 0.7-0.9, green >0.9)
- ✅ Hover box → outline brightens
- ✅ Click "Version History" → see all edits with timestamps
- ✅ See cost tracker: "$2.45 / $100.00 (2.45%)" with breakdown
- ✅ Click "Export" → download markdown file

### Acceptance Criteria Summary

#### AI Integration

**Pass if:**

- Page images sent to AI API successfully
- Bounding boxes returned with accurate coordinates
- Devanagari text extracted correctly (no mojibake)
- Content types detected (even if not semantic - paragraph/heading/footnote OK)
- Languages identified
- Confidence scores provided (0-1 range)
- Reading order determined (top→bottom, left→right for multi-column)
- Results saved to page-NNN.json in GitHub
- API costs logged to costs.jsonl
- Version history entry created (changeType: 'ai_generated')

**Fail if:**

- Invalid API key not caught early
- Rate limit causes failure without retry
- Timeout >60s without error handling
- Malformed response crashes parser
- Devanagari text corrupted
- Reading order incorrect for multi-column layouts

#### Canvas Core

**Pass if:**

- Page image displays at correct aspect ratio
- All bounding boxes render with correct positions
- AI boxes are blue, user-edited boxes are green
- Click detection works (select correct box)
- Drag to move works smoothly
- Resize handles appear when box selected (8 handles)
- Resize works by dragging handles
- Coordinates stay accurate when zooming
- 30-40 boxes render in <100ms
- No lag during interactions

**Fail if:**

- Boxes don't align with image
- Selection doesn't work (can't click boxes)
- Dragging is laggy (>200ms delay)
- Coordinates drift during zoom/pan
- Resize handles missing or non-functional
- Canvas crashes with >50 boxes

#### Metadata Panel

**Pass if:**

- Selected box data populates panel
- Text edits update box immediately
- Content type dropdown works (all types available)
- Language dropdown works (all languages available)
- Delete button shows confirmation
- Confidence score displayed with color
- Box coordinates shown

**Fail if:**

- Panel doesn't sync with selection
- Text edits don't update box
- Dropdowns missing options
- Delete without confirmation (accidental deletion)
- No box selected → panel empty without message

#### Drawing & Operations

**Pass if:**

- Draw mode creates new boxes by click-and-drag
- Preview rectangle shown while drawing
- Split horizontal creates 2 boxes (top/bottom 50/50)
- Split vertical creates 2 boxes (left/right 50/50)
- Shift+Click multi-selects boxes
- Merge creates single box with bounding rectangle
- Text concatenated in reading order
- Reading order numbers draggable

**Fail if:**

- Draw mode: single click creates box (should need drag)
- Split doesn't divide text properly
- Merge loses text content
- Reading order can't be changed
- Multi-select doesn't work

#### Data Persistence

**Pass if:**

- Page loads from GitHub with all data
- Edits tracked in memory
- Auto-save triggers after 30s
- Manual save works immediately
- Version history entry created with:
  - Correct version number (incremental)
  - Timestamp (ISO 8601)
  - User attribution (from JWT)
  - Change type and details
  - GitHub commit SHA
- GitHub commit created with proper message
- "Saving..." indicator shown during save
- "Last saved" timestamp accurate

**Fail if:**

- Page load fails with no error
- Edits lost on page reload (no save)
- Auto-save doesn't trigger
- Version history missing entries
- No commit created in GitHub
- Concurrent tab edits conflict badly

#### Navigation & Polish

**Pass if:**

- Next/Prev buttons work
- Page jump input works
- Mouse wheel zooms (centered on cursor)
- Space+drag pans
- All keyboard shortcuts work:
  - Arrows move 1px
  - Delete removes box
  - Ctrl+S saves
  - Escape deselects
- Confidence colors accurate (red/yellow/green)
- Hover effects work
- 30-40 boxes render smoothly

**Fail if:**

- Navigation broken (can't move between pages)
- Zoom doesn't center on cursor
- Pan doesn't work
- Keyboard shortcuts conflict with text editing
- Performance degrades with many boxes

#### Cost Tracking

**Pass if:**

- Total cost displayed accurately
- Budget progress bar shows percentage
- Breakdown by operation type shown
- Costs update in real-time during processing
- Monthly budget tracked correctly
- Warning shown at >80% budget

**Fail if:**

- Costs not logged (missing entries)
- Aggregation incorrect
- No budget warning
- Cost display doesn't update

### Definition of Done

- [ ] All AI integration tests pass
- [ ] Annotation editor fully functional for all operations
- [ ] Auto-save and version tracking working reliably
- [ ] Cost tracking accurate within $0.01
- [ ] Performance <100ms confirmed with 40 boxes
- [ ] No memory leaks after 1 hour of editing
- [ ] Tested with real book (all 700 pages)
- [ ] Can export to markdown successfully

---

## Summary: You're Ready When...

### ✅ Milestone 1 Complete When:

You can log in, create a project, upload a PDF, see it on the dashboard, and log out - all working smoothly with no errors.

### ✅ Milestone 2 Complete When:

You can trigger processing, watch it split 700 pages, see quality analysis, decide on preprocessing, compare before/after images, and see "Processing Complete" status.

### ✅ Milestone 3 Complete When:

You can run AI detection, open the editor, see boxes, move/resize/edit/delete/draw/split/merge them, save changes with version history, navigate pages with zoom/pan, track costs, and export to markdown - all working smoothly.

---

## Critical Success Metrics

### Performance

- Annotation editor interaction: <100ms latency ✓
- Page load time: <2s ✓
- Auto-save debounce: 30s ✓
- Canvas rendering: 30-40 boxes without lag ✓

### Reliability

- All positive test cases pass ✓
- All negative test cases handled gracefully ✓
- No data loss scenarios ✓
- Version history complete and accurate ✓

### Cost

- Hosting: $0-2/month ✓
- API usage tracked accurately ✓
- Budget warnings work ✓
- Under $120/year total ✓

---

**Reference:** See [REQUIREMENTS.md](REQUIREMENTS.md) for complete implementation details and task checklists.
