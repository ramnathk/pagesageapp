#!/usr/bin/env tsx
/**
 * Comprehensive test script for Google Document AI OCR
 * Tests maximum fidelity OCR with Enterprise Document OCR processor
 *
 * Features tested:
 * - Multi-language OCR (English, Sanskrit/Hindi Devanagari, IAST)
 * - Precise bounding boxes with confidence scores
 * - Hierarchical layout (blocks → paragraphs → lines → tokens)
 * - Image quality assessment
 * - Multi-column layout detection
 *
 * Usage:
 *   1. Set up authentication: export GOOGLE_APPLICATION_CREDENTIALS="path/to/key.json"
 *   2. Set project details in .env or environment
 *   3. Run: npx tsx scripts/test-document-ai-ocr.ts <image-path>
 *
 * Requirements:
 *   - @google-cloud/documentai installed
 *   - Service account with Document AI API Editor role
 *   - OCR processor created in Google Cloud Console
 */

import { DocumentProcessorServiceClient } from "@google-cloud/documentai";
import type { google } from "@google-cloud/documentai/build/protos/protos";
import fs from "fs";
import path from "path";

// Type aliases for readability
type IDocument = google.cloud.documentai.v1.IDocument;
type IPage = google.cloud.documentai.v1.Document.IPage;
type IBoundingPoly = google.cloud.documentai.v1.IBoundingPoly;

// Configuration
interface Config {
  projectId: string;
  location: string;
  processorId: string;
  imagePath: string;
}

function loadConfig(): Config {
  // Check for required environment variables
  const projectId =
    process.env.GOOGLE_CLOUD_PROJECT_ID || process.env.GCP_PROJECT_ID;
  const location = process.env.DOCUMENT_AI_LOCATION || "us";
  const processorId = process.env.DOCUMENT_AI_PROCESSOR_ID;

  if (!projectId) {
    console.error(
      "❌ Error: GOOGLE_CLOUD_PROJECT_ID environment variable not set",
    );
    console.error("\nSet it with:");
    console.error('  export GOOGLE_CLOUD_PROJECT_ID="your-project-id"');
    process.exit(1);
  }

  if (!processorId) {
    console.error(
      "❌ Error: DOCUMENT_AI_PROCESSOR_ID environment variable not set",
    );
    console.error("\nTo create a processor:");
    console.error(
      "  1. Visit: https://console.cloud.google.com/ai/document-ai/processors",
    );
    console.error("  2. Create new processor → OCR → Enterprise Document OCR");
    console.error("  3. Copy the Processor ID");
    console.error(
      '  4. Set: export DOCUMENT_AI_PROCESSOR_ID="your-processor-id"',
    );
    process.exit(1);
  }

  const imagePath = process.argv[2];
  if (!imagePath) {
    console.error("❌ Error: No image path provided");
    console.error(
      "\nUsage: npx tsx scripts/test-document-ai-ocr.ts <image-path>",
    );
    console.error(
      "Example: npx tsx scripts/test-document-ai-ocr.ts test-samples/kalika-page-8-08.png",
    );
    process.exit(1);
  }

  if (!fs.existsSync(imagePath)) {
    console.error(`❌ Error: Image not found: ${imagePath}`);
    process.exit(1);
  }

  return { projectId, location, processorId, imagePath };
}

/**
 * Get MIME type from file extension
 */
function getMimeType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  const mimeTypes: { [key: string]: string } = {
    ".pdf": "application/pdf",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".tiff": "image/tiff",
    ".tif": "image/tiff",
    ".gif": "image/gif",
    ".bmp": "image/bmp",
    ".webp": "image/webp",
  };

  const mimeType = mimeTypes[ext];
  if (!mimeType) {
    throw new Error(`Unsupported file type: ${ext}`);
  }

  return mimeType;
}

/**
 * Extract text from a layout element using text anchors
 */
function getTextFromLayout(
  layout: google.cloud.documentai.v1.Document.Page.ILayout | null | undefined,
  fullText: string,
): string {
  if (!layout?.textAnchor?.textSegments) {
    return "";
  }

  let text = "";
  for (const segment of layout.textAnchor.textSegments) {
    const startIndex = Number(segment.startIndex || 0);
    const endIndex = Number(segment.endIndex || fullText.length);
    text += fullText.substring(startIndex, endIndex);
  }

  return text;
}

/**
 * Get bounding box dimensions
 */
function getBoundingBoxDimensions(
  boundingBox: IBoundingPoly | null | undefined,
) {
  if (!boundingBox?.vertices || boundingBox.vertices.length === 0) {
    return null;
  }

  const vertices = boundingBox.vertices;
  const xs = vertices.map((v) => Number(v.x || 0));
  const ys = vertices.map((v) => Number(v.y || 0));

  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const maxX = Math.max(...xs);
  const maxY = Math.max(...ys);

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

/**
 * Process document with Document AI OCR
 */
async function processDocument(config: Config) {
  console.log("╔════════════════════════════════════════════════════════════╗");
  console.log("║  Document AI Enterprise OCR Test                          ║");
  console.log("╚════════════════════════════════════════════════════════════╝");
  console.log(`\nImage: ${config.imagePath}`);
  console.log(`Project: ${config.projectId}`);
  console.log(`Location: ${config.location}`);
  console.log(`Processor: ${config.processorId}\n`);

  const client = new DocumentProcessorServiceClient();

  // Read file
  console.log("📖 Reading image file...");
  const imageFile = await fs.promises.readFile(config.imagePath);
  const encodedImage = Buffer.from(imageFile).toString("base64");
  const mimeType = getMimeType(config.imagePath);
  console.log(`   MIME type: ${mimeType}`);
  console.log(`   File size: ${(imageFile.length / 1024).toFixed(2)} KB\n`);

  // Build processor name
  const name = `projects/${config.projectId}/locations/${config.location}/processors/${config.processorId}`;

  // Configure OCR options for maximum fidelity
  const request = {
    name,
    rawDocument: {
      content: encodedImage,
      mimeType,
    },
    processOptions: {
      ocrConfig: {
        // Enable all quality features
        enableNativePdfParsing: true,
        enableImageQualityScores: true,
        enableSymbol: true,

        // Language hints for Indic scripts (improves accuracy)
        languageHints: [
          "en", // English
          "hi", // Hindi (Devanagari)
          "sa", // Sanskrit
        ],

        // Premium features for better accuracy
        premiumFeatures: {
          enableMathOcr: false, // Not needed for our use case
          enableSelectionMarkDetection: false,
          computeStyleInfo: true, // Get font/style information
        },
      },
    },
  };

  console.log("🔄 Calling Document AI API...");
  console.log("   Features enabled:");
  console.log("   ✓ Native PDF parsing");
  console.log("   ✓ Image quality scoring");
  console.log("   ✓ Symbol detection");
  console.log("   ✓ Style information");
  console.log("   ✓ Language hints: English, Hindi, Sanskrit\n");

  const startTime = Date.now();

  try {
    const [result] = await client.processDocument(request);
    const duration = Date.now() - startTime;

    console.log(`✅ Response received in ${duration}ms\n`);

    return result.document;
  } catch (error: any) {
    console.error("\n❌ Error calling Document AI API:");
    console.error(`   ${error.message}`);

    if (error.code === 7) {
      console.error("\n💡 Permission denied. Check:");
      console.error(
        "   1. GOOGLE_APPLICATION_CREDENTIALS points to valid service account key",
      );
      console.error('   2. Service account has "Document AI API Editor" role');
      console.error("   3. Document AI API is enabled in your project");
    } else if (error.code === 5) {
      console.error("\n💡 Processor not found. Check:");
      console.error("   1. Processor ID is correct");
      console.error("   2. Processor exists in the specified location");
      console.error("   3. Location matches processor location (us/eu)");
    }

    throw error;
  }
}

/**
 * Analyze and report on Document AI results
 */
function analyzeResults(document: IDocument, imagePath: string) {
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("📊 ANALYSIS RESULTS");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  // Full text
  const fullText = document.text || "";
  console.log(`📝 Full Text Length: ${fullText.length} characters`);
  console.log(
    `   First 100 chars: "${fullText.substring(0, 100).replace(/\n/g, " ")}..."\n`,
  );

  // Pages
  const pages = document.pages || [];
  console.log(`📄 Pages: ${pages.length}`);

  if (pages.length === 0) {
    console.log("❌ No pages detected!\n");
    return;
  }

  // Analyze first page in detail
  const page = pages[0];

  // Image dimensions
  console.log(`📐 Image Dimensions:`);
  console.log(`   Width: ${page.dimension?.width || "unknown"} pixels`);
  console.log(`   Height: ${page.dimension?.height || "unknown"} pixels`);
  console.log(`   Unit: ${page.dimension?.unit || "pixels"}\n`);

  // Detected languages
  if (page.detectedLanguages && page.detectedLanguages.length > 0) {
    console.log("🌐 Detected Languages:");
    page.detectedLanguages.forEach((lang) => {
      const langCode = lang.languageCode || "unknown";
      const confidence = ((lang.confidence || 0) * 100).toFixed(1);
      console.log(`   ${langCode}: ${confidence}% confidence`);
    });
    console.log();
  }

  // Image quality (if available)
  if (page.imageQualityScores) {
    console.log("🎨 Image Quality Scores:");
    const scores = page.imageQualityScores;
    console.log(
      `   Overall: ${((scores.qualityScore || 0) * 100).toFixed(1)}%`,
    );

    if (scores.detectedDefects && scores.detectedDefects.length > 0) {
      console.log("   Detected defects:");
      scores.detectedDefects.forEach((defect) => {
        console.log(
          `     - ${defect.type}: ${((defect.confidence || 0) * 100).toFixed(1)}%`,
        );
      });
    }
    console.log();
  }

  // Layout elements
  const blocks = page.blocks || [];
  const paragraphs = page.paragraphs || [];
  const lines = page.lines || [];
  const tokens = page.tokens || [];

  console.log("📦 Layout Elements:");
  console.log(`   Blocks: ${blocks.length}`);
  console.log(`   Paragraphs: ${paragraphs.length}`);
  console.log(`   Lines: ${lines.length}`);
  console.log(`   Tokens: ${tokens.length}\n`);

  // Sample blocks
  if (blocks.length > 0) {
    console.log("📄 Sample Blocks (first 3):");
    console.log("─────────────────────────────────────────────────");
    blocks.slice(0, 3).forEach((block, i) => {
      const text = getTextFromLayout(block.layout, fullText);
      const bbox = getBoundingBoxDimensions(block.layout?.boundingPoly);
      const confidence = block.layout?.confidence || 0;

      console.log(`\nBlock ${i + 1}:`);
      console.log(
        `  BBox: x=${bbox?.x}, y=${bbox?.y}, w=${bbox?.width}, h=${bbox?.height}`,
      );
      console.log(`  Confidence: ${(confidence * 100).toFixed(1)}%`);
      console.log(
        `  Text: ${text.substring(0, 80).replace(/\n/g, " ")}${text.length > 80 ? "..." : ""}`,
      );
    });
    console.log();
  }

  // Export to JSON
  const outputPath = imagePath.replace(
    /\.(png|jpg|jpeg|pdf)$/i,
    "-documentai-result.json",
  );

  // Convert to our format (similar to Gemini for comparison)
  const outputData = {
    processor: "Document AI Enterprise OCR",
    timestamp: new Date().toISOString(),
    imageWidth: page.dimension?.width || 0,
    imageHeight: page.dimension?.height || 0,
    imagePath,
    fullText,
    pages: pages.map((p, pageNum) => ({
      pageNumber: pageNum + 1,
      dimensions: {
        width: p.dimension?.width,
        height: p.dimension?.height,
        unit: p.dimension?.unit,
      },
      detectedLanguages: p.detectedLanguages,
      imageQuality: p.imageQualityScores,
      blockCount: p.blocks?.length || 0,
      paragraphCount: p.paragraphs?.length || 0,
      lineCount: p.lines?.length || 0,
      tokenCount: p.tokens?.length || 0,
      blocks: (p.blocks || []).map((block, idx) => {
        const bbox = getBoundingBoxDimensions(block.layout?.boundingPoly);
        return {
          id: `block-${idx}`,
          text: getTextFromLayout(block.layout, fullText),
          boundingBox: bbox,
          confidence: block.layout?.confidence || 0,
        };
      }),
      paragraphs: (p.paragraphs || []).map((para, idx) => {
        const bbox = getBoundingBoxDimensions(para.layout?.boundingPoly);
        return {
          id: `paragraph-${idx}`,
          text: getTextFromLayout(para.layout, fullText),
          boundingBox: bbox,
          confidence: para.layout?.confidence || 0,
        };
      }),
    })),
    // Also save raw document for detailed analysis
    rawDocument: document,
  };

  fs.writeFileSync(outputPath, JSON.stringify(outputData, null, 2));
  console.log(`💾 Full results saved to: ${path.basename(outputPath)}\n`);

  return outputData;
}

/**
 * Main test execution
 */
async function main() {
  try {
    const config = loadConfig();
    const document = await processDocument(config);

    if (!document) {
      throw new Error("No document returned from API");
    }

    const results = analyzeResults(document, config.imagePath);

    console.log(
      "╔════════════════════════════════════════════════════════════╗",
    );
    console.log(
      "║  TEST COMPLETE                                             ║",
    );
    console.log(
      "╚════════════════════════════════════════════════════════════╝\n",
    );

    console.log("✅ Document AI OCR test completed successfully");
    console.log(
      `📊 Extracted ${results.pages[0].blockCount} blocks, ${results.pages[0].paragraphCount} paragraphs`,
    );
    console.log(`📝 Total text: ${results.fullText.length} characters\n`);
  } catch (error: any) {
    console.error("\n❌ Test failed:", error.message);
    process.exit(1);
  }
}

// Run the test
main().catch(console.error);
