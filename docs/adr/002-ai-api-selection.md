# ADR 002: AI API Selection for OCR and Layout Detection

**Status:** Proposed (Pending Testing)
**Date:** 2025-12-05
**Decision Makers:** kramnat
**Context:** PageSage v1 - OCR and layout detection for Sanskrit/Hindi/English texts

---

## Context and Problem Statement

PageSage needs AI services for:
1. **Layout detection** - Identify bounding boxes, columns, footnotes, reading order
2. **OCR text extraction** - Extract text in Devanagari, IAST, and English
3. **Language detection** - Classify text by language/script

**Sample complexity ranges from:**
- **Simple:** Single-column Sanskrit with Hindi commentary
- **Complex:** Multi-column with extensive footnotes, parallel text, index pages (2-4 columns)

**Key requirements:**
- Multi-column layout detection (2-4 columns)
- Precise bounding box coordinates (pixel-level)
- Footnote detection and classification
- Reading order across complex layouts
- Mixed language support (English, Sanskrit Devanagari, IAST transliteration)
- High accuracy (>90% for production use)

---

## Decision Drivers

1. **Quality:** Accuracy for Devanagari, layout detection precision
2. **Cost:** API costs at scale (10-50 books/year)
3. **Complexity handling:** Multi-column, footnotes, parallel text
4. **Reliability:** Production-ready, proven
5. **Integration:** Ease of use, documentation

---

## Options Considered

### Option 1: Google Document AI Layout Parser

**Capabilities:**
- Specialized document layout processor
- Extracts text, tables, lists with structure
- Context-aware chunking
- Supports 200+ languages including Devanagari
- Precise bounding box coordinates

**Pricing:**
- $10 per 1,000 pages (no volume discount)
- 700-page book: **$7.00**
- 10 books/year: **$70.00**

**Pros:**
- ✅ Purpose-built for complex document layouts
- ✅ Multi-column detection is core feature
- ✅ Proven accuracy for documents
- ✅ Pixel-perfect bounding boxes
- ✅ Reading order algorithm built-in
- ✅ Production-ready, reliable
- ✅ Devanagari support confirmed

**Cons:**
- ❌ Expensive ($7/book)
- ❌ No free tier (only $300 credit for new customers)
- ❌ More complex setup

**Risk:** Low - proven technology

---

### Option 2: Gemini 2.5 Flash

**Capabilities:**
- Modern vision model with document understanding
- Built-in OCR (95%+ accuracy for printed text)
- Layout analysis (general-purpose)
- 100+ language support
- Bounding box detection

**Pricing:**
- FREE tier (rate-limited)
- Paid: $0.30 per 1M tokens
- 700-page book: **$0.27** (paid tier) or **$0.00** (free tier)
- 10 books/year: **$2.70** or **$0.00**

**Pros:**
- ✅ FREE tier available
- ✅ 26x cheaper than Document AI Layout Parser
- ✅ Modern vision model (2024)
- ✅ Fast processing
- ✅ Good general document understanding
- ✅ Likely supports Devanagari (100+ languages)

**Cons:**
- ⚠️ **Unproven for complex Sanskrit layouts**
- ⚠️ General vision model (not document-specialized)
- ⚠️ Unknown multi-column detection quality
- ⚠️ Unknown footnote reference linking capability
- ⚠️ Unknown Sanskrit accuracy specifically

**Risk:** Medium - needs testing to validate

---

### Option 3: Gemini 2.0 Flash

**Capabilities:**
- Similar to 2.5 but lower quality
- Good for simple documents
- Fast, efficient

**Pricing:**
- FREE tier
- Paid: $0.10 per 1M tokens
- 700-page book: **$0.09** or **$0.00**
- 10 books/year: **$0.90** or **$0.00**

**Pros:**
- ✅ FREE tier
- ✅ 78x cheaper than Document AI
- ✅ Fast

**Cons:**
- ⚠️ Lower quality than 2.5 Flash
- ⚠️ May struggle with complex layouts

**Good for:** Simple single-column texts only

---

### Option 4: Claude Sonnet 4.5

**Capabilities:**
- Best semantic understanding
- Multimodal vision
- Complex reasoning
- Flexible instructions

**Pricing:**
- ~$3 per 1M input tokens
- 700-page book: **~$3.00**
- 10 books/year: **~$30.00**

**Pros:**
- ✅ Best understanding of semantic relationships
- ✅ Can distinguish IAST from emphasis
- ✅ Excellent for edge cases

**Cons:**
- ❌ No pixel-precise coordinates
- ❌ Not designed for batch processing
- ❌ Slower than specialized APIs

**Best use:** Validation and QA, not primary OCR

---

## Decision Outcome

**Status:** Pending empirical testing

### Recommended Testing Approach

**Phase 1: Test Gemini 2.5 Flash** (1-2 hours)
- Process both samples (simple + complex)
- Validate multi-column detection
- Check footnote detection and linking
- Measure Devanagari accuracy
- Assess manual correction burden

**Phase 2: Decision**

**IF** Gemini 2.5 achieves ≥90% accuracy on complex layouts:
- **Use Gemini 2.5 Flash** as primary API
- Save $67/year compared to Document AI
- Accept slightly lower quality for massive cost savings

**IF** Gemini 2.5 achieves <90% accuracy:
- **Use Document AI Layout Parser** for complex texts
- **Use Gemini 2.0** for simple texts (hybrid approach)
- Blended cost: ~$2-3/book average

**Always:** Use Claude Code for validation and QA (spot-check 10% of pages)

---

## Consequences

### If Gemini 2.5 Flash Works Well

**Positive:**
- ✅ Near-zero API costs ($0-2.70/year)
- ✅ FREE tier for testing and low volume
- ✅ Simple integration (one API)
- ✅ Fast processing
- ✅ Budget available for other features

**Negative:**
- ⚠️ Risk of lower quality (needs more manual correction)
- ⚠️ Unproven for Sanskrit specifically
- ⚠️ May need fallback for complex pages

### If Document AI Required

**Positive:**
- ✅ Proven quality for complex layouts
- ✅ Specialized for documents
- ✅ Reliable, production-ready
- ✅ Less manual correction needed
- ✅ Still within budget ($70/year < $120 budget)

**Negative:**
- ❌ Higher API costs (26x more than Gemini)
- ❌ Less budget for storage/hosting
- ❌ No free tier for testing

---

## Testing Criteria

### Success Metrics for Gemini 2.5 Flash

Must achieve on **kalika sample** (complex):

- [ ] Multi-column boundary detection: >90% accuracy
- [ ] Column reading order: 100% correct sequence
- [ ] Footnote detection: Find >90% of footnotes
- [ ] Footnote reference linking: Detect >80% of superscript references
- [ ] English OCR: >98% accuracy
- [ ] Devanagari OCR: >92% accuracy
- [ ] IAST detection: >85% correct identification
- [ ] Overall layout quality: Requires <2 hours manual correction per 100 pages

**If all criteria met:** Use Gemini 2.5 Flash

**If any critical criterion fails:** Use Document AI Layout Parser

---

## Implementation Notes

### Environment Variables Required

```bash
# For Gemini
GOOGLE_AI_API_KEY=
GOOGLE_AI_MODEL=gemini-2.5-flash

# For Document AI (if needed)
GOOGLE_CLOUD_PROJECT_ID=
GOOGLE_APPLICATION_CREDENTIALS=  # Service account JSON path
DOCUMENTAI_PROCESSOR_ID=         # Layout Parser processor ID
DOCUMENTAI_LOCATION=us           # Processor location

# For Claude validation (optional)
ANTHROPIC_API_KEY=
```

### Hybrid Strategy (If Needed)

```typescript
// Project-level configuration
interface ProjectSettings {
  layoutComplexity: 'simple' | 'complex';
  preferredApi: 'gemini' | 'document-ai' | 'auto';
}

async function processPage(page: Page, project: Project): Promise<Annotations> {
  if (project.settings.preferredApi === 'auto') {
    // Auto-select based on complexity
    if (project.settings.layoutComplexity === 'simple') {
      return await gemini.process(page);
    } else {
      return await documentAI.process(page);
    }
  } else {
    // Use user preference
    return await apis[project.settings.preferredApi].process(page);
  }
}
```

---

## References

- Google Document AI Pricing: https://cloud.google.com/document-ai/pricing
- Document AI Processors: https://docs.cloud.google.com/document-ai/docs/processors-list
- Gemini API Pricing: https://ai.google.dev/gemini-api/docs/pricing
- Google OCR for Sanskrit (2019): http://www.prakrit.info/blog/google-ocr-for-sanskrit/
- Sample files: `/sample files/` directory

---

## Next Steps

1. Create Gemini 2.5 Flash test script
2. Process both sample files (simple + complex)
3. Measure accuracy against criteria above
4. Make final decision
5. Document results in this ADR
6. Update REQUIREMENTS-v1.md with chosen API

**Timeline:** 1-2 days for testing, decision by 2025-12-07

---

**Decision Status:** ⏳ Awaiting test results
**Review Date:** After testing complete
