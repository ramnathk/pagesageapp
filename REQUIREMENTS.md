# Ancient Text OCR & Annotation Platform - Requirements Document

## Project Vision
A collaborative web application for digitizing and structuring ancient texts (particularly Sanskrit, Hindi, and English multi-language books) with AI-assisted layout detection and human-in-the-loop correction.

---

## Project Scope

**THIS PROJECT: Component 1 - OCR/Annotation/Publication Tool**

This requirements document covers **Component 1 ONLY** - the internal tool for digitizing, annotating, OCR processing, and exporting books to Quarto markdown.

**OUT OF SCOPE (Separate Future Projects):**
- **Component 2**: Public Website & Reader Experience (rendering, feedback collection, responsive design)
- **Component 3**: Cross-Reference & Insights Engine (topic modeling, concordance, network analysis)

**Key Deliverable:** Export Quarto-compatible markdown files that can be consumed by downstream publishing tools.

---

## Key Technical Decisions

### Storage & Version Control
- **All project files in single GitHub repository** (books, metadata, images, OCR output)
- **Plain text storage** for all annotations and metadata (git-friendly)
- **GitHub authentication** required for all editing users
- Only **Admin can delete** projects or uploaded books

### OCR & Processing
- **Cloud-based APIs for AI/ML tasks** - use Google Document AI or Gemini APIs for OCR and layout detection
- **Local image processing** - deskew, color correction, noise reduction done on server (not GPU-intensive)
- **No local ML model hosting** - avoid expensive GPU servers and model hosting costs
- **Pay-per-use model** - leverage cloud provider infrastructure for AI tasks
- **Ignore embedded OCR** in uploaded PDFs (typically low quality)
- **Auto-extract metadata** from PDF, user fills in blanks
- **Incremental processing** - users can work on completed pages while system processes remaining
- **Flexible OCR initiation** - can start OCR before all pages are analyzed

### Layout Detection
- Support **2-column and multi-column** layouts
- Detect **transliterations** (IAST, etc.) and **superscript footnote references**
- **Link footnote numbers** in text to corresponding footnotes
- Distinguish **English translation vs English commentary**
- Detect and preserve **images/figures**

### Collaboration & Attribution
- **GitHub-based collaboration** with asynchronous editing
- **Granular attribution** - track edits at stanza/section level
- **Visual distinction** between AI-generated and user-edited content
- **Attention indicators** - highlight sections needing review

### User Experience
- **Single-book upload** (no batch upload)
- **Easy metadata palette** for quick annotation
- **Incremental editing** - work page-by-page as processing completes
- **Desktop-focused** web app (no mobile annotation app)

---

## Core User Flows

### 1. Book Upload & Project Setup
**Actors:** User (Book Owner/Project Creator), System

**Flow:**
1. User creates a new project/book
2. User uploads PDF file(s)
3. System validates PDF (readable, not corrupted)
4. System automatically identifies/extracts book metadata from PDF
5. User reviews and fills in missing metadata:
   - Book title, author(s), publisher, year
   - Primary languages (Sanskrit, Hindi, English, etc.)
   - Book category/genre (religious texts, philosophy, etc.)
6. System ignores any existing OCR text embedded in PDF (typically low quality from sources like archive.org)
7. System stores uploaded PDF in project's GitHub repository
8. Project is created with unique ID

**Requirements:**
- Support multi-hundred page PDFs (500+ pages)
- Handle scanned images embedded in PDFs
- Support single-file uploads only (no batch upload of multiple books)
- **Auto-extract metadata** from PDF (title page, copyright page, etc.)
- **Ignore embedded OCR** text in PDF
- **Store in project GitHub repo** (not user's personal account)
- Project organization (folders, tags, collections)

---

### 2. Automated Processing Pipeline
**Actors:** System (Background Process - Local Server)

**Flow:**
1. PDF is split into individual page images
2. Each page undergoes **local image preprocessing** (on server, no cloud APIs):
   - Deskew (straighten tilted scans)
   - Color correction (remove yellowing, improve contrast)
   - Noise reduction
   - Border/margin detection and cropping
3. Preprocessed pages are stored
4. User is notified when processing completes

**Requirements:**
- **Local server processing** - use image processing libraries (OpenCV, Pillow, etc.)
- Non-blocking (user can navigate away during processing)
- Progress indicators (X of Y pages processed)
- Ability to preview preprocessing results
- Option to reprocess specific pages with different settings
- Configurable processing quality settings (fast/balanced/high-quality)
- Handle pages with different orientations (portrait/landscape mixed)
- Error handling for corrupted or unreadable pages

---

### 3. AI-Powered Layout Analysis
**Actors:** System (Cloud API)

**Flow:**
1. For each preprocessed page, cloud API analyzes layout (using Google Document AI or Gemini)
2. System detects and creates bounding boxes for:
   - **Sanskrit verses** (devanagari script, typically centered or indented)
   - **Hindi commentary** (devanagari script, typically paragraph form)
   - **English commentary** (roman script, paragraph form)
   - **English translations** (roman script, often italicized or indented)
   - **Transliterations** (Sanskrit in Roman script/IAST)
   - **Footnotes** (smaller text at page bottom)
   - **Footnote references** (superscript numbers in text)
   - **Chapter headings** (larger text, often centered)
   - **Page numbers**
   - **Headers/footers** (running headers, book title, author)
   - **Verse numbers** (small numbers before verses)
   - **Images/Figures** (diagrams, illustrations)
   - **Columns** (detect 1-column, 2-column, multi-column layouts)
3. Each bounding box is labeled with:
   - Content type (verse/commentary/translation/footnote/heading/etc.)
   - Language (Sanskrit/Hindi/English/Other)
   - Reading order (sequence number)
   - Confidence score
   - **Link to related content** (e.g., footnote reference → footnote)
4. Results are saved as **plain text format per page**
5. **All files stored on GitHub** in folder structure relating to book/project

**Requirements:**
- Distinguish between scripts (Devanagari vs Roman)
- Detect language within same script (Sanskrit vs Hindi in Devanagari)
- **Detect transliterations** (IAST, Harvard-Kyoto, etc.)
- **Detect and link footnote references** to corresponding footnotes
- **Identify English translation vs English commentary** sections
- Handle mixed layouts (verse in center, commentary on sides)
- Detect hierarchical structure (main text vs commentary vs sub-commentary)
- **Support 2-column and multi-column layouts**
- **Detect and preserve images/figures** on pages
- Support complex layouts (nested columns, text wrapping around verses)
- Preserve reading order logic (top-to-bottom, left-to-right, but respecting structure)
- Confidence scoring for each detection
- **Incremental processing** - user can work on completed pages while system processes remaining
- Option to apply settings from one page to similar pages
- **Plain text output format** for all annotations
- **GitHub storage** with organized folder structure

---

### 4. Interactive Annotation Editor
**Actors:** User (Editor/Annotator), System

**Flow:**
1. User navigates to a specific page
2. Page image is displayed with AI-detected bounding boxes overlaid
3. System **visually distinguishes** user additions/modifications from AI-generated content
4. User can:
   - **View** bounding boxes with color-coded labels
   - **Select** a bounding box to see details
   - **Move** bounding box by dragging
   - **Resize** bounding box by dragging corners/edges
   - **Delete** incorrect bounding boxes
   - **Create new** bounding boxes by drawing on image
   - **Change label** (content type, language) via **easy-to-use metadata palette**
   - **Adjust reading order** by dragging sequence numbers
   - **Split** one box into multiple boxes
   - **Merge** multiple boxes into one
   - **Copy settings** from one page to apply to others
5. System **tracks all user edits in plain text** alongside automated output
6. System **attributes edits at highest granularity** (per stanza/section level)
   - Example: User A changes stanza X, User B modifies stanzas X and Y → both captured separately
7. Changes are auto-saved
8. User can mark page as "reviewed" or "complete"
9. System **highlights sections needing attention** (glanceable view)
10. User can **work on completed pages** while system processes remaining pages

**Requirements:**
- Smooth, responsive UI for drawing/editing boxes
- **Visual distinction** between AI-generated vs user-edited content (different colors, borders, icons)
- **Easy metadata palette** - quick selection of content types, languages, tags
- **Plain text storage** for all user edits
- **Granular attribution** - track who edited what at stanza/section level
- **Attention indicators** - visually highlight low-confidence sections, incomplete annotations, conflicts
- **Incremental editing** - work page-by-page while background processing continues
- Zoom in/out for fine-grained editing
- Pan across large images
- Keyboard shortcuts for common actions
- Undo/redo functionality (unlimited history per session)
- Side-by-side view: original image + annotated image
- Visual indicators for confidence scores (low confidence = dashed border, yellow highlight, etc.)
- Batch operations (apply label to multiple selected boxes)
- Quick navigation between pages (prev/next buttons, page jumper)
- Progress tracking (X of Y pages reviewed)
- Visual diff showing AI suggestions vs user edits

---

### 5. Annotation Persistence & Versioning
**Actors:** System (Storage Layer)

**Flow:**
1. Every edit is captured as a change event
2. Changes include:
   - Timestamp
   - User who made the change
   - Type of change (box created/moved/resized/deleted/relabeled)
   - Before and after states
3. Changes are persisted in structured flat files (one per page)
4. File format includes:
   - Page metadata (page number, book ID, dimensions)
   - List of bounding boxes with coordinates, labels, reading order
   - Edit history/changelog
   - AI confidence scores
   - Review status

**Requirements:**
- Flat file format (JSON, YAML, or similar)
- Human-readable and git-friendly
- Schema version for future compatibility
- Support for incomplete/in-progress annotations
- Capture both AI-generated and human-edited data
- Store original AI suggestions separately from final user-approved version
- Include provenance (who, when, what changed)

**Example structure:**
```
book-project/
  metadata.json (book-level info)
  pages/
    page-001.json
    page-002.json
    ...
  processed-images/
    page-001.png
    page-002.png
    ...
  ocr-output/
    book.md
```

---

### 6. OCR Execution & Text Extraction
**Actors:** User (initiates), System (executes)

**Flow:**
1. **User can initiate OCR even if all pages have not been structure analyzed yet**
2. User selects pages/sections to OCR (single page, page range, or entire book)
3. User can configure OCR settings:
   - Per-language OCR engines
   - Output format preferences
   - Whether to include low-confidence detections
4. System processes each bounding box in reading order:
   - Uses **Google Document AI or Gemini APIs** for OCR
   - Applies appropriate OCR engine based on language/script
   - Extracts text with formatting hints
   - Captures confidence scores
5. Results are compiled into structured output file
6. User can review OCR output and re-run if needed

**Requirements:**
- **Flexible OCR initiation** - can start OCR before all pages are analyzed
- **Prefer Google Document AI or Gemini models/APIs** for OCR processing
- Use different OCR engines for different languages/scripts (Devanagari, Roman, etc.)
- Preserve structure (verses separate from commentary)
- Handle transliteration (Sanskrit in Roman script like IAST)
- Detect and preserve special characters (diacritics, combining marks)
- Support for right-to-left text if needed
- Batch OCR with progress tracking
- Incremental OCR (only process changed pages or specified ranges)
- Export OCR results without requiring annotation completion
- Handle OCR errors gracefully (flag low-confidence text)
- **Store original OCR output separately** from user-edited text
- Track complete edit history: OCR output → user edits → final version

---

### 6b. OCR Text Correction Interface
**Actors:** User (Editor/Reviewer)

**Flow:**
1. After OCR is complete, user can review extracted text
2. For each text section (bounding box):
   - View original OCR output
   - View current/edited text
   - Edit text directly in interface
   - View confidence scores
   - Mark as "verified" or "needs review"
3. Every edit is tracked:
   - Timestamp of edit
   - User who made the edit
   - Original OCR text
   - Changed text
   - Reason/note (optional)
4. Changes are saved and versioned in git
5. Final output file reflects the edited text

**Requirements:**
- Side-by-side view: image snippet + OCR text
- Rich text editor for Sanskrit (Devanagari input), Hindi, English
- Support for special characters, diacritics, IAST transliteration
- Keyboard shortcuts for common edits
- Spell check / dictionary lookup for Sanskrit/Hindi
- Batch operations (apply same correction to multiple instances)
- Text comparison view (diff between OCR and edited)
- Comment/annotation on specific text sections
- Maintain provenance chain: OCR → User A edit → User B edit → Final
- Export both raw OCR and corrected versions

---

### 7. Rich Markup Output Format
**Actors:** System (generates), User (consumes)

**Flow:**
1. System generates output file(s) from OCR results
2. Output includes:
   - Structured markup (markdown-based)
   - Language tags for each section
   - Semantic tags (verse/commentary/translation/footnote)
   - Preserved formatting (line breaks, indentation)
   - Metadata headers (book info, page numbers, citations)
   - Cross-references and footnote linking
3. Output is compatible with publishing tools (Quarto, Pandoc)
4. User can export and use in downstream projects

**Requirements:**
- Markdown-based with extended syntax
- Frontmatter for metadata (YAML)
- Language annotations (inline or block-level)
- Semantic classes/styles for different content types
- Preserve structure for table of contents generation
- Support for parallel texts (original + translation side-by-side)
- Citation-ready format
- Support for mathematical/special notation in verses
- Include page references for citation purposes

**Example output:**
```markdown
---
title: "Bhagavad Gita"
author: "Vyasa"
translator: "Author Name"
languages: [sanskrit, english]
---

# Chapter 1: Arjuna Vishada Yoga

## Verse 1 {#bg-1-1}

::: {.verse lang="sa"}
धृतराष्ट्र उवाच |
धर्मक्षेत्रे कुरुक्षेत्रे समवेता युयुत्सवः |
:::

::: {.translation lang="en"}
Dhritarashtra said:
O Sanjaya, what did my sons and the sons of Pandu do when they gathered on the holy field of Kurukshetra, eager to fight?
:::

::: {.commentary lang="en" author="Shankaracharya"}
The word 'dharma-kshetra' (field of dharma) indicates...
:::

::: {.footnote}
[^1]: Kurukshetra is located in modern-day Haryana, India.
:::
```

---

### 8. Git-Based Version Control & Collaboration
**Actors:** System (manages git), Users (collaborate)

**Flow:**
1. Each book project is a git repository
2. All annotation files and metadata are tracked in git
3. User edits create commits with meaningful messages:
   - "Updated page 45 annotations by [user]"
   - "Corrected verse bounding boxes on pages 12-15"
4. Users can:
   - View change history
   - See who made what changes
   - Revert changes if needed
   - Branch for experimental edits
   - Create pull requests for suggested changes
5. System automatically attributes edits to users

**Requirements:**
- Automatic git commits on save (or manual commit points)
- Commit messages include: user, timestamp, pages affected, type of change
- **Asynchronous collaboration model** - users can suggest edits on same page but not simultaneously (like GitHub PR workflow)
- Merge conflict handling for concurrent edits on same page
- Suggestion/review workflow (user A suggests change, user B approves/rejects)
- Visual diff viewer for annotations (overlay before/after)
- Blame/attribution view (see who annotated each box)
- Integration with GitHub/GitLab for remote backup
- Branch/PR workflow for review process
- Rollback capability to any previous state

---

## Additional Use Cases & Requirements

### User Management & Authentication
**Requirements:**
- **GitHub authentication required** for all users who can make edits or view pre-published documents
- **Viewers of published content** do not need authentication
- User roles:
  - **Admin** - full access, manage users, **delete projects/books**
  - **Project Owner** - create projects, invite collaborators
  - **Editor** - full edit access to assigned projects
  - **Reviewer** - view and comment, suggest changes
  - **Viewer** - read-only access (no GitHub auth needed for published content)
- Invitation system for adding collaborators
- Permissions per project
- Activity tracking (who's working on what)
- **GitHub integration** - all edits tracked with GitHub identity

### Project Management
**Requirements:**
- **Dashboard showing all projects** user has access to
- **Project selector/switcher** - easy navigation between projects:
  - Dropdown in header/navbar
  - Grid or list view on dashboard
  - Show project thumbnail/preview
  - Recent projects quick access
- **Project metadata** displayed on dashboard:
  - Project/book name
  - Progress (X of Y pages completed)
  - Last updated date/time
  - Contributors (avatars/names)
  - Status (in progress, under review, published)
- **Filter/search projects**:
  - By name
  - By status
  - By language
  - By contributor
  - By date range
- Archive/delete projects (Admin only)
- Duplicate project (for creating variants)
- Project templates (preset configurations)
- Bulk operations (export multiple projects)
- **Project access control** - users only see projects they have permissions for

### Storage & File Management
**Requirements:**
- **All files stored in single GitHub repository per project**:
  - Uploaded books (PDFs)
  - Processed images
  - Annotation metadata (plain text)
  - OCR output (.md files)
  - User edit history
- **Project-level storage** - files stored in project repo, not user's personal account
- **Only Admin can delete** projects or books
- Automatic backup via GitHub
- Data export (download entire project)
- Data import (restore from backup)
- Cleanup of old processed images if needed
- **Organized folder structure** relating to book/project hierarchy

### Search & Navigation
**Requirements:**
- Full-text search across OCR results
- Search within a book
- Search across all books in a project
- Filter by content type, language, page range
- Jump to page by number
- Bookmarks/favorites

### Quality Assurance & Review
**Requirements:**
- Review workflow (mark pages for review, approve, reject)
- Comment system (leave notes on specific boxes or pages)
- Quality metrics (% pages reviewed, % OCR confidence, etc.)
- Comparison view (side-by-side original vs output)
- Issue tracking (flag problems, assign to users)

### Export & Publishing
**Requirements:**
- Export to multiple formats (Markdown, HTML, PDF, EPUB)
- Batch export all books in a project
- Custom export templates
- Direct integration with Quarto/Pandoc
- Preview generated output before export

### Configuration & Settings
**Requirements:**
- Per-project settings:
  - Languages used in book
  - Content types to detect
  - OCR engine preferences
  - Output format preferences
- User preferences:
  - Interface language
  - Keyboard shortcuts
  - Default zoom level
  - Autosave frequency
- System settings (admin only):
  - Processing pipeline parameters
  - AI model configuration
  - Storage locations

---

## Key Technical Constraints (Non-Implementation)

### Performance
- Handle large books (1000+ pages)
- Responsive annotation editor (sub-100ms interactions)
- Efficient storage (don't store redundant data)

### Scalability
- Support multiple concurrent users
- Queue system for processing jobs
- Incremental processing (don't reprocess everything on small changes)

### Reliability
- Autosave to prevent data loss
- Graceful error handling
- Data integrity checks
- Transaction safety for concurrent edits

### Accessibility
- Keyboard navigation support
- Screen reader compatibility (where feasible)
- High contrast mode for annotation colors

---

## Initial Content Type Taxonomy

**Core Types (v1.0):**
- `verse` - Sanskrit verses/shlokas
- `commentary` - Explanatory text (any language)
- `translation` - English/Hindi translation of verses
- `footnote` - Page footer notes
- `heading` - Chapter/section headings
- `page_number` - Page numbering
- `citation` - References to other texts
- `metadata` - Author names, publisher info, etc.

**Language Tags:**
- `sanskrit` (Devanagari)
- `hindi` (Devanagari)
- `english` (Roman)
- `transliteration` (Sanskrit in Roman/IAST)

**Future Extensions (examples):**
Could later subdivide into:
- `verse.mula` (root text)
- `verse.invocation` (mangalacharana)
- `commentary.bhashya` (primary commentary)
- `commentary.tika` (sub-commentary)
- `commentary.vyakhya` (explanation)
- etc.

---

## Decisions Made

1. **Collaboration Model:** ✓
   - **Asynchronous collaborative editing** (GitHub-style)
   - Multiple users can suggest edits on same page, but not simultaneously
   - Suggestion/approval workflow for changes
   - Merge conflict resolution when edits overlap

2. **OCR Text Correction:** ✓
   - **In-app editing** with full tracking
   - Store original OCR output + all user edits + timestamps + user attribution
   - Changes update the source annotations and flow through to output

3. **Publishing Model:** ✓
   - Books are **not copyrighted** (public domain texts)
   - **All output published online** under specific domain by default
   - Not for personal use only - intended for public scholarly access

4. **Content Type Taxonomy:** ✓
   - **Start simple** with basic categories (verse, commentary, translation, footnote, heading)
   - **Design for extensibility** - easy to add more specific types later
   - Schema versioning to support taxonomy evolution

5. **AI Learning:** ✓
   - Nice to have but **not priority**
   - Using cloud APIs means no control over model training/learning
   - Keeping costs down by avoiding local model hosting
   - Focus on tracking corrections for quality metrics instead

6. **Publication & Corrections:** ✓
   - **Publication certification**: Users with Publisher role can certify books as ready for export
   - **Ongoing corrections**: Out of scope - handled by future Component 2 (Public Website)

7. **Project Scope:** ✓
   - **THIS PROJECT (Component 1)**: OCR/Annotation Tool - digitize, annotate, OCR, export markdown
   - **OUT OF SCOPE**: Component 2 (Public Website) and Component 3 (Cross-Reference Engine) are separate future projects

8. **Platform:** ✓
   - **Desktop web application** only (no mobile annotation app)
   - Responsive design is Component 2 concern (out of scope)

9. **Attribution & Licensing:** ✓
   - **Multi-level attribution**: Show contributors at book/page/line level
   - Start with book-level contributor list
   - Detailed provenance available on demand
   - **License**: CC0 (public domain dedication)

10. **Versioning & History:** ✓
   - No explicit version numbers (v1.0, v1.1)
   - **Version history UI**: Show past edits/versions of sections/lines
   - Git-based history provides audit trail
   - Users can see evolution of specific content

11. **Export Format:** ✓
   - **Primary format**: Quarto-compatible markdown
   - Supports multiple scripts (IAST, Romanized, Devanagari)
   - Can generate: websites, PDFs, EPUB, etc. from single source
   - Font/rendering handled by Quarto

---

## Proposed User Roles & Permissions

**Suggested Role Hierarchy:**

1. **Admin**
   - Full system access
   - User management (create/delete accounts, assign roles)
   - System configuration
   - Delete/archive projects

2. **Publisher**
   - Certify books as "ready for publication"
   - Approve major changes to published books
   - Manage publication metadata
   - Can have Editor permissions

3. **Editor**
   - Full edit access to assigned projects
   - Create/modify bounding boxes and annotations
   - Edit OCR text directly
   - Create and approve merge requests
   - Mark pages as reviewed/complete
   - Initiate OCR processing

4. **Contributor**
   - Suggest edits via PR-like workflow
   - Create bounding boxes and annotations (as suggestions)
   - Propose OCR text corrections
   - Comment on pages/annotations
   - Cannot directly modify - needs Editor approval

5. **Viewer**
   - Read-only access
   - View projects, pages, annotations
   - View change history
   - Cannot make any changes

**Access Control:**
- **Invitation-based initially** - Project owners invite users and assign roles
- Later could add "public contribution" mode for specific projects
- All changes tracked in git with user attribution (deterrent for vandalism)
- Roll-back capability if needed

**Workflow Example:**
- Contributor suggests changes → Editor reviews and approves/rejects → Publisher certifies for publication

---

## System Architecture

### Component 1: OCR/Annotation/Publication Tool (THIS PROJECT)

**Purpose:** Digitize scanned books into structured, annotated, machine-readable text

**Core Features:**
- PDF upload and page splitting
- Local image preprocessing (deskew, color correction)
- Cloud-based AI layout detection (Google Document AI/Gemini)
- Interactive annotation editor with collaboration workflows
- OCR execution and text correction
- Git-based version control
- Publication certification
- Export to Quarto markdown

**Users:** Editors, Contributors, Publishers (internal team)

**Output:** Structured Quarto-compatible markdown files with rich metadata stored in GitHub

---

### Future Components (Out of Scope for This Project)

**Component 2: Public Website & Reader Experience**
- Separate project that will consume the markdown output from Component 1
- Renders books, collects feedback, creates GitHub issues
- See separate requirements document when ready

**Component 3: Cross-Reference & Insights Engine**
- Future project for advanced scholarly features
- Works with exported markdown from Component 1
- See separate requirements document when ready

---

**Integration Contract:**
Component 1's deliverable is Quarto-compatible markdown files in GitHub. Future components will consume these files as their input.

---

## Success Metrics

- **Annotation Efficiency:** Time to fully annotate a 500-page book
- **OCR Accuracy:** % of correct text extraction (measured against ground truth)
- **User Adoption:** Number of books processed, active users
- **Collaboration:** Number of multi-user projects, edits per page
- **Output Quality:** Usability of generated markdown in downstream tools

---

## Error Handling & Resilience

### Architecture Model
- **SaaS model** - All data storage happens on server (no local-only data)
- **GitHub as source of truth** - All persisted data must be committed to GitHub repos

### Critical Error Categories

#### 1. **GitHub Storage Failures (CRITICAL)**
**Scenarios:**
- Failed to commit annotations to GitHub
- Failed to push changes to remote repository
- GitHub API rate limit exceeded during save operation
- Network failure during git push

**Handling:**
- **Immediate user notification** - Display prominent error banner
- **Block further edits** until GitHub connection restored
- **Local cache** - Temporarily store changes locally with warning
- **Auto-retry** - Attempt to reconnect and push every 30 seconds
- **Manual retry button** - Allow user to trigger immediate retry
- **Error details** - Show specific GitHub error message and troubleshooting steps

**Requirements:**
- Must not lose user work even if GitHub temporarily unavailable
- Clear visual indication that work is "unsaved to GitHub"
- Ability to export uncommitted work as JSON backup
- Admin notification if GitHub failures persist beyond 5 minutes

---

#### 2. **PDF Upload Failures (ALL-OR-NOTHING)**
**Scenarios:**
- Corrupted PDF file
- Unsupported PDF version/encryption
- File size exceeds limit
- PDF cannot be parsed/split into pages

**Handling:**
- **Reject entire upload** - No partial processing
- **Immediate user feedback** - Show clear error message during upload
- **Validation details** - Explain why PDF was rejected
- **Suggested fixes** - "Try re-exporting PDF without encryption" etc.
- **Trash corrupted file** - Do not store unusable files

**Requirements:**
- Validate PDF before accepting upload
- Maximum file size: 500MB (configurable)
- Support PDF versions 1.4 - 2.0
- Reject password-protected or encrypted PDFs
- Provide file validation report

---

#### 3. **Image Processing Failures (PARTIAL OK)**
**Scenarios:**
- Individual pages fail during preprocessing (deskew, color correction)
- Image extraction fails for specific pages
- Processing timeout on particularly complex pages

**Handling:**
- **Allow partial success** - Process remaining pages
- **Create notification** per failed page
- **Continue workflow** - User can annotate successfully processed pages
- **Manual retry** - Button to reprocess failed pages individually
- **Skip option** - Allow user to skip failed pages and continue

**Requirements:**
- Track which pages failed and why
- Allow reprocessing with different settings
- Notify user when processing completes with summary (e.g., "695 of 700 pages processed successfully")
- Link to failed pages in notification

---

#### 4. **Cloud API Failures (OCR/Layout Detection)**
**Scenarios:**
- Google Document AI / Gemini API timeout
- API rate limit exceeded
- API returns error or low-confidence results
- Network connectivity issues

**Handling:**
- **Automatic retry** - Up to 3 attempts with exponential backoff
- **Queue for later** - If persistent failure, add to retry queue
- **Notification** - Create notification for page/section that failed
- **Manual retry button** - Allow user to re-run OCR on specific pages
- **Fallback** - Option to skip AI layout detection and do manual annotation
- **Show error details** - API error message, confidence scores, suggested actions

**Requirements:**
- Track API call failures per page
- Implement retry logic with backoff (5s, 30s, 5min)
- Don't block entire book if some pages fail
- Allow processing to continue for other pages
- Log all API errors for cost/reliability analysis

---

### Notification System

#### Notification Types & Severity

**CRITICAL (Red, blocking):**
- ❌ **GitHub save failure** - "Unable to save changes to GitHub. Your work is at risk."
- 🛑 **Monthly cost cap reached** - "Processing halted: Monthly budget limit reached"

**ERROR (Orange, non-blocking):**
- ❌ **PDF upload rejected** - "Upload failed: Corrupted or unsupported PDF"
- ❌ **Processing failure** - "Failed to process pages 45-52. Click to retry."

**WARNING (Yellow, informational):**
- ⚠️ **Partial processing failure** - "Image preprocessing failed on 5 of 700 pages"
- ⚠️ **Low OCR confidence** - "OCR confidence below 50% on pages 23, 67, 89"
- 💰 **Cost warning (50%)** - "You've used 50% of your monthly budget ($50 of $100)"
- 💰 **Cost warning (80%)** - "You've used 80% of your monthly budget ($80 of $100)"

**INFO (Blue, success):**
- ℹ️ **Processing complete** - "Book 'Bhagavad Gita' processing complete: 700 pages ready"
- ℹ️ **OCR complete** - "OCR finished for pages 1-100"

---

#### Notification Features

**Display locations:**
- **Global notification center** - Bell icon in header with unread count
- **Per-project notifications page** - List of all notifications for a project
- **Inline contextual alerts** - Show on affected page/section

**Notification functionality:**
- **Read/Unread status** - Track which notifications user has seen
- **Mark all read** - Bulk action to clear unread status
- **Mark all unread** - Bulk action to reset notifications
- **Dismiss** - Remove notification from active list (keep in history)
- **Details panel** - Expandable section with full error message, logs, stack trace
- **Direct links** - Click notification to jump to affected page/section
- **Manual retry button** - For errors that can be retried (API failures, processing errors)
- **Timestamp** - Show when error occurred
- **Persistence** - Notifications persist across sessions until dismissed

**Notification delivery:**
- **In-app only** for MVP (no email initially)
- Future: Optional email for critical errors and cost warnings

---

### Central Error Logging

**Requirements:**
- **One log file per project** - Stored in project's GitHub repo
- **Structured format** - JSON Lines (.jsonl) or CSV for easy parsing
- **Standardized schema** - Consistent fields across all error types
- **Human-readable** - Can be opened in text editor or spreadsheet

**Log entry format:**
```json
{
  "timestamp": "2025-01-15T10:23:45Z",
  "severity": "ERROR",
  "category": "image_processing",
  "page_number": 45,
  "error_code": "DESKEW_FAILED",
  "message": "Unable to detect page orientation: insufficient contrast",
  "details": {
    "file": "page-045.png",
    "processing_stage": "deskew",
    "retry_count": 2,
    "user_id": "github:username"
  },
  "stack_trace": "..."
}
```

**Log categories:**
- `github_storage` - Git commit/push failures
- `pdf_upload` - File validation and upload errors
- `image_processing` - Preprocessing failures
- `ocr_api` - OCR service errors
- `layout_api` - Layout detection errors
- `export` - Markdown generation errors
- `auth` - Authentication/authorization failures
- `system` - General application errors

**Log retention:**
- Keep all logs in git history (no automatic deletion)
- Admin can manually archive old logs if repo size becomes issue

**Analysis tools:**
- Provide scripts to analyze error patterns
- Generate reports: "Most common errors", "Pages with highest failure rate"
- Track error rate over time

---

## Cost Management & Budget Control

### Cost Tracking Requirements

#### 1. **Real-Time API Usage Tracking**

**What to track:**
- **OCR API calls** (Google Document AI)
  - Pages processed
  - Cost per page (~$0.0015)
  - Total spend
- **Layout Detection API calls** (Gemini)
  - Images analyzed
  - Tokens consumed
  - Cost per call
- **Other cloud services**
  - Storage costs (if not using GitHub Pro)
  - Bandwidth/egress fees (if applicable)

**Tracking granularity:**
- **Global** - Total spend across all projects
- **Per project** - Cost to process each book
- **Per user** - Track which users initiated expensive operations
- **Per operation** - Individual API call costs

**Data storage:**
- Store cost data in project metadata (JSON file in GitHub repo)
- Aggregate costs in application database (if separate from flat files)
- Export to CSV for analysis

---

#### 2. **Cost Dashboard**

**Admin dashboard displays:**
- **Current month spending** - Total $ spent so far this month
- **Budget utilization** - Visual progress bar (0-100%)
- **Cost breakdown by project** - Which books cost most to process
- **API call statistics**
  - OCR calls: X pages @ $Y = $Z
  - Layout detection calls: X images @ $Y = $Z
- **Projected monthly cost** - Estimate based on current usage rate
- **Cost history** - Chart showing spending over past 6 months

**Per-project cost view:**
- Total cost to process this book
- Breakdown by stage (image processing, OCR, layout detection)
- Pages processed vs pages remaining
- Estimated cost to complete remaining pages

**User-facing cost info:**
- Show estimated cost before starting OCR: "Processing 700 pages will cost approximately $1.05"
- Real-time cost counter during processing: "Cost so far: $0.47"

---

#### 3. **Budget Caps & Alerts**

**Monthly budget configuration:**
- Admin sets monthly spending limit (e.g., $100/month)
- Budget applies globally across all projects
- Budget resets on 1st of each month

**Alert thresholds:**
- **50% utilization** - Warning notification
  - "You've used $50 of your $100 monthly budget (50%)"
  - Notification + email to admin
- **80% utilization** - Strong warning
  - "You've used $80 of your $100 monthly budget (80%)"
  - Notification + email to admin
  - Suggest reviewing remaining planned processing
- **100% utilization** - HARD STOP
  - "Monthly budget limit reached. All processing halted."
  - Block new OCR/AI processing jobs
  - Allow users to continue manual annotation (free)
  - Admin can override and increase budget

**Budget enforcement:**
- Check budget before queuing API calls
- Reject processing requests if budget exceeded
- Show clear message: "Cannot start OCR: Monthly budget limit reached. Contact admin."

**Emergency override:**
- Admin can temporarily exceed budget in critical situations
- Requires explicit confirmation
- Logged and flagged for review

---

#### 4. **Cost Optimization Features**

**Settings to control costs:**
- **Processing priority** - Process critical books first
- **Batch processing** - Queue jobs to process during low-rate periods (if APIs have time-based pricing)
- **Quality vs cost tradeoff**
  - High quality: More expensive OCR models
  - Standard quality: Default models
  - Fast/cheap: Lower quality, faster models

**Cost-saving strategies:**
- **Preview before full OCR** - Process 10 sample pages, review quality, then decide
- **Incremental processing** - Process chapters/sections one at a time
- **Skip redundant processing** - Don't re-OCR unchanged pages

---

#### 5. **Cost Reporting & Analysis**

**Monthly reports:**
- Total spend vs budget
- Cost per book processed
- Most expensive operations
- Recommendations for cost reduction

**Export formats:**
- CSV for spreadsheet analysis
- JSON for programmatic access
- PDF summary report for stakeholders

**Metrics to track:**
- Average cost per page (across all books)
- Average cost per book
- Cost trend over time
- ROI analysis (if monetizing)

---

### No User Charges (Contributors Don't Pay)

**Business model clarification:**
- **Users do not pay** - This is a free service for contributors
- **Contributors donate content** - Users upload books as contribution to open-source corpus
- **Admin bears all costs** - OCR, hosting, storage paid by project owner
- **Budget caps protect admin** - Prevent runaway costs

**Implications:**
- No payment processing needed (simplifies system)
- No per-user billing/quotas
- All cost controls are for admin's benefit
- Users see cost transparency but don't pay

---

## Security & Access Control

### Authentication & User Identity

#### GitHub OAuth (Only Option)

**Why GitHub-only:**
- **Edit attribution** - Every edit linked to GitHub identity
- **Accountability** - GitHub profile provides verified identity
- **Git integration** - Seamless with GitHub-based storage
- **No password management** - Delegate to GitHub

**Authentication flow:**
1. User clicks "Sign in with GitHub"
2. OAuth redirects to GitHub authorization
3. User approves access (first time only)
4. App receives OAuth token + user profile
5. App stores user session
6. All edits committed with GitHub username/email

**OAuth scope requirements:**
- `user:email` - Get user's email for attribution
- `read:user` - Get username and profile
- `repo` - Create/modify repositories (for admin service account only)

**Session management:**
- Session timeout: 7 days of inactivity
- Automatic token refresh using refresh tokens
- Logout clears all session data
- Optional "Remember me" for 30-day sessions

---

### Repository Architecture & Access Control

#### Private Repository Model

**Repository ownership:**
- Admin owns a **GitHub organization** (e.g., `pagesage-books`)
- All book projects are **private repositories** under this organization
- Repository naming: `pagesage-books/book-{id}-{slug}`
- **Users never directly access GitHub** - Only through web app UI

**Repository structure (per book):**
```
pagesage-books/book-001-bhagavad-gita/
  README.md
  metadata.json
  pages/
    page-001.json
    page-002.json
    ...
  images/
    page-001.png
    page-002.png
    ...
  ocr-output/
    book.md
  logs/
    errors.jsonl
```

**Access control model:**
- **Users authenticate via GitHub OAuth** (for identity)
- **Users do NOT have direct GitHub repo access**
- **All file operations go through backend API**
- Backend uses **service account** with org-level permissions
- Backend enforces access control rules (not GitHub)

**Benefits of this model:**
- Users can't accidentally break things in GitHub
- Centralized access control in application
- Can grant granular page-level permissions
- Can revoke access instantly without touching GitHub
- Audit all actions through application logs

---

### User Roles & Permissions

#### Role Hierarchy

**1. Admin (Super User)**
- Full system access
- Manage all users and projects
- Configure system settings
- View cost dashboard
- Override budget limits
- **Delete projects and books**
- Access all repositories
- View all logs and analytics

**2. Editor**
- Full edit access to **assigned projects only**
- Create/modify/delete bounding boxes
- Edit OCR text
- Mark pages as complete
- Initiate OCR processing
- View project cost data
- Cannot delete projects

**3. Reviewer (Future - optional for MVP)**
- View assigned projects
- Add comments and suggestions
- Cannot directly modify content
- Suggest corrections (PR-style workflow)

**4. Viewer (Public - for published content only)**
- **No authentication required** for published books on Component 2 website
- Read-only access to final output
- Cannot see work-in-progress

---

#### User-Project Provisioning

**Admin workflow:**
1. Admin creates new user account or invites GitHub user
2. Admin assigns user to specific project(s)
3. Admin selects role for each project assignment
4. User receives invitation (email or in-app notification)
5. User accepts and gains access

**Admin screens required:**
- **User management dashboard**
  - List all users
  - View user's project assignments
  - Edit user roles
  - Deactivate users
- **Project access management**
  - List all projects
  - View who has access to each project
  - Add/remove users from project
  - Bulk permission changes

**Access control enforcement:**
- Check on every API request: "Does this user have access to this project?"
- Return 403 Forbidden if unauthorized
- Log all unauthorized access attempts
- Rate limit failed access attempts (prevent brute force)

---

### Data Security

#### Content Security

**Book content:**
- **Public domain texts** - No copyright restrictions
- **Flag non-public-domain content** - System should detect and warn
  - Check metadata for copyright status
  - Display warning banner: "⚠️ This book may still be under copyright. Verify before publishing."
  - **Do not block** - Allow processing but require admin confirmation before export

**Copyright verification workflow:**
- User uploads book → system extracts metadata
- Check publication date: if after 1928 (US) or 1950 (India), flag for review
- Admin manually verifies public domain status
- Mark project as "copyright_verified: true" in metadata

---

#### System Security

**PDF upload security:**
- **Malware scanning** - Integrate with antivirus API (ClamAV, VirusTotal)
- **File type validation** - Verify file is actually a PDF
- **Size limits** - Max 500MB per file
- **Sandboxed processing** - Process PDFs in isolated environment
- **Reject suspicious files** - Encrypted, password-protected, or obfuscated PDFs

**API rate limiting:**
- **Per-user rate limits**
  - 100 requests/minute for authenticated users
  - 10 requests/minute for public endpoints (if any)
- **Per-IP rate limits**
  - 1000 requests/hour per IP
- **Exponential backoff** - Suggest retry-after headers
- **Block abusive IPs** - Temporarily ban IPs with excessive failed requests

**API security:**
- **Authentication required** - All write endpoints require valid session
- **CSRF protection** - Use CSRF tokens for state-changing operations
- **XSS prevention** - Sanitize all user input, escape output
- **SQL injection prevention** - Use parameterized queries (if using SQL database)
- **Input validation** - Validate all API parameters

**Secret management:**
- **API keys** (Google Document AI, Gemini) - Store in environment variables, never in code
- **GitHub OAuth credentials** - Stored in secure vault (e.g., AWS Secrets Manager, HashiCorp Vault)
- **Service account tokens** - Encrypted at rest
- **Rotate secrets regularly** - Every 90 days

**Data encryption:**
- **In transit** - All communication over HTTPS (TLS 1.3)
- **At rest** - Rely on GitHub's encryption for repo data
- **API keys** - Encrypt in database using AES-256

---

### Compliance & Legal

#### GDPR Compliance (If EU Users)

**Personal data collected:**
- GitHub username, email, avatar URL (from OAuth)
- User activity logs (page edits, annotations, timestamps)
- IP addresses (in access logs)
- Browser/device information (from user agent)

**GDPR requirements:**

**1. Legal basis for processing:**
- **Legitimate interest** for edit attribution and accountability
- **User consent** for optional analytics/tracking

**2. Privacy policy (required):**
- Explain what data is collected
- How data is used (edit attribution, analytics)
- How long data is retained
- User rights (access, deletion, export)
- Link prominently in footer and during signup

**3. User rights:**
- **Right to access** - User can download all their edit history
- **Right to erasure ("Right to be forgotten")**
  - User can request account deletion
  - Replace edit attribution with "Anonymous" or "[deleted user]"
  - Preserve edit history for data integrity
- **Right to data portability** - Export user's contributions as JSON/CSV

**4. Data retention policy:**
- **Active users** - Retain data indefinitely
- **Inactive users** - Anonymize after 2 years of inactivity (configurable)
- **Deleted accounts** - Anonymize immediately but keep edit records
- **Access logs** - Retain for 90 days, then purge

**5. Cookie policy:**
- Disclose use of cookies (session, analytics)
- Allow opt-out of non-essential cookies

**Implementation:**
- Privacy policy page
- User data export feature
- Account deletion workflow
- Anonymization scripts

---

#### Terms of Service (Required)

**Key sections:**
- **Acceptable use** - No malicious uploads, spam, abuse
- **Content licensing** - Users confirm books are public domain or properly licensed
- **Attribution requirements** - Users grant permission for edit attribution
- **Service availability** - No SLA guarantees (best effort)
- **Limitation of liability** - Standard disclaimers
- **Termination** - Admin can suspend/ban users for violations

**Acceptance workflow:**
- Checkbox during first login: "I agree to the Terms of Service"
- Link to full TOS document
- Log acceptance timestamp

---

#### Audit Logging

**What to log:**
- **Authentication events**
  - Login, logout, failed login attempts
  - OAuth token refresh
- **Access events**
  - Project access (who viewed what project when)
  - Failed authorization attempts
- **Edit events**
  - Page annotations created/modified/deleted
  - OCR text corrections
  - Metadata changes
- **Admin actions**
  - User provisioning/deprovisioning
  - Permission changes
  - Budget overrides
  - Project deletion

**Log format:**
- Structured JSON logs
- Include: timestamp, user_id, action, resource, result (success/failure), IP address
- Stored in separate audit log (not mixed with error logs)

**Log retention:**
- Audit logs retained for 1 year minimum
- Admins can export audit logs for compliance reviews

---

## Next Steps

1. **Prioritize requirements** - categorize as must-have vs nice-to-have
2. **Create user stories** - convert flows into detailed user stories
3. **Design data models** - structure of annotation files, database schemas
4. **Wireframe UI** - sketch the annotation editor and key screens
5. **Generate PRDs** - detailed Product Requirements Documents for each feature area
