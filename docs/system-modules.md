# PageSage System Modules (v1 - Single User)

This document explains the functional modules in PageSage v1, focusing on **what** each module does, not **how** it's implemented.

---

## Overview

PageSage v1 is organized into **9 core functional modules** plus supporting infrastructure:

```
User Workflows:
├── Project Management
├── PDF Upload & Processing
├── Annotation Editor (with version tracking)
├── Text Correction (with version tracking)
└── Export & Publishing

Processing Pipeline:
├── Image Preprocessing
├── AI Layout Detection
└── OCR Text Extraction

Supporting Systems:
├── Cost Management
├── Version Control & Storage
└── Notification System
```

---

## Core Functional Modules

### 1. Project Management

**Purpose**: Organize and manage book digitization projects

**What It Does**:
- Create new projects for each book
- Store project metadata (title, author, languages, etc.)
- Track project progress (X of Y pages complete)
- Track project costs (spent vs budget)
- Display project dashboard (status, progress, costs)
- Archive completed projects

**Key Entities**:
- **Project**: A single book being digitized
  - Unique ID
  - Book metadata (title, author, publisher, year, languages)
  - Progress tracking (total pages, processed, reviewed)
  - Cost tracking (budget, spent)
  - Status (active, complete, archived)

**User Interactions**:
- Create project → Enter metadata → Upload PDF
- View dashboard → See progress and costs
- Navigate to pages → Edit annotations
- Export project → Download markdown

**Dependencies**:
- → PDF Upload (receives uploaded files)
- → Cost Management (displays costs)
- → Export Module (generates markdown)

---

### 2. PDF Upload & Validation

**Purpose**: Handle PDF uploads and prepare for processing

**What It Does**:
- Accept PDF file uploads (single book, up to 500MB)
- Validate PDF (format, size, not corrupted)
- Scan for malware (security check)
- Extract metadata from PDF (title, author, page count)
- Split PDF into individual page images
- Store original PDF and page images
- Trigger image preprocessing

**Processing Steps**:
```
User uploads PDF
  ↓
Validate (format, size, corruption, malware)
  ↓
Extract metadata (auto-fill book info)
  ↓
Split into page images (PNG or JPEG)
  ↓
Store in repository
  ↓
Trigger preprocessing
```

**Requirements**:
- Single-file upload (no batch)
- Support large files (500+ pages, 500MB max)
- Handle scanned images embedded in PDFs
- Ignore any embedded OCR text (usually poor quality)
- Validate before storing

**User Interactions**:
- Drag-and-drop PDF or file picker
- View upload progress
- Review extracted metadata
- See preview of first page

---

### 3. Image Preprocessing

**Purpose**: Prepare page images for optimal OCR results

**What It Does**:
- Process each page image to improve quality:
  - **Deskew**: Straighten tilted scans
  - **Color correction**: Remove yellowing, improve contrast
  - **Noise reduction**: Remove speckles and artifacts
  - **Border detection**: Detect and crop margins
- Store preprocessed images
- Mark pages as "ready for layout detection"
- Notify when processing complete

**Why It Matters**:
- OCR works better on clean, straight images
- Better contrast improves text detection
- Removes distracting background noise

**Processing Flow**:
```
For each page:
  Detect skew angle → Rotate to straighten
    ↓
  Analyze colors → Adjust contrast, remove yellowing
    ↓
  Identify noise → Apply denoising filters
    ↓
  Detect borders → Crop to content area
    ↓
  Save preprocessed image
```

**User Interactions**:
- View preprocessing progress (X of Y pages)
- Preview before/after preprocessing
- Adjust settings if needed (contrast, crop margins)
- Reprocess specific pages

---

### 4. AI Layout Detection

**Purpose**: Automatically detect and classify text regions on each page

**What It Does**:
- Analyze each preprocessed page using cloud AI
- Detect bounding boxes around text regions
- Classify each region:
  - **Content type**: verse, commentary, translation, footnote, heading, etc.
  - **Language**: Sanskrit (Devanagari), Hindi (Devanagari), English (Roman), IAST transliteration
  - **Reading order**: Sequence for correct flow
- Link related elements (footnote references → footnotes)
- Assign confidence scores
- **Create Version 1**: "AI-generated layout"
- Store annotations in repository

**What It Detects**:
- Sanskrit verses (Devanagari, often centered or indented)
- Hindi commentary (Devanagari, paragraph form)
- English text (roman script)
- Transliterations (Sanskrit in IAST/Harvard-Kyoto)
- Footnotes (small text at page bottom)
- Footnote references (superscript numbers in text)
- Headings and subheadings
- Page numbers
- Verse numbers
- Images and figures

**Bounding Box Data**:
Each detected box includes:
- Coordinates (x, y, width, height)
- Content type
- Language
- Reading order (sequence number)
- Confidence score (0-1)
- Links to related boxes (if applicable)

**Requirements**:
- Handle multi-column layouts (2-column, 3-column)
- Distinguish Sanskrit vs Hindi (both use Devanagari)
- Detect IAST transliteration
- Preserve logical reading order
- High confidence thresholds (> 80%)

**User Interactions**:
- View detection progress
- Review detected layout in annotation editor
- Adjust AI-generated boxes if needed

---

### 5. Interactive Annotation Editor

**Purpose**: Visual interface for reviewing and correcting layout annotations

**What It Does**:
- Display page image with overlaid bounding boxes
- **Visual distinction**: AI-generated vs user-edited boxes (different colors/styles)
- Enable editing operations:
  - **Move** boxes (drag to reposition)
  - **Resize** boxes (drag corners/edges)
  - **Create** new boxes (draw on image)
  - **Delete** incorrect boxes
  - **Change labels** (content type, language)
  - **Adjust reading order** (drag sequence numbers)
  - **Split** one box into multiple
  - **Merge** multiple boxes into one
  - **Add notes** ("adjusted to fit verse better")
- **Track every edit as new version**:
  - Version 2: "You moved box-1" + timestamp + note
  - Version 3: "You changed box-2 to translation" + timestamp
- Auto-save changes
- Display version history
- Zoom and pan for precision
- Undo/redo within session

**Version Tracking in Editor**:
- Show edit history panel: "12 versions, last edited 5 min ago"
- Click box → See its history: "Created by AI → Adjusted by you"
- Compare versions: Side-by-side before/after
- Revert to previous version if needed

**Navigation**:
- Previous/next page buttons
- Jump to page number
- Thumbnail grid view
- Filter pages (reviewed, needs attention, low confidence)

**Requirements**:
- Smooth, responsive canvas (< 100ms interaction lag)
- Clear visual distinction (AI vs user edits)
- Easy metadata palette (quick label selection)
- Comprehensive keyboard shortcuts
- Zoom without losing context
- Unlimited undo/redo

**User Interactions**:
1. Navigate to page
2. View AI-detected boxes
3. Select and edit boxes as needed
4. Add notes explaining changes
5. Mark page as "reviewed"
6. View version history at any time

---

### 6. OCR Text Extraction

**Purpose**: Extract text from bounding boxes using OCR

**What It Does**:
- Process selected pages/regions
- Crop image to each bounding box
- Use appropriate OCR engine based on language:
  - Devanagari (Sanskrit/Hindi)
  - Roman script (English)
  - IAST transliteration
- Extract text with confidence scores
- **Store original OCR output** (immutable, never overwritten)
- **Create version**: "OCR extracted text" with confidence scores
- Preserve special characters (diacritics, combining marks)

**Flexible Timing**:
- Can start OCR before finishing all layout annotations
- Can OCR specific pages or page ranges
- Can re-run OCR for specific boxes

**Processing Flow**:
```
For each bounding box (in reading order):
  Crop image to box coordinates
    ↓
  Detect language/script
    ↓
  Select OCR engine (Devanagari / Roman / IAST)
    ↓
  Call cloud OCR API
    ↓
  Extract text + confidence score
    ↓
  Store as new version: "OCR output (85% confidence)"
```

**Quality Indicators**:
- Confidence score per box (0-100%)
- Visual highlighting (red/yellow/green based on confidence)
- Flag low-confidence text for review

**User Interactions**:
- Select pages to OCR
- View OCR progress
- See confidence scores
- Review and correct low-confidence text

---

### 7. Text Correction Interface

**Purpose**: Review and correct OCR output

**What It Does**:
- Display OCR text alongside image snippet
- Enable text editing:
  - Rich text editor (supports Devanagari, IAST, English)
  - Special character input
  - Spell checking (Sanskrit/Hindi dictionaries)
- **Track corrections as new versions**:
  - Version 4: Original OCR (85% confidence)
  - Version 5: "You corrected word 3" + timestamp + note
- Show before/after comparison
- Mark text as "verified" when confident
- Preserve original OCR output (never overwritten)

**Version Chain Example**:
```
Box-1 Text History:
  Version 1: [AI detected box]
  Version 2: [You adjusted box position]
  Version 3: [OCR extracted text] "धर्मक्षैत्रे" (85% confidence)
  Version 4: [You corrected text] "धर्मक्षेत्रे"
              Note: "OCR misread the vowel mark"
```

**UI Layout**:
```
┌──────────────────────┬──────────────────────┐
│  Image Snippet       │  Text Editor         │
│  (Bounding Box)      │                      │
│                      │  [Editable Text]     │
│  [Zoom controls]     │                      │
│                      │  OCR: 85% confidence │
│                      │  [Mark Verified]     │
│                      │                      │
│  Version History:    │  Note: [Optional]    │
│  • OCR (v3)          │                      │
│  • Corrected (v4)    │  [Compare versions]  │
└──────────────────────┴──────────────────────┘
```

**Requirements**:
- Side-by-side image and text
- Support Devanagari input (on-screen keyboard or transliteration)
- Support IAST with diacritics
- Confidence indicators
- Version comparison (show diff)
- Comment capability (explain corrections)
- Batch operations (apply same correction to multiple instances)

**User Interactions**:
- Navigate through boxes
- Review OCR text vs image
- Edit text where incorrect
- Add notes explaining corrections
- Mark as verified
- View correction history

---

### 8. Export & Publishing

**Purpose**: Generate structured markdown from annotations and text

**What It Does**:
- Compile all pages into single markdown file
- Apply Quarto-compatible formatting:
  - YAML frontmatter (book metadata)
  - Language tags for each section
  - Semantic classes (verse, commentary, translation)
  - Cross-references (footnote links)
  - Citation-ready format
- **Include attribution metadata**:
  - Contributors (you + AI assistance)
  - Edit counts and timestamps
  - Version information
- Support multiple export options:
  - Complete book
  - Chapter/section only
  - Parallel text layout (original + translation side-by-side)
- Generate preview
- Store final output in repository

**Output Format** (Quarto Markdown):
```markdown
---
title: "Bhagavad Gita"
author: "Vyasa"
digitized_by: "Your Name"
languages: [sanskrit, english]
digitization_date: "2025-01-15"
total_pages: 700
ocr_engine: "Google Document AI"
---

# Chapter 1: Arjuna Vishada Yoga

## Verse 1 {#bg-1-1}

::: {.verse lang="sa"}
धृतराष्ट्र उवाच |
धर्मक्षेत्रे कुरुक्षेत्रे समवेता युयुत्सवः |
:::

::: {.translation lang="en"}
Dhritarashtra said:
O Sanjaya, what did my sons and the sons of Pandu do
when they gathered on the holy field of Kurukshetra,
eager to fight?
:::

::: {.commentary lang="en" author="Shankaracharya"}
The word 'dharma-kshetra' (field of dharma) indicates...
:::

<!-- Page 1 | OCR: 95% | Verified: 2025-01-15 -->
```

**Export Options**:
- Full book or selected chapters
- Include/exclude low-confidence text
- Parallel text layouts
- Different citation formats
- HTML preview

**User Interactions**:
- Click "Export Project"
- Configure export options
- Preview generated markdown
- Download file
- View export in repository

---

### 9. Cost Management & Budget Control

**Purpose**: Track API usage costs and enforce budgets

**What It Does**:
- **Pre-operation cost estimates**:
  - "Processing 700 pages will cost ~$1.75"
  - Show breakdown (preprocessing, layout, OCR)
  - Require confirmation before proceeding
- **Real-time cost tracking**:
  - Track every API call and cost
  - Update dashboard continuously
  - Show: "$67 of $100 used (67%)"
- **Budget enforcement**:
  - Set monthly budget cap (default $100)
  - Alert at thresholds (50%, 80%, 100%)
  - Hard stop at 100% (no overages)
  - Allow in-flight operations to complete
- **Cost spike detection**:
  - Baseline: Average cost per time window
  - Alert if exceeds 5x baseline
  - Show details: project, operation, cost
- **Cost reporting**:
  - Daily/weekly/monthly summaries
  - Cost breakdown by operation type
  - Export cost logs

**Budget Workflow**:
```
1. Set monthly budget: $100
   ↓
2. Start expensive operation (OCR 700 pages)
   ↓
3. System shows: "This will cost ~$1.75. Continue?"
   ↓
4. You approve
   ↓
5. Processing runs, costs tracked in real-time
   ↓
6. Dashboard updates: "$68.75 of $100 (69%)"
   ↓
7. If reaches $80: Alert "80% budget used"
   ↓
8. If reaches $100: Halt new operations
```

**Budget Override**:
- You can increase budget anytime
- Requires explicit action
- Logged for review

**Cost Dashboard**:
```
┌─────────────────────────────────────────┐
│ Monthly Budget Status                   │
│                                         │
│ $67.00 / $100.00 (67%)                 │
│ [▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░] Resets: Jan 31   │
│                                         │
│ This Month:                             │
│ • OCR: $45.00 (300 pages)              │
│ • Layout: $22.00 (300 pages)           │
│                                         │
│ Recent Activity:                        │
│ • Jan 15: OCR 50 pages ($0.75)         │
│ • Jan 14: Layout 100 pages ($1.00)     │
└─────────────────────────────────────────┘
```

**User Interactions**:
- View budget status on dashboard
- Set/adjust monthly budget
- Review cost history
- Approve cost estimates before operations
- Increase budget if needed

---

## Supporting Infrastructure

### A. Version Control & Storage

**Purpose**: Store all project data with full version history

**What It Does**:
- Create repository for each project
- Store all files:
  - Project metadata (JSON)
  - Page annotations (JSON with version history)
  - Images (original and preprocessed)
  - OCR output (markdown)
  - Cost logs (JSONL)
- Commit every change to version control
- Maintain full git history
- Enable rollback to any previous state

**Repository Structure**:
```
book-{id}-{slug}/
  metadata.json              # Project metadata
  pages/
    page-001.json            # Annotations + version history
    page-002.json
  images/
    original/
      page-001.png
    preprocessed/
      page-001.png
  ocr-output/
    book.md                  # Final exported markdown
  logs/
    costs.jsonl              # Cost tracking logs
```

**Version History Per Page**:
Each `page-NNN.json` contains:
- Current state (latest bounding boxes, text)
- Full version history (all edits, timestamps, notes)
- Attribution (who made each change)
- Git commit SHAs (links to repository commits)

**Git Integration**:
- Every save creates git commit
- Commit messages include change summary
- Full git history available
- Can use git commands to review history

**Why Plain Text Storage**:
- Human-readable (can open JSON files directly)
- Git-friendly (meaningful diffs)
- Version control works naturally
- Easy to backup and export

---

### B. Notification System

**Purpose**: Keep you informed of important events

**What It Does**:
- Display in-app notifications
- Alert on:
  - **Processing complete**: "Page preprocessing finished (700 pages)"
  - **OCR complete**: "OCR extraction done (350 boxes)"
  - **Budget alerts**: "80% of monthly budget used"
  - **Errors**: "Failed to process page 45 (timeout)"
  - **Export ready**: "Markdown export complete"
- Notification categories:
  - Success (green): Operations completed
  - Warning (yellow): Budget alerts, low confidence
  - Error (red): Failures, issues
  - Info (blue): General updates
- Mark as read/unread
- Notification history

**Notification Panel**:
```
┌────────────────────────────────────────┐
│ Notifications                     [×]  │
├────────────────────────────────────────┤
│ ✓ OCR complete for pages 1-50          │
│   5 minutes ago                        │
│                                        │
│ ⚠ Budget at 80% ($80/$100)            │
│   1 hour ago                           │
│                                        │
│ ✗ Page 45 preprocessing failed         │
│   2 hours ago  [Retry]                 │
└────────────────────────────────────────┘
```

---

### C. Background Job Queue

**Purpose**: Manage long-running processing tasks

**What It Does**:
- Queue processing jobs:
  - Image preprocessing (per page)
  - Layout detection (per page)
  - OCR extraction (per box)
  - Export generation (per project)
- Execute jobs in background (non-blocking)
- Track job status:
  - Queued
  - Processing
  - Complete
  - Failed
- Handle failures:
  - Auto-retry with backoff (3 attempts)
  - Queue failed jobs for manual review
  - Preserve failed job details
- Monitor job health:
  - Detect stuck jobs (timeout > 2 hours)
  - Show job progress
  - Estimate completion time

**Job Status UI**:
```
┌────────────────────────────────────────┐
│ Background Jobs                        │
├────────────────────────────────────────┤
│ ⏳ OCR Processing: Pages 1-50          │
│    Progress: 35/50 (70%)               │
│    ETA: 5 minutes                      │
│                                        │
│ ⏳ Image Preprocessing: Pages 100-200  │
│    Progress: 120/100 (120%)            │
│    ETA: 2 minutes                      │
│                                        │
│ ✓ Layout Detection: Complete           │
│   700 pages processed                  │
└────────────────────────────────────────┘
```

---

## Complete Workflow Example

**Scenario**: You digitize a 700-page book

```
1. CREATE PROJECT
   • Enter book metadata
   • Upload PDF file
   → Project created

2. AUTOMATIC PROCESSING
   • PDF split into 700 page images
   • Each page preprocessed (deskew, color correction)
   • Progress: "Preprocessing... 350/700"
   → Notification: "Preprocessing complete"

3. AI LAYOUT DETECTION
   • System analyzes each page
   • Detects bounding boxes (verses, commentary, etc.)
   • Progress: "Detecting layout... 500/700"
   → Version 1 created for each page: "AI-generated layout"
   → Notification: "Layout detection complete"

4. MANUAL ANNOTATION REVIEW
   • You review page 1
   • Adjust 3 bounding boxes (move, resize)
   • Add notes: "Adjusted verse 2 to fit better"
   → Version 2 created: "You edited page 1"
   • You mark page as "reviewed"
   • Repeat for all 700 pages (or spot-check key pages)

5. OCR TEXT EXTRACTION
   • You initiate OCR for all pages
   • System shows cost: "$1.05 for 700 pages. Continue?"
   • You approve
   • System processes each bounding box
   • Progress: "OCR... 400/700 pages"
   → Version 3 created for each page: "OCR extracted text"
   → Notification: "OCR complete (avg 92% confidence)"

6. TEXT CORRECTION
   • You review OCR text
   • Find 15 boxes with errors (low confidence)
   • Correct each error:
     - "धर्मक्षैत्रे" → "धर्मक्षेत्रे"
     - Add note: "OCR misread vowel mark"
   → Version 4 created: "You corrected text"
   • Mark as "verified"

7. EXPORT TO MARKDOWN
   • You click "Export Project"
   • System compiles 700 pages into book.md
   • Includes:
     - All text (corrected OCR)
     - Proper structure (verses, commentary)
     - Language tags
     - Attribution metadata
   → Download book.md
   → Ready to publish with Quarto!

RESULT: Fully digitized book with complete version history
```

---

## Version Tracking: The Core Feature

**Why It's Critical**:
- Working with historical texts requires absolute accuracy
- Every correction must be attributable and reviewable
- Scholarly work needs provenance (who said what, when)
- Mistakes can be caught and fixed retroactively

**What Gets Tracked**:
1. **AI-generated layout** (version 1):
   - Bounding box coordinates
   - Content type classifications
   - Confidence scores
   - Timestamp

2. **Your annotation edits** (version 2+):
   - Box movements (before/after coordinates)
   - Box resizes (before/after dimensions)
   - Label changes (before/after types)
   - New boxes created
   - Boxes deleted
   - Reading order changes
   - Your notes explaining changes

3. **OCR extraction** (version N):
   - Original OCR text
   - Confidence scores
   - Timestamp

4. **Text corrections** (version N+1):
   - Original OCR text
   - Your corrected text
   - Your notes explaining correction
   - Timestamp

**Version History UI**:
- **Timeline view**: Chronological list of all versions
- **Diff view**: Side-by-side comparison of any two versions
- **Attribution**: "Created by AI, adjusted by You on Jan 15"
- **Revert**: Restore any previous version (creates new version, never deletes)
- **Search**: Find when specific change was made
- **Export**: Download full edit history as report

**Git Integration**:
- Each version has corresponding git commit
- Commit messages include change summary
- Can use standard git tools (log, diff, show)
- Full audit trail preserved forever

---

## Data Flow Summary

```
PDF Upload
  ↓
Split into Pages
  ↓
Image Preprocessing
  ↓
AI Layout Detection → Version 1 (AI-generated)
  ↓
Manual Review → Version 2+ (Your edits)
  ↓
OCR Extraction → Version N (OCR text)
  ↓
Text Correction → Version N+1 (Corrected text)
  ↓
Export to Markdown
  ↓
Final Book with Full Attribution
```

**All stored in repository with version control**

---

## Module Dependencies

```
PDF Upload
  ↓
Image Preprocessing
  ↓
AI Layout Detection
  ↓
┌─────────────────────────┐
│  Annotation Editor      │ ← Core user interaction
│  (Version Tracking)     │
└─────────────────────────┘
  ↓
OCR Extraction
  ↓
┌─────────────────────────┐
│  Text Correction        │ ← Core user interaction
│  (Version Tracking)     │
└─────────────────────────┘
  ↓
Export & Publishing
```

**Supporting all modules**:
- Version Control & Storage (every module stores data)
- Cost Management (tracks OCR and AI operations)
- Notification System (all modules can notify)

---

## What v2 Will Add

**v2: Multi-User Collaboration**

Additional modules:
- User Management (authentication, roles)
- Collaboration Workflows (concurrent editing, conflicts)
- Admin Dashboard (monitor multiple users)
- Per-User Budgets (cost allocation)
- Activity Monitoring (who's editing what)

See **REQUIREMENTS-v2.md** for details.

---

## Summary

**v1 Core Modules** (9):
1. Project Management
2. PDF Upload & Processing
3. Image Preprocessing
4. AI Layout Detection
5. **Annotation Editor** (with version tracking) ⭐
6. OCR Text Extraction
7. **Text Correction** (with version tracking) ⭐
8. Export & Publishing
9. Cost Management

**v1 Infrastructure** (3):
- Version Control & Storage
- Notification System
- Background Job Queue

**Key Principle**: **Version tracking is central to v1** - every module contributes to comprehensive edit history.

---

## Next Steps

1. **Define data schemas** (JSON structure for all files)
2. **Design version tracking UI** (history viewer, diff comparison)
3. **Plan annotation editor** (canvas for bounding boxes)
4. **Design text correction interface** (side-by-side editing)
5. **Specify export format** (Quarto markdown templates)
