# PageSage v1 - Data Schemas

**Status:** Complete specification
**Last Updated:** 2025-12-05

This document defines all data structures used in PageSage v1, including JSON schemas and TypeScript interfaces.

---

## Overview

PageSage uses plain-text JSON formats for all structured data to ensure:

- Git-friendly diffs
- Human readability
- Version control compatibility
- Cross-platform portability

**Storage Locations:**

- **GitHub repositories**: Annotations, metadata, version history, cost logs
- **Google Drive**: Images (PDFs, page images)

---

## Schema Index

1. [Project Metadata](#1-project-metadata) - `metadata.json`
2. [User Profile](#2-user-profile) - Session/auth data
3. [Page Annotations](#3-page-annotations) - `pages/page-NNN.json`
4. [Bounding Box](#4-bounding-box) - Annotation structure
5. [Version History Entry](#5-version-history-entry) - Edit tracking
6. [Cost Tracking Log](#6-cost-tracking-log) - `costs.jsonl`
7. [OCR Result](#7-ocr-result) - OCR output
8. [Image Metadata](#8-image-metadata) - Page image properties
9. [Export Configuration](#9-export-configuration) - Export settings

---

## 1. Project Metadata

**Location:** `metadata.json` (root of each project repository)

**Purpose:** Store book information and project state

### TypeScript Interface

```typescript
interface ProjectMetadata {
  // Core Identity
  projectId: string; // Unique ID (e.g., "proj_abc123")
  slug: string; // URL-friendly name (e.g., "bhagavad-gita")

  // Book Information
  title: string; // Book title
  subtitle?: string; // Optional subtitle
  authors: string[]; // List of authors
  publisher?: string; // Publisher name
  publicationYear?: number; // Year of publication
  edition?: string; // Edition (e.g., "2nd Edition")
  languages: Language[]; // Primary languages in book
  category?: string; // Category (e.g., "Vedic Literature")

  // Source Document
  sourceDocument: {
    driveFileId: string; // Google Drive ID for original PDF
    fileName: string; // Original filename
    fileSizeBytes: number; // File size
    sha256: string; // Checksum for integrity
    uploadedAt: string; // ISO 8601 timestamp
  };

  // Processing Status
  status: ProjectStatus; // Current project state
  pages: {
    total: number; // Total page count
    processed: number; // Completed preprocessing
    annotated: number; // Layout annotations complete
    reviewed: number; // Human review complete
    ocred: number; // OCR complete
    corrected: number; // Text corrections complete
  };

  // Version Control
  repositoryUrl: string; // GitHub repo URL
  createdAt: string; // ISO 8601 timestamp
  updatedAt: string; // ISO 8601 timestamp
  createdBy: UserAttribution; // Who created project

  // Cost Tracking
  costs: {
    totalSpent: number; // Total USD spent on this project
    breakdown: {
      preprocessing: number;
      layoutDetection: number;
      ocr: number;
      other: number;
    };
    lastUpdated: string; // ISO 8601 timestamp
  };

  // Export History
  exports: ExportRecord[]; // List of generated exports

  // Settings
  settings: {
    autoSaveInterval: number; // Seconds (default: 30)
    ocrConfidenceThreshold: number; // 0-1 (default: 0.8)
    defaultExportFormat: ExportFormat;
  };

  // Box Index (for efficient cross-page reference resolution)
  boxIndex: {
    [boxId: string]: {
      pageId: string;
      pageNumber: number;
      contentType: ContentType; // For quick filtering
    };
  };
}

type ProjectStatus =
  | "created" // Initial state
  | "uploading" // PDF upload in progress
  | "preprocessing" // Image processing
  | "detecting-layout" // AI layout detection
  | "annotating" // Manual annotation review
  | "ocr-processing" // OCR extraction
  | "correcting" // Text correction
  | "ready-to-export" // All processing complete
  | "exported" // Export generated
  | "archived"; // Project archived

type Language = "sanskrit" | "hindi" | "english" | "iast"; // IAST transliteration

interface UserAttribution {
  name: string; // Display name
  githubUsername: string; // GitHub username
  githubId: number; // GitHub user ID
  avatarUrl?: string; // Profile picture URL
}

interface ExportRecord {
  exportId: string;
  format: ExportFormat;
  generatedAt: string; // ISO 8601 timestamp
  filePath: string; // Path in repository
  fileSize: number; // Bytes
  sha256: string; // Checksum
  includedPages: number[]; // Which pages exported
  settings: ExportConfiguration;
}

type ExportFormat = "markdown-quarto" | "hocr" | "plain-text" | "json";
```

### Example

```json
{
  "projectId": "proj_bg2025",
  "slug": "bhagavad-gita-commentary",
  "title": "Bhagavad Gita with Commentary",
  "subtitle": "Sanskrit Text with Hindi and English Translation",
  "authors": ["Vyasa", "Shankaracharya (commentary)"],
  "publisher": "Gita Press",
  "publicationYear": 1985,
  "edition": "15th Edition",
  "languages": ["sanskrit", "hindi", "english"],
  "category": "Vedic Literature",
  "sourceDocument": {
    "driveFileId": "1a2b3c4d5e6f7g8h9i0j",
    "fileName": "bhagavad-gita-1985.pdf",
    "fileSizeBytes": 52428800,
    "sha256": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    "uploadedAt": "2025-01-15T10:00:00Z"
  },
  "status": "annotating",
  "pages": {
    "total": 700,
    "processed": 700,
    "annotated": 350,
    "reviewed": 200,
    "ocred": 0,
    "corrected": 0
  },
  "repositoryUrl": "https://github.com/pagesage-books/bhagavad-gita-commentary",
  "createdAt": "2025-01-15T10:00:00Z",
  "updatedAt": "2025-01-20T15:30:00Z",
  "createdBy": {
    "name": "Your Name",
    "githubUsername": "yourusername",
    "githubId": 123456,
    "avatarUrl": "https://avatars.githubusercontent.com/u/123456"
  },
  "costs": {
    "totalSpent": 3.45,
    "breakdown": {
      "preprocessing": 0.7,
      "layoutDetection": 1.4,
      "ocr": 1.35,
      "other": 0.0
    },
    "lastUpdated": "2025-01-20T15:30:00Z"
  },
  "exports": [],
  "settings": {
    "autoSaveInterval": 30,
    "ocrConfidenceThreshold": 0.8,
    "defaultExportFormat": "markdown-quarto"
  }
}
```

---

## 2. User Profile

**Location:** Session storage (not committed to git)

**Purpose:** Store authenticated user session data

### TypeScript Interface

```typescript
interface UserProfile {
  // Identity
  userId: string; // Internal user ID (e.g., "user_abc123")
  githubId: number; // GitHub user ID
  githubUsername: string; // GitHub username
  name: string; // Display name
  email: string; // Primary email
  avatarUrl?: string; // Profile picture URL

  // Role & Permissions (v1: always admin)
  role: UserRole; // v1: only 'admin'
  isAdmin: boolean; // v1: always true

  // Session
  sessionToken: string; // Secure session token (httpOnly cookie)
  sessionCreatedAt: string; // ISO 8601 timestamp
  sessionExpiresAt: string; // ISO 8601 timestamp (7 days)
  lastActivityAt: string; // ISO 8601 timestamp

  // OAuth
  githubAccessToken?: string; // GitHub OAuth token (encrypted)
  githubScopes: string[]; // Granted OAuth scopes

  // Preferences
  preferences: {
    theme: "light" | "dark";
    timezone: string; // IANA timezone (e.g., "America/New_York")
    dateFormat: string; // Preferred date format
  };

  // Metadata
  createdAt: string; // ISO 8601 timestamp (first login)
  updatedAt: string; // ISO 8601 timestamp
}

type UserRole =
  | "admin" // v1: Full access
  | "editor" // v4: Can edit annotations
  | "reviewer" // v4: Can review/approve
  | "viewer"; // v4: Read-only

interface UserSession {
  sessionId: string;
  userId: string;
  createdAt: string;
  expiresAt: string;
  ipAddress?: string;
  userAgent?: string;
}
```

### Example

```json
{
  "userId": "user_abc123",
  "githubId": 123456,
  "githubUsername": "yourusername",
  "name": "Your Name",
  "email": "you@example.com",
  "avatarUrl": "https://avatars.githubusercontent.com/u/123456",
  "role": "admin",
  "isAdmin": true,
  "sessionToken": "[encrypted]",
  "sessionCreatedAt": "2025-01-15T10:00:00Z",
  "sessionExpiresAt": "2025-01-22T10:00:00Z",
  "lastActivityAt": "2025-01-15T14:30:00Z",
  "githubScopes": ["repo", "user:email"],
  "preferences": {
    "theme": "light",
    "timezone": "America/New_York",
    "dateFormat": "YYYY-MM-DD"
  },
  "createdAt": "2025-01-15T10:00:00Z",
  "updatedAt": "2025-01-15T14:30:00Z"
}
```

---

## 3. Page Annotations

**Location:** `pages/page-NNN.json` (one file per page in project repository)

**Purpose:** Store bounding boxes, OCR text, and version history for each page

### TypeScript Interface

```typescript
interface PageAnnotations {
  // Page Identity
  pageId: string; // Unique ID (e.g., "page-001")
  pageNumber: number; // 1-based page number
  projectId: string; // Parent project ID

  // Image Reference (Google Drive)
  image: ImageMetadata;

  // Current State
  currentState: {
    boundingBoxes: BoundingBox[];
    reviewStatus: ReviewStatus;
    ocrStatus: OcrStatus;
    confidence: number; // Overall confidence (0-1)
    lastModifiedAt: string; // ISO 8601 timestamp
    lastModifiedBy: UserAttribution;
  };

  // Version Tracking (CORE FEATURE)
  versionHistory: VersionHistoryEntry[];

  // Metadata
  createdAt: string; // ISO 8601 timestamp
  updatedAt: string; // ISO 8601 timestamp
}

type ReviewStatus =
  | "pending" // Not yet reviewed
  | "in-progress" // Currently being reviewed
  | "reviewed" // Human review complete
  | "needs-rework" // Issues found, needs re-review
  | "approved"; // Final approval

type OcrStatus =
  | "not-started"
  | "queued"
  | "processing"
  | "completed"
  | "failed"
  | "correcting"; // Text correction in progress
```

### Example (with Multiple Inline Footnotes)

```json
{
  "pageId": "page-001",
  "pageNumber": 1,
  "projectId": "proj_bg2025",
  "image": {
    "driveFileId": "1x2y3z4a5b6c7d8e9f0g",
    "fileName": "page-001.png",
    "width": 2480,
    "height": 3508,
    "dpi": 300,
    "format": "png",
    "fileSizeBytes": 2097152,
    "sha256": "a1b2c3d4e5f6...",
    "uploadedAt": "2025-01-15T10:05:00Z"
  },
  "currentState": {
    "boundingBoxes": [
      {
        "boxId": "box-001",
        "coordinates": {
          "x": 100,
          "y": 200,
          "width": 800,
          "height": 120
        },
        "contentType": "verse",
        "language": "sanskrit",
        "readingOrder": 1,
        "confidence": 0.95,
        "text": {
          "ocr": "धर्मक्षेत्रे कुरुक्षेत्रे समवेता युयुत्सवः",
          "corrected": "धर्मक्षेत्रे कुरुक्षेत्रे समवेता युयुत्सवः",
          "ocrConfidence": 0.92,
          "isCorrected": false
        },
        "linkedBoxes": [],
        "inlineReferences": [],
        "notes": "",
        "createdBy": "ai",
        "lastModifiedBy": {
          "name": "Your Name",
          "githubUsername": "yourusername",
          "githubId": 123456
        },
        "lastModifiedAt": "2025-01-15T10:15:00Z"
      },
      {
        "boxId": "box-002",
        "coordinates": {
          "x": 100,
          "y": 350,
          "width": 800,
          "height": 80
        },
        "contentType": "commentary",
        "language": "english",
        "readingOrder": 2,
        "confidence": 0.88,
        "text": {
          "ocr": "This verse appears in the Mahābhārata and has been interpreted by multiple scholars.",
          "corrected": "This verse appears in the Mahābhārata and has been interpreted by multiple scholars."
        },
        "linkedBoxes": [
          "box-footnote-001",
          "box-footnote-002",
          "box-footnote-003"
        ],
        "inlineReferences": [
          {
            "referenceId": "ref-001",
            "type": "footnote",
            "position": { "charOffset": 24, "length": 1 },
            "targetBoxId": "box-footnote-001",
            "displayText": "¹",
            "sequenceInText": 1
          },
          {
            "referenceId": "ref-002",
            "type": "footnote",
            "position": { "charOffset": 38, "length": 1 },
            "targetBoxId": "box-footnote-002",
            "displayText": "²",
            "sequenceInText": 2
          },
          {
            "referenceId": "ref-003",
            "type": "footnote",
            "position": { "charOffset": 84, "length": 1 },
            "targetBoxId": "box-footnote-003",
            "displayText": "³",
            "sequenceInText": 3
          }
        ],
        "notes": "Contains three footnote references",
        "createdBy": "ai",
        "lastModifiedBy": {
          "name": "Your Name",
          "githubUsername": "yourusername",
          "githubId": 123456
        },
        "lastModifiedAt": "2025-01-15T10:18:00Z"
      }
    ],
    "reviewStatus": "reviewed",
    "ocrStatus": "completed",
    "confidence": 0.93,
    "lastModifiedAt": "2025-01-15T10:20:00Z",
    "lastModifiedBy": {
      "name": "Your Name",
      "githubUsername": "yourusername",
      "githubId": 123456
    }
  },
  "versionHistory": [
    {
      "version": 1,
      "timestamp": "2025-01-15T10:10:00Z",
      "editedBy": {
        "name": "AI System",
        "githubUsername": "pagesage-ai",
        "githubId": 0
      },
      "changeType": "ai_generated",
      "changes": {
        "action": "created",
        "boxId": null,
        "details": "Initial AI layout detection created 12 bounding boxes"
      },
      "commitSha": "abc123def456",
      "note": "AI detected Sanskrit verses, Hindi commentary, and English translation"
    },
    {
      "version": 2,
      "timestamp": "2025-01-15T10:15:00Z",
      "editedBy": {
        "name": "Your Name",
        "githubUsername": "yourusername",
        "githubId": 123456
      },
      "changeType": "manual_edit",
      "changes": {
        "action": "moved",
        "boxId": "box-001",
        "before": { "x": 100, "y": 200 },
        "after": { "x": 105, "y": 198 }
      },
      "commitSha": "def456ghi789",
      "note": "Adjusted box to better fit verse text"
    }
  ],
  "createdAt": "2025-01-15T10:10:00Z",
  "updatedAt": "2025-01-15T10:20:00Z"
}
```

---

## 4. Bounding Box

**Purpose:** Define structure for annotation boxes

### TypeScript Interface

```typescript
interface BoundingBox {
  // Identity
  boxId: string; // Unique ID (e.g., "box-001")

  // Position & Size
  coordinates: BoxCoordinates;

  // Classification
  contentType: ContentType; // What kind of content
  language: Language; // Which language/script
  readingOrder: number; // Sequence for reading (1-based)
  confidence: number; // AI confidence score (0-1)

  // Text Content
  text: TextContent;

  // Relationships
  linkedBoxes: string[]; // IDs of related boxes (e.g., footnote refs)
  parentBox?: string; // Parent box ID (for hierarchical content)

  // Inline References (for footnotes embedded in text)
  inlineReferences?: InlineReference[];

  // Metadata
  notes: string; // User annotations
  createdBy: "ai" | "user"; // Origin
  lastModifiedBy: UserAttribution;
  lastModifiedAt: string; // ISO 8601 timestamp
}

interface InlineReference {
  referenceId: string; // Unique ID for this reference
  type: "footnote" | "verse-number" | "citation";
  position: {
    charOffset: number; // Character offset in text (0-based, relative to corrected text)
    length: number; // Length of reference text
  };
  targetBoxId: string; // ID of box being referenced (can be on any page)
  displayText: string; // The reference marker (e.g., "1", "2.11", "[5]")
  sequenceInText: number; // Order of appearance in text (1-based)

  // Optional: Cached location info for efficient lookup (denormalized)
  targetPageId?: string; // Page containing target box (for cross-page refs)
  targetPageNumber?: number; // User-friendly page number
}

interface BoxCoordinates {
  x: number; // Left edge (pixels from top-left)
  y: number; // Top edge (pixels from top-left)
  width: number; // Box width (pixels)
  height: number; // Box height (pixels)
  rotation?: number; // Rotation in degrees (0-360)
}

type ContentType =
  | "verse" // Sanskrit verse
  | "commentary" // Commentary text
  | "translation" // Translation
  | "transliteration" // IAST transliteration
  | "footnote" // Footnote text
  | "footnote-reference" // Footnote marker/number
  | "heading" // Chapter/section heading
  | "subheading" // Subsection heading
  | "page-number" // Page number
  | "verse-number" // Verse number
  | "image" // Embedded image
  | "table" // Table content
  | "caption" // Image/table caption
  | "other"; // Uncategorized

interface TextContent {
  ocr: string; // Original OCR output (immutable)
  corrected: string; // Human-corrected text
  ocrConfidence: number; // OCR confidence (0-1)
  isCorrected: boolean; // Has human edited text?
  correctionHistory: TextCorrection[];
}

interface TextCorrection {
  version: number;
  timestamp: string; // ISO 8601 timestamp
  editedBy: UserAttribution;
  before: string;
  after: string;
  note: string;
}
```

### Coordinate System

**Origin:** Top-left corner of image
**Units:** Pixels
**Precision:** Integer pixels (no sub-pixel precision needed)
**Validation:**

- `x >= 0 && x < imageWidth`
- `y >= 0 && y < imageHeight`
- `width > 0 && x + width <= imageWidth`
- `height > 0 && y + height <= imageHeight`

### Footnote Reference Handling

PageSage supports **two approaches** for capturing footnote references:

#### Approach A: Inline References (Recommended)

Footnote markers embedded in text are captured as **inline references** within the parent text box.

##### Example 1: Single Footnote

```json
{
  "boxId": "box-001",
  "contentType": "commentary",
  "text": {
    "ocr": "The Gītā states this principle clearly in Chapter 2.",
    "corrected": "The Gītā states this principle clearly in Chapter 2."
  },
  "inlineReferences": [
    {
      "referenceId": "ref-001",
      "type": "footnote",
      "position": {
        "charOffset": 32,
        "length": 1
      },
      "targetBoxId": "box-footnote-001",
      "displayText": "¹",
      "sequenceInText": 1
    }
  ],
  "linkedBoxes": ["box-footnote-001"]
}
```

**Visual representation:**

```
The Gītā states this principle¹ clearly in Chapter 2.
                              ^
                              charOffset: 32
```

##### Example 2: Multiple Footnotes in Same Sentence

```json
{
  "boxId": "box-002",
  "contentType": "commentary",
  "text": {
    "ocr": "The first principle appears in Chapter 2, followed by the second in Chapter 3.",
    "corrected": "The first principle appears in Chapter 2, followed by the second in Chapter 3."
  },
  "inlineReferences": [
    {
      "referenceId": "ref-002",
      "type": "footnote",
      "position": {
        "charOffset": 18,
        "length": 1
      },
      "targetBoxId": "box-footnote-002",
      "displayText": "²",
      "sequenceInText": 1
    },
    {
      "referenceId": "ref-003",
      "type": "footnote",
      "position": {
        "charOffset": 41,
        "length": 1
      },
      "targetBoxId": "box-footnote-003",
      "displayText": "³",
      "sequenceInText": 2
    },
    {
      "referenceId": "ref-004",
      "type": "footnote",
      "position": {
        "charOffset": 72,
        "length": 1
      },
      "targetBoxId": "box-footnote-004",
      "displayText": "⁴",
      "sequenceInText": 3
    }
  ],
  "linkedBoxes": ["box-footnote-002", "box-footnote-003", "box-footnote-004"]
}
```

**Visual representation:**

```
The first principle² appears in Chapter 2³, followed by the second⁴ in Chapter 3.
                  ^                     ^                            ^
                  charOffset: 18        charOffset: 41              charOffset: 72
```

##### Example 3: Adjacent Footnotes (Multiple Sources)

```json
{
  "boxId": "box-003",
  "contentType": "verse",
  "text": {
    "ocr": "धर्मक्षेत्रे कुरुक्षेत्रे",
    "corrected": "धर्मक्षेत्रे कुरुक्षेत्रे"
  },
  "inlineReferences": [
    {
      "referenceId": "ref-005",
      "type": "footnote",
      "position": {
        "charOffset": 25,
        "length": 1
      },
      "targetBoxId": "box-footnote-005",
      "displayText": "¹",
      "sequenceInText": 1
    },
    {
      "referenceId": "ref-006",
      "type": "footnote",
      "position": {
        "charOffset": 26,
        "length": 1
      },
      "targetBoxId": "box-footnote-006",
      "displayText": "²",
      "sequenceInText": 2
    },
    {
      "referenceId": "ref-007",
      "type": "footnote",
      "position": {
        "charOffset": 27,
        "length": 1
      },
      "targetBoxId": "box-footnote-007",
      "displayText": "³",
      "sequenceInText": 3
    }
  ],
  "linkedBoxes": ["box-footnote-005", "box-footnote-006", "box-footnote-007"]
}
```

**Visual representation:**

```
धर्मक्षेत्रे कुरुक्षेत्रे¹²³
                       ^^^
                       Adjacent footnotes at charOffsets: 25, 26, 27
```

##### Example 4: Bracketed References

```json
{
  "boxId": "box-004",
  "contentType": "translation",
  "text": {
    "ocr": "As stated in the Mahābhārata.",
    "corrected": "As stated in the Mahābhārata."
  },
  "inlineReferences": [
    {
      "referenceId": "ref-008",
      "type": "citation",
      "position": {
        "charOffset": 18,
        "length": 3
      },
      "targetBoxId": "box-footnote-008",
      "displayText": "[5]",
      "sequenceInText": 1
    }
  ],
  "linkedBoxes": ["box-footnote-008"]
}
```

**Visual representation:**

```
As stated in the Mahābhārata[5].
                             ^^^
                             charOffset: 18, length: 3
```

##### Rules for Multiple Inline References

1. **Ordering**: `inlineReferences` array MUST be ordered by `charOffset` (ascending)
2. **Sequence**: `sequenceInText` reflects reading order (1, 2, 3, ...)
3. **Character offsets**: Always relative to the **corrected text** field
4. **Non-overlapping**: Reference positions must not overlap (validated)
5. **LinkedBoxes**: Must include all target boxes referenced in `inlineReferences`

**When to use:**

- Superscript numbers inline with text (e.g., "principle¹ clearly")
- Bracketed references (e.g., "states [1] that")
- Adjacent multiple footnotes (e.g., "verse¹²³")
- Maintains natural text flow
- Easier to export to formats that support inline footnotes

#### Approach B: Separate Bounding Boxes

Standalone footnote markers get their own bounding box:

```json
{
  "boxId": "box-ref-001",
  "contentType": "footnote-reference",
  "coordinates": { "x": 456, "y": 210, "width": 12, "height": 16 },
  "text": { "ocr": "1", "corrected": "1" },
  "linkedBoxes": ["box-footnote-001"]
}
```

**When to use:**

- Visually distinct reference markers (verse numbers)
- References positioned separately from main text
- References that span multiple lines
- When spatial positioning is semantically important

**Note:** AI layout detection will determine which approach to use based on visual analysis. The annotation editor allows users to convert between approaches during review.

### Validation Rules for Inline References

All implementations MUST validate:

```typescript
// Validation pseudocode
function validateInlineReferences(box: BoundingBox): ValidationResult {
  const refs = box.inlineReferences || [];
  const text = box.text.corrected;

  // 1. Ordering: Must be sorted by charOffset
  for (let i = 1; i < refs.length; i++) {
    if (refs[i].position.charOffset <= refs[i - 1].position.charOffset) {
      return error("References must be ordered by charOffset");
    }
  }

  // 2. Non-overlapping: Check for overlaps
  for (let i = 1; i < refs.length; i++) {
    const prevEnd =
      refs[i - 1].position.charOffset + refs[i - 1].position.length;
    if (refs[i].position.charOffset < prevEnd) {
      return error("Reference positions cannot overlap");
    }
  }

  // 3. Within bounds: Check character offsets are valid
  for (const ref of refs) {
    const end = ref.position.charOffset + ref.position.length;
    if (end > text.length) {
      return error(`Reference ${ref.referenceId} exceeds text length`);
    }
  }

  // 4. Sequence numbering: Must be sequential 1, 2, 3...
  for (let i = 0; i < refs.length; i++) {
    if (refs[i].sequenceInText !== i + 1) {
      return error("sequenceInText must be sequential starting from 1");
    }
  }

  // 5. LinkedBoxes consistency: All targetBoxIds must be in linkedBoxes
  for (const ref of refs) {
    if (!box.linkedBoxes.includes(ref.targetBoxId)) {
      return error(`targetBoxId ${ref.targetBoxId} not in linkedBoxes array`);
    }
  }

  return success();
}
```

### Edge Cases & Handling

#### Case 1: OCR Text Includes/Excludes Reference Markers

**Recommended approach:** OCR text **includes** the reference markers

```json
{
  "text": {
    "ocr": "The principle¹ is clear.",
    "corrected": "The principle¹ is clear."
  },
  "inlineReferences": [
    {
      "position": { "charOffset": 13, "length": 1 },
      "displayText": "¹"
    }
  ]
}
```

**Rationale:**

- Preserves exact character positions
- No need to recalculate offsets if text is corrected
- Export process can strip markers if needed

#### Case 2: User Corrects Text and Adds/Removes References

When text is corrected, inline references must be updated:

```json
// Before correction
{
  "text": {
    "ocr": "The principle is clear.",
    "corrected": "The principle is clear."
  },
  "inlineReferences": []
}

// After user adds footnote reference
{
  "text": {
    "ocr": "The principle is clear.",
    "corrected": "The principle¹ is clear."
  },
  "inlineReferences": [
    {
      "referenceId": "ref-manual-001",
      "type": "footnote",
      "position": {"charOffset": 13, "length": 1},
      "targetBoxId": "box-footnote-001",
      "displayText": "¹",
      "sequenceInText": 1
    }
  ]
}
```

**Version tracking:** This creates a new version entry with `changeType: 'inline_reference_added'`

#### Case 3: OCR Misreads Reference Markers

```json
// OCR reads "¹" as "1" or misses it entirely
{
  "text": {
    "ocr": "The principle1 is clear.", // OCR error: "1" instead of "¹"
    "corrected": "The principle¹ is clear." // User corrects
  },
  "inlineReferences": [
    {
      "position": { "charOffset": 13, "length": 1 },
      "displayText": "¹"
    }
  ]
}
```

**Handling:** User must correct both the text AND add/adjust inline reference

#### Case 4: Compound Reference Markers

```json
// References like "1,2,3" or "1-3"
{
  "text": {
    "ocr": "Multiple sources support this claim.",
    "corrected": "Multiple sources support this claim."
  },
  "inlineReferences": [
    {
      "referenceId": "ref-compound-001",
      "type": "footnote",
      "position": { "charOffset": 36, "length": 5 },
      "targetBoxId": "box-footnotes-001-003", // Can reference a group
      "displayText": "¹⁻³", // Or "1-3" or "1,2,3"
      "sequenceInText": 1
    }
  ]
}
```

**Alternative:** Split into individual references at adjacent positions (Example 3 above)

#### Case 5: Reference in Middle of Word (Edge Case)

```json
// Should NOT happen, but if it does:
{
  "text": {
    "ocr": "The prin¹ciple is clear.", // Malformed - reference splits word
    "corrected": "The principle¹ is clear." // User corrects
  },
  "inlineReferences": [
    {
      "position": { "charOffset": 13, "length": 1 },
      "displayText": "¹"
    }
  ]
}
```

**Validation:** Warn if reference is not at word boundary, but don't block

### Cross-Page Reference Resolution

**Key insight:** The schema supports cross-page references natively. `targetBoxId` can reference any box in the project, regardless of page.

#### How It Works

**1. BoxId Uniqueness**

- Every box in the project has a globally unique `boxId`
- Format: `"box-{type}-{uuid}"` (e.g., `"box-footnote-a3f9d2c1"`)
- BoxIds must be unique across ALL pages in project

**2. Project-Level Box Index**

The `metadata.json` maintains an index for efficient lookup:

```json
{
  "boxIndex": {
    "box-footnote-001": {
      "pageId": "page-237",
      "pageNumber": 237,
      "contentType": "footnote"
    },
    "box-verse-042": {
      "pageId": "page-050",
      "pageNumber": 50,
      "contentType": "verse"
    }
  }
}
```

**3. Reference Resolution Algorithm**

```typescript
async function resolveReference(
  projectId: string,
  targetBoxId: string,
): Promise<BoundingBox> {
  // 1. Look up box location in project metadata
  const metadata = await loadProjectMetadata(projectId);
  const location = metadata.boxIndex[targetBoxId];

  if (!location) {
    throw new Error(`Box ${targetBoxId} not found in project`);
  }

  // 2. Load only the specific page
  const page = await loadPage(projectId, location.pageId);

  // 3. Find the box on that page
  const box = page.currentState.boundingBoxes.find(
    (b) => b.boxId === targetBoxId,
  );

  return box;
}
```

**Performance:** O(1) lookup + single page load (not all pages)

**4. Maintaining the Index**

Index is updated automatically when:

- New box created → Add to index
- Box deleted → Remove from index
- Page moved/renumbered → Update pageNumber in index

```typescript
// When creating a box
function createBox(pageId: string, box: BoundingBox): void {
  // Add to page
  page.currentState.boundingBoxes.push(box);

  // Update index
  metadata.boxIndex[box.boxId] = {
    pageId: pageId,
    pageNumber: page.pageNumber,
    contentType: box.contentType,
  };

  saveProjectMetadata(metadata);
}
```

#### Cross-Page Reference Examples

**Example 1: Footnote on Different Page**

```json
// Page 50 - box-text-050
{
  "text": {
    "corrected": "See detailed explanation in footnote 23."
  },
  "inlineReferences": [
    {
      "referenceId": "ref-cross-001",
      "type": "footnote",
      "targetBoxId": "box-footnote-237-023",
      "targetPageId": "page-237",      // Cached for efficiency
      "targetPageNumber": 237,          // For UX display
      "displayText": "23"
    }
  ]
}

// Page 237 - box-footnote-237-023
{
  "boxId": "box-footnote-237-023",
  "contentType": "footnote",
  "text": {
    "corrected": "23. This is a detailed explanation..."
  }
}
```

**Example 2: Verse Reference**

```json
// Page 100
{
  "text": {
    "corrected": "As stated in verse 2.11, the principle is clear."
  },
  "inlineReferences": [
    {
      "referenceId": "ref-verse-001",
      "type": "verse-number",
      "targetBoxId": "box-verse-002-011",
      "targetPageId": "page-025",
      "targetPageNumber": 25,
      "displayText": "2.11"
    }
  ]
}
```

#### UI Considerations

**Navigation:**

- Click reference → Jump to target (even if different page)
- Show page number in tooltip: "Footnote 23 (page 237)"
- "Jump back" button after navigating to cross-page reference

**Validation:**

- Check that `targetBoxId` exists in `boxIndex`
- Warn if target is on different page (not an error, just FYI)
- Show page number in reference list

**Performance:**

- Don't load all pages to validate references
- Use boxIndex for validation
- Lazy-load target pages only when user clicks reference

### User Workflows: Adding Missing Footnote References

When OCR misses a footnote reference, users can manually add it through the annotation editor.

#### Scenario: OCR Completely Missed the Reference Marker

**Original page text:**

```
The Gītā states this principle¹ clearly in Chapter 2.
```

**OCR output (missed the superscript):**

```json
{
  "boxId": "box-001",
  "text": {
    "ocr": "The Gītā states this principle clearly in Chapter 2.",
    "corrected": "The Gītā states this principle clearly in Chapter 2."
  },
  "inlineReferences": []
}
```

**User Workflow in Annotation Editor:**

1. **Select the text box** - Click on box-001 in the annotation editor
2. **Open text correction interface** - Click "Edit Text" button
3. **Add reference marker to text:**
   - Place cursor after "principle"
   - Type or insert "¹" (from special character palette)
   - Text becomes: "The Gītā states this principle¹ clearly in Chapter 2."
4. **Add inline reference metadata:**
   - System detects new character and offers: "Add footnote reference?"
   - Or user clicks "Add Inline Reference" button
   - System calculates `charOffset: 32` automatically
5. **Link to target footnote:**
   - User selects target footnote from dropdown (shows all footnote boxes on page)
   - Or user clicks the target footnote box to create link
6. **System creates inline reference:**
   ```json
   {
     "referenceId": "ref-manual-001",
     "type": "footnote",
     "position": { "charOffset": 32, "length": 1 },
     "targetBoxId": "box-footnote-001",
     "displayText": "¹",
     "sequenceInText": 1
   }
   ```
7. **Version history recorded:**
   ```json
   {
     "version": 5,
     "changeType": "inline_reference_added",
     "changes": {
       "action": "inline_reference_added",
       "boxId": "box-001",
       "referenceId": "ref-manual-001",
       "after": {
         "referenceId": "ref-manual-001",
         "type": "footnote",
         "position": { "charOffset": 32, "length": 1 },
         "targetBoxId": "box-footnote-001",
         "displayText": "¹",
         "sequenceInText": 1
       }
     },
     "note": "Added missing footnote reference"
   }
   ```

#### Scenario: OCR Read Reference as Regular Text

**Original page text:**

```
The principle¹ is clear.
```

**OCR output (misread superscript as regular "1"):**

```json
{
  "boxId": "box-002",
  "text": {
    "ocr": "The principle1 is clear.",
    "corrected": "The principle1 is clear."
  },
  "inlineReferences": []
}
```

**User Workflow:**

1. **Select text box**
2. **Correct the character:**
   - Select the "1" character
   - Replace with "¹" (superscript)
   - Text becomes: "The principle¹ is clear."
3. **System auto-suggests:** "Detected potential footnote reference. Add metadata?"
4. **User confirms and links to target footnote**
5. **System creates inline reference with correct `charOffset`**

**Simpler alternative:** System can auto-detect superscript characters and prompt user to convert them to inline references.

#### Scenario: Multiple Missing References

**OCR output (missed 3 references):**

```json
{
  "text": {
    "ocr": "The first principle appears in Chapter 2, followed by the second in Chapter 3."
  },
  "inlineReferences": []
}
```

**User Workflow:**

1. **Add references one at a time:**
   - Add "²" after "principle" → system prompts for metadata → link to footnote
   - Add "³" after "2" → system prompts → link to footnote
   - Add "⁴" after "second" → system prompts → link to footnote

2. **System handles ordering automatically:**
   - Automatically assigns `sequenceInText: 1, 2, 3`
   - Sorts by `charOffset`
   - Validates no overlaps

3. **Final result:**
   ```json
   {
     "text": {
       "ocr": "The first principle appears in Chapter 2, followed by the second in Chapter 3.",
       "corrected": "The first principle² appears in Chapter 2³, followed by the second⁴ in Chapter 3."
     },
     "inlineReferences": [
       { "charOffset": 18, "displayText": "²", "sequenceInText": 1 },
       { "charOffset": 41, "displayText": "³", "sequenceInText": 2 },
       { "charOffset": 72, "displayText": "⁴", "sequenceInText": 3 }
     ]
   }
   ```

#### Annotation Editor UI Requirements

To support manual footnote reference addition, the editor must provide:

##### 1. Text Editing Mode

- **Rich text editor** with cursor positioning
- **Special character palette** for superscripts (¹²³⁴⁵⁶⁷⁸⁹⁰)
- **Character insertion** at any position
- **Real-time character offset calculation** (shown to user for debugging)

##### 2. Inline Reference Management

**Visual indicators:**

- Highlight inline references in text (different color/underline)
- Show reference type icon (📝 for footnote, 📖 for citation)
- Tooltip on hover: "Footnote ¹ → box-footnote-001"

**Add reference button:**

- Appears when text contains superscript/bracket characters
- "Convert to inline reference" quick action
- Keyboard shortcut: `Cmd+Shift+R` (Add Reference)

**Link to target:**

- **Dropdown list** of all footnote boxes on current page
- **Click-to-link**: Click reference, then click target box
- **Auto-match**: System suggests target based on reference number
  - Reference "¹" → suggests footnote box starting with "1."
  - Reference "⁵" → suggests footnote box starting with "5."

##### 3. Reference List Panel

Show all inline references in sidebar:

```
Inline References (3)
━━━━━━━━━━━━━━━━━━━━
📝 ¹ at char 32 → Footnote 1
📝 ² at char 58 → Footnote 2
📝 ³ at char 91 → Footnote 3

[+ Add Reference]
```

**Actions per reference:**

- Edit position
- Change target
- Remove reference
- View in text (scroll to position)

##### 4. Validation Feedback

Real-time validation indicators:

```
✅ Reference ¹: Valid (char 32, links to box-footnote-001)
⚠️  Reference ²: Warning - No target footnote found
❌ Reference ³: Error - Overlaps with reference ⁴
```

##### 5. Auto-Detection Helpers

**Smart detection:**

- When user types superscript characters, show prompt:
  ```
  "Detected potential footnote reference ¹.
   [Add as inline reference] [Ignore]"
  ```

**Batch conversion:**

- "Detect all potential references" button
- Scans text for superscripts/brackets
- Shows list of candidates for user approval
- User selects which to convert and links targets

##### 6. Keyboard Shortcuts

- `Cmd+Shift+R` - Add inline reference at cursor
- `Cmd+Shift+F` - Find footnote by number
- `Cmd+Click` on reference - Jump to target footnote
- `Alt+Click` on footnote - Show all references to it

#### Example User Session

**Goal:** Add missing reference to existing text

```
1. User opens page in annotation editor
2. Selects commentary box: "The principle is clear"
3. Notices image shows "The principle¹ is clear" (OCR missed it)
4. Clicks "Edit Text" button
5. Places cursor after "principle"
6. Clicks superscript button, types "1"
7. System auto-prompts: "Add footnote reference?"
8. User clicks "Yes"
9. System shows dropdown: "Select target footnote"
   Options:
   - box-footnote-001: "1. See Śaṅkara's commentary..."
   - box-footnote-002: "2. Compare with verse 2.11..."
10. User selects box-footnote-001
11. System creates inline reference:
    - referenceId: "ref-manual-001"
    - charOffset: 13 (automatically calculated)
    - targetBoxId: "box-footnote-001"
12. Text now shows "The principle¹ is clear" with underlined "¹"
13. Tooltip on hover: "Footnote 1: See Śaṅkara's commentary..."
14. Changes auto-saved
15. Version history updated:
    - Version 5: "inline_reference_added"
    - Note: "Added missing footnote reference"
```

#### API Endpoint for Manual Addition

```typescript
// POST /api/pages/:pageId/boxes/:boxId/inline-references
interface AddInlineReferenceRequest {
  position: {
    charOffset: number;
    length: number;
  };
  type: "footnote" | "verse-number" | "citation";
  targetBoxId: string;
  displayText: string;
  note?: string; // Optional user note explaining addition
}

interface AddInlineReferenceResponse {
  referenceId: string;
  versionNumber: number;
  commitSha: string;
  updatedBox: BoundingBox;
}
```

#### Validation & Error Handling

**Server-side validation:**

```typescript
function validateInlineReferenceAddition(
  box: BoundingBox,
  newRef: InlineReference,
): ValidationResult {
  // 1. Check position is within text bounds
  if (
    newRef.position.charOffset + newRef.position.length >
    box.text.corrected.length
  ) {
    return error("Position exceeds text length");
  }

  // 2. Check no overlap with existing references
  for (const existingRef of box.inlineReferences || []) {
    if (doPositionsOverlap(existingRef.position, newRef.position)) {
      return error("Reference overlaps with existing reference");
    }
  }

  // 3. Check target box exists and is a footnote
  const targetBox = await getBox(newRef.targetBoxId);
  if (!targetBox) {
    return error("Target footnote box not found");
  }
  if (targetBox.contentType !== "footnote") {
    return warning("Target box is not a footnote (but allowed)");
  }

  // 4. Check displayText matches text content at position
  const textAtPosition = box.text.corrected.substr(
    newRef.position.charOffset,
    newRef.position.length,
  );
  if (textAtPosition !== newRef.displayText) {
    return error(
      `Text mismatch: expected "${newRef.displayText}", found "${textAtPosition}"`,
    );
  }

  return success();
}
```

**User-friendly error messages:**

- ❌ "Cannot add reference: Position overlaps with existing reference ²"
- ❌ "Cannot add reference: Text at position doesn't match reference marker"
- ⚠️ "Warning: Target box is not marked as a footnote. Continue anyway?"
- ✅ "Footnote reference added successfully"

---

### Critical Data Integrity: Character Offset Updates

**Problem:** When text is edited, character offsets become invalid.

```typescript
// Example of the problem
const original = {
  text: "The principle¹ is clear.",
  inlineReferences: [
    { charOffset: 13, length: 1, displayText: "¹" }, // Points to "¹"
  ],
};

// User inserts "fundamental " before "principle"
const edited = {
  text: "The fundamental principle¹ is clear.",
  inlineReferences: [
    { charOffset: 13, length: 1, displayText: "¹" }, // NOW POINTS TO WRONG POSITION!
  ],
};
```

**Solution: Offset Update Algorithm**

```typescript
interface TextChange {
  type: "insert" | "delete" | "replace";
  position: number; // Where change occurred
  insertedLength: number; // Characters inserted (0 for delete)
  deletedLength: number; // Characters deleted (0 for insert)
  oldText?: string; // For undo/validation
  newText?: string; // For redo/validation
}

function updateInlineReferenceOffsets(
  box: BoundingBox,
  change: TextChange,
): BoundingBox {
  const { position, insertedLength, deletedLength } = change;
  const delta = insertedLength - deletedLength;

  const updatedRefs: InlineReference[] = [];

  for (const ref of box.inlineReferences || []) {
    const refStart = ref.position.charOffset;
    const refEnd = refStart + ref.position.length;

    // Case 1: Reference is BEFORE the change - no update needed
    if (refEnd <= position) {
      updatedRefs.push(ref);
      continue;
    }

    // Case 2: Reference is AFTER the change - shift offset
    if (refStart >= position + deletedLength) {
      updatedRefs.push({
        ...ref,
        position: {
          ...ref.position,
          charOffset: refStart + delta,
        },
      });
      continue;
    }

    // Case 3: Reference is WITHIN deleted range - mark as orphaned
    if (refStart >= position && refEnd <= position + deletedLength) {
      updatedRefs.push({
        ...ref,
        isOrphaned: true,
        orphanedReason: "deleted_with_text",
      });
      continue;
    }

    // Case 4: Reference spans the change boundary - complex case
    if (refStart < position && refEnd > position) {
      // Reference marker is being partially edited
      // Mark as needs review
      updatedRefs.push({
        ...ref,
        needsReview: true,
        reviewReason: "text_changed_within_reference",
      });
      continue;
    }
  }

  // Re-validate all offsets
  for (const ref of updatedRefs) {
    const textAtOffset = box.text.corrected.substr(
      ref.position.charOffset,
      ref.position.length,
    );

    if (textAtOffset !== ref.displayText && !ref.isOrphaned) {
      ref.needsReview = true;
      ref.reviewReason = "display_text_mismatch";
    }
  }

  // Re-sort by charOffset and re-assign sequenceInText
  updatedRefs.sort((a, b) => a.position.charOffset - b.position.charOffset);
  updatedRefs.forEach((ref, index) => {
    ref.sequenceInText = index + 1;
  });

  return {
    ...box,
    inlineReferences: updatedRefs,
  };
}
```

**Enhanced InlineReference Schema:**

```typescript
interface InlineReference {
  // ... existing fields

  // Data integrity flags
  isOrphaned?: boolean; // Target box not found or deleted
  orphanedReason?: string; // Why it's orphaned
  needsReview?: boolean; // Offset may be invalid
  reviewReason?: string; // Why review is needed
  lastValidated?: string; // ISO 8601 timestamp
}
```

**API Endpoint for Text Changes:**

```typescript
// PUT /api/pages/:pageId/boxes/:boxId/text
interface UpdateTextRequest {
  oldText: string; // Current text (for validation)
  newText: string; // New text
  changes: TextChange[]; // Detailed change log
  note?: string; // User explanation
}

interface UpdateTextResponse {
  updatedBox: BoundingBox;
  affectedReferences: {
    updated: string[]; // Reference IDs with updated offsets
    orphaned: string[]; // Reference IDs marked as orphaned
    needsReview: string[]; // Reference IDs needing manual review
  };
  versionNumber: number;
  commitSha: string;
}
```

**UI Requirements:**

1. **Real-time offset preview** - Show updated positions as user types
2. **Warning dialogs** - Alert when edit affects references:

   ```
   ⚠️  Warning: This edit will affect 3 inline references.
   - Reference ¹ offset will change: 13 → 25
   - Reference ² will be deleted with text
   - Reference ³ may need review

   [Continue] [Cancel]
   ```

3. **Post-edit validation** - Show list of references needing attention
4. **Undo/redo support** - Restore references when text is reverted

---

### Orphaned Reference & Footnote Detection

**Enhancement to PageAnnotations Schema:**

```typescript
interface PageAnnotations {
  // ... existing fields

  currentState: {
    boundingBoxes: BoundingBox[];
    reviewStatus: ReviewStatus;
    ocrStatus: OcrStatus;
    confidence: number;

    // NEW: Data quality tracking
    validationStatus: ValidationStatus;
    validationWarnings: ValidationWarning[];
  };
}

interface ValidationStatus {
  isValid: boolean;
  lastValidated: string; // ISO 8601 timestamp
  orphanedReferences: string[]; // Reference IDs with no target
  orphanedFootnotes: string[]; // Footnote box IDs with no references
  brokenCrossPageRefs: string[]; // References to non-existent pages
  numberMismatches: NumberMismatch[];
}

interface ValidationWarning {
  type: ValidationWarningType;
  severity: "error" | "warning" | "info";
  boxId?: string;
  referenceId?: string;
  message: string;
  suggestedFix?: string;
  autoFixable: boolean;
}

type ValidationWarningType =
  | "orphaned_reference" // Reference points to non-existent box
  | "orphaned_footnote" // Footnote has no references
  | "cross_page_broken" // Cross-page target missing
  | "number_mismatch" // Reference "1" → Footnote "2"
  | "duplicate_reference" // Same footnote referenced multiple times
  | "offset_mismatch" // displayText doesn't match text at offset
  | "overlapping_references" // References overlap
  | "text_changed_unupdated"; // Text edited but offsets not updated

interface NumberMismatch {
  referenceId: string;
  referenceNumber: string; // "1"
  footnoteBoxId: string;
  footnoteNumber: string; // "2"
  confidence: number; // 0-1: How confident we are it's wrong
}
```

**Validation API:**

```typescript
// POST /api/pages/:pageId/validate
interface ValidatePageResponse {
  validationStatus: ValidationStatus;
  warnings: ValidationWarning[];
  autoFixableCount: number;
}

// POST /api/pages/:pageId/auto-fix
interface AutoFixRequest {
  warningIds: string[]; // Which warnings to fix
  confirmAll: boolean; // Fix all auto-fixable
}

interface AutoFixResponse {
  fixed: string[]; // Warning IDs that were fixed
  failed: string[]; // Warning IDs that couldn't be fixed
  versionNumber: number;
}
```

**Validation Workflow:**

```typescript
async function validatePage(
  page: PageAnnotations,
  project: ProjectMetadata,
): ValidationStatus {
  const warnings: ValidationWarning[] = [];
  const orphanedReferences: string[] = [];
  const orphanedFootnotes: string[] = [];

  // 1. Check all inline references
  for (const box of page.currentState.boundingBoxes) {
    for (const ref of box.inlineReferences || []) {
      // Validate target exists
      const targetLocation = project.boxIndex[ref.targetBoxId];

      if (!targetLocation) {
        orphanedReferences.push(ref.referenceId);
        warnings.push({
          type: "orphaned_reference",
          severity: "error",
          boxId: box.boxId,
          referenceId: ref.referenceId,
          message: `Reference "${ref.displayText}" points to non-existent box ${ref.targetBoxId}`,
          suggestedFix: "Remove reference or link to different footnote",
          autoFixable: false,
        });
      }

      // Validate offset matches text
      const textAtOffset = box.text.corrected.substr(
        ref.position.charOffset,
        ref.position.length,
      );

      if (textAtOffset !== ref.displayText) {
        warnings.push({
          type: "offset_mismatch",
          severity: "warning",
          boxId: box.boxId,
          referenceId: ref.referenceId,
          message: `Reference displayText "${ref.displayText}" doesn't match text "${textAtOffset}" at offset ${ref.position.charOffset}`,
          suggestedFix: "Update charOffset or displayText",
          autoFixable: true, // Can search for displayText in text
        });
      }
    }
  }

  // 2. Check all footnotes for references
  const footnoteBoxes = page.currentState.boundingBoxes.filter(
    (b) => b.contentType === "footnote",
  );

  for (const footnote of footnoteBoxes) {
    const hasReferences = page.currentState.boundingBoxes.some((box) =>
      box.inlineReferences?.some((ref) => ref.targetBoxId === footnote.boxId),
    );

    if (!hasReferences) {
      orphanedFootnotes.push(footnote.boxId);
      warnings.push({
        type: "orphaned_footnote",
        severity: "warning",
        boxId: footnote.boxId,
        message: `Footnote "${footnote.text.corrected.substr(0, 50)}..." has no references`,
        suggestedFix: "Add reference in text or mark as general note",
        autoFixable: false,
      });
    }
  }

  // 3. Check for number mismatches
  for (const box of page.currentState.boundingBoxes) {
    for (const ref of box.inlineReferences || []) {
      const refNumber = extractNumber(ref.displayText);
      if (!refNumber) continue;

      const targetLocation = project.boxIndex[ref.targetBoxId];
      if (!targetLocation) continue;

      const targetPage = await loadPage(
        project.projectId,
        targetLocation.pageId,
      );
      const targetBox = targetPage.currentState.boundingBoxes.find(
        (b) => b.boxId === ref.targetBoxId,
      );

      if (targetBox) {
        const footnoteNumber = extractFootnoteNumber(targetBox.text.corrected);

        if (footnoteNumber && refNumber !== footnoteNumber) {
          warnings.push({
            type: "number_mismatch",
            severity: "warning",
            boxId: box.boxId,
            referenceId: ref.referenceId,
            message: `Reference "${refNumber}" links to footnote "${footnoteNumber}"`,
            suggestedFix: `Link to footnote ${refNumber} instead?`,
            autoFixable: false, // Need user confirmation
          });
        }
      }
    }
  }

  return {
    isValid: warnings.filter((w) => w.severity === "error").length === 0,
    lastValidated: new Date().toISOString(),
    orphanedReferences,
    orphanedFootnotes,
    brokenCrossPageRefs: [], // Would check cross-page refs here
    numberMismatches: [], // Would populate from warnings
  };
}
```

**UI Requirements:**

```
Validation Panel
━━━━━━━━━━━━━━━━
✅ 150 references valid
⚠️  3 warnings
❌ 1 error

Errors (1):
━━━━━━━━━━━━━━━━
❌ Reference ¹ on page 50
   → Target box not found
   [Fix manually]

Warnings (3):
━━━━━━━━━━━━━━━━
⚠️  Footnote at page bottom
   → No references point to it
   [Add reference] [Mark as note]

⚠️  Reference ² on page 51
   → Links to footnote 3
   [Relink to footnote 2]

⚠️  Reference ³ offset mismatch
   → Text changed but offset not updated
   [Auto-fix]

[Validate All Pages] [Auto-fix All]
```

---

### Bidirectional Navigation & Reference Tracking

**Enhancement to BoundingBox Schema:**

```typescript
interface BoundingBox {
  // ... existing fields

  // For footnote boxes: track incoming references
  incomingReferences?: IncomingReference[];
}

interface IncomingReference {
  referenceId: string;
  sourceBoxId: string;
  sourcePageId: string;
  sourcePageNumber: number;
  displayText: string;
  textExcerpt: string; // "...principle¹ is clear..."
  createdAt: string;
}
```

**When to Update:**

```typescript
// When inline reference is added
async function addInlineReference(
  sourceBox: BoundingBox,
  reference: InlineReference,
): void {
  // 1. Add reference to source box
  sourceBox.inlineReferences.push(reference);

  // 2. Add incoming reference to target box
  const targetLocation = project.boxIndex[reference.targetBoxId];
  const targetPage = await loadPage(project.projectId, targetLocation.pageId);
  const targetBox = targetPage.currentState.boundingBoxes.find(
    (b) => b.boxId === reference.targetBoxId,
  );

  if (targetBox) {
    targetBox.incomingReferences = targetBox.incomingReferences || [];
    targetBox.incomingReferences.push({
      referenceId: reference.referenceId,
      sourceBoxId: sourceBox.boxId,
      sourcePageId: currentPage.pageId,
      sourcePageNumber: currentPage.pageNumber,
      displayText: reference.displayText,
      textExcerpt: getTextExcerpt(sourceBox.text.corrected, reference.position),
      createdAt: new Date().toISOString(),
    });

    await savePage(targetPage);
  }
}

function getTextExcerpt(
  text: string,
  position: { charOffset: number; length: number },
): string {
  const start = Math.max(0, position.charOffset - 20);
  const end = Math.min(text.length, position.charOffset + position.length + 20);
  const excerpt = text.substring(start, end);
  return `...${excerpt}...`;
}
```

**API Endpoints:**

```typescript
// GET /api/boxes/:boxId/incoming-references
interface GetIncomingReferencesResponse {
  footnoteBox: BoundingBox;
  incomingReferences: IncomingReferenceDetail[];
  totalCount: number;
}

interface IncomingReferenceDetail extends IncomingReference {
  isValid: boolean; // Does source reference still exist?
  lastValidated: string;
}

// GET /api/boxes/:boxId/outgoing-references
interface GetOutgoingReferencesResponse {
  sourceBox: BoundingBox;
  outgoingReferences: OutgoingReferenceDetail[];
  totalCount: number;
}

interface OutgoingReferenceDetail extends InlineReference {
  targetExists: boolean;
  targetPageNumber?: number;
  targetTextExcerpt?: string;
}
```

**UI Requirements:**

```
Footnote Box (selected)
━━━━━━━━━━━━━━━━━━━━━━━━
Content: "1. See Śaṅkara's commentary..."

Referenced by: 3 places
━━━━━━━━━━━━━━━━━━━━━━━━
📍 Page 50: "...principle¹ is clear..."
   [Jump to reference]

📍 Page 52: "...again¹ we see..."
   [Jump to reference]

📍 Page 75: "...as stated¹ in..."
   [Jump to reference]

[Show all references]
```

**Navigation Features:**

1. **Click footnote** → Show "Referenced by" panel
2. **Click "Jump to reference"** → Navigate to source page + highlight reference
3. **Breadcrumb trail** → "Page 50 → Footnote 1 (page 237) → Back to page 50"
4. **Keyboard shortcuts:**
   - `Alt+→` - Follow reference
   - `Alt+←` - Go back
   - `Alt+Shift+R` - Show all references to current footnote

---

## 5. Version History Entry

**Purpose:** Track individual edits (core feature)

### TypeScript Interface

```typescript
interface VersionHistoryEntry {
  // Version Identity
  version: number; // Sequential version number (1-based)
  timestamp: string; // ISO 8601 timestamp

  // Attribution
  editedBy: UserAttribution;

  // Change Information
  changeType: ChangeType;
  changes: ChangeDetails;

  // Version Control
  commitSha: string; // Git commit SHA

  // Context
  note: string; // User explanation of change
}

type ChangeType =
  | "ai_generated" // Initial AI detection
  | "manual_edit" // User edited annotations
  | "ocr_extraction" // OCR text extracted
  | "text_correction" // User corrected OCR text
  | "box_created" // New box added
  | "box_deleted" // Box removed
  | "box_moved" // Position changed
  | "box_resized" // Size changed
  | "box_relabeled" // Type/language changed
  | "reading_order_changed" // Sequence updated
  | "boxes_merged" // Multiple boxes combined
  | "box_split" // One box split into multiple
  | "inline_reference_added" // Inline footnote reference added
  | "inline_reference_removed" // Inline footnote reference removed
  | "inline_reference_modified" // Inline footnote reference changed
  | "review_status_changed"; // Review status updated

type ChangeDetails =
  | CreateChange
  | MoveChange
  | ResizeChange
  | DeleteChange
  | RelabelChange
  | ReadingOrderChange
  | MergeChange
  | SplitChange
  | TextCorrectionChange
  | InlineReferenceChange
  | ReviewStatusChange;

interface CreateChange {
  action: "created";
  boxId: string | null; // null for batch operations
  details: string;
}

interface MoveChange {
  action: "moved";
  boxId: string;
  before: { x: number; y: number };
  after: { x: number; y: number };
}

interface ResizeChange {
  action: "resized";
  boxId: string;
  before: { width: number; height: number };
  after: { width: number; height: number };
}

interface DeleteChange {
  action: "deleted";
  boxId: string;
  deletedBox: BoundingBox; // Store deleted box for potential restore
}

interface RelabelChange {
  action: "relabeled";
  boxId: string;
  before: { contentType: ContentType; language: Language };
  after: { contentType: ContentType; language: Language };
}

interface ReadingOrderChange {
  action: "reading_order_changed";
  changes: Array<{
    boxId: string;
    before: number;
    after: number;
  }>;
}

interface MergeChange {
  action: "merged";
  sourceBoxIds: string[];
  targetBoxId: string;
}

interface SplitChange {
  action: "split";
  sourceBoxId: string;
  newBoxIds: string[];
}

interface TextCorrectionChange {
  action: "text_corrected";
  boxId: string;
  before: string;
  after: string;
}

interface InlineReferenceChange {
  action:
    | "inline_reference_added"
    | "inline_reference_removed"
    | "inline_reference_modified";
  boxId: string;
  referenceId: string;
  before?: InlineReference; // For removed/modified
  after?: InlineReference; // For added/modified
}

interface ReviewStatusChange {
  action: "review_status_changed";
  before: ReviewStatus;
  after: ReviewStatus;
}
```

---

## 6. Cost Tracking Log

**Location:** `costs.jsonl` (JSONL format - one JSON object per line)

**Purpose:** Log all API costs for transparency and budget tracking

### TypeScript Interface

```typescript
interface CostLogEntry {
  // Entry Identity
  entryId: string; // Unique ID (e.g., "cost_abc123")
  timestamp: string; // ISO 8601 timestamp

  // Context
  projectId: string; // Which project
  pageId?: string; // Which page (if applicable)
  operation: CostOperation; // What operation

  // Cost Details
  provider: string; // API provider (e.g., "google-ai")
  service: string; // Specific service (e.g., "document-ai-ocr")
  units: number; // Units consumed (e.g., pages, API calls)
  costPerUnit: number; // USD per unit
  totalCost: number; // Total USD cost
  currency: "USD"; // Always USD for v1

  // API Details
  apiRequestId?: string; // Provider's request ID
  apiResponseTime?: number; // Milliseconds
  apiStatus: "success" | "failed" | "partial";

  // Metadata
  userId: string; // Who initiated
  notes?: string; // Additional context
}

type CostOperation =
  | "pdf-upload"
  | "image-preprocessing"
  | "layout-detection"
  | "ocr-extraction"
  | "text-analysis"
  | "export-generation"
  | "storage"
  | "other";
```

### Example (JSONL format)

```jsonl
{"entryId":"cost_001","timestamp":"2025-01-15T10:10:00Z","projectId":"proj_bg2025","pageId":"page-001","operation":"layout-detection","provider":"google-ai","service":"document-ai-layout","units":1,"costPerUnit":0.002,"totalCost":0.002,"currency":"USD","apiStatus":"success","userId":"user_abc123"}
{"entryId":"cost_002","timestamp":"2025-01-15T10:11:00Z","projectId":"proj_bg2025","pageId":"page-001","operation":"ocr-extraction","provider":"google-ai","service":"document-ai-ocr","units":1,"costPerUnit":0.0015,"totalCost":0.0015,"currency":"USD","apiStatus":"success","userId":"user_abc123"}
{"entryId":"cost_003","timestamp":"2025-01-15T10:15:00Z","projectId":"proj_bg2025","operation":"layout-detection","provider":"google-ai","service":"document-ai-layout","units":50,"costPerUnit":0.002,"totalCost":0.10,"currency":"USD","apiStatus":"success","userId":"user_abc123","notes":"Batch processing pages 2-51"}
```

**Why JSONL?**

- Append-only (fast writes)
- No need to parse entire file to add entry
- Easy to stream/process line-by-line
- Git-friendly (adding lines = minimal diff)

---

## 7. OCR Result

**Purpose:** Store OCR extraction results

### TypeScript Interface

```typescript
interface OcrResult {
  // Identity
  resultId: string; // Unique ID
  pageId: string; // Which page
  boxId: string; // Which bounding box

  // OCR Output
  text: string; // Extracted text
  confidence: number; // Overall confidence (0-1)

  // Per-Word Details (optional)
  words?: OcrWord[];

  // OCR Metadata
  engine: string; // OCR engine used (e.g., "document-ai")
  language: Language; // Detected/specified language
  script: string; // Script (e.g., "Devanagari", "Latin")

  // Processing
  processingTime: number; // Milliseconds
  apiRequestId?: string; // Provider's request ID

  // Timestamps
  extractedAt: string; // ISO 8601 timestamp
}

interface OcrWord {
  text: string; // Word text
  confidence: number; // Word confidence (0-1)
  boundingBox: {
    // Word position within box
    x: number;
    y: number;
    width: number;
    height: number;
  };
  language?: Language; // Word-level language (for mixed text)
}
```

### Example

```json
{
  "resultId": "ocr_page001_box001",
  "pageId": "page-001",
  "boxId": "box-001",
  "text": "धर्मक्षेत्रे कुरुक्षेत्रे समवेता युयुत्सवः",
  "confidence": 0.92,
  "words": [
    {
      "text": "धर्मक्षेत्रे",
      "confidence": 0.95,
      "boundingBox": { "x": 0, "y": 0, "width": 120, "height": 24 }
    },
    {
      "text": "कुरुक्षेत्रे",
      "confidence": 0.88,
      "boundingBox": { "x": 125, "y": 0, "width": 130, "height": 24 }
    }
  ],
  "engine": "google-document-ai",
  "language": "sanskrit",
  "script": "Devanagari",
  "processingTime": 1250,
  "apiRequestId": "req_xyz789",
  "extractedAt": "2025-01-15T10:12:00Z"
}
```

---

## 8. Image Metadata

**Purpose:** Store page image properties (references to Google Drive assets)

### TypeScript Interface

```typescript
interface ImageMetadata {
  // Google Drive Reference
  driveFileId: string; // Google Drive file ID
  driveUrl?: string; // Direct download URL (if available)

  // File Information
  fileName: string; // File name (e.g., "page-001.png" or "enhanced-page-001.png")
  format: ImageFormat; // Image format
  fileSizeBytes: number; // File size
  sha256: string; // Checksum for integrity

  // Image Properties
  width: number; // Width in pixels
  height: number; // Height in pixels
  dpi: number; // Dots per inch (typically 300)
  colorSpace?: string; // Color space (e.g., "RGB", "Grayscale")
  bitDepth?: number; // Bits per channel

  // Processing Status
  isPreprocessed: boolean; // Has undergone preprocessing
  preprocessingApplied?: PreprocessingOperation[]; // Operations applied (if any)

  // Quality Metrics (from pre-processing analysis)
  qualityMetrics?: {
    skewAngle: number; // Detected skew in degrees (0 = perfect)
    contrast: number; // Contrast level 0-1 (higher is better)
    brightness: number; // Brightness 0-1 (0.4-0.8 ideal)
    noiseLevel: number; // Noise 0-1 (lower is better)
    overallQuality: "excellent" | "good" | "fair" | "poor";
  };

  // Timestamps
  uploadedAt: string; // ISO 8601 timestamp
  processedAt?: string; // ISO 8601 timestamp (if preprocessed)
}

type PreprocessingOperation =
  | "deskew" // Rotation correction
  | "color-correction" // Normalize colors, improve contrast
  | "noise-reduction" // Remove speckles and grain
  | "border-crop"; // Remove margins

type ImageFormat = "png" | "jpg" | "jpeg" | "tiff" | "webp";
```

### Example

```json
{
  "driveFileId": "1x2y3z4a5b6c7d8e9f0g",
  "fileName": "enhanced-page-001.png",
  "format": "png",
  "fileSizeBytes": 2097152,
  "sha256": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0",
  "width": 2480,
  "height": 3508,
  "dpi": 300,
  "colorSpace": "RGB",
  "bitDepth": 8,
  "isPreprocessed": true,
  "preprocessingApplied": ["deskew", "color-correction", "noise-reduction"],
  "qualityMetrics": {
    "skewAngle": 1.8,
    "contrast": 0.42,
    "brightness": 0.38,
    "noiseLevel": 0.18,
    "overallQuality": "poor"
  },
  "uploadedAt": "2025-01-15T10:05:00Z",
  "processedAt": "2025-01-15T10:08:00Z"
}
```

---

## 9. Export Configuration

**Purpose:** Store export settings and generated export metadata

### TypeScript Interface

```typescript
interface ExportConfiguration {
  // Export Identity
  exportId: string; // Unique ID
  projectId: string; // Source project

  // Format & Output
  format: ExportFormat;
  outputFileName: string;

  // Content Selection
  includedPages: number[] | "all"; // Which pages to export
  includeImages: boolean;
  includeLowConfidence: boolean; // Include text with confidence < threshold
  confidenceThreshold: number; // 0-1

  // Format-Specific Options
  markdown?: MarkdownExportOptions;
  hocr?: HocrExportOptions;
  json?: JsonExportOptions;

  // Attribution
  includeAttribution: boolean; // Include contributor list
  includeVersionHistory: boolean; // Include edit history
  includeMetadata: boolean; // Include project metadata

  // Generated Export
  generatedAt?: string; // ISO 8601 timestamp
  generatedBy?: UserAttribution;
  outputFilePath?: string; // Path in repository
  outputFileSize?: number; // Bytes
  outputSha256?: string; // Checksum
}

interface MarkdownExportOptions {
  flavor: "quarto" | "pandoc" | "commonmark";
  includeYamlFrontmatter: boolean;
  useSemanticClasses: boolean; // .verse, .commentary, etc.
  languageTags: boolean; // {lang="sa"} annotations
  parallelText: boolean; // Side-by-side original + translation
  citationFormat?: string; // Citation style
  tocDepth: number; // Table of contents depth (0 = none)
}

interface HocrExportOptions {
  includeConfidence: boolean;
  includeBoundingBoxes: boolean;
  includeWordLevel: boolean; // Word-level hOCR
}

interface JsonExportOptions {
  pretty: boolean; // Pretty-print JSON
  includeRawOcr: boolean; // Include original OCR output
  includeVersionHistory: boolean;
}
```

### Example

```json
{
  "exportId": "export_001",
  "projectId": "proj_bg2025",
  "format": "markdown-quarto",
  "outputFileName": "bhagavad-gita.md",
  "includedPages": "all",
  "includeImages": false,
  "includeLowConfidence": false,
  "confidenceThreshold": 0.8,
  "markdown": {
    "flavor": "quarto",
    "includeYamlFrontmatter": true,
    "useSemanticClasses": true,
    "languageTags": true,
    "parallelText": false,
    "tocDepth": 3
  },
  "includeAttribution": true,
  "includeVersionHistory": false,
  "includeMetadata": true,
  "generatedAt": "2025-01-20T16:00:00Z",
  "generatedBy": {
    "name": "Your Name",
    "githubUsername": "yourusername",
    "githubId": 123456
  },
  "outputFilePath": "exports/markdown/bhagavad-gita.md",
  "outputFileSize": 524288,
  "outputSha256": "b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1"
}
```

---

## Schema Validation

All schemas should have corresponding JSON Schema validation files:

**Directory:** `schemas/`

```
schemas/
├── project-metadata.schema.json
├── user-profile.schema.json
├── page-annotations.schema.json
├── bounding-box.schema.json
├── version-history-entry.schema.json
├── cost-log-entry.schema.json
├── ocr-result.schema.json
├── image-metadata.schema.json
└── export-configuration.schema.json
```

**Validation Strategy:**

- Validate on write (before saving to repository)
- Validate on read (after loading from repository)
- Use JSON Schema Draft 2020-12
- Generate TypeScript types from JSON Schema (or vice versa)

---

## Data Integrity Checks

### On Write

- Validate against JSON Schema
- Check referential integrity (Drive file IDs exist)
- Verify checksums (SHA-256)
- Ensure version numbers are sequential
- Validate coordinates within image bounds

### On Read

- Validate against JSON Schema
- Verify checksums match
- Check for orphaned references
- Detect missing files

### Periodic Maintenance

- Find Drive files without GitHub references (orphans)
- Find GitHub references to missing Drive files (broken links)
- Validate all checksums
- Repair/report issues

---

## Migration Strategy

If schemas change in future versions:

1. **Version schema files**: Add `schemaVersion` field to all root objects
2. **Write migrations**: Create migration functions for each schema change
3. **Backward compatibility**: Support reading old formats
4. **Forward migrations**: Automatically upgrade on write
5. **Document changes**: Update this document with migration notes

**Example:**

```typescript
interface ProjectMetadata {
  schemaVersion: string; // e.g., "1.0.0"
  // ... rest of schema
}
```

---

## Summary

**Total Schemas Defined:** 9 core + 7 supporting types

### Core Schemas

1. ✅ Project Metadata - `metadata.json` (with box index)
2. ✅ User Profile - Session data
3. ✅ Page Annotations - `pages/page-NNN.json` (with validation status)
4. ✅ Bounding Box - Annotation structure (with inline refs & incoming refs)
5. ✅ Version History Entry - Edit tracking (18 change types)
6. ✅ Cost Tracking Log - `costs.jsonl`
7. ✅ OCR Result - OCR output
8. ✅ Image Metadata - Page image properties
9. ✅ Export Configuration - Export settings

### Supporting Types

10. ✅ InlineReference - Footnote reference metadata
11. ✅ IncomingReference - Bidirectional navigation
12. ✅ ValidationStatus - Data quality tracking
13. ✅ ValidationWarning - Error/warning messages
14. ✅ TextChange - Track text edits for offset updates
15. ✅ NumberMismatch - Reference number validation
16. ✅ BoxCoordinates - Position structure

**Key Design Decisions:**

- **Plain text JSON**: Git-friendly, human-readable
- **JSONL for logs**: Append-only, efficient
- **SHA-256 checksums**: Data integrity
- **Google Drive references**: Hybrid storage model
- **Rich version tracking**: Every edit captured (18 change types)
- **Type-safe**: Full TypeScript interfaces
- **Validation-ready**: JSON Schema compatible
- **Cross-page references**: Supported natively via box index
- **Inline footnote references**: Character offset-based with auto-update
- **Bidirectional navigation**: Reference ↔ Footnote

### Critical Data Integrity Features

**1. Character Offset Updates**

- Automatic update algorithm when text changes
- 4 cases handled: before, after, within deletion, spanning boundary
- Orphaned/needs-review flags when offsets become invalid

**2. Validation System**

- 8 warning types (orphaned refs, mismatches, etc.)
- Auto-fixable vs manual resolution
- Validation API endpoints
- Real-time validation in UI

**3. Box Index**

- Project-level index for O(1) cross-page lookups
- Automatically maintained on box create/delete
- Prevents loading all pages for validation

**4. Bidirectional Navigation**

- IncomingReferences track all references to a footnote
- Jump to/from references across pages
- Text excerpts for context

**5. Multiple Footnote Handling**

- Support for multiple refs in same sentence
- Adjacent footnotes (¹²³)
- Ordered by charOffset, validated for overlaps
- Sequential numbering with sequenceInText

---

## Next Steps

1. Generate JSON Schema files for validation
2. Implement TypeScript types in codebase
3. Create validation utilities
4. Write data integrity checks
5. Test with real data samples

---

**Status:** ✅ COMPLETE - All schemas defined and documented
