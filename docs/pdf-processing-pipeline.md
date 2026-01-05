# PDF Processing Pipeline - Technical Implementation

**Last Updated:** 2025-12-05
**Status:** Technical specification

> **NOTE:** Deployment-specific sections (Railway/Vercel references) are OUTDATED. This document describes the PDF processing LOGIC which remains accurate. For WHERE this runs, see [`deployment-architecture-cloudflare-github.md`](deployment-architecture-cloudflare-github.md) (Answer: GitHub Actions workflows).

This document details how PDFs are split into pages and preprocessed.

---

## Overview: PDF Upload to Preprocessed Images

```
PDF File (500MB)
    ↓
1. Upload to Google Drive
    ↓
2. Split into page images (1-700 PNG files)
    ↓
3. Preprocess each image (deskew, color correction, denoise, crop)
    ↓
4. Upload preprocessed images to Google Drive
    ↓
5. Ready for AI layout detection
```

**Where this runs:** Background worker (Railway/Fly.io) - not serverless (too long)

**Duration estimate:**

- Split 700 pages: 2-3 minutes
- Preprocess 700 pages: 5-10 minutes (1-2 sec/page)
- Total: **~15 minutes for 700-page book**

---

## Step 1: PDF Splitting (PDF → PNG images)

### Technology Choice: Poppler Utils (pdftoppm)

**Why Poppler:**

- ✅ Fast, reliable, battle-tested
- ✅ Direct PDF → PNG conversion
- ✅ Preserves quality
- ✅ Command-line tool (easy to call from Node.js)
- ✅ Free, open-source

**Installation:**

```bash
# macOS
brew install poppler

# Ubuntu/Debian
apt-get install poppler-utils

# Docker
RUN apt-get install -y poppler-utils
```

### Implementation (Node.js/TypeScript)

```typescript
import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs/promises";

const execAsync = promisify(exec);

interface SplitPdfOptions {
  pdfPath: string; // Local path to PDF
  outputDir: string; // Where to save page images
  dpi: number; // Resolution (default 300)
  format: "png" | "jpeg"; // Output format
}

async function splitPdfToImages(options: SplitPdfOptions): Promise<string[]> {
  const { pdfPath, outputDir, dpi = 300, format = "png" } = options;

  // Ensure output directory exists
  await fs.mkdir(outputDir, { recursive: true });

  // Use pdftoppm to extract pages
  const command = `pdftoppm \
    -${format} \
    -r ${dpi} \
    "${pdfPath}" \
    "${outputDir}/page"`;

  try {
    await execAsync(command);

    // pdftoppm creates: page-1.png, page-2.png, ...
    // Rename to zero-padded: page-001.png, page-002.png, ...
    const files = await fs.readdir(outputDir);
    const pageFiles = files.filter((f) => f.startsWith("page-")).sort();

    const renamedFiles: string[] = [];
    for (let i = 0; i < pageFiles.length; i++) {
      const oldPath = `${outputDir}/${pageFiles[i]}`;
      const newPath = `${outputDir}/page-${String(i + 1).padStart(3, "0")}.${format}`;

      await fs.rename(oldPath, newPath);
      renamedFiles.push(newPath);
    }

    return renamedFiles;
  } catch (error) {
    throw new Error(`PDF splitting failed: ${error.message}`);
  }
}

// Usage
const pageImages = await splitPdfToImages({
  pdfPath: "/tmp/bhagavad-gita.pdf",
  outputDir: "/tmp/pages",
  dpi: 300,
  format: "png",
});

console.log(`Extracted ${pageImages.length} pages`);
// => Extracted 700 pages
```

**Output:**

- `page-001.png` (300 DPI, ~2-5MB per page)
- `page-002.png`
- ...
- `page-700.png`

**Quality settings:**

- DPI: 300 (standard for OCR, good balance of quality/size)
- Format: PNG (lossless, better for OCR than JPEG)
- Color: RGB (preserve original colors for preprocessing)

---

## Step 2: Image Preprocessing

### Operations Needed

1. **Deskew** - Straighten tilted scans
2. **Color Correction** - Remove yellowing, improve contrast
3. **Noise Reduction** - Remove speckles and artifacts
4. **Border Crop** - Remove margins, focus on content

### Technology Choice: Sharp + ImageMagick

**Primary: Sharp (Node.js)**

- Fast, modern, actively maintained
- C++ backend (libvips)
- Great for: color correction, noise reduction, crop
- Limited: No built-in deskew detection

**Secondary: ImageMagick (command-line)**

- Comprehensive image manipulation
- Built-in deskew: `-deskew 40%`
- Fallback for operations Sharp can't do

### Implementation: Preprocessing Pipeline

```typescript
import sharp from "sharp";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

interface PreprocessOptions {
  inputPath: string;
  outputPath: string;
  deskew: boolean;
  colorCorrect: boolean;
  denoise: boolean;
  autoCrop: boolean;
}

async function preprocessImage(options: PreprocessOptions): Promise<void> {
  const { inputPath, outputPath, deskew, colorCorrect, denoise, autoCrop } =
    options;

  let image = sharp(inputPath);

  // 1. Deskew (use ImageMagick - Sharp doesn't have this)
  if (deskew) {
    const tempDeskewed = `${inputPath}.deskewed.png`;

    await execAsync(`convert "${inputPath}" -deskew 40% "${tempDeskewed}"`);

    image = sharp(tempDeskewed);
  }

  // 2. Color Correction (Sharp)
  if (colorCorrect) {
    image = image
      .normalize() // Auto-levels (remove yellowing)
      .linear(1.2, -(128 * 0.2)); // Increase contrast slightly
  }

  // 3. Noise Reduction (Sharp - median filter)
  if (denoise) {
    image = image.median(3); // 3x3 median filter removes speckles
  }

  // 4. Auto-crop borders (Sharp)
  if (autoCrop) {
    image = image.trim({
      threshold: 10, // Brightness threshold
      background: "white",
    });
  }

  // Save preprocessed image
  await image.png({ quality: 95, compressionLevel: 6 }).toFile(outputPath);

  // Cleanup temp files
  if (deskew) {
    await fs.unlink(`${inputPath}.deskewed.png`);
  }
}

// Usage
await preprocessImage({
  inputPath: "/tmp/pages/page-001.png",
  outputPath: "/tmp/preprocessed/page-001.png",
  deskew: true,
  colorCorrect: true,
  denoise: true,
  autoCrop: true,
});
```

### Alternative: Pure ImageMagick Approach

If Sharp limitations are too restrictive, use ImageMagick for everything:

```typescript
async function preprocessWithImageMagick(
  inputPath: string,
  outputPath: string,
): Promise<void> {
  const command = `convert "${inputPath}" \
    -deskew 40% \
    -normalize \
    -contrast-stretch 2%x1% \
    -median 2 \
    -trim \
    "${outputPath}"`;

  await execAsync(command);
}
```

**Pros:**

- ✅ One tool does everything
- ✅ Powerful, comprehensive
- ✅ Battle-tested for 30+ years

**Cons:**

- ❌ Slower than Sharp (interpreted vs compiled)
- ❌ Command-line dependency (needs installation)

---

## Step 3: Upload to Google Drive

```typescript
import { google } from "googleapis";

const drive = google.drive({ version: "v3", auth: oAuth2Client });

async function uploadPageImage(
  filePath: string,
  projectFolderId: string,
  pageNumber: number,
): Promise<DriveFile> {
  const fileName = `page-${String(pageNumber).padStart(3, "0")}.png`;

  const response = await drive.files.create({
    requestBody: {
      name: fileName,
      parents: [projectFolderId], // Project folder in Drive
      mimeType: "image/png",
    },
    media: {
      mimeType: "image/png",
      body: fs.createReadStream(filePath),
    },
    fields: "id, name, size, md5Checksum",
  });

  return {
    driveFileId: response.data.id,
    fileName: response.data.name,
    fileSizeBytes: parseInt(response.data.size),
    md5Checksum: response.data.md5Checksum,
  };
}
```

---

## Complete Processing Function

```typescript
async function processPdf(
  projectId: string,
  pdfDriveFileId: string,
  onProgress: (update: ProgressUpdate) => void,
): Promise<void> {
  const tempDir = `/tmp/pagesage-${projectId}`;
  const pagesDir = `${tempDir}/pages`;
  const preprocessedDir = `${tempDir}/preprocessed`;

  try {
    // 1. Download PDF from Google Drive
    onProgress({ step: "downloading", progress: 0 });
    const pdfPath = await downloadFromDrive(
      pdfDriveFileId,
      `${tempDir}/source.pdf`,
    );

    // 2. Split PDF into page images
    onProgress({ step: "splitting", progress: 0 });
    const pageImages = await splitPdfToImages({
      pdfPath,
      outputDir: pagesDir,
      dpi: 300,
      format: "png",
    });

    const totalPages = pageImages.length;
    onProgress({ step: "preprocessing", progress: 0, total: totalPages });

    // 3. Preprocess each page
    for (let i = 0; i < pageImages.length; i++) {
      const inputPath = pageImages[i];
      const outputPath = `${preprocessedDir}/page-${String(i + 1).padStart(3, "0")}.png`;

      await preprocessImage({
        inputPath,
        outputPath,
        deskew: true,
        colorCorrect: true,
        denoise: true,
        autoCrop: true,
      });

      onProgress({
        step: "preprocessing",
        progress: i + 1,
        total: totalPages,
        percentage: ((i + 1) / totalPages) * 100,
      });
    }

    // 4. Upload preprocessed images to Google Drive
    onProgress({ step: "uploading", progress: 0, total: totalPages });

    const projectFolder = await getOrCreateProjectFolder(projectId);
    const uploadedImages: ImageMetadata[] = [];

    for (let i = 0; i < totalPages; i++) {
      const imagePath = `${preprocessedDir}/page-${String(i + 1).padStart(3, "0")}.png`;

      const driveFile = await uploadPageImage(
        imagePath,
        projectFolder.id,
        i + 1,
      );

      uploadedImages.push({
        driveFileId: driveFile.driveFileId,
        fileName: driveFile.fileName,
        width: 2480, // Read from image
        height: 3508,
        dpi: 300,
        format: "png",
        fileSizeBytes: driveFile.fileSizeBytes,
        sha256: await calculateSha256(imagePath),
        isPreprocessed: true,
        preprocessingApplied: [
          "deskew",
          "color-correction",
          "noise-reduction",
          "crop",
        ],
        uploadedAt: new Date().toISOString(),
      });

      onProgress({
        step: "uploading",
        progress: i + 1,
        total: totalPages,
      });
    }

    // 5. Update project metadata
    await updateProjectMetadata(projectId, {
      pages: { total: totalPages, processed: totalPages },
      status: "preprocessing-complete",
    });

    // 6. Cleanup temp files
    await fs.rm(tempDir, { recursive: true });

    onProgress({ step: "complete", progress: totalPages, total: totalPages });
  } catch (error) {
    onProgress({ step: "error", error: error.message });
    throw error;
  }
}
```

---

## Where This Runs

**NOT on Vercel serverless** (too long, 15-minute timeout)

**MUST run on Railway/Fly.io worker** (no timeout)

**Architecture:**

```
User uploads PDF → Vercel API receives
    ↓
Vercel uploads to Google Drive (quick)
    ↓
Vercel creates job in queue: "process-pdf"
    ↓
Vercel returns immediately (non-blocking)
    ↓
Railway Worker picks up job from queue
    ↓
Railway downloads PDF to /tmp
    ↓
Railway runs pdftoppm (split pages)
    ↓
Railway runs Sharp/ImageMagick (preprocess)
    ↓
Railway uploads to Google Drive
    ↓
Railway commits metadata to GitHub
    ↓
Railway emits progress via SSE
```

**Worker spec needed:**

- RAM: 1-2GB (for 500MB PDF + processing)
- Storage: 10-20GB temp space (for extracted images)
- CPU: 1-2 cores (for image processing)

**Railway Hobby plan:** ✅ Sufficient (512MB RAM upgradeable, 1 vCPU)

---

## System Dependencies

**Railway worker needs:**

```dockerfile
# Dockerfile for Railway worker
FROM node:18-slim

# Install Poppler utils (for PDF splitting)
RUN apt-get update && apt-get install -y \
    poppler-utils \
    imagemagick \
    && rm -rf /var/lib/apt/lists/*

# Copy application
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .

# Start worker
CMD ["node", "src/worker/index.js"]
```

**Dependencies in package.json:**

```json
{
  "dependencies": {
    "sharp": "^0.33.0", // Image processing
    "googleapis": "^128.0.0", // Google Drive API
    "@octokit/rest": "^20.0.0", // GitHub API
    "bullmq": "^5.0.0", // Job queue (optional)
    "ioredis": "^5.3.0" // Redis client (or ioredis-mock for in-memory)
  }
}
```

---

## Detailed: Deskew Implementation

### Option 1: Using ImageMagick (Simplest)

```typescript
async function deskewImage(
  inputPath: string,
  outputPath: string,
): Promise<void> {
  // ImageMagick auto-detects skew and corrects up to 40 degrees
  const command = `convert "${inputPath}" -deskew 40% "${outputPath}"`;

  await execAsync(command);
}
```

**How it works:**

1. Analyzes image to find text lines
2. Detects average angle of text baselines
3. Rotates image to straighten
4. Crops to remove empty corners

**Accuracy:** Very good for printed text (Sanskrit/Hindi included)

---

### Option 2: Custom Skew Detection + Sharp Rotation

If you want to avoid ImageMagick:

```typescript
import sharp from "sharp";

async function detectSkewAngle(imagePath: string): Promise<number> {
  // This requires more advanced computer vision
  // Options:
  // A) Use TensorFlow.js with a skew detection model
  // B) Use OpenCV bindings (opencv4nodejs)
  // C) Call Python script with OpenCV

  // Example with Python subprocess (simplest):
  const { stdout } = await execAsync(
    `python3 scripts/detect-skew.py "${imagePath}"`,
  );

  return parseFloat(stdout.trim()); // Returns angle in degrees
}

async function deskewWithSharp(
  inputPath: string,
  outputPath: string,
): Promise<void> {
  // 1. Detect skew angle
  const angle = await detectSkewAngle(inputPath);

  // 2. Rotate with Sharp
  if (Math.abs(angle) > 0.5) {
    // Only if skew is significant
    await sharp(inputPath)
      .rotate(angle, { background: { r: 255, g: 255, b: 255 } })
      .toFile(outputPath);
  } else {
    // No deskew needed, just copy
    await fs.copyFile(inputPath, outputPath);
  }
}
```

**Python skew detection script (detect-skew.py):**

```python
import cv2
import numpy as np
import sys

def detect_skew(image_path):
    img = cv2.imread(image_path, cv2.IMREAD_GRAYSCALE)

    # Threshold to binary
    thresh = cv2.threshold(img, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)[1]

    # Detect lines with Hough transform
    coords = np.column_stack(np.where(thresh > 0))
    angle = cv2.minAreaRect(coords)[-1]

    # Correct angle
    if angle < -45:
        angle = 90 + angle

    return -angle  # Negative to correct

if __name__ == '__main__':
    angle = detect_skew(sys.argv[1])
    print(angle)
```

**Recommendation:** Use ImageMagick for deskew (simpler, reliable)

---

## Detailed: Color Correction

```typescript
async function colorCorrect(
  inputPath: string,
  outputPath: string,
): Promise<void> {
  await sharp(inputPath)
    .normalize() // Auto-level colors (removes yellowing)
    .modulate({
      brightness: 1.05, // Slight brightness increase
      saturation: 0.8, // Reduce saturation (more grayscale-like)
    })
    .linear(1.2, -(128 * 0.2)) // Increase contrast
    .toFile(outputPath);
}
```

**What each does:**

- `normalize()`: Stretches contrast to use full dynamic range (removes yellowing)
- `modulate()`: Adjusts brightness/saturation
- `linear()`: Fine-tune contrast curve

**Result:** Cleaner, higher contrast image for better OCR

---

## Detailed: Noise Reduction

```typescript
async function denoise(inputPath: string, outputPath: string): Promise<void> {
  await sharp(inputPath)
    .median(3) // 3x3 median filter (removes salt-and-pepper noise)
    .blur(0.3) // Very slight Gaussian blur (optional)
    .toFile(outputPath);
}
```

**Median filter:**

- Removes isolated speckles
- Preserves edges (better than Gaussian blur for text)
- Size 3 is good balance (5 can blur text)

---

## Detailed: Border Crop

```typescript
async function cropBorders(
  inputPath: string,
  outputPath: string,
): Promise<void> {
  const metadata = await sharp(inputPath).metadata();

  await sharp(inputPath)
    .trim({
      threshold: 10, // How different from background
      background: "white", // Assume white margins
      lineArt: true, // Preserve text edges
    })
    .toFile(outputPath);
}
```

**How it works:**

1. Detects regions that differ from white background
2. Finds bounding box of content
3. Crops to content area

**Fallback:** If auto-crop removes too much, use fixed margins:

```typescript
.extract({
  left: 100,    // Remove 100px from left
  top: 100,     // Remove 100px from top
  width: metadata.width - 200,
  height: metadata.height - 200
})
```

---

## Complete Worker Implementation

```typescript
// worker/process-pdf.ts
import { JobQueue } from "./job-queue";
import {
  splitPdfToImages,
  preprocessImage,
  uploadToGoogleDrive,
} from "./utils";

const queue = new JobQueue();

// Worker loop (runs continuously)
async function worker() {
  while (true) {
    const job = await queue.getNextJob();

    if (!job) {
      await sleep(5000); // Wait 5 seconds if no jobs
      continue;
    }

    try {
      await processJob(job);
      await queue.completeJob(job.id);
    } catch (error) {
      await queue.failJob(job.id, error.message);
    }
  }
}

async function processJob(job: Job): Promise<void> {
  const { projectId, pdfDriveFileId } = job.data;

  // 1. Download PDF from Drive
  const pdfPath = await downloadFromDrive(pdfDriveFileId);
  job.updateProgress(5, "Downloaded PDF");

  // 2. Split into pages
  const pageImages = await splitPdfToImages({
    pdfPath,
    outputDir: `./tmp/${projectId}/pages`,
    dpi: 300,
    format: "png",
  });
  job.updateProgress(15, `Split into ${pageImages.length} pages`);

  // 3. Preprocess each page
  const totalPages = pageImages.length;

  for (let i = 0; i < totalPages; i++) {
    const inputPath = pageImages[i];
    const outputPath = `./tmp/${projectId}/preprocessed/page-${i + 1}.png`;

    await preprocessImage({
      inputPath,
      outputPath,
      deskew: true,
      colorCorrect: true,
      denoise: true,
      autoCrop: true,
    });

    // Upload to Drive
    const driveFile = await uploadPageImage(outputPath, projectId, i + 1);

    // Update metadata
    await updatePageMetadata(projectId, i + 1, {
      image: {
        driveFileId: driveFile.id,
        width: driveFile.width,
        height: driveFile.height,
        sha256: await calculateSha256(outputPath),
      },
    });

    // Progress update
    const percentage = ((i + 1) / totalPages) * 85 + 15; // 15-100%
    job.updateProgress(percentage, `Preprocessed page ${i + 1}/${totalPages}`);

    // Emit SSE event
    emitProgressEvent(job.id, {
      step: "preprocessing",
      current: i + 1,
      total: totalPages,
      percentage,
    });
  }

  // 4. Cleanup temp files
  await fs.rm(`./tmp/${projectId}`, { recursive: true });

  job.updateProgress(100, "Complete");
}

// Start worker
worker().catch(console.error);
```

---

## Progress Updates via SSE

**Backend worker emits events:**

```typescript
import { EventEmitter } from "events";

// Global event emitter (in-memory)
export const progressEmitter = new EventEmitter();

// Worker emits progress
progressEmitter.emit("job-progress", {
  jobId: "job-abc123",
  step: "preprocessing",
  current: 350,
  total: 700,
  percentage: 50,
  message: "Preprocessed page 350/700",
});

// API route streams to frontend
export async function GET({ params }) {
  const { jobId } = params;

  return new Response(
    new ReadableStream({
      start(controller) {
        const handler = (data: any) => {
          if (data.jobId === jobId) {
            controller.enqueue(`data: ${JSON.stringify(data)}\n\n`);
          }
        };

        progressEmitter.on("job-progress", handler);

        // Cleanup on disconnect
        return () => progressEmitter.off("job-progress", handler);
      },
    }),
    { headers: { "Content-Type": "text/event-stream" } },
  );
}
```

**Frontend receives updates:**

```typescript
<script lang="ts">
  let progress = $state(0);
  let message = $state('');

  onMount(() => {
    const events = new EventSource(`/api/jobs/${jobId}/stream`);

    events.onmessage = (event) => {
      const data = JSON.parse(event.data);
      progress = data.percentage;
      message = data.message;
    };

    return () => events.close();
  });
</script>

<div>
  <p>{message}</p>
  <progress value={progress} max="100">{progress}%</progress>
</div>
```

---

## Performance Optimizations

### Parallel Processing

Process multiple pages simultaneously:

```typescript
const BATCH_SIZE = 10; // Process 10 pages at a time

for (let i = 0; i < totalPages; i += BATCH_SIZE) {
  const batch = pageImages.slice(i, i + BATCH_SIZE);

  // Process batch in parallel
  await Promise.all(
    batch.map(async (imagePath, index) => {
      const pageNum = i + index + 1;
      await preprocessImage({
        inputPath: imagePath,
        outputPath: `${preprocessedDir}/page-${pageNum}.png`,
        deskew: true,
        colorCorrect: true,
        denoise: true,
        autoCrop: true,
      });
    }),
  );

  // Update progress after each batch
  const processed = Math.min(i + BATCH_SIZE, totalPages);
  job.updateProgress((processed / totalPages) * 100);
}
```

**Speed improvement:** 10x faster (10 pages in parallel vs sequential)

**Resource usage:** Higher (10 images in memory simultaneously)

**Railway requirement:** Need 2GB RAM for parallel processing (upgrade from 512MB)

---

## Error Handling

### PDF Corruption Detection

```typescript
async function validatePdf(pdfPath: string): Promise<ValidationResult> {
  try {
    // Try to get page count
    const { stdout } = await execAsync(`pdfinfo "${pdfPath}"`);

    const pageCountMatch = stdout.match(/Pages:\s+(\d+)/);
    if (!pageCountMatch) {
      return { valid: false, error: "Could not determine page count" };
    }

    const pageCount = parseInt(pageCountMatch[1]);

    if (pageCount === 0) {
      return { valid: false, error: "PDF has 0 pages" };
    }

    if (pageCount > 2000) {
      return {
        valid: false,
        error: `Too many pages (${pageCount} > 2000 max)`,
      };
    }

    return { valid: true, pageCount };
  } catch (error) {
    return { valid: false, error: "PDF is corrupted or invalid format" };
  }
}
```

### Page Processing Failure

```typescript
async function preprocessImageWithRetry(
  inputPath: string,
  outputPath: string,
  maxRetries: number = 3
): Promise<void> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await preprocessImage({ inputPath, outputPath, ... });
      return;  // Success

    } catch (error) {
      if (attempt === maxRetries) {
        // Final attempt failed, log and skip this page
        console.error(`Failed to preprocess ${inputPath} after ${maxRetries} attempts`);

        // Mark page as failed in metadata
        await markPageAsFailed(inputPath, error.message);

        // Continue with other pages
        return;
      }

      // Wait before retry (exponential backoff)
      await sleep(1000 * Math.pow(2, attempt));
    }
  }
}
```

---

## Alternative: Skip Preprocessing (Simplify v1)

**For v1 MVP, you could skip preprocessing entirely:**

```
PDF Upload
    ↓
Split into pages (pdftoppm)
    ↓
Upload original pages to Drive
    ↓
Send directly to Gemini/Document AI
    ↓
AI handles imperfections
```

**Pros:**

- ✅ Simpler (less code, fewer dependencies)
- ✅ Faster (5 minutes vs 15 minutes)
- ✅ Let AI handle quality issues

**Cons:**

- ⚠️ Lower OCR accuracy (AI works better with preprocessed images)
- ⚠️ May need more manual corrections

**Recommendation:** Start without preprocessing, add later if OCR quality is poor

---

## Summary

**PDF → Pages flow:**

```
1. Upload PDF to Google Drive (Vercel API)
      ↓ (hand off to worker)
2. Download PDF to worker /tmp (Railway)
      ↓
3. Split with pdftoppm → 700 PNG files
      ↓
4. For each page:
   - Deskew with ImageMagick (-deskew 40%)
   - Color correct with Sharp (.normalize())
   - Denoise with Sharp (.median(3))
   - Crop borders with Sharp (.trim())
      ↓
5. Upload preprocessed images to Google Drive
      ↓
6. Update metadata in GitHub
      ↓
7. Emit SSE progress events to frontend
```

**Tech:**

- Poppler (pdftoppm) - PDF splitting
- ImageMagick - Deskew
- Sharp (Node.js) - Color, denoise, crop
- Google Drive API - Store images
- GitHub API - Store metadata
- SSE - Real-time progress

**Where:** Railway worker ($5/month, no timeout)

**No database needed!** All state in files + in-memory queue.
