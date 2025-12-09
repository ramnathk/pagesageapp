#!/usr/bin/env tsx
/**
 * Test script to verify if Gemini 2.5 Flash can provide bounding boxes
 * for layout detection.
 *
 * Usage:
 *   1. Set GOOGLE_AI_API_KEY environment variable
 *   2. Run: npx tsx scripts/test-gemini-layout.ts <image-path>
 *
 * Example:
 *   export GOOGLE_AI_API_KEY="your-key-here"
 *   npx tsx scripts/test-gemini-layout.ts ./test-samples/page-001.png
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import path from 'path';

// Check for API key
const API_KEY = process.env.GOOGLE_AI_API_KEY;
if (!API_KEY) {
  console.error('❌ Error: GOOGLE_AI_API_KEY environment variable not set');
  console.error('\nTo get an API key:');
  console.error('1. Visit: https://aistudio.google.com/app/apikey');
  console.error('2. Click "Create API Key"');
  console.error('3. Export it: export GOOGLE_AI_API_KEY="your-key-here"');
  process.exit(1);
}

// Check for image path argument
const imagePath = process.argv[2];
if (!imagePath) {
  console.error('❌ Error: No image path provided');
  console.error('\nUsage: npx tsx scripts/test-gemini-layout.ts <image-path>');
  console.error('Example: npx tsx scripts/test-gemini-layout.ts ./test-samples/page-001.png');
  process.exit(1);
}

// Check if image exists
if (!fs.existsSync(imagePath)) {
  console.error(`❌ Error: Image not found: ${imagePath}`);
  process.exit(1);
}

// Initialize Gemini
const genAI = new GoogleGenerativeAI(API_KEY);

/**
 * Test 1: Can Gemini return structured bounding boxes?
 */
async function testBoundingBoxes(imagePath: string) {
  console.log('\n📦 TEST 1: Bounding Box Detection');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`Image: ${path.basename(imagePath)}`);

  try {
    // Read image
    const imageData = fs.readFileSync(imagePath);
    const base64Image = imageData.toString('base64');
    const mimeType = imagePath.endsWith('.png') ? 'image/png' : 'image/jpeg';

    // Get model
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `You are a document layout analyzer. Analyze this page image and return a detailed JSON structure with ALL text blocks and their precise bounding box coordinates.

IMPORTANT: Return ONLY valid JSON, no markdown formatting, no explanations.

For each text block, provide:
1. Exact pixel coordinates (x, y, width, height) where:
   - x, y = top-left corner position
   - width, height = dimensions in pixels
   - Coordinates must be relative to the image dimensions
2. Block type (heading, paragraph, footnote, verse, commentary, etc.)
3. The actual text content
4. Language (en, sa, hi, or mixed)
5. Reading order number

Return in this exact format:
{
  "imageWidth": <image width in pixels>,
  "imageHeight": <image height in pixels>,
  "blocks": [
    {
      "id": "block-1",
      "type": "paragraph",
      "text": "...",
      "boundingBox": {
        "x": 100,
        "y": 200,
        "width": 500,
        "height": 50
      },
      "language": "en",
      "readingOrder": 1,
      "confidence": 0.95
    }
  ],
  "layoutStructure": {
    "columns": 1,
    "hasFootnotes": false,
    "hasHeaders": true
  }
}`;

    console.log('\n🔄 Calling Gemini 2.5 Flash API...');
    const startTime = Date.now();

    const result = await model.generateContent([
      {
        inlineData: {
          mimeType,
          data: base64Image
        }
      },
      { text: prompt }
    ]);

    const duration = Date.now() - startTime;
    const response = result.response;
    const text = response.text();

    console.log(`✅ Response received in ${duration}ms\n`);

    // Try to parse as JSON
    let parsed;
    try {
      // Remove markdown code blocks if present
      const cleanedText = text
        .replace(/```json\s*/g, '')
        .replace(/```\s*/g, '')
        .trim();

      parsed = JSON.parse(cleanedText);
      console.log('✅ Response is valid JSON');
    } catch (e) {
      console.log('❌ Response is NOT valid JSON');
      console.log('\nRaw response:');
      console.log('─────────────────────────────────────────────────');
      console.log(text);
      console.log('─────────────────────────────────────────────────');
      return { success: false, response: text };
    }

    // Validate structure
    console.log('\n📊 Validation Results:');
    console.log('─────────────────────────────────────────────────');

    const hasImageDimensions = parsed.imageWidth && parsed.imageHeight;
    console.log(`${hasImageDimensions ? '✅' : '❌'} Image dimensions: ${hasImageDimensions ? `${parsed.imageWidth}x${parsed.imageHeight}` : 'MISSING'}`);

    const hasBlocks = Array.isArray(parsed.blocks);
    console.log(`${hasBlocks ? '✅' : '❌'} Blocks array: ${hasBlocks ? `${parsed.blocks?.length || 0} blocks` : 'MISSING'}`);

    if (hasBlocks && parsed.blocks.length > 0) {
      const firstBlock = parsed.blocks[0];

      const hasBoundingBox = firstBlock.boundingBox &&
                            typeof firstBlock.boundingBox.x === 'number' &&
                            typeof firstBlock.boundingBox.y === 'number' &&
                            typeof firstBlock.boundingBox.width === 'number' &&
                            typeof firstBlock.boundingBox.height === 'number';

      console.log(`${hasBoundingBox ? '✅' : '❌'} Bounding box format: ${hasBoundingBox ? 'CORRECT' : 'INVALID'}`);

      const hasText = typeof firstBlock.text === 'string' && firstBlock.text.length > 0;
      console.log(`${hasText ? '✅' : '❌'} Text content: ${hasText ? 'PRESENT' : 'MISSING'}`);

      const hasType = typeof firstBlock.type === 'string';
      console.log(`${hasType ? '✅' : '❌'} Block type: ${hasType ? firstBlock.type : 'MISSING'}`);

      const hasReadingOrder = typeof firstBlock.readingOrder === 'number';
      console.log(`${hasReadingOrder ? '✅' : '❌'} Reading order: ${hasReadingOrder ? 'PRESENT' : 'MISSING'}`);
    }

    const hasLayout = parsed.layoutStructure;
    console.log(`${hasLayout ? '✅' : '❌'} Layout structure: ${hasLayout ? 'PRESENT' : 'MISSING'}`);

    // Print sample blocks
    if (hasBlocks && parsed.blocks.length > 0) {
      console.log('\n📄 Sample Blocks (first 3):');
      console.log('─────────────────────────────────────────────────');
      parsed.blocks.slice(0, 3).forEach((block: any, i: number) => {
        console.log(`\nBlock ${i + 1}:`);
        console.log(`  Type: ${block.type}`);
        console.log(`  BBox: x=${block.boundingBox?.x}, y=${block.boundingBox?.y}, w=${block.boundingBox?.width}, h=${block.boundingBox?.height}`);
        console.log(`  Text: ${block.text?.substring(0, 60)}${block.text?.length > 60 ? '...' : ''}`);
        console.log(`  Order: ${block.readingOrder}`);
      });
    }

    // Save full response
    const outputPath = imagePath.replace(/\.(png|jpg|jpeg)$/i, '-gemini-result.json');
    fs.writeFileSync(outputPath, JSON.stringify(parsed, null, 2));
    console.log(`\n💾 Full response saved to: ${path.basename(outputPath)}`);

    return { success: true, response: parsed };

  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Test 2: Can Gemini handle multi-column layouts?
 */
async function testMultiColumn(imagePath: string) {
  console.log('\n\n📐 TEST 2: Multi-Column Detection');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  try {
    const imageData = fs.readFileSync(imagePath);
    const base64Image = imageData.toString('base64');
    const mimeType = imagePath.endsWith('.png') ? 'image/png' : 'image/jpeg';

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `Analyze this page layout. Answer in JSON format:

{
  "columnCount": <number>,
  "columnBoundaries": [
    {"x": <left edge>, "width": <width>}
  ],
  "readingOrder": "left-to-right" | "right-to-left" | "top-to-bottom",
  "hasFootnotes": true | false,
  "footnoteRegion": {"y": <top edge>, "height": <height>} or null
}`;

    const result = await model.generateContent([
      { inlineData: { mimeType, data: base64Image } },
      { text: prompt }
    ]);

    const text = result.response.text()
      .replace(/```json\s*/g, '')
      .replace(/```\s*/g, '')
      .trim();

    const parsed = JSON.parse(text);

    console.log('✅ Multi-column analysis:');
    console.log(`   Columns: ${parsed.columnCount}`);
    console.log(`   Footnotes: ${parsed.hasFootnotes ? 'Yes' : 'No'}`);
    console.log(`   Reading order: ${parsed.readingOrder}`);

    return { success: true, response: parsed };

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Test 3: Language detection for Devanagari
 */
async function testLanguageDetection(imagePath: string) {
  console.log('\n\n🌐 TEST 3: Language Detection (Devanagari)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  try {
    const imageData = fs.readFileSync(imagePath);
    const base64Image = imageData.toString('base64');
    const mimeType = imagePath.endsWith('.png') ? 'image/png' : 'image/jpeg';

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `Identify all languages/scripts in this document. Return JSON:

{
  "languages": [
    {"script": "devanagari", "language": "sanskrit", "percentage": 60},
    {"script": "latin", "language": "english", "percentage": 40}
  ],
  "hasIAST": true | false,
  "mixedContent": true | false
}`;

    const result = await model.generateContent([
      { inlineData: { mimeType, data: base64Image } },
      { text: prompt }
    ]);

    const text = result.response.text()
      .replace(/```json\s*/g, '')
      .replace(/```\s*/g, '')
      .trim();

    const parsed = JSON.parse(text);

    console.log('✅ Language detection:');
    parsed.languages?.forEach((lang: any) => {
      console.log(`   ${lang.script} (${lang.language}): ${lang.percentage}%`);
    });
    console.log(`   IAST present: ${parsed.hasIAST ? 'Yes' : 'No'}`);

    return { success: true, response: parsed };

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Main test runner
 */
async function main() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║  Gemini 2.5 Flash Layout Detection Test                   ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log(`\nTesting image: ${imagePath}`);
  console.log(`API Key: ${API_KEY.substring(0, 10)}...${API_KEY.substring(API_KEY.length - 4)}`);

  const results = {
    boundingBoxes: await testBoundingBoxes(imagePath),
    multiColumn: await testMultiColumn(imagePath),
    languageDetection: await testLanguageDetection(imagePath)
  };

  // Summary
  console.log('\n\n╔════════════════════════════════════════════════════════════╗');
  console.log('║  TEST SUMMARY                                              ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log(`\n✅ Bounding Boxes: ${results.boundingBoxes.success ? 'PASS' : 'FAIL'}`);
  console.log(`✅ Multi-Column: ${results.multiColumn.success ? 'PASS' : 'FAIL'}`);
  console.log(`✅ Language Detection: ${results.languageDetection.success ? 'PASS' : 'FAIL'}`);

  const allPassed = results.boundingBoxes.success &&
                    results.multiColumn.success &&
                    results.languageDetection.success;

  console.log('\n' + '═'.repeat(60));
  if (allPassed) {
    console.log('🎉 VERDICT: Gemini 2.5 Flash CAN provide layout detection!');
    console.log('   ✅ Proceed with Gemini-based architecture');
    console.log('   💰 Cost: ~$0.27 per 700-page book (26x cheaper than Document AI)');
  } else {
    console.log('⚠️  VERDICT: Gemini 2.5 Flash has limitations');
    console.log('   ❌ Consider using Document AI Layout Parser instead');
    console.log('   💰 Cost: ~$7.00 per 700-page book (but proven to work)');
  }
  console.log('═'.repeat(60) + '\n');

  // Save summary
  const summaryPath = path.join(path.dirname(imagePath), 'gemini-test-summary.json');
  fs.writeFileSync(summaryPath, JSON.stringify({
    testDate: new Date().toISOString(),
    imagePath,
    model: 'gemini-2.5-flash',
    results,
    verdict: allPassed ? 'PASS' : 'FAIL'
  }, null, 2));

  console.log(`📊 Test summary saved to: ${path.basename(summaryPath)}\n`);
}

// Run tests
main().catch(console.error);
