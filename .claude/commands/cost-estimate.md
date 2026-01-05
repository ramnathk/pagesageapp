# API Cost Estimation for PageSage

You are calculating estimated costs for PageSage operations to help manage the API budget.

## Cost Management Philosophy (from CLAUDE.md)

- Track all API calls with costs
- Display estimated costs BEFORE processing ("This will cost ~$1.05")
- Budget awareness - check before queuing expensive operations
- Optimize: batch operations, cache results, avoid redundant processing
- Monthly caps with hard stop at budget limit

## Your Task

1. **Ask the user** what operation they want to estimate:
   - OCR processing for a book
   - Re-processing specific pages
   - GitHub API operations
   - Gemini API calls for enhancement

2. **Gather required information**:
   - Number of pages
   - Page resolution/size (KB or MB per page)
   - Whether it's initial OCR or re-processing
   - Whether layout detection is needed

3. **Calculate costs** based on pricing:

### Google Document AI Pricing (as of 2024)

- **Document OCR API**: $1.50 per 1,000 pages
- **Form Parser**: $65 per 1,000 pages (if needed for layout)
- **Specialized processors**: $85-$110 per 1,000 pages

### Gemini API Pricing (if used for enhancement)

- **Gemini 1.5 Flash**: $0.075 per 1M input tokens, $0.30 per 1M output tokens
- **Gemini 1.5 Pro**: $1.25 per 1M input tokens, $5.00 per 1M output tokens

### GitHub API

- Free for authenticated requests (5,000 req/hour)
- Storage: Free for public repos, $0.008/GB/month for private

4. **Display estimation**:

```
📊 Cost Estimation for OCR Processing

Book Details:
  - Title: Bhagavad Gita Sanskrit Edition
  - Pages: 850
  - Avg page size: 2.4 MB
  - Total size: 2.04 GB

Operations:
  ✓ Document OCR (text extraction)
  ✓ Layout detection (columns, verses)
  ✗ Form parsing (not needed)
  ✓ Multi-language detection (Sanskrit, Hindi)

Cost Breakdown:
  - OCR processing: 850 pages × $0.0015 = $1.28
  - Layout detection: 850 pages × $0.065 = $55.25
  - Gemini enhancement (optional): ~200K tokens × $0.075/1M = $0.02
  - GitHub storage: 2.04 GB × $0.008 = $0.02/month

📈 Total Estimated Cost: $56.57 (one-time)
💰 Monthly storage cost: $0.02

⚠️  This is a significant expense. Consider:
  - Test with 10 sample pages first (~$0.67)
  - Review OCR quality before processing full book
  - Check if layout detection is necessary (saves $54.97)
  - Use cached results if re-processing

Proceed? [y/N]
```

5. **Suggest optimizations**:
   - **Batch processing**: Group pages to minimize API calls
   - **Sampling**: Process 5-10 pages first to validate quality
   - **Caching**: Store OCR results to avoid re-processing
   - **Incremental**: Process pages independently, work on completed ones
   - **Layout detection**: Only use if needed (most expensive!)
   - **Resolution**: Reduce image resolution if quality is acceptable

6. **Budget tracking**:
   - Show current month's spending
   - Warn if approaching budget limit
   - Suggest alternatives if over budget

## Cost Optimization Strategies

### For OCR Processing

```
Strategy 1: Basic OCR only
  - Skip layout detection
  - Use Document OCR API only
  - Cost: $1.28 for 850 pages
  - Savings: $54.97 (96% cheaper!)

Strategy 2: Sample-then-process
  - Process 10 pages first: $0.67
  - Review quality
  - Process remaining 840 pages: $55.90
  - Total: $56.57 (same cost, but validated)

Strategy 3: Progressive enhancement
  - Basic OCR first: $1.28
  - Manual layout annotation: $0
  - Use AI only for uncertain sections
  - Potential savings: $30-40
```

### For Storage

- Use public GitHub repos (free)
- Compress JSON exports with gzip
- Store only essential data (text + coordinates)
- Archive old versions after 6 months

## Monthly Budget Report

```
📅 January 2024 Budget Report

Spending:
  - OCR processing: $234.56 / $500 budget (47%)
  - Gemini enhancement: $12.34 / $100 budget (12%)
  - Storage: $1.23 / $25 budget (5%)

Total: $248.13 / $625 monthly budget (40%)

Books processed: 4
  1. Bhagavad Gita (850 pages) - $56.57
  2. Upanishads Collection (1,200 pages) - $78.00
  3. Ramayana (2,100 pages) - $89.25
  4. Vedic Hymns (350 pages) - $23.91

Remaining budget: $376.87

⚠️  Projected end-of-month: $520 (exceeds budget by $95)
   Consider: Reduce processing or increase budget
```

## API Call Tracking

Log all API calls to `/data/api-usage.json`:

```json
{
  "calls": [
    {
      "timestamp": "2024-01-15T10:30:00Z",
      "service": "google-document-ai",
      "operation": "ocr-page",
      "pages": 10,
      "cost": 0.015,
      "bookId": "bhagavad-gita",
      "userId": "user123"
    }
  ],
  "monthly": {
    "2024-01": {
      "total": 248.13,
      "budget": 625,
      "calls": 1247
    }
  }
}
```

## Output

- Display clear cost estimation
- Suggest optimizations
- Show budget status
- Log the estimation request
- Ask for confirmation before expensive operations
