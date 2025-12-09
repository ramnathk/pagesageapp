# Image Quality Analysis - Technical Specification

**Last Updated:** 2025-12-08
**Status:** Technical specification

This document details how to analyze PDF scan quality to intelligently decide if preprocessing is needed.

---

## Overview: Smart Preprocessing Decision

**Problem:** Not all PDFs need preprocessing. Perfect scans waste 10-15 minutes on unnecessary processing.

**Solution:** Analyze sample pages from the **middle of the book** to determine quality and recommend preprocessing.

**Why middle pages?**
- ❌ First 5 pages: Often covers, title pages, publisher info (different quality)
- ✅ Middle 5 pages: Actual book content (representative of what needs OCR)

---

## Sample Page Selection Strategy

```typescript
async function getSamplePageNumbers(pdfPath: string): Promise<number[]> {
  // 1. Get total page count
  const { stdout } = await execAsync(`pdfinfo "${pdfPath}"`);
  const pageCountMatch = stdout.match(/Pages:\s+(\d+)/);

  if (!pageCountMatch) {
    throw new Error('Could not determine PDF page count');
  }

  const totalPages = parseInt(pageCountMatch[1]);

  // 2. Sample 5 pages distributed through middle section
  // Skip first 10% and last 10% (intro/appendix material)
  const startPage = Math.ceil(totalPages * 0.1);  // 10% in
  const endPage = Math.floor(totalPages * 0.9);   // 90% in
  const middleRange = endPage - startPage;

  // Sample at 25%, 40%, 50%, 60%, 75% through the content section
  const samplePositions = [0.25, 0.40, 0.50, 0.60, 0.75];
  const samplePages = samplePositions.map(pos =>
    Math.floor(startPage + middleRange * pos)
  );

  return samplePages;
}

// Example for 700-page book:
// startPage = 70, endPage = 630
// Samples: pages 210, 280, 350, 420, 490
```

---

## Complete Quality Check Function

```typescript
interface QualityCheckResult {
  recommendation: 'skip' | 'optional' | 'recommended';
  quality: 'excellent' | 'good' | 'fair' | 'poor';
  timeSavings: string | null;
  confidence: 'high' | 'medium' | 'low';
  details: {
    pagesAnalyzed: number[];
    totalPages: number;
    pagesNeedingPreprocessing: number;
    avgIssuesPerPage: number;
    commonIssues: string[];
  };
  message: string;
  analyses: QualityAssessment[];
}

async function quickQualityCheck(pdfPath: string): Promise<QualityCheckResult> {
  const startTime = Date.now();

  // 1. Get sample page numbers from middle of book
  const samplePages = await getSamplePageNumbers(pdfPath);
  const totalPages = await getTotalPages(pdfPath);

  console.log(`Analyzing pages ${samplePages.join(', ')} of ${totalPages}...`);

  // 2. Extract only those specific pages
  const tempDir = `/tmp/quality-check-${Date.now()}`;
  await fs.mkdir(tempDir, { recursive: true });

  const extractedFiles: string[] = [];

  for (const pageNum of samplePages) {
    const outputPath = `${tempDir}/page-${pageNum}.png`;

    // Extract single page at 300 DPI
    await execAsync(
      `pdftoppm -png -r 300 -f ${pageNum} -l ${pageNum} "${pdfPath}" "${tempDir}/page"`
    );

    // pdftoppm creates: page-1.png (numbered from extraction start)
    // Rename to page-{actual}.png
    const generatedFile = `${tempDir}/page-1.png`;
    await fs.rename(generatedFile, outputPath);

    extractedFiles.push(outputPath);
  }

  // 3. Analyze each sample page in parallel
  const analyses = await Promise.all(
    extractedFiles.map(analyzeImageQuality)
  );

  // 4. Aggregate results
  const pagesNeedingPreprocessing = analyses.filter(a => a.needsPreprocessing).length;
  const avgIssuesPerPage = analyses.reduce((sum, a) => sum + a.issueCount, 0) / analyses.length;

  // Identify common issues across pages
  const issueFrequency = {
    skew: analyses.filter(a => a.recommendedOperations.deskew).length,
    contrast: analyses.filter(a => a.recommendedOperations.colorCorrect).length,
    noise: analyses.filter(a => a.recommendedOperations.denoise).length,
    borders: analyses.filter(a => a.recommendedOperations.crop).length
  };

  const commonIssues = Object.entries(issueFrequency)
    .filter(([_, count]) => count >= 3) // Present in 3+ pages
    .map(([issue]) => issue);

  // 5. Make recommendation
  let recommendation: 'skip' | 'optional' | 'recommended';
  let quality: 'excellent' | 'good' | 'fair' | 'poor';
  let confidence: 'high' | 'medium' | 'low';
  let message: string;
  let timeSavings: string | null = null;

  if (pagesNeedingPreprocessing === 0) {
    recommendation = 'skip';
    quality = 'excellent';
    confidence = 'high';
    timeSavings = '~15 minutes';
    message = `✅ Excellent scan quality! All ${analyses.length} sample pages are clean. ` +
              `Preprocessing not needed - saves 15 minutes.`;

  } else if (pagesNeedingPreprocessing === 1) {
    recommendation = 'optional';
    quality = 'good';
    confidence = 'high';
    message = `✓ Good quality. Only 1/${analyses.length} pages needs preprocessing. ` +
              `Optional - preprocessing may slightly improve OCR accuracy.`;

  } else if (pagesNeedingPreprocessing === 2) {
    recommendation = 'optional';
    quality = 'good';
    confidence = 'medium';
    message = `⚠️ Fair quality. ${pagesNeedingPreprocessing}/${analyses.length} pages need preprocessing. ` +
              `Common issues: ${commonIssues.join(', ')}. ` +
              `Recommended for best OCR results.`;

  } else if (pagesNeedingPreprocessing <= 3) {
    recommendation = 'recommended';
    quality = 'fair';
    confidence = 'high';
    message = `⚠️ Multiple quality issues found in ${pagesNeedingPreprocessing}/${analyses.length} pages. ` +
              `Issues: ${commonIssues.join(', ')}. ` +
              `Preprocessing strongly recommended for accurate OCR.`;

  } else {
    recommendation = 'recommended';
    quality = 'poor';
    confidence = 'high';
    message = `🔴 Poor scan quality. ${pagesNeedingPreprocessing}/${analyses.length} pages need correction. ` +
              `Issues: ${commonIssues.join(', ')}. ` +
              `Preprocessing essential for usable OCR results.`;
  }

  // 6. Cleanup
  await fs.rm(tempDir, { recursive: true });

  const duration = Date.now() - startTime;
  console.log(`Quality check completed in ${(duration / 1000).toFixed(1)}s`);

  return {
    recommendation,
    quality,
    timeSavings,
    confidence,
    details: {
      pagesAnalyzed: samplePages,
      totalPages,
      pagesNeedingPreprocessing,
      avgIssuesPerPage: parseFloat(avgIssuesPerPage.toFixed(1)),
      commonIssues
    },
    message,
    analyses
  };
}
```

---

## Quality Analysis Metrics

### 1. Skew Detection (Rotation Angle)

```typescript
async function detectSkewAngle(imagePath: string): Promise<number> {
  // Use ImageMagick to detect and report skew angle
  const tempOutput = `${imagePath}.deskewed.png`;

  try {
    const { stderr } = await execAsync(
      `convert "${imagePath}" -deskew 40% -verbose "${tempOutput}" 2>&1`
    );

    // Parse: "Deskew: 2.34 degrees"
    const match = stderr.match(/Deskew:\s+([-\d.]+)\s+degrees/i);
    const angle = match ? parseFloat(match[1]) : 0;

    await fs.unlink(tempOutput).catch(() => {}); // Cleanup

    return Math.abs(angle);

  } catch (error) {
    return 0; // Assume no skew if detection fails
  }
}

// Thresholds:
// < 0.5°  : Excellent (no correction needed)
// < 1.0°  : Good
// < 2.0°  : Fair (correction recommended)
// >= 2.0° : Poor (correction required)
```

---

### 2. Contrast Analysis

```typescript
async function analyzeContrast(imagePath: string): Promise<number> {
  const { channels } = await sharp(imagePath)
    .greyscale()
    .stats();

  const channel = channels[0];

  // Contrast = standard deviation / 128
  // High stddev = good separation between light/dark
  const contrast = channel.stdev / 128;

  return Math.min(contrast, 1.0); // Normalize to 0-1
}

// Thresholds:
// >= 0.7 : Excellent (crisp, clear)
// >= 0.5 : Good
// >= 0.3 : Fair (correction helps)
// < 0.3  : Poor (washed out, correction required)
```

---

### 3. Brightness Analysis

```typescript
async function analyzeBrightness(imagePath: string): Promise<number> {
  const { channels } = await sharp(imagePath)
    .greyscale()
    .stats();

  // Brightness = mean pixel value normalized to 0-1
  const brightness = channels[0].mean / 255;

  return brightness;
}

// Thresholds:
// 0.45-0.75 : Excellent (good exposure)
// 0.40-0.80 : Good
// 0.35-0.85 : Fair
// Otherwise  : Poor (too dark or blown out)
```

---

### 4. Noise Level Detection

```typescript
async function analyzeNoise(imagePath: string): Promise<number> {
  const { channels } = await sharp(imagePath)
    .greyscale()
    .stats();

  // Noise ≈ standard deviation of pixel values
  // (simplified - works well for scanned documents)
  const noiseLevel = channels[0].stdev / 255;

  return noiseLevel;
}

// Thresholds:
// < 0.05  : Excellent (clean)
// < 0.10  : Good (minimal noise)
// < 0.15  : Fair (visible noise, denoise helps)
// >= 0.15 : Poor (noisy, denoise required)
```

---

### 5. Border Detection

```typescript
async function detectBorders(imagePath: string): Promise<{
  hasBorders: boolean;
  borderSizes: { top: number; right: number; bottom: number; left: number };
}> {
  const { data, info } = await sharp(imagePath)
    .greyscale()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const width = info.width;
  const height = info.height;
  const threshold = 240; // White = > 240

  // Scan from each edge inward until we hit content

  // Top border
  let topBorder = 0;
  for (let y = 0; y < height * 0.2; y++) { // Check first 20%
    let whitePixels = 0;
    for (let x = 0; x < width; x++) {
      if (data[y * width + x] > threshold) whitePixels++;
    }
    if (whitePixels / width < 0.95) break; // Found content row
    topBorder = y;
  }

  // Similar for bottom, left, right...
  // (full implementation in previous response)

  const borderSizes = {
    top: topBorder,
    right: 0, // simplified
    bottom: 0,
    left: 0
  };

  // Has borders if any edge > 5% of dimension
  const hasBorders =
    topBorder > height * 0.05;

  return { hasBorders, borderSizes };
}

// Thresholds:
// < 3% of dimension  : No borders (skip crop)
// 3-10% of dimension : Moderate borders (crop recommended)
// > 10% of dimension : Large borders (crop required)
```

---

## Complete Quality Assessment

```typescript
interface ImageQualityMetrics {
  skewAngle: number;
  contrast: number;
  brightness: number;
  noiseLevel: number;
  hasBorders: boolean;
  borderSizes: { top: number; right: number; bottom: number; left: number };
}

interface QualityAssessment extends ImageQualityMetrics {
  overallQuality: 'excellent' | 'good' | 'fair' | 'poor';
  needsPreprocessing: boolean;
  recommendedOperations: {
    deskew: boolean;
    colorCorrect: boolean;
    denoise: boolean;
    crop: boolean;
  };
  issueCount: number;
  scores: {
    skew: number;      // 0-100 (100 = perfect)
    contrast: number;
    brightness: number;
    noise: number;
    borders: number;
  };
}

async function analyzeImageQuality(imagePath: string): Promise<QualityAssessment> {
  // Run all analyses in parallel for speed
  const [skewAngle, contrast, brightness, noiseLevel, borderInfo] = await Promise.all([
    detectSkewAngle(imagePath),
    analyzeContrast(imagePath),
    analyzeBrightness(imagePath),
    analyzeNoise(imagePath),
    detectBorders(imagePath)
  ]);

  // Calculate scores (0-100, higher is better)
  const scores = {
    skew: Math.max(0, 100 - skewAngle * 50),      // 0° = 100, 2° = 0
    contrast: contrast * 100,                       // 0.7+ = 70+
    brightness: brightnessScore(brightness),        // 0.5-0.7 = 100
    noise: Math.max(0, 100 - noiseLevel * 500),    // 0.05 = 75, 0 = 100
    borders: borderInfo.hasBorders ? 50 : 100      // Has borders = 50
  };

  // Determine which operations are needed
  const recommended = {
    deskew: skewAngle > 0.5,
    colorCorrect: contrast < 0.5 || brightness < 0.4 || brightness > 0.8,
    denoise: noiseLevel > 0.15,
    crop: borderInfo.hasBorders
  };

  const issueCount = Object.values(recommended).filter(v => v).length;

  // Overall quality
  let overallQuality: 'excellent' | 'good' | 'fair' | 'poor';
  if (issueCount === 0) overallQuality = 'excellent';
  else if (issueCount === 1) overallQuality = 'good';
  else if (issueCount === 2) overallQuality = 'fair';
  else overallQuality = 'poor';

  const needsPreprocessing = issueCount >= 2;

  return {
    skewAngle,
    contrast,
    brightness,
    noiseLevel,
    hasBorders: borderInfo.hasBorders,
    borderSizes: borderInfo.borderSizes,
    overallQuality,
    needsPreprocessing,
    recommendedOperations: recommended,
    issueCount,
    scores
  };
}

function brightnessScore(brightness: number): number {
  // Perfect range: 0.5-0.7 = 100
  // Acceptable: 0.4-0.8 = 80+
  // Poor: < 0.3 or > 0.9 = 0

  if (brightness >= 0.5 && brightness <= 0.7) return 100;
  if (brightness >= 0.4 && brightness <= 0.8) {
    const distFromIdeal = Math.min(
      Math.abs(brightness - 0.5),
      Math.abs(brightness - 0.7)
    );
    return 100 - distFromIdeal * 200; // 0.1 away = 80
  }
  return Math.max(0, 50 - Math.abs(brightness - 0.6) * 100);
}
```

---

## UI Integration Example

```svelte
<script lang="ts">
  let qualityCheck = $state<QualityCheckResult | null>(null);
  let isAnalyzing = $state(false);
  let userDecision = $state<boolean | null>(null);

  async function analyzePdfQuality() {
    isAnalyzing = true;

    try {
      qualityCheck = await quickQualityCheck(uploadedPdfPath);

      // Auto-skip if excellent
      if (qualityCheck.recommendation === 'skip') {
        userDecision = false;
        await processWithoutPreprocessing();
      }
    } finally {
      isAnalyzing = false;
    }
  }
</script>

{#if isAnalyzing}
  <div class="analyzing">
    <p>🔍 Analyzing scan quality...</p>
    <p class="small">Checking pages from middle of book</p>
  </div>
{/if}

{#if qualityCheck && userDecision === null}
  <div class="quality-report {qualityCheck.quality}">
    <h3>Scan Quality Assessment</h3>

    <div class="quality-badge {qualityCheck.quality}">
      {qualityCheck.quality.toUpperCase()}
    </div>

    <p class="message">{qualityCheck.message}</p>

    <details>
      <summary>Analysis Details</summary>
      <ul>
        <li>Pages analyzed: {qualityCheck.details.pagesAnalyzed.join(', ')}</li>
        <li>Pages needing preprocessing: {qualityCheck.details.pagesNeedingPreprocessing}/5</li>
        <li>Average issues per page: {qualityCheck.details.avgIssuesPerPage}</li>
        {#if qualityCheck.details.commonIssues.length > 0}
          <li>Common issues: {qualityCheck.details.commonIssues.join(', ')}</li>
        {/if}
      </ul>

      {#each qualityCheck.analyses as analysis, i}
        <div class="page-analysis">
          <h4>Page {qualityCheck.details.pagesAnalyzed[i]}</h4>
          <ul>
            <li>Skew: {analysis.skewAngle.toFixed(2)}° (score: {analysis.scores.skew})</li>
            <li>Contrast: {analysis.contrast.toFixed(2)} (score: {analysis.scores.contrast})</li>
            <li>Brightness: {analysis.brightness.toFixed(2)} (score: {analysis.scores.brightness})</li>
            <li>Noise: {analysis.noiseLevel.toFixed(2)} (score: {analysis.scores.noise})</li>
          </ul>
        </div>
      {/each}
    </details>

    <div class="actions">
      {#if qualityCheck.recommendation === 'skip'}
        <button class="primary" onclick={() => { userDecision = false; processWithoutPreprocessing(); }}>
          ✅ Continue Without Preprocessing {qualityCheck.timeSavings ? `(save ${qualityCheck.timeSavings})` : ''}
        </button>
        <button class="secondary" onclick={() => { userDecision = true; processWithPreprocessing(); }}>
          Enable Anyway (optional)
        </button>

      {:else if qualityCheck.recommendation === 'optional'}
        <button class="secondary" onclick={() => { userDecision = false; processWithoutPreprocessing(); }}>
          Skip Preprocessing (faster)
        </button>
        <button class="primary" onclick={() => { userDecision = true; processWithPreprocessing(); }}>
          ✅ Enable Preprocessing (recommended)
        </button>

      {:else}
        <button class="primary" onclick={() => { userDecision = true; processWithPreprocessing(); }}>
          ✅ Enable Preprocessing (strongly recommended)
        </button>
        <button class="secondary" onclick={() => { userDecision = false; processWithoutPreprocessing(); }}>
          Skip Anyway (not recommended)
        </button>
      {/if}
    </div>
  </div>
{/if}

<style>
  .quality-badge {
    display: inline-block;
    padding: 0.5rem 1rem;
    border-radius: 0.5rem;
    font-weight: bold;
    margin: 1rem 0;
  }

  .quality-badge.excellent { background: #d4edda; color: #155724; }
  .quality-badge.good { background: #d1ecf1; color: #0c5460; }
  .quality-badge.fair { background: #fff3cd; color: #856404; }
  .quality-badge.poor { background: #f8d7da; color: #721c24; }

  .primary {
    background: #007bff;
    color: white;
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 0.5rem;
    font-size: 1rem;
    cursor: pointer;
  }

  .secondary {
    background: #6c757d;
    color: white;
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 0.5rem;
    font-size: 1rem;
    cursor: pointer;
  }
</style>
```

---

## Performance

**Time breakdown (700-page PDF):**
- Get page count: ~1 second
- Calculate sample pages: < 1ms
- Extract 5 pages: ~5-8 seconds
- Analyze 5 pages: ~10-15 seconds (2-3s per page)
- **Total: ~15-25 seconds**

**Optimization:** Run analyses in parallel (already implemented)

---

## Testing with Sample Files

```typescript
// Test with actual project samples
const samples = [
  './sample files/san with hindi-ch4 mahanirvana.pdf',
  './sample files/kalika few pgs.pdf'
];

for (const samplePath of samples) {
  console.log(`\n=== Analyzing: ${path.basename(samplePath)} ===\n`);

  const result = await quickQualityCheck(samplePath);

  console.log(`Quality: ${result.quality}`);
  console.log(`Recommendation: ${result.recommendation}`);
  console.log(`Message: ${result.message}`);
  console.log(`\nDetails:`);
  console.log(`  Pages analyzed: ${result.details.pagesAnalyzed.join(', ')}`);
  console.log(`  Pages needing work: ${result.details.pagesNeedingPreprocessing}/5`);
  console.log(`  Common issues: ${result.details.commonIssues.join(', ')}`);
}
```

---

## Summary

**Key improvements from first-page sampling:**
1. ✅ Sample from **middle 50-70% of book** (actual content)
2. ✅ Skip first 10% (intro, covers) and last 10% (appendix)
3. ✅ Distributed sample: 25%, 40%, 50%, 60%, 75% through content
4. ✅ More representative of actual OCR workload

**Recommendation logic:**
- **Skip**: 0-1 pages need work (excellent/good quality)
- **Optional**: 2 pages need work (fair quality)
- **Recommended**: 3+ pages need work (fair/poor quality)

**Time investment:** 15-25 seconds to save potentially 10-15 minutes
