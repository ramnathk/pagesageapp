# PageSage v1 Requirements - Single User OCR Tool

**Version**: 1.0 (Single User MVP)
**Status**: Planning
**Last Updated**: 2025-01-15

---

## Project Vision

A personal tool for digitizing ancient texts (Sanskrit, Hindi, and English multi-language books) with AI-assisted layout detection and rich version tracking.

---

## v1 Scope: Single User Tool

**THIS VERSION: v1 - Personal OCR/Annotation Tool**

**Target User**: You (solo admin/operator)

**Core Value Proposition**:
- Upload PDFs of ancient texts
- AI automatically detects layout and text structure
- Manually refine annotations
- Extract text via OCR
- Correct OCR errors
- Export to structured markdown
- **Track every edit with full attribution (Wikipedia-style)**

**Explicitly OUT OF SCOPE for v1**:
- ❌ Multiple users or collaboration
- ❌ Role-based permissions (multi-user)
- ❌ Concurrent editing (multi-user)
- ❌ User management (multi-user provisioning)
- ❌ Per-user budgets or quotas (multi-user)
- ❌ Public website (Component 2)
- ❌ Cross-reference engine (Component 3)

**IN SCOPE for v1**:
- ✅ **Single-user authentication** (GitHub OAuth for admin)
- ✅ Secure session management
- ✅ Prevent unauthorized access

**Future Versions Will Add**:
- v2: Public website for book display (with Wikipedia-style change history)
- v3: Multiple books/projects management
- v4: Multi-user collaboration, roles, permissions (see REQUIREMENTS-v4.md)

---

## Key Design Principles

### 1. **Rich Version Tracking (Core to v1)**

Every edit is tracked with full attribution:
- **Who**: User attribution (your name, GitHub username)
- **When**: Precise timestamps
- **What**: Detailed change records (before/after)
- **Why**: Optional edit notes/comments

**Wikipedia-Style Features**:
- View full edit history for any page
- Compare any two versions (diff view)
- Revert to previous versions
- Never lose data - all history preserved

### 2. **Data Integrity First**

- All data stored in version control (GitHub)
- Plain text formats (git-friendly)
- Human-readable annotations
- Immutable history

### 3. **Cost Awareness**

- Track all API usage and costs
- Display costs before operations
- Monthly budget caps with alerts
- No surprises

### 4. **Correctness Over Speed**

- Working with historical texts requires accuracy
- Manual review and correction supported
- High OCR confidence thresholds

---

## Core User Flows (v1)

### 1. User Authentication & Authorization

**Actors**: You (admin user)

**Flow**:
1. Navigate to PageSage application URL
2. **If not authenticated**: Redirected to login page
3. Click "Sign in with GitHub"
4. GitHub OAuth flow:
   - Redirected to GitHub authorization page
   - Grant PageSage access to your GitHub account
   - Redirected back to PageSage
5. System validates OAuth response
6. **First-time setup** (only on first login):
   - System creates admin user profile
   - Links GitHub username to admin account
   - Stores session token (httpOnly cookie)
7. **Subsequent logins**:
   - System validates existing admin user
   - Creates new session
8. Redirected to Dashboard

**Requirements**:
- GitHub OAuth only (no password authentication)
- Server-side session management
- httpOnly, secure cookies (prevent XSS)
- 7-day session timeout (auto-logout)
- CSRF protection enabled
- **Authorization check on every request**:
  - API routes verify authenticated session
  - Unauthenticated requests → 401 Unauthorized
  - Frontend redirects to login if session expired
- **Single admin user for v1**:
  - First GitHub user to log in becomes admin
  - System blocks additional users (until v4)
  - Clear error message: "This is a single-user tool"

**Security Requirements**:
- OAuth state parameter (prevent CSRF)
- Validate GitHub callback signatures
- Store minimal user data (GitHub ID, username, avatar)
- No plaintext passwords (OAuth only)
- Automatic session refresh before expiry
- Clear session on logout
- Rate limiting on authentication endpoints

**Error Handling**:
- OAuth cancelled: Show message, allow retry
- OAuth fails: Log error, show friendly message
- Session expired: Auto-redirect to login
- Concurrent sessions: Allow (same user, multiple tabs)

---

### 2. Project Setup

**Actors**: You (sole user)

**Flow**:
1. Create new project/book
2. Upload PDF file (single book, 500+ pages)
3. System validates PDF
4. System extracts metadata (title, author, page count)
5. You review and fill in missing metadata:
   - Book title, author(s), publisher, year
   - Primary languages (Sanskrit, Hindi, English)
   - Book category
6. System stores PDF in repository
7. Project created

**Requirements**:
- Single-file upload (no batch)
- Support large PDFs (500+ pages, 500MB max)
- Auto-extract metadata from PDF properties
- Validate PDF (not corrupted, readable)
- Ignore any embedded OCR (typically low quality)

---

### 3. Automated Image Processing

**Actors**: System (background process)

**Flow**:
1. PDF split into individual page images
2. Each page undergoes preprocessing:
   - Deskew (straighten tilted scans)
   - Color correction (remove yellowing, improve contrast)
   - Noise reduction
   - Border detection and cropping
3. Preprocessed pages stored
4. You notified when complete

**Requirements**:
- Non-blocking (can navigate away during processing)
- Progress indicators
- Preview preprocessing results
- Option to reprocess pages with different settings
- Handle mixed orientations (portrait/landscape)

---

### 4. AI Layout Detection

**Actors**: System (cloud API)

**Flow**:
1. For each preprocessed page, AI analyzes layout
2. System detects bounding boxes for:
   - Sanskrit verses (Devanagari, centered/indented)
   - Hindi commentary (Devanagari, paragraphs)
   - English commentary (roman script)
   - English translations (roman, often italicized)
   - Transliterations (IAST)
   - Footnotes (small text at bottom)
   - Footnote references (superscript numbers)
   - Headings, page numbers
   - Verse numbers
   - Images/figures
3. Each box labeled with:
   - Content type (verse/commentary/translation/etc.)
   - Language (Sanskrit/Hindi/English)
   - Reading order (sequence)
   - Confidence score
   - Links (footnote refs → footnotes)
4. **Version 1 created**: "AI-generated layout"
5. Results stored in repository

**Requirements**:
- Detect Devanagari vs Roman script
- Distinguish Sanskrit vs Hindi (both Devanagari)
- Detect IAST transliteration
- Link footnote references to footnotes
- Distinguish English translation vs commentary
- Handle 2-column and multi-column layouts
- Detect and preserve images
- Preserve reading order
- Store confidence scores
- **Version tracking**: Mark as AI-generated (version 1)

---

### 5. Interactive Annotation Editor

**Actors**: You (editor)

**Flow**:
1. Navigate to specific page
2. Page image displayed with AI bounding boxes overlaid
3. **Visual distinction**: AI-generated boxes vs your edited boxes
4. You can:
   - **View** boxes with labels and confidence scores
   - **Select** box to see details
   - **Move** box by dragging
   - **Resize** box by dragging corners/edges
   - **Delete** incorrect boxes
   - **Create** new boxes by drawing
   - **Change label** (content type, language)
   - **Adjust reading order** (drag sequence numbers)
   - **Split** one box into multiple
   - **Merge** multiple boxes
   - **Add notes** to boxes ("adjusted for better fit")
5. **Every edit creates new version**:
   - Version 2: "Moved box-1 to better fit verse"
   - Version 3: "Changed box-2 from commentary to translation"
6. Changes auto-saved
7. **View version history** at any time
8. Mark page as "reviewed" when done

**Requirements**:
- Smooth, responsive canvas
- **Clear visual distinction**: AI (blue?) vs user-edited (green?)
- **Easy metadata palette**: Quick label changes
- **Version tracking UI**: Show edit history
- **Attribution**: "Created by AI, adjusted by You on Jan 15"
- Zoom in/out for precision
- Pan across large images
- Keyboard shortcuts (undo, delete, etc.)
- Undo/redo (unlimited per session)
- **Version comparison**: View any two versions side-by-side
- **Revert capability**: Restore previous version
- Quick page navigation (prev/next, jump to page)

---

### 6. Version Tracking & History

**Actors**: System (automatic), You (can review)

**Flow**:
1. **Every edit creates version record**:
   ```
   Version 1: AI-generated layout (Jan 15, 10:00)
   Version 2: You moved box-1 (Jan 15, 10:15)
              "Adjusted to fit verse better"
   Version 3: You changed box-2 type (Jan 15, 10:20)
              "This is translation, not commentary"
   ```

2. **Version record includes**:
   - Version number
   - Timestamp
   - User attribution (your name, GitHub username)
   - Change type (created/moved/resized/deleted/relabeled)
   - Before/after state (what changed)
   - Optional note (why you made change)
   - Repository commit SHA

3. **View history UI**:
   - Timeline of all versions
   - Click any version to view
   - Compare any two versions (diff)
   - Revert to any previous version

4. **Changes committed to repository**:
   - Each save creates git commit
   - Commit message includes user and change summary
   - Full git history available

**Requirements**:
- **Never lose data**: All versions preserved forever
- **Full attribution**: Every edit tracked to user with timestamp
- **Rich metadata**: Before/after states, change notes
- **Git integration**: Every version has commit SHA
- **Rollback**: Revert to any previous version (creates new version, doesn't delete history)
- **Diff view**: Visual comparison between versions
- **Search history**: Find when specific change was made
- **Export history**: Download full edit history as report

---

### 7. OCR Text Extraction

**Actors**: You (initiate), System (execute)

**Flow**:
1. **You can start OCR anytime** (don't need all pages analyzed)
2. Select pages to OCR (single, range, or all)
3. Configure OCR settings (optional):
   - Per-language engines
   - Confidence threshold
4. System processes each box in reading order:
   - Crops image to box coordinates
   - Uses appropriate OCR engine (Devanagari/Roman/IAST)
   - Extracts text
   - Records confidence score
5. **Version created**: "OCR text extracted"
6. Results stored (original OCR output - immutable)
7. You notified when complete

**Requirements**:
- **Flexible timing**: OCR before full layout review if desired
- Use cloud OCR APIs (Google Document AI or Gemini)
- Different engines per language/script
- Preserve special characters (diacritics, combining marks)
- Handle IAST transliteration
- Record confidence scores
- **Store original OCR separately**: Never overwrite
- Batch processing with progress
- Incremental (only new/changed pages)
- **Version tracking**: Mark as "OCR-generated" text

---

### 8. OCR Text Correction

**Actors**: You (reviewer/corrector)

**Flow**:
1. After OCR complete, review extracted text
2. For each bounding box:
   - View image snippet (box crop)
   - View original OCR text
   - View confidence score
   - Edit text directly
   - Add correction notes (optional)
   - Mark as "verified"
3. **Every text edit creates version**:
   ```
   Version 4: OCR extracted (85% confidence)
   Version 5: You corrected word 3 (Jan 15, 11:00)
              "OCR read 'धर्मक्षेत्रे' as 'धर्मक्षैत्रे'"
   ```
4. Changes saved to repository
5. **Full version chain**:
   - OCR output (v4) → Your correction (v5) → Final

**Requirements**:
- Side-by-side: image + text editor
- Rich text editing (Devanagari, IAST input)
- Special character support (diacritics)
- Confidence indicators (highlight low-confidence)
- **Version tracking**: Track OCR → corrections
- **Attribution**: "Original OCR 85% → Corrected by You"
- Text comparison (OCR vs corrected)
- Comment on corrections (why changed)
- Spell check (Sanskrit/Hindi dictionaries)
- **Preserve original OCR**: Always keep initial output

---

### 9. Export to Structured Markdown

**Actors**: You (initiate), System (generate)

**Flow**:
1. Select project to export
2. Configure export options:
   - Include/exclude low-confidence text
   - Parallel text layout (original + translation)
   - Citation format
3. System generates Quarto-compatible markdown:
   - Frontmatter (YAML metadata)
   - Structured content (verses, commentary, translations)
   - Language tags
   - Semantic classes
   - Cross-references (footnote links)
   - **Attribution metadata**: List of all contributors (you + AI)
4. Export saved in repository
5. **Download or preview** generated markdown

**Requirements**:
- Quarto/Pandoc compatible format
- YAML frontmatter (book metadata)
- Language annotations (`{lang="sa"}`)
- Semantic markup (`.verse`, `.commentary`, `.translation`)
- Preserve structure for TOC generation
- Support parallel texts
- Citation-ready format
- **Include attribution**: Contributors, edit counts, timestamps
- Page references for citations
- Preview before export

**Example Output**:
```markdown
---
title: "Bhagavad Gita"
author: "Vyasa"
digitized_by: "Your Name"
languages: [sanskrit, english]
digitization_date: "2025-01-15"
pages_processed: 700
---

# Chapter 1

## Verse 1 {#bg-1-1}

::: {.verse lang="sa"}
धृतराष्ट्र उवाच |
धर्मक्षेत्रे कुरुक्षेत्रे समवेता युयुत्सवः |
:::

::: {.translation lang="en"}
Dhritarashtra said:
O Sanjaya, what did my sons and the sons of Pandu do...
:::

<!-- OCR confidence: 95% | Verified by: Your Name | Date: 2025-01-15 -->
```

---

### 10. Cost Tracking & Budget Control

**Actors**: You (monitor), System (enforce)

**Flow**:
1. **Before expensive operations**, system shows cost estimate:
   - "Processing 700 pages will cost approximately $1.05"
   - "Continue?"
2. You approve
3. System tracks all API costs:
   - OCR calls: X pages @ $Y = $Z
   - Layout detection: X pages @ $Y = $Z
4. **Display current spending**:
   - Dashboard shows: "$67 of $100 monthly budget (67%)"
   - Progress bar visual
5. **Budget alerts**:
   - 50% used: "You've used $50 of $100 budget"
   - 80% used: "You've used $80 of $100 budget (warning)"
   - 100% used: "Budget limit reached - processing halted"
6. **If budget exceeded mid-processing**:
   - Complete in-flight operations
   - Halt new operations
   - Show error: "Budget cap reached. Increase budget to continue."
7. You can increase budget if needed

**Requirements**:
- Real-time cost tracking
- **Cost preview** before operations ("This will cost $X")
- Visual budget widget (progress bar)
- Monthly budget cap (default $100)
- Alert thresholds (50%, 80%, 100%)
- **Hard stop** at 100% (prevent overages)
- Allow in-flight operations to complete
- Budget override (you can increase)
- Cost history and reports
- Export cost logs

---

### 11. Repository Management

**Actors**: System (automatic)

**Flow**:
1. Each project gets private repository:
   ```
   pagesage-books/book-{id}-{slug}/
     metadata.json
     pages/
       page-001.json    (annotations + version history)
       page-002.json
     images/
       original/
         page-001.png
       preprocessed/
         page-001.png
     ocr-output/
       book.md
     logs/
       costs.jsonl
   ```

2. **Every change committed**:
   - Annotation edits → git commit
   - Text corrections → git commit
   - Export → git commit
   - Commit messages include: "Updated page 45 annotations"

3. **Full git history**:
   - Use `git log` to see all changes
   - Use `git show <sha>` to see specific change
   - Use `git revert` if needed

**Requirements**:
- One repository per project
- Plain text storage (JSON for annotations)
- Human-readable formats
- Automatic commits on save
- Meaningful commit messages
- Git-friendly diffs
- Never lose data (git history)
- **Attribution in commits**: Include user name/email

---

## Data Model: Version Tracking

**Core Concept**: Every page annotation file maintains full edit history

```json
{
  "pageId": "page-001",
  "projectId": "book-123",

  "currentState": {
    "boundingBoxes": [ /* current boxes */ ],
    "reviewStatus": "reviewed",
    "lastModified": "2025-01-15T10:20:45Z"
  },

  "versionHistory": [
    {
      "version": 1,
      "timestamp": "2025-01-15T10:00:00Z",
      "editedBy": {
        "name": "Your Name",
        "githubUsername": "yourusername"
      },
      "changeType": "ai_generated",
      "changes": {
        "action": "created",
        "details": "Initial AI layout detection"
      },
      "commitSha": "abc123...",
      "note": "AI detected 12 bounding boxes"
    },
    {
      "version": 2,
      "timestamp": "2025-01-15T10:15:30Z",
      "editedBy": {
        "name": "Your Name",
        "githubUsername": "yourusername"
      },
      "changeType": "manual_edit",
      "changes": {
        "action": "moved",
        "boxId": "box-1",
        "before": { "x": 100, "y": 200 },
        "after": { "x": 105, "y": 198 }
      },
      "commitSha": "def456...",
      "note": "Adjusted to better fit verse"
    },
    {
      "version": 3,
      "timestamp": "2025-01-15T10:20:45Z",
      "editedBy": {
        "name": "Your Name",
        "githubUsername": "yourusername"
      },
      "changeType": "text_correction",
      "changes": {
        "action": "text_edited",
        "boxId": "box-1",
        "before": "धर्मक्षैत्रे (OCR error)",
        "after": "धर्मक्षेत्रे"
      },
      "commitSha": "ghi789...",
      "note": "Corrected OCR mistake"
    }
  ]
}
```

---

## Additional Requirements

### Performance
- Large books (1000+ pages) handled efficiently
- Annotation editor responsive (<100ms interactions)
- Lazy loading for page lists
- Efficient image storage

### Reliability
- Autosave (every 30 seconds)
- Graceful error handling
- Data integrity checks
- Transaction safety

### Accessibility
- Keyboard navigation in annotation editor
- High contrast mode for boxes
- Clear visual indicators

### Browser Support
- Modern browsers (Chrome, Firefox, Safari, Edge)
- Desktop-focused (no mobile requirement)

---

## Error Handling

### Critical Errors (Block Operation)

**1. Repository Save Failures**
- Cannot commit to repository
- **Handling**:
  - Immediate error message
  - Preserve changes locally
  - Block further edits until resolved
  - Manual retry option
  - Show specific error details

**2. PDF Upload Failures**
- Corrupted PDF
- Unsupported format
- File too large
- **Handling**:
  - Reject upload immediately
  - Clear error message
  - Suggest fixes ("Try re-exporting without encryption")
  - Don't store unusable files

### Recoverable Errors (Allow Continuation)

**3. Image Processing Failures**
- Individual pages fail preprocessing
- **Handling**:
  - Process remaining pages
  - Notify which pages failed
  - Allow work on successful pages
  - Manual retry for failed pages
  - Option to skip failed pages

**4. OCR/AI API Failures**
- API timeout
- API rate limit
- Low confidence results
- **Handling**:
  - Auto-retry (3 attempts with backoff)
  - Queue for later retry
  - Notify failure
  - Manual retry option
  - Option to skip and continue
  - Show error details

---

## Cost Management Details

### Budget Configuration
- Default monthly cap: $100
- Adjustable by you at any time
- Resets monthly (1st of month)

### Cost Tracking
- **Real-time**: Track costs as operations happen
- **Per-operation**: OCR, layout detection, etc.
- **Storage**: Log all costs in repository

### Cost Breakdown
- OCR: ~$0.0015 per page
- Layout detection: ~$0.001 per page
- Total per page: ~$0.0025
- 700-page book: ~$1.75

### Budget Enforcement
- Check before each API call
- Hard stop at budget cap
- Allow in-flight operations to complete
- Clear error messages

### Cost Spike Detection
- Baseline: Average cost per 10-minute window
- Spike threshold: 5x baseline
- Alert when exceeded
- Show details: project, operation, cost

---

## Success Metrics (v1)

**Efficiency**:
- Time to digitize 500-page book: < 8 hours (including review)
- Annotation accuracy: > 95% after manual review

**Quality**:
- OCR accuracy: > 90% (measured against ground truth)
- Text correction: Reduce errors to < 1%

**Reliability**:
- Zero data loss (version control)
- 100% attribution (every edit tracked)

**Cost Control**:
- Stay within monthly budget
- No cost surprises

---

## What Future Versions Will Add

**v2: Public Website for Book Display**
- User-facing website to view digitized books
- Wikipedia-style change history display
- Citation generation with version references
- Search and browse functionality

**v3: Multiple Books/Projects Management**
- Project dashboard for multiple books
- Cross-project search and navigation
- Bulk operations and project templates

**v4: Multi-User Collaboration**
- Multiple editors
- Role-based permissions (Admin, Editor, Reviewer)
- User authentication (GitHub OAuth)
- Concurrent editing with conflict resolution
- Per-user budgets
- User activity monitoring
- Collaborative workflows

See **REQUIREMENTS-v4.md** for multi-user collaboration details.

---

## Next Steps

1. **Set up authentication** (CRITICAL FIRST STEP):
   - Register GitHub OAuth application
   - Configure environment variables (client ID/secret)
   - Implement OAuth callback flow
   - Set up session management
   - Add authentication middleware to all routes
2. **Define data schemas**: JSON structure for all files
3. **Design annotation editor**: Canvas UI for bounding boxes
4. **Plan version tracking UI**: History viewer, diff comparison
5. **Cost estimation**: Accurate per-book cost calculations
6. **Repository structure**: Finalize folder organization
7. **Export templates**: Markdown format specifications

---

## Notes

- This is v1 ONLY - single user, personal tool **with authentication**
- Authentication protects access even for solo user (no unauthorized access)
- Multi-user collaboration features (roles, permissions, concurrent editing) come in v4
- Public website (v2), multi-book management (v3), and multi-user features (v4) come later
- Focus: Get core workflow perfect before adding other features
- Version tracking is CORE - must be robust and complete
- Data integrity above all else (working with historical texts)
- All books are public domain (no copyright restrictions)
