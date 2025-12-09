# Architecture Update - Image Preprocessing Pipeline

**Date:** 2025-12-08
**Status:** Documentation updated, awaiting implementation
**Impact:** Critical clarification of PDF→OCR data flow

---

## Summary of Changes

Updated architecture documentation to clarify the complete image preprocessing pipeline and quality analysis workflow.

### Key Clarifications

**Problem identified:** Original architecture overview didn't clearly show:
1. How PDF pages are extracted to individual images
2. When/how preprocessing (deskew, color correction, etc.) happens
3. That OCR/layout detection runs on **enhanced images**, not original PDF pages

**Solution:** Updated documentation to show 3-phase processing with intelligent quality check.

---

## Documents Updated

### 1. ✅ **NEW: docs/quality-analysis.md**
   - Complete technical specification for image quality analysis
   - Smart preprocessing decision logic
   - **Key insight:** Sample from **middle pages** (25%, 40%, 50%, 60%, 75%), not first 5 pages
   - Reason: First pages are often covers, title pages, publisher info (not representative)
   - Quality metrics: skew, contrast, brightness, noise, borders
   - Recommendation engine: skip / optional / recommended

### 2. ✅ **UPDATED: docs/architecture-overview.md - Flow 3**
   - Added 3-phase processing flow:
     - **Phase 1:** Quality Check (~20 seconds)
     - **Phase 2A:** Preprocessing if enabled (~10-15 min)
     - **Phase 2B:** Direct extraction if skipped (~5 min)
     - **Phase 3:** AI Layout Detection (~5-10 min)
   - Clarified storage:
     - Original PDF: `original.pdf` in Google Drive
     - Enhanced images: `enhanced-page-NNN.png` OR `page-NNN.png` if preprocessing skipped
     - OCR runs on enhanced/original images, NOT PDF directly

### 3. ✅ **UPDATED: docs/data-schemas.md - ImageMetadata**
   - Added `qualityMetrics` field with analysis results:
     - `skewAngle`, `contrast`, `brightness`, `noiseLevel`, `overallQuality`
   - Enhanced `preprocessingApplied` with typed operations:
     - `deskew`, `color-correction`, `noise-reduction`, `border-crop`
   - Updated example to show `enhanced-page-001.png` naming

### 4. ✅ **EXISTING: docs/pdf-processing-pipeline.md**
   - Already had complete technical implementation details
   - No changes needed - comprehensive coverage

---

## Architecture Decision: Smart Preprocessing

### Approach

**Hybrid user choice with intelligent recommendation:**

1. After PDF upload, analyze 5 sample pages from **middle of book**
2. Calculate quality metrics and make recommendation
3. Show user-friendly UI with recommendation
4. User decides: enable preprocessing or skip
5. Store decision in project metadata

### Sample Page Selection

```typescript
// For 700-page book:
// Skip first 10% (pages 1-70): covers, title, TOC
// Skip last 10% (pages 631-700): appendix, index
// Sample from middle 80% (pages 71-630)

Sample positions: 25%, 40%, 50%, 60%, 75%
Sample pages: 210, 280, 350, 420, 490
```

**Why this matters:**
- First 5 pages (1-5): Often different quality than main content
- Middle 5 pages (210-490): Representative of actual book content that needs OCR

### Recommendation Logic

| Pages Needing Work | Quality | Recommendation | Time Savings |
|-------------------|---------|----------------|--------------|
| 0-1 / 5 | Excellent/Good | **Skip** | ~15 minutes |
| 2 / 5 | Good/Fair | **Optional** | - |
| 3+ / 5 | Fair/Poor | **Recommended** | - |

### User Experience

```
[After PDF upload]

🔍 Analyzing scan quality... (checking pages 210, 280, 350, 420, 490)

┌───────────────────────────────────────────────┐
│ Scan Quality Assessment                       │
├───────────────────────────────────────────────┤
│ Quality: POOR                                 │
│                                               │
│ ⚠️ Poor scan quality detected                │
│ 4/5 sample pages need correction             │
│                                               │
│ Issues found:                                 │
│ • Skewed pages (1.5-2.3°)                    │
│ • Low contrast (washed out)                  │
│ • Background noise/speckles                  │
│                                               │
│ Preprocessing strongly recommended for       │
│ accurate OCR results.                        │
│                                               │
│ [✅ Enable Preprocessing] [Skip Anyway]      │
└───────────────────────────────────────────────┘
```

---

## Technical Implementation

### Quality Analysis Function

```typescript
async function quickQualityCheck(pdfPath: string): Promise<QualityCheckResult> {
  // 1. Get sample pages from middle
  const samplePages = await getSamplePageNumbers(pdfPath);
  // [210, 280, 350, 420, 490] for 700-page book

  // 2. Extract those specific pages
  for (const pageNum of samplePages) {
    await execAsync(`pdftoppm -png -r 300 -f ${pageNum} -l ${pageNum} ...`);
  }

  // 3. Analyze each
  const analyses = await Promise.all(samplePages.map(analyzeImageQuality));

  // 4. Make recommendation
  const pagesNeedingWork = analyses.filter(a => a.needsPreprocessing).length;

  if (pagesNeedingWork === 0) return 'skip';
  if (pagesNeedingWork <= 2) return 'optional';
  return 'recommended';
}
```

### Quality Metrics (per page)

```typescript
interface QualityAssessment {
  skewAngle: number;           // 0-10+ degrees (0 = perfect)
  contrast: number;            // 0-1 (0.7+ = excellent)
  brightness: number;          // 0-1 (0.4-0.8 = good range)
  noiseLevel: number;          // 0-1 (< 0.05 = clean)
  hasBorders: boolean;         // Large margins to crop?

  overallQuality: 'excellent' | 'good' | 'fair' | 'poor';
  needsPreprocessing: boolean;
  recommendedOperations: {
    deskew: boolean;
    colorCorrect: boolean;
    denoise: boolean;
    crop: boolean;
  };
}
```

### Detection Methods

| Metric | Tool | Method |
|--------|------|--------|
| **Skew** | ImageMagick | `convert -deskew 40% -verbose` |
| **Contrast** | Sharp | `stats().channels[0].stdev / 128` |
| **Brightness** | Sharp | `stats().channels[0].mean / 255` |
| **Noise** | Sharp | Standard deviation of pixel values |
| **Borders** | Sharp | Scan edges for white margins |

---

## Data Flow: Complete Picture

```
User uploads PDF (500MB)
    ↓
Backend uploads to Google Drive → original.pdf
    ↓
Backend creates GitHub repo + metadata.json
    ↓
───────────────────────────────────────────────────
PHASE 1: QUALITY CHECK (15-25 seconds)
───────────────────────────────────────────────────
Worker downloads PDF
    ↓
Extract 5 pages from MIDDLE: 25%, 40%, 50%, 60%, 75%
    ↓
Analyze each page:
  - Skew: 1.8°, 0.3°, 2.1°, 1.5°, 0.9°
  - Contrast: 0.42, 0.68, 0.35, 0.51, 0.73
  - Brightness: 0.38, 0.62, 0.33, 0.55, 0.70
  - Noise: 0.18, 0.06, 0.22, 0.14, 0.04
    ↓
Aggregate: 3/5 pages need preprocessing
Recommendation: RECOMMENDED
    ↓
Show UI to user: Enable preprocessing?
    ↓
User clicks: [✅ Enable Preprocessing]
    ↓
───────────────────────────────────────────────────
PHASE 2A: PREPROCESSING (10-15 minutes)
───────────────────────────────────────────────────
For each page 1-700:
  Extract PDF page → /tmp/original-page-NNN.png
      ↓
  Deskew → /tmp/deskewed.png
  Color correct → /tmp/color-corrected.png
  Denoise → /tmp/denoised.png
  Crop borders → /tmp/enhanced-page-NNN.png
      ↓
  Upload to Google Drive → enhanced-page-NNN.png
      ↓
  Save metadata:
    {
      image: {
        driveFileId: "...",
        fileName: "enhanced-page-NNN.png",
        isPreprocessed: true,
        preprocessingApplied: ["deskew", "color-correction", "noise-reduction", "border-crop"],
        qualityMetrics: { skewAngle: 1.8, contrast: 0.42, ... }
      }
    }
    ↓
───────────────────────────────────────────────────
PHASE 3: AI LAYOUT DETECTION (5-10 minutes)
───────────────────────────────────────────────────
For each page 1-700:
  Download enhanced-page-NNN.png from Drive
      ↓
  Call Gemini 2.5 Flash API with ENHANCED image
      ↓
  Get layout + OCR results
      ↓
  Create page-NNN.json with annotations
      ↓
  Commit to GitHub
      ↓
Done!
```

---

## Storage Architecture

### Google Drive Structure

```
/PageSage Books/
  /book-proj_abc123-bhagavad-gita/
    original.pdf                    ← User upload (500MB)
    enhanced-page-001.png           ← Preprocessed (2MB)
    enhanced-page-002.png
    ...
    enhanced-page-700.png
```

### GitHub Repository Structure

```
pagesage-books/book-proj_abc123-bhagavad-gita/
  metadata.json                     ← Project metadata
  pages/
    page-001.json                   ← Annotations + version history
    page-002.json
    ...
    page-700.json
  costs.jsonl                       ← Cost tracking log
  exports/
    markdown/
      book.md                       ← Generated export
```

### Key Files

**metadata.json:**
```json
{
  "projectId": "proj_abc123",
  "sourceDocument": {
    "driveFileId": "1a2b3c4d5e6f",  // original.pdf
    "sha256": "..."
  },
  "preprocessing": {
    "enabled": true,
    "recommendation": "recommended",
    "qualityCheckResults": {
      "overallQuality": "poor",
      "pagesAnalyzed": [210, 280, 350, 420, 490],
      "pagesNeedingWork": 4
    }
  }
}
```

**page-001.json:**
```json
{
  "pageId": "page-001",
  "image": {
    "driveFileId": "7g8h9i0j1k2l",  // enhanced-page-001.png
    "fileName": "enhanced-page-001.png",
    "isPreprocessed": true,
    "preprocessingApplied": ["deskew", "color-correction", "noise-reduction"],
    "qualityMetrics": {
      "skewAngle": 1.8,
      "contrast": 0.42,
      "brightness": 0.38,
      "noiseLevel": 0.18,
      "overallQuality": "poor"
    }
  },
  "currentState": {
    "boundingBoxes": [...]
  },
  "versionHistory": [{
    "version": 1,
    "changeType": "ai_generated",
    "processedFrom": "enhanced-image",  // or "original-image"
    "timestamp": "2025-01-15T10:15:00Z"
  }]
}
```

---

## Performance Impact

### Timing Breakdown (700-page book)

| Phase | With Preprocessing | Without Preprocessing |
|-------|-------------------|----------------------|
| Quality Check | ~20 seconds | ~20 seconds |
| Image Extraction | ~5 minutes | ~5 minutes |
| **Preprocessing** | **~10-15 minutes** | **Skipped** |
| AI Layout Detection | ~5-10 minutes | ~5-10 minutes |
| **Total** | **~20-30 minutes** | **~10-15 minutes** |

### Trade-offs

**Skip preprocessing (faster):**
- ✅ 50% faster (10-15 minutes saved)
- ⚠️ Lower OCR accuracy (more manual corrections needed)
- ⚠️ AI must handle quality issues (may fail on poor scans)

**Enable preprocessing (higher quality):**
- ✅ Better OCR accuracy (fewer manual corrections)
- ✅ Consistent quality for AI processing
- ⚠️ 50% slower (~15 minutes additional time)

---

## Next Steps

### Implementation Priority

1. **Implement quality analysis functions** (docs/quality-analysis.md)
   - `detectSkewAngle()` using ImageMagick
   - `analyzeContrast()`, `analyzeBrightness()`, `analyzeNoise()` using Sharp
   - `detectBorders()` with edge scanning

2. **Implement sample page selection**
   - `getSamplePageNumbers()` - calculate middle pages
   - Extract specific pages with pdftoppm

3. **Create quality check UI**
   - SSE endpoint for real-time updates
   - Svelte component for quality report
   - User decision capture

4. **Update worker pipeline**
   - Add 3-phase job structure
   - Conditional preprocessing based on user choice
   - Track which images were preprocessed

5. **Update data schemas in code**
   - Add `qualityMetrics` to ImageMetadata interface
   - Add `preprocessing` section to ProjectMetadata
   - Update version history to track `processedFrom`

### Testing Requirements

1. Test with both sample PDFs:
   - `san with hindi-ch4 mahanirvana.pdf` (simple)
   - `kalika few pgs.pdf` (complex)

2. Verify quality analysis accuracy:
   - Manually check 10 pages
   - Compare detected skew with visual inspection
   - Validate contrast/brightness recommendations

3. Compare OCR accuracy:
   - Run same page with and without preprocessing
   - Measure character accuracy differences
   - Determine if time investment is worth quality improvement

---

## Documentation Status

| Document | Status | Notes |
|----------|--------|-------|
| quality-analysis.md | ✅ **NEW** | Complete technical spec |
| architecture-overview.md | ✅ **UPDATED** | Flow 3 rewritten with 3 phases |
| data-schemas.md | ✅ **UPDATED** | Added qualityMetrics to ImageMetadata |
| pdf-processing-pipeline.md | ✅ No changes needed | Already comprehensive |

---

## References

- Quality analysis: `docs/quality-analysis.md`
- Architecture overview: `docs/architecture-overview.md` (Flow 3)
- Data schemas: `docs/data-schemas.md` (ImageMetadata)
- PDF pipeline: `docs/pdf-processing-pipeline.md`

---

**Author:** Claude Code
**Approved by:** kramnat
**Date:** 2025-12-08
