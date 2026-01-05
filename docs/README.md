# PageSage Documentation Index

**Last Updated:** 2025-01-05

This directory contains all architecture, design, and planning documentation for PageSage.

---

## Start Here

### Primary Architecture Documentation

1. **[Deployment Architecture](deployment-architecture-cloudflare-github.md)** ⭐ START HERE
   - Cloudflare Pages + GitHub Actions deployment
   - Storage strategy: R2 (binary) vs GitHub (metadata)
   - Complete data flow and cost breakdown
   - **Status:** Current, authoritative

2. **[Data Schemas](data-schemas.md)**
   - TypeScript interfaces for all data structures
   - BoundingBox, PageAnnotations, ProjectMetadata, etc.
   - **Status:** Current

3. **[Annotation Editor Implementation Plan](annotation-editor-implementation-plan.md)**
   - 3-phase implementation over 4 weeks
   - HTML5 Canvas bounding box editor
   - Component architecture and coordinate system
   - **Status:** Current (2025-01-05)

---

## Implementation Planning

### Use Case Driven Development

- **[Use Cases](use-cases.md)** - Complete UC-1 through UC-15 with test scenarios
  - UC-1: Environment setup
  - UC-2: GitHub authentication
  - UC-3: Create project
  - UC-4: Upload PDF
  - UC-5: View dashboard
  - UC-6: Split PDF into pages
  - UC-7: Quality check
  - UC-8: AI layout detection
  - UC-9-15: Annotation, batch processing, export

### Technical Specifications

- **[PDF Processing Pipeline](pdf-processing-pipeline.md)** - PDF splitting and image preprocessing logic
- **[System Modules](system-modules.md)** - Module breakdown and responsibilities
- **[Test Specifications](test-specifications.md)** - Testing strategy and requirements
- **[Performance Requirements](performance-requirements.md)** - Latency and throughput targets
- **[Security Threat Model](security-threat-model.md)** - Security considerations

---

## Architecture Decision Records (ADRs)

- **[ADR 001: Storage Architecture](adr/001-storage-architecture.md)** - GitHub + R2 (not database)
- **[ADR 002: AI API Selection](adr/002-ai-api-selection.md)** - Document AI vs Gemini analysis

---

## Supporting Documentation

### AI API Evaluation

- **[Gemini 2.5 Flash Evaluation Report](gemini-2.5-flash-evaluation-report.md)** - Why Gemini failed for PageSage
- **[Quality Analysis](quality-analysis.md)** - Image quality metrics and preprocessing

### Historical/Reference (Partially Outdated)

- **[Backend Architecture Analysis](backend-architecture.md)** ⚠️ PARTIALLY OUTDATED
  - Still valuable: Sample analysis, backend responsibilities, real-time patterns
  - Outdated: Architecture options 1-3, Recommendations (see deployment doc instead)

---

## Quick Reference

### Architecture Summary

```
Tech Stack: SvelteKit (Svelte 5) + TypeScript
Deployment: Cloudflare Pages + GitHub Actions
Storage: Cloudflare R2 (binary) + GitHub (metadata)
AI APIs: Google Document AI ($7/book) or Gemini 2.5 Flash (experimental)
Cost: $0-2/month hosting (free tier)
```

### Key Design Decisions

- ✅ Database-free architecture (files only)
- ✅ GitHub for version control and metadata storage
- ✅ Cloudflare R2 for binary/image storage (zero egress fees)
- ✅ GitHub Actions for long-running background jobs (free tier)
- ✅ HTML5 Canvas for bounding box annotation editor
- ✅ Svelte 5 runes for state management

### Development Workflow

1. Read [Use Cases](use-cases.md) to understand features
2. Check [Data Schemas](data-schemas.md) for type definitions
3. Follow [Annotation Editor Plan](annotation-editor-implementation-plan.md) for UI implementation
4. Refer to [Deployment Architecture](deployment-architecture-cloudflare-github.md) for infrastructure

---

## Document Status Legend

- ⭐ **Current & Authoritative** - Use this as source of truth
- ✅ **Current** - Accurate and up-to-date
- ⚠️ **Partially Outdated** - Some sections superseded, see notes in file
- 🗄️ **Historical** - Kept for context, may not reflect current decisions

---

**For questions about architecture, start with `deployment-architecture-cloudflare-github.md`**
