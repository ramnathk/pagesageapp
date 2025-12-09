# Gemini 2.5 Flash Layout Detection Test

**Critical Test:** This verifies if Gemini can provide bounding boxes for layout detection, which is a fundamental assumption of our architecture.

---

## Quick Start (5 minutes)

### 1. Get API Key (FREE, no credit card)

Visit: https://aistudio.google.com/app/apikey

- Click "Create API Key"
- Copy the key
- It looks like: `AIzaSyBx...` (39 characters)

### 2. Set Environment Variable

```bash
export GOOGLE_AI_API_KEY='your-key-here'
```

### 3. Run Setup Script

```bash
chmod +x scripts/setup-test.sh
./scripts/setup-test.sh
```

This will:
- Install dependencies (`@google/generative-ai`, `tsx`)
- Create `test-samples/` directory
- Extract test pages from your sample PDFs
- Verify everything is ready

### 4. Run Test

Test with complex multi-column layout (page 8 from Kalika):
```bash
npx tsx scripts/test-gemini-layout.ts test-samples/kalika-page-8.png
```

Or test with simpler layout (page 5 from Mahanirvana):
```bash
npx tsx scripts/test-gemini-layout.ts test-samples/mahanirvana-page-5.png
```

---

## What the Test Does

### Test 1: Bounding Box Detection ✅/❌
**Question:** Can Gemini return pixel-precise bounding boxes?

**Success criteria:**
- ✅ Returns JSON with `boundingBox: {x, y, width, height}`
- ✅ Coordinates are in pixels
- ✅ All text blocks detected
- ✅ Text content extracted

**If this fails:** Architecture needs Document AI (26x more expensive)

---

### Test 2: Multi-Column Detection ✅/❌
**Question:** Can Gemini detect columns and reading order?

**Success criteria:**
- ✅ Detects number of columns (1, 2, or 3+)
- ✅ Provides column boundaries
- ✅ Determines correct reading order
- ✅ Identifies footnote regions

**If this fails:** May need custom column detection logic

---

### Test 3: Language Detection ✅/❌
**Question:** Can Gemini handle Devanagari/Sanskrit/IAST?

**Success criteria:**
- ✅ Detects Devanagari script
- ✅ Identifies Sanskrit vs Hindi
- ✅ Distinguishes IAST transliteration
- ✅ Handles mixed-language content

**If this fails:** May need language-specific preprocessing

---

## Understanding the Output

### ✅ Ideal Output (PASS)

```
📦 TEST 1: Bounding Box Detection
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Response is valid JSON
✅ Image dimensions: 2480x3508
✅ Blocks array: 45 blocks
✅ Bounding box format: CORRECT
✅ Text content: PRESENT
✅ Block type: paragraph
✅ Reading order: PRESENT
✅ Layout structure: PRESENT

📄 Sample Blocks (first 3):

Block 1:
  Type: heading
  BBox: x=100, y=150, w=500, h=40
  Text: Chapter 88: The Liberation of the Soul
  Order: 1

Block 2:
  Type: paragraph
  BBox: x=100, y=250, w=500, h=120
  Text: In the beginning, the supreme consciousness...
  Order: 2

Block 3:
  Type: footnote
  BBox: x=100, y=3200, w=500, h=80
  Text: 1. See also Chapter 12, verse 34 for related...
  Order: 45

🎉 VERDICT: Gemini 2.5 Flash CAN provide layout detection!
   ✅ Proceed with Gemini-based architecture
   💰 Cost: ~$0.27 per 700-page book
```

---

### ❌ Problematic Output (FAIL)

```
📦 TEST 1: Bounding Box Detection
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
❌ Response is NOT valid JSON

Raw response:
─────────────────────────────────────────────────
This appears to be a page from an ancient Sanskrit text.
The layout consists of two columns with extensive footnotes
at the bottom. The text is primarily in Devanagari script
with some English translations. I can see approximately
45 distinct text blocks arranged in reading order...
─────────────────────────────────────────────────

⚠️  VERDICT: Gemini 2.5 Flash has limitations
   ❌ Consider using Document AI Layout Parser instead
   💰 Cost: ~$7.00 per 700-page book (but proven to work)
```

---

## What Happens Next?

### If Tests PASS ✅

**Architecture:** Continue with Gemini 2.5 Flash
**Cost:** $0.27 per 700-page book (or FREE on free tier)
**Next Steps:**
1. ✅ Mark ADR 002 as "APPROVED - Gemini 2.5 Flash"
2. Implement preprocessing pipeline (already documented)
3. Implement Gemini API integration
4. Build annotation editor with bounding boxes

---

### If Tests FAIL ❌

**Architecture:** Switch to Document AI Layout Parser
**Cost:** $7.00 per 700-page book
**Next Steps:**
1. ❌ Update ADR 002 to "REJECTED - Gemini / APPROVED - Document AI"
2. Update architecture-overview.md (minimal changes)
3. Implement Document AI integration (different SDK)
4. Accept higher cost but guaranteed quality

**Trade-off:** 26x more expensive but:
- ✅ Proven for complex layouts
- ✅ Purpose-built for documents
- ✅ Reliable bounding boxes
- ✅ Better footnote detection
- ✅ Still within budget ($70/year for 10 books)

---

### If Tests are PARTIAL 🟡

Some features work, some don't. Options:

**Option A: Hybrid approach**
- Use Gemini for simple pages
- Use Document AI for complex pages
- Auto-detect complexity per page
- Blended cost: ~$2-4 per book

**Option B: Gemini + Custom Processing**
- Use Gemini for OCR only
- Custom algorithm for bounding boxes (OpenCV)
- More development work, but low cost

**Option C: Claude Sonnet 4.5**
- Better semantic understanding
- Cost: ~$3 per book
- May still need custom bounding box detection

---

## Expected Results

Based on my analysis:

**Gemini 2.5 Flash likely CAN:**
- ✅ Extract text (OCR)
- ✅ Identify language/script
- ✅ Describe layout in natural language
- ✅ Return JSON with structured prompting

**Gemini 2.5 Flash might NOT:**
- ⚠️ Provide pixel-perfect bounding boxes
- ⚠️ Return coordinates without heavy prompting
- ⚠️ Handle complex multi-column layouts perfectly
- ⚠️ Match Document AI's specialized layout detection

**My prediction:** 60% chance of PASS, 40% chance of PARTIAL

---

## Files Generated

After running the test, you'll have:

```
test-samples/
  kalika-page-8.png              ← Extracted test page
  kalika-page-8-gemini-result.json  ← Full Gemini response
  mahanirvana-page-5.png
  mahanirvana-page-5-gemini-result.json
  gemini-test-summary.json       ← Test results summary
```

---

## Troubleshooting

### "GOOGLE_AI_API_KEY not set"
```bash
export GOOGLE_AI_API_KEY='AIzaSyBx...'
```

### "pdftoppm: command not found"
```bash
# macOS
brew install poppler

# Ubuntu/Debian
sudo apt-get install poppler-utils
```

### "Module '@google/generative-ai' not found"
```bash
npm install @google/generative-ai
```

### "TypeError: Cannot read property 'blocks' of undefined"
The API response wasn't in the expected format. Check:
- Is the API key valid?
- Is the image file readable?
- Review the raw response in the error output

---

## Cost of Testing

**FREE tier limits:**
- 15 requests per minute
- 1,500 requests per day
- No credit card required

**This test makes:**
- 3 API calls per test image
- ~6 total calls if testing both samples

**Cost:** $0.00 (within free tier)

---

## Questions?

If test results are unclear:
1. Share the `gemini-test-summary.json` file
2. Share the `*-gemini-result.json` files
3. I'll help interpret the results

---

**Remember:** This test is BLOCKING architecture decisions. Don't proceed with implementation until we know if Gemini can provide bounding boxes!
