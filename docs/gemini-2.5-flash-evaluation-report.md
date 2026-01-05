# Gemini 2.5 Flash Layout Detection - Evaluation Report

**Date:** 2025-12-08
**Test Subject:** Google Gemini 2.5 Flash API for OCR & Layout Detection
**Verdict:** ❌ **REJECTED** - Unsuitable for PageSage Project
**Decision:** Abandoning Gemini 2.5 Flash; proceeding with Google Document AI instead

---

## Executive Summary

We evaluated Google Gemini 2.5 Flash as a potential low-cost alternative to Google Document AI for OCR and layout detection in the PageSage project (Ancient Text OCR & Annotation Platform). Despite promising initial results and a 26x cost advantage, **critical accuracy failures in coordinate precision and Devanagari OCR make Gemini unsuitable for historical text digitization**.

**Key Finding:** Gemini can extract English text reasonably well but fails on:

1. Accurate bounding box coordinates (wrong widths/heights)
2. Devanagari/Sanskrit text accuracy (OCR errors and hallucinations)
3. Complete content coverage (missing text blocks)
4. Image downscaling without disclosure (coordinates don't match actual image)

For a project where **data integrity is paramount** and we're working with irreplaceable historical texts, these failures are **showstoppers**.

---

## Test Setup

### Test Environment

- **Model:** `gemini-2.5-flash` (via Google Generative AI SDK)
- **Test Images:** Sanskrit/Hindi/English multi-column book pages
- **Primary Test Case:** `kalika-page-8-08.png` (complex multi-column layout)
  - Source: Kalika Purana, page 685
  - Layout: 2-column, mixed scripts (English, Sanskrit Devanagari, IAST)
  - Content: Verses, translations, footnotes, page numbers

### Test Script

- Location: `scripts/test-gemini-layout.ts`
- Visualization: `scripts/visualize-boxes.py`
- Test Date: 2025-12-08

### What We Tested

1. Bounding box detection (pixel-perfect coordinates)
2. Text extraction accuracy (especially Devanagari)
3. Multi-column layout understanding
4. Language detection
5. Reading order assignment

---

## Critical Findings

### 1. ❌ Image Downscaling Without Disclosure

**Problem:** Gemini silently downscales images and returns coordinates for the downscaled version.

**Evidence:**

- **Actual image dimensions:** 1867 × 2435 pixels
- **Gemini reported dimensions:** 846 × 1047 pixels
- **Scale factor:** ~2.2x horizontal, ~2.3x vertical

**Impact:**

```
Original image:  1867 × 2435 pixels
Gemini's image:   846 × 1047 pixels (55% smaller!)
```

All bounding box coordinates must be manually scaled up, which:

- Introduces rounding errors
- Compounds other coordinate inaccuracies
- Suggests Gemini may lose detail during downscaling
- Is not documented in API behavior

**Why This Matters:**

- Coordinate scaling adds complexity to implementation
- Non-uniform scaling (2.21x vs 2.33x) indicates aspect ratio changes
- No control over downscaling parameters
- Risk of losing fine details in dense Devanagari text

---

### 2. ❌ Bounding Box Widths Grossly Inaccurate

**Problem:** Bounding boxes extend far beyond actual text boundaries, overlapping into adjacent columns.

**Example: Block 21**

- **Content:** "King should not drink water kept in a vessal of brass matel or silver..."
- **Layout:** Left column only (single column text)
- **Gemini's width:** 444px (on 846px image) = **52% of image width**
- **Actual width needed:** ~200-250px = **~25% of image width**
- **Result:** Box extends across column boundary into right column

**Visual Evidence:**

```
┌─────────────────┬─────────────────┐
│ Column 1        │ Column 2        │
│ [Block 21 text] │                 │
│ └─────────────────────────────────┘ │  ← Gemini's box
│                 │                 │
└─────────────────┴─────────────────┘
```

**Impact:**

- Cannot reliably separate column content
- Overlapping boxes make reading order ambiguous
- Multi-column layout detection is unreliable
- Manual correction would be required for every page

---

### 3. ❌ Devanagari Text Extraction Errors

**Problem:** OCR accuracy for Sanskrit/Devanagari text is poor, with character misrecognition and hallucination.

**Example: Block 17**

**Gemini extracted:**

```
कांश्य-राजतपात्रस्थं तोयं न चाग्नरवं दर्शनम्।
```

**Actual text in bounding box:** (Visual inspection shows different characters)

- Characters don't match source image
- Word "दर्शनम्" appears to be hallucinated
- Bounding box covers 2 lines but only 1 line extracted

**Why This Is Critical:**

- PageSage digitizes historical Sanskrit texts
- Text accuracy is the #1 project requirement
- Errors in sacred/historical texts are unacceptable
- Human editors would need to verify every character

---

### 4. ❌ Missing Content Blocks

**Problem:** Many text regions are not detected at all.

**Statistics from Test:**

- **Image content:** ~60-70 distinct text blocks (estimated)
- **Gemini detected:** 43 blocks
- **Missing:** ~20-30 blocks (30-40% of content)

**What's Missing:**

- Some verse numbers
- Partial footnote text
- Column headers
- Portions of paragraphs

**Impact:**

- Incomplete digitization
- Manual identification of missing blocks required
- No guarantee which content will be missed

---

### 5. ⚠️ Overlap Issues Indicate Poor Boundary Detection

**Statistics:**

- 18 blocks with no overlaps (42%)
- 25 blocks with 1-2 overlaps (58%)
- 0 blocks with heavy overlaps (3+)

**What This Means:**

- 58% of blocks have coordinate conflicts
- Reading order becomes ambiguous with overlaps
- Column separation logic would be complex
- Human review needed to resolve conflicts

---

## Why This Matters for PageSage

### Project Requirements (from REQUIREMENTS.md)

PageSage has specific requirements that Gemini fails to meet:

#### 1. **Data Integrity & Correctness**

> "Data integrity and correctness (working with historical texts)"

**Gemini's Failures:**

- ❌ Devanagari OCR errors compromise text accuracy
- ❌ Missing content blocks create data gaps
- ❌ Cannot trust output without full human review

#### 2. **Historical Text Accuracy**

> "Character encoding: Always UTF-8, preserve special characters"
> "Devanagari support: Test with actual Sanskrit/Hindi text"

**Gemini's Failures:**

- ❌ Character misrecognition in Devanagari
- ❌ Hallucinated words that don't exist in source
- ❌ No confidence scores for individual characters

#### 3. **Multi-Column Layout Support**

> Complex layouts with verses, translations, footnotes, marginalia

**Gemini's Failures:**

- ❌ Bounding boxes cross column boundaries
- ❌ Cannot reliably separate columns
- ❌ Reading order ambiguous with overlapping boxes

#### 4. **Cost-Aware but Accuracy-First**

> "Priorities: Correctness > Maintainability > Performance"

**Verdict:**

- ✅ Gemini is cheaper ($0.27 vs $7.00 per 700-page book)
- ❌ But cost savings are worthless if output requires full manual correction
- ❌ Document AI's higher cost is justified if accuracy is better

---

## Test Results Summary

| Category                   | Status       | Notes                                       |
| -------------------------- | ------------ | ------------------------------------------- |
| English Text Extraction    | ✅ Good      | Accurate for simple English blocks          |
| Devanagari Text Extraction | ❌ Poor      | Character errors, hallucinations            |
| Bounding Box X/Y Position  | ⚠️ Fair      | Approximate but not pixel-perfect           |
| Bounding Box Width         | ❌ Poor      | Extends beyond text boundaries              |
| Bounding Box Height        | ⚠️ Fair      | Sometimes covers multiple lines incorrectly |
| Complete Content Coverage  | ❌ Poor      | 30-40% of blocks missing                    |
| Multi-Column Detection     | ❌ Poor      | Cannot separate columns reliably            |
| Reading Order              | ⚠️ Fair      | Mostly correct but overlaps cause issues    |
| Image Handling             | ❌ Poor      | Silent downscaling, no control              |
| Cost                       | ✅ Excellent | 26x cheaper than Document AI                |

---

## Cost Analysis

### Gemini 2.5 Flash

- **Cost:** ~$0.27 per 700-page book
- **Accuracy:** Insufficient for production use
- **Manual correction time:** Unknown, likely 10-20 hours per book
- **Total cost:** $0.27 + (15 hours × $50/hour) = **~$750 per book**

### Google Document AI Layout Parser

- **Cost:** ~$7.00 per 700-page book
- **Accuracy:** Unknown (needs testing)
- **Manual correction time:** Unknown (hopefully minimal)
- **Total cost:** $7.00 + (correction time × $50/hour)

**Conclusion:** Gemini's cost advantage is eliminated if human correction time exceeds 15 minutes per book.

---

## Decision: Rejecting Gemini 2.5 Flash

### Showstopper Issues

1. **Devanagari OCR errors** - Unacceptable for historical text digitization
2. **Bounding box inaccuracy** - Cannot reliably support annotation workflow
3. **Missing content blocks** - Incomplete digitization violates project requirements
4. **Silent image downscaling** - Loss of control over quality/precision

### What Would Be Needed to Use Gemini

To make Gemini viable, we would need:

1. ✅ Manual coordinate scaling (solvable, implemented)
2. ❌ Manual verification of every Devanagari character (impractical)
3. ❌ Manual identification of missing blocks (defeats automation purpose)
4. ❌ Manual correction of bounding boxes (defeats layout detection purpose)
5. ❌ Complex overlap resolution logic (brittle, unreliable)

**Estimated effort:** 50-100 hours of development + ongoing per-book correction

**Verdict:** Not worth the effort when Document AI exists.

---

## Recommendations

### Immediate Actions

1. ✅ **Abandon Gemini 2.5 Flash** for PageSage OCR/layout detection
2. ⏭️ **Test Google Document AI Layout Parser** with same test images
3. ⏭️ **Document Document AI test results** with same rigor
4. ⏭️ **Compare accuracy** (not just cost) between solutions

### Document AI Test Plan

Use the same test methodology:

1. Test with `kalika-page-8-08.png` and `mahanirvana-page-5-05.png`
2. Check bounding box accuracy (visual overlay)
3. Verify Devanagari text extraction accuracy
4. Check for missing content blocks
5. Measure coordinate precision
6. Verify multi-column separation
7. Compare cost vs accuracy tradeoff

### Fallback Options

If Document AI also fails:

1. **Hybrid approach:** Document AI for layout + Tesseract/EasyOCR for Devanagari
2. **Commercial OCR:** ABBYY FineReader (Devanagari support, expensive)
3. **Academic solutions:** Indic OCR research projects
4. **Manual layout annotation:** Skip automated layout, focus on OCR only

---

## Appendix: Test Artifacts

### Files Generated

- `test-samples/kalika-page-8-08.png` - Test image (1867×2435px)
- `test-samples/kalika-page-8-08-gemini-result.json` - Full JSON response
- `test-samples/gemini-test-summary.json` - Test summary
- `test-samples/kalika-page-8-08-annotated-fixed.png` - Visualization with overlays
- `test-samples/kalika-page-8-08-debug-block21.png` - Block 21 debug view
- `test-samples/kalika-page-8-08-debug-block17.png` - Block 17 debug view

### Scripts

- `scripts/test-gemini-layout.ts` - Main test script
- `scripts/visualize-boxes.py` - Bounding box visualization
- `scripts/debug-single-block.py` - Single block debugging

### Test Data

- 43 blocks detected
- 18 blocks with no overlaps
- 25 blocks with overlaps
- Multiple blocks with incorrect coordinates
- Multiple blocks with incorrect Devanagari text

---

## Conclusion

Despite Gemini 2.5 Flash's impressive cost advantage (26x cheaper) and strong English text extraction, **critical failures in Devanagari accuracy and bounding box precision make it unsuitable for PageSage**.

For a project digitizing irreplaceable historical Sanskrit texts where **data integrity is paramount**, we cannot accept:

- OCR errors in sacred texts
- Missing content blocks
- Unreliable coordinate systems
- Ambiguous reading order

**The decision to reject Gemini 2.5 Flash is final and justified.**

Next step: Evaluate Google Document AI Layout Parser with the same rigor and compare results.

---

**Report prepared by:** Claude (with human oversight)
**Review status:** Pending user review
**Next action:** Test Document AI Layout Parser
