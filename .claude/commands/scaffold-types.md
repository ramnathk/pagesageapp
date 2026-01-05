# TypeScript Type Scaffolding for PageSage

You are helping scaffold TypeScript types and interfaces for PageSage's core data structures.

## Project Context

PageSage handles:

- **OCR Results**: Text, coordinates, confidence scores
- **Annotations**: Bounding boxes, user edits, attribution
- **Documents**: Multi-page books, metadata, version history
- **Multi-language text**: Sanskrit (Devanagari), Hindi, English

## Your Task

1. **Ask the user** what domain they want to scaffold:
   - OCR types (results, confidence, language detection)
   - Annotation types (bounding boxes, text regions, edits)
   - Document types (book metadata, page info, project structure)
   - GitHub types (commits, storage format, attribution)
   - API types (request/response for endpoints)

2. **Check existing types** in:
   - `/src/lib/types/*.ts`
   - Look for overlaps to avoid duplication

3. **Generate types following these patterns**:

```typescript
/**
 * Core type with JSDoc
 */
export interface TypeName {
  // Required fields first
  id: string;
  createdAt: Date;

  // Optional fields after
  updatedAt?: Date;

  // Complex nested types
  metadata: {
    key: string;
    value: unknown;
  };
}

// Type guards for runtime validation
export function isTypeName(value: unknown): value is TypeName {
  return (
    typeof value === "object" &&
    value !== null &&
    "id" in value &&
    typeof value.id === "string"
  );
}

// Utility types
export type CreateTypeNameInput = Omit<TypeName, "id" | "createdAt">;
export type UpdateTypeNameInput = Partial<CreateTypeNameInput>;
```

4. **PageSage-specific conventions**:
   - **Coordinates**: Use `BoundingBox` with `{ x, y, width, height }` (normalized 0-1)
   - **Text content**: Always UTF-8, preserve Unicode
   - **Confidence**: Number 0-1 (0 = no confidence, 1 = certain)
   - **Attribution**: `{ userId: string, timestamp: Date, action: string }`
   - **Languages**: `'sanskrit' | 'hindi' | 'english'` union type
   - **Git refs**: Store as `{ sha: string, ref: string }`

5. **Include validation helpers**:
   - Type guards (`isX`)
   - Zod schemas for runtime validation (if needed)
   - Builder functions for complex types

6. **Testing considerations**:
   - Export factory functions for test data
   - Include mock data generators
   - Document edge cases in comments

## Example Domains

### OCR Types

```typescript
export interface OCRResult {
  text: string;
  confidence: number; // 0-1
  boundingBox: BoundingBox;
  language: Language;
  detectedScript?: "devanagari" | "latin";
}

export interface BoundingBox {
  x: number; // 0-1 normalized
  y: number;
  width: number;
  height: number;
}
```

### Annotation Types

```typescript
export interface Annotation {
  id: string;
  pageId: string;
  type: "text" | "heading" | "verse" | "commentary";
  originalText: string; // OCR output
  editedText?: string; // User correction
  boundingBox: BoundingBox;
  attribution: Attribution[];
  confidence: number;
  createdAt: Date;
  updatedAt?: Date;
}
```

## Output

- Create type file in `/src/lib/types/`
- Export from `/src/lib/types/index.ts`
- Generate corresponding test file with factories
- Document any special handling for Sanskrit/Hindi text
