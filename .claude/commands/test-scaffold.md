# Test Scaffolding for PageSage

You are setting up tests for PageSage with 90% coverage target.

## Testing Philosophy (from CLAUDE.md)

- **TDD approach**: Write tests BEFORE features
- **Coverage target**: 90% minimum (95%+ preferred)
- **Test types**:
  - Unit tests: Business logic, text processing, coordinate calculations
  - Integration tests: API workflows, GitHub operations, OCR pipeline
  - E2E tests: Upload → Process → Annotate → Export flows
- **Mock philosophy**: Mock external APIs (Google, GitHub) but prefer integration tests for internal services

## Your Task

1. **Ask the user** what they want to test:
   - Unit test for a function/class
   - Integration test for an API workflow
   - E2E test for a user flow
   - Component test for Svelte component

2. **Check test infrastructure** exists:
   - Vitest config
   - Test utilities in `/src/tests/utils/`
   - Mock factories
   - Test data fixtures (especially Sanskrit/Hindi samples)

3. **Generate test file** with this structure:

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { TestSubject } from "$lib/types";

/**
 * Tests for [describe what's being tested]
 *
 * Coverage areas:
 * - [Area 1]
 * - [Area 2]
 *
 * Edge cases:
 * - [Special case 1, e.g., Sanskrit diacritics]
 * - [Special case 2, e.g., multi-line annotations]
 */

describe("[Component/Function Name]", () => {
  // Setup
  beforeEach(() => {
    // Reset mocks, initialize test data
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("happy path", () => {
    it("should [expected behavior]", () => {
      // Arrange
      const input = createTestData();

      // Act
      const result = functionUnderTest(input);

      // Assert
      expect(result).toEqual(expectedOutput);
    });
  });

  describe("edge cases", () => {
    it("should handle Sanskrit text with diacritics", () => {
      // Test with actual Devanagari characters
      const sanskritText = "भगवद्गीता"; // Bhagavad Gita
      // ... test logic
    });

    it("should handle empty input gracefully", () => {
      // ... test logic
    });

    it("should validate bounding box coordinates", () => {
      // Coordinates must be 0-1 normalized
      // ... test logic
    });
  });

  describe("error conditions", () => {
    it("should throw descriptive error for invalid input", () => {
      expect(() => functionUnderTest(null)).toThrow("Expected non-null input");
    });
  });
});
```

4. **For Integration Tests** (API workflows):

```typescript
import { describe, it, expect, vi } from "vitest";
import { mockGoogleAI, mockGitHub } from "$tests/mocks";

describe("OCR Pipeline Integration", () => {
  it("should process page and save to GitHub", async () => {
    // Mock expensive external APIs
    const mockOCR = vi.spyOn(mockGoogleAI, "processDocument");
    const mockSave = vi.spyOn(mockGitHub, "commitFile");

    mockOCR.mockResolvedValue({
      text: "Sample OCR output",
      confidence: 0.95,
    });

    // Test the full workflow without hitting real APIs
    await ocrPipeline.process(testPDF);

    expect(mockOCR).toHaveBeenCalledWith(expect.any(Buffer));
    expect(mockSave).toHaveBeenCalledWith(
      expect.objectContaining({
        path: expect.stringMatching(/\.json$/),
        content: expect.stringContaining("Sample OCR output"),
      }),
    );
  });
});
```

5. **For E2E Tests** (Playwright):

```typescript
import { test, expect } from "@playwright/test";

test.describe("Annotation Workflow", () => {
  test("should upload, process, annotate, and export book", async ({
    page,
  }) => {
    // Navigate to app
    await page.goto("/");

    // Upload PDF
    await page.setInputFiles(
      '[data-testid="file-upload"]',
      "./fixtures/sample-book.pdf",
    );

    // Wait for processing
    await page.waitForSelector('[data-testid="annotation-editor"]');

    // Edit annotation
    await page.click('[data-testid="annotation-0"]');
    await page.fill('[data-testid="text-editor"]', "Corrected text");

    // Export
    await page.click('[data-testid="export-markdown"]');

    // Verify download
    const download = await page.waitForEvent("download");
    expect(download.suggestedFilename()).toMatch(/\.md$/);
  });
});
```

6. **PageSage-specific test data**:
   - Create fixtures in `/tests/fixtures/`:
     - `sample-sanskrit.txt` - Devanagari text samples
     - `sample-hindi.txt` - Hindi text samples
     - `sample-page.json` - OCR result structure
     - `sample-annotations.json` - Annotation data
   - Mock factories in `/tests/mocks/`:
     - `mockOCRResult()` - Generate fake OCR responses
     - `mockGitHubCommit()` - Simulate GitHub operations
     - `mockBoundingBox()` - Valid coordinate data

7. **Cost-aware mocking**:
   - ALWAYS mock Google Document AI (expensive!)
   - ALWAYS mock GitHub API (rate limits!)
   - Use vitest-mock-extended for type-safe mocks
   - Simulate API errors/rate limits in tests

8. **Run tests**:
   ```bash
   npm test                    # Run all tests
   npm run test:unit           # Unit tests only
   npm run test:integration    # Integration tests
   npm run test:e2e            # E2E tests
   npm run test:coverage       # Generate coverage report
   ```

## Output

- Create test file mirroring source structure
- Add test data fixtures if needed
- Ensure mocks are reusable
- Document any special setup requirements
- Run the tests to verify they pass
