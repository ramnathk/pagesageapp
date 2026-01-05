# Document AI OCR Testing Guide

Comprehensive testing of Google Document AI Enterprise OCR for the PageSage project.

## Overview

This test evaluates Google Document AI as an alternative to Gemini 2.5 Flash for OCR and layout detection, specifically focusing on:

- **Multi-language support** (English, Sanskrit/Hindi Devanagari, IAST transliteration)
- **Precise bounding boxes** with pixel-perfect coordinates
- **High-fidelity text extraction** from historical texts
- **Image quality assessment**
- **Confidence scores** for all detected elements

## Prerequisites

### 1. Google Cloud Project Setup

1. **Create or select a Google Cloud project**

   ```bash
   # Visit: https://console.cloud.google.com/
   ```

2. **Enable the Document AI API**

   ```bash
   # Visit: https://console.cloud.google.com/apis/library/documentai.googleapis.com
   # Click "ENABLE"
   ```

3. **Enable billing** (required for Document AI)
   - Document AI requires a billing account
   - Pricing: https://cloud.google.com/document-ai/pricing
   - Enterprise OCR: ~$1.50 per 1000 pages (first 500 free/month)

### 2. Service Account Setup

1. **Create a service account**

   ```bash
   # Visit: https://console.cloud.google.com/iam-admin/serviceaccounts
   # Click "CREATE SERVICE ACCOUNT"
   ```

2. **Grant Document AI Editor role**
   - Role: `roles/documentai.editor`
   - Permissions: Process documents, manage processors

3. **Create and download JSON key**
   - Click on the service account
   - Go to "KEYS" tab
   - Add Key → Create new key → JSON
   - Download and save securely (e.g., `~/.gcp/documentai-key.json`)

4. **Set environment variable**
   ```bash
   export GOOGLE_APPLICATION_CREDENTIALS="$HOME/.gcp/documentai-key.json"
   ```

### 3. Create OCR Processor

1. **Visit Document AI Processors page**

   ```bash
   # URL: https://console.cloud.google.com/ai/document-ai/processors
   ```

2. **Create new processor**
   - Click "CREATE PROCESSOR"
   - Select "Document OCR" category
   - Choose "Enterprise Document OCR"
   - Select region: `us` or `eu`
   - Name: `PageSage OCR Test`

3. **Copy Processor ID**
   - After creation, click on the processor
   - Copy the Processor ID (format: `abc123def456...`)

4. **Set environment variable**
   ```bash
   export DOCUMENT_AI_PROCESSOR_ID="your-processor-id"
   export DOCUMENT_AI_LOCATION="us"  # or "eu"
   ```

### 4. Set Project ID

```bash
export GOOGLE_CLOUD_PROJECT_ID="your-project-id"
```

## Quick Start

### 1. Run Setup Script

```bash
chmod +x scripts/setup-document-ai-test.sh
./scripts/setup-document-ai-test.sh
```

This will:

- ✅ Check Node.js and npm
- ✅ Install `@google-cloud/documentai` package
- ✅ Verify authentication
- ✅ Check project configuration
- ✅ Verify processor exists

### 2. Run OCR Test

```bash
npx tsx scripts/test-document-ai-ocr.ts test-samples/kalika-page-8-08.png
```

### 3. Visualize Results

```bash
python3 scripts/visualize-boxes.py \
  test-samples/kalika-page-8-08.png \
  test-samples/kalika-page-8-08-documentai-result.json \
  test-samples/kalika-page-8-08-documentai-annotated.png
```

## Test Features

### Maximum Fidelity Configuration

The test script enables **all high-fidelity features**:

```typescript
ocrConfig: {
  // Core features
  enableNativePdfParsing: true,      // Better PDF text extraction
  enableImageQualityScores: true,    // Detect image defects
  enableSymbol: true,                // Character-level detection

  // Language optimization
  languageHints: ['en', 'hi', 'sa'], // English, Hindi, Sanskrit

  // Premium features
  premiumFeatures: {
    computeStyleInfo: true,          // Font/style information
  }
}
```

### What Gets Tested

1. **Text Extraction Accuracy**
   - English prose (translations, commentary)
   - Sanskrit verses in Devanagari script
   - IAST transliteration with diacritics
   - Verse numbers and footnotes

2. **Layout Detection**
   - Hierarchical structure: Blocks → Paragraphs → Lines → Tokens
   - Bounding boxes with pixel coordinates
   - Multi-column layout detection
   - Reading order preservation

3. **Quality Metrics**
   - Image quality scores (8 defect dimensions)
   - Per-element confidence scores
   - Language detection with confidence
   - Symbol-level accuracy

4. **Coordinate Accuracy**
   - Actual pixel coordinates (no scaling needed!)
   - Normalized coordinates (0-1 range)
   - Precise bounding polygons
   - Proper column separation

## Output Files

### 1. JSON Result File

**Location**: `test-samples/<image-name>-documentai-result.json`

**Contents**:

```json
{
  "processor": "Document AI Enterprise OCR",
  "imageWidth": 1867,
  "imageHeight": 2435,
  "fullText": "...",
  "pages": [{
    "pageNumber": 1,
    "dimensions": { "width": 1867, "height": 2435 },
    "detectedLanguages": [
      { "languageCode": "hi", "confidence": 0.85 },
      { "languageCode": "en", "confidence": 0.95 }
    ],
    "imageQuality": {
      "qualityScore": 0.92,
      "detectedDefects": [...]
    },
    "blocks": [
      {
        "id": "block-0",
        "text": "...",
        "boundingBox": { "x": 100, "y": 200, "width": 500, "height": 50 },
        "confidence": 0.98
      }
    ]
  }],
  "rawDocument": { /* Full Document AI response */ }
}
```

### 2. Annotated Image

**Location**: `test-samples/<image-name>-documentai-annotated.png`

**Features**:

- Bounding boxes overlaid on original image
- Color-coded by overlap count:
  - 🟢 Green = No overlaps
  - 🟠 Orange = 1-2 overlaps
  - 🔴 Red = 3-4 overlaps
  - 🟣 Magenta = 5+ overlaps

## Comparison with Gemini

### Why We're Testing Document AI

Gemini 2.5 Flash was **rejected** for PageSage due to critical failures (see `docs/gemini-2.5-flash-evaluation-report.md`):

- ❌ **Devanagari OCR errors**: Character misrecognition and hallucinations
- ❌ **Bounding box inaccuracy**: Widths 2x too large, crossing column boundaries
- ❌ **Image downscaling**: Silent downscaling from 1867×2435 to 846×1047
- ❌ **Missing content**: 30-40% of page blocks not detected
- ❌ **Poor column separation**: Cannot reliably separate multi-column layouts

Document AI is expected to perform significantly better on all these criteria.

### Feature Comparison

| Feature                   | Document AI Enterprise OCR            | Gemini 2.5 Flash                         | Winner                    |
| ------------------------- | ------------------------------------- | ---------------------------------------- | ------------------------- |
| **Coordinate System**     | ✅ Actual pixels, no scaling          | ❌ Downscaled 2.2× (846px vs 1867px)     | 🏆 Document AI            |
| **Bounding Box Accuracy** | ✅ _To be tested_                     | ❌ Width 2× too wide, crosses columns    | 🏆 Document AI (expected) |
| **Devanagari/Sanskrit**   | ✅ Native Hindi/Sanskrit support      | ❌ Character errors, hallucinations      | 🏆 Document AI (expected) |
| **Text Extraction**       | ✅ _To be tested_                     | ⚠️ Good for English, poor for Devanagari | 🏆 Document AI (expected) |
| **Layout Hierarchy**      | ✅ 4 levels (block→para→line→token)   | ❌ Flat blocks only                      | 🏆 Document AI            |
| **Confidence Scores**     | ✅ Per element at all levels          | ⚠️ Per block only                        | 🏆 Document AI            |
| **Image Quality**         | ✅ 8-dimension quality assessment     | ❌ Not provided                          | 🏆 Document AI            |
| **Content Coverage**      | ✅ _To be tested_                     | ❌ 30-40% blocks missing                 | 🏆 Document AI (expected) |
| **Language Detection**    | ✅ With confidence percentages        | ✅ Basic detection                       | 🏆 Document AI            |
| **Cost (700-page book)**  | ⚠️ ~$0.30-7.00 (depends on free tier) | ✅ $0.27                                 | 🏆 Gemini                 |
| **Speed**                 | ⚠️ _To be tested_                     | ✅ Fast (~2-5 seconds)                   | 🏆 Gemini (expected)      |

### Cost Analysis

| Scenario                   | Document AI      | Gemini 2.5 Flash  | Notes                                          |
| -------------------------- | ---------------- | ----------------- | ---------------------------------------------- |
| **Single 700-page book**   | $0.30            | $0.27             | Gemini cheaper                                 |
| **Annual (50 books)**      | $43.50           | $13.50            | Gemini cheaper                                 |
| **With manual correction** | $43.50 + 0 hours | $13.50 + 50 hours | Document AI cheaper if Gemini needs correction |

**Key Insight**: Gemini's cost advantage disappears if manual correction takes more than 1 hour per book.

### Run Both Tests

```bash
# Gemini test (already run)
npx tsx scripts/test-gemini-layout.ts test-samples/kalika-page-8-08.png

# Document AI test
npx tsx scripts/test-document-ai-ocr.ts test-samples/kalika-page-8-08.png
```

### Side-by-Side Comparison

```bash
# Visualize both
python3 scripts/visualize-boxes.py \
  test-samples/kalika-page-8-08.png \
  test-samples/kalika-page-8-08-gemini-result.json \
  test-samples/kalika-page-8-08-gemini-viz.png

python3 scripts/visualize-boxes.py \
  test-samples/kalika-page-8-08.png \
  test-samples/kalika-page-8-08-documentai-result.json \
  test-samples/kalika-page-8-08-documentai-viz.png

# Open both images to compare
open test-samples/kalika-page-8-08-gemini-viz.png
open test-samples/kalika-page-8-08-documentai-viz.png
```

### Evaluation Criteria

When comparing results, focus on:

1. **✅ Devanagari Accuracy** (CRITICAL)
   - Character-level correctness
   - No hallucinated words
   - Proper handling of diacritics
   - Verse numbers preserved

2. **✅ Bounding Box Precision** (CRITICAL)
   - Boxes fit actual text (not 2× too wide)
   - Column boundaries respected
   - No cross-column overlaps
   - Proper reading order

3. **✅ Complete Content Coverage** (CRITICAL)
   - All text blocks detected
   - No missing paragraphs/verses
   - Footnotes captured
   - Page numbers included

4. **✅ Confidence Scores** (IMPORTANT)
   - Realistic confidence values
   - Low confidence flags problem areas
   - Useful for prioritizing human review

5. **⚠️ Cost** (MODERATE)
   - Only matters if accuracy is acceptable
   - Manual correction time is the real cost

## Troubleshooting

### Permission Denied Error

```
Error: 7 PERMISSION_DENIED: Permission 'documentai.processors.processDocument' denied
```

**Solutions**:

1. Check service account has `roles/documentai.editor` role
2. Verify `GOOGLE_APPLICATION_CREDENTIALS` points to correct key file
3. Ensure Document AI API is enabled in your project

### Processor Not Found Error

```
Error: 5 NOT_FOUND: Processor not found
```

**Solutions**:

1. Verify `DOCUMENT_AI_PROCESSOR_ID` is correct
2. Check processor exists in specified location (`us` or `eu`)
3. Ensure `DOCUMENT_AI_LOCATION` matches processor location

### Quota Exceeded Error

```
Error: 8 RESOURCE_EXHAUSTED: Quota exceeded
```

**Solutions**:

1. Check quotas: https://console.cloud.google.com/iam-admin/quotas
2. Request quota increase if needed
3. Use batch processing for large volumes
4. First 500 pages/month are free, then $1.50 per 1000 pages

### Image Too Large Error

```
Error: 3 INVALID_ARGUMENT: Document size exceeds 20MB limit
```

**Solutions**:

1. Compress image before processing
2. Reduce DPI (300 DPI is usually sufficient for OCR)
3. Split multi-page PDFs into smaller batches

## Cost Estimation

### Document AI Pricing (as of 2024)

- **First 500 pages/month**: FREE
- **Additional pages**: $1.50 per 1000 pages
- **Region**: US and EU pricing is same

### PageSage Project Estimate

**700-page book**:

- Pages 1-500: $0 (free tier)
- Pages 501-700: 200 pages × ($1.50 / 1000) = $0.30
- **Total per book**: ~$0.30 (within free tier limits)

**Annual cost (50 books)**:

- 50 books × 700 pages = 35,000 pages
- First 6,000 pages: $0 (500/month × 12 months free)
- Remaining 29,000 pages: 29 × $1.50 = $43.50
- **Total annual cost**: ~$43.50

## Environment Variables Reference

```bash
# Required
export GOOGLE_CLOUD_PROJECT_ID="your-project-id"
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/key.json"
export DOCUMENT_AI_PROCESSOR_ID="processor-id"

# Optional
export DOCUMENT_AI_LOCATION="us"  # Default: "us", options: "us" or "eu"
```

### Persistent Configuration

Add to `~/.bashrc` or `~/.zshrc`:

```bash
# Document AI Configuration
export GOOGLE_CLOUD_PROJECT_ID="pagesage-project"
export GOOGLE_APPLICATION_CREDENTIALS="$HOME/.gcp/documentai-key.json"
export DOCUMENT_AI_PROCESSOR_ID="abc123def456..."
export DOCUMENT_AI_LOCATION="us"
```

## Next Steps

After running tests:

1. **Evaluate Results**
   - Compare text extraction accuracy (especially Devanagari)
   - Check bounding box precision
   - Verify no missing content blocks
   - Review confidence scores

2. **Generate Comparison Report**
   - Document AI vs Gemini accuracy
   - Cost-benefit analysis
   - Recommendations for PageSage

3. **Make Architectural Decision**
   - Choose primary OCR engine
   - Define fallback strategies
   - Plan integration approach

## References

- [Document AI Documentation](https://cloud.google.com/document-ai/docs)
- [Enterprise OCR Guide](https://cloud.google.com/document-ai/docs/process-documents-ocr)
- [Pricing Calculator](https://cloud.google.com/document-ai/pricing)
- [API Reference](https://cloud.google.com/document-ai/docs/reference)
- [Language Support](https://cloud.google.com/document-ai/docs/languages)

---

**Created**: 2025-12-08
**Purpose**: PageSage OCR engine evaluation
**Status**: Ready for testing
