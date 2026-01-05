# Claude Code Preferences - PageSage App

### Tool Usage Preferences

**Testing:**

- **Always use** `mcp__vitest-runner__run-vitest` for running tests
- **Never use** `npm test` directly
- **Coverage reports**: Use `mcp__vitest-runner__run-vitest-coverage`
- **Benefits**: Better integration, real-time feedback in Claude context

**Documentation Lookup (priority order):**

1. **context7** (first choice) - Official library/framework documentation
   - Use `mcp__context7__resolve-library-id` then `mcp__context7__get-library-docs`
   - Best for: React, Svelte, TypeScript, Obsidian API, npm packages
   - Get API references, official guides, authoritative docs
2. **exa** (second choice) - Community content, real-world examples
   - Use `mcp__exa__get_code_context_exa` for programming-related queries
   - Best for: Blog posts, Stack Overflow, GitHub issues, tutorials, troubleshooting

**Web Search:**

- **Always use** `mcp__exa__web_search_exa` for general web searches
- **Never use** built-in WebSearch
- **Reason**: Better quality results, can scrape specific URLs, more reliable

**Planning & Architecture:**

- **Use thoughtbox** (`mcp__thoughtbox__thoughtbox`) before starting complex work
- **When**: Multi-step features, architecture decisions, debugging complex issues
- **Templates**: Sequential Feynman template for deep learning of new concepts
- **Benefits**: Better plans, fewer mistakes, clearer thinking process

### Testing Approach

- **Never reduce test coverage**: All tests must pass before committing
- **Test-first verification**: Always run tests before and after changes
- **Coverage targets**: Maintain or improve existing 805 tests
- **Test alongside code**: When adding features, add tests in same session
- **E2E for UI**: UI components should have end-to-end tests
- **Documentation-driven tests**: Update test-suite.md to auto-generate new tests

### Svelte Conventions

- **Accessibility first**: Proper labels, ARIA, semantic HTML
- **Always use keys**: Every `{#each}` block must have unique key
- **Form semantics**: Use `<fieldset>/<legend>` for grouped inputs
- **Component verification**: Run autofixer before committing any .svelte file
- **Version**: Svelte 4 (verify in package.json)

### Git Standards

- **Commit message format**:
  - First line: Action verb + concise description
  - Body: Bullet list of changes
- **Rebase preferred**: Use `git pull --rebase` to avoid merge commits
- **Small commits**: Focused changes, one concern per commit
- **Build verification**: Verify builds succeed before releasing

### Release Workflow Preferences

- **Semantic versioning**: Follow semver strictly (no 'v' prefix in tags)
- **Release artifacts**: Always attach main.js, manifest.json, styles.css
- **Release notes**: Include features, fixes, test count, requirements
- **Tag management**: Delete old tags before recreating
- **Verification**: Test installation process (BRAT for Obsidian)

## Project Overview

**PageSage** is an Ancient Text OCR & Annotation Platform for digitizing Sanskrit, Hindi, and English multi-language books with AI-assisted layout detection and human-in-the-loop correction.

**Tech Stack:**

- SvelteKit (frontend & backend)
- TypeScript
- GitHub (storage, authentication, version control)
- Google Document AI / Gemini (OCR & layout detection APIs)
- Desktop web application (no mobile)

**Key Values:**

- Data integrity and correctness (working with historical texts)
- Cost awareness (cloud API usage)
- Collaboration and attribution
- Git-friendly storage (plain text, human-readable)

---

## 🧪 Testing Philosophy

### Testing Approach

- **Coverage target**: 90% minimum (95%+ preferred)
- **Test types required**:
  - Unit tests for business logic (text processing, coordinate calculations, validation)
  - Integration tests for API workflows (OCR pipeline, GitHub operations)
  - E2E tests for critical user flows (upload → process → annotate → export)
- **Test-first verification**: Always run tests before committing changes
- **Never reduce coverage**: All tests must pass before commit
- **Test with code**: Add tests in same session as features
- **TDD approach**: Always write tests before implementing features/bug fixes
- **Mock philosophy**: Mock external APIs (Google, GitHub) but prefer integration tests for internal services

### Special Considerations

- **Historical text accuracy**: Test edge cases for Sanskrit/Hindi character handling
- **Data integrity**: Tests must verify no data loss in annotation workflows
- **Cost simulation**: Mock expensive API calls in tests to avoid charges

---

## 💻 Code Style & Conventions

### General

- **Line length**: 100 characters max
- **Indentation**: 2 spaces (tabs for .svelte files per Svelte convention)
- **Quotes**: Single quotes for strings, double quotes in templates
- **Semicolons**: Consistent with project (prefer without for Svelte)

### TypeScript/JavaScript

- **Type annotations**: Always for function signatures and exported types, minimal within functions
- **Async patterns**: async/await over promises
- **Function style**: Arrow functions for utilities, regular functions for Svelte component methods
- **Destructuring**: Use when it improves readability
- **Optional chaining**: Use `?.` and `??` operators for safety
- **Strict mode**: TypeScript strict mode enabled

### Svelte-Specific

- **Runes (Svelte 5)**: Use `$state`, `$derived`, `$effect` for reactivity
- **Component structure**:

  ```svelte
  <script lang="ts">
    // Imports
    // Props
    // State
    // Derived
    // Functions
    // Effects
  </script>

  <!-- Template -->

  <style>
    /* Scoped styles */
  </style>
  ```

- **Props**: Use TypeScript interfaces for component props
- **Events**: Use typed event handlers
- **Stores**: Use for global state only, prefer local state otherwise

### Naming Conventions

- **Variables**: camelCase
- **Constants**: UPPER_SNAKE_CASE
- **Functions**: camelCase (verb + noun: `processBoundingBox`, `exportToMarkdown`)
- **Classes/Interfaces**: PascalCase
- **Components**: PascalCase (e.g., `AnnotationEditor.svelte`)
- **Files**: kebab-case for utilities, PascalCase for components
- **Test files**: `*.test.ts` or `ComponentName.test.svelte`

### Comments & Documentation

- **When to comment**: Why, not what - code should be self-documenting
- **TODOs**: Use `TODO:` format with GitHub issue number if applicable
- **Function docs**: JSDoc for public APIs and complex functions
- **Inline comments**: Only for complex logic that can't be simplified
- **Sanskrit/Hindi content**: Always add English translation comments for non-English text processing logic

---

## 🌿 Git Workflow

### Commit Messages

**Format**:

```
<type>: <subject>

<body>

```

**Types**:

- `feat`: New feature (e.g., annotation editor, OCR pipeline)
- `fix`: Bug fix
- `docs`: Documentation only
- `style`: Formatting, linting fixes
- `refactor`: Code restructuring without behavior change
- `test`: Adding or updating tests
- `chore`: Dependency updates, build config
- `perf`: Performance improvements
- `security`: Security fixes or improvements

**Examples**:

```
feat: add bounding box resize functionality to annotation editor
fix: correct coordinate calculation for multi-column layouts
docs: update API documentation for OCR endpoint
test: add integration tests for GitHub storage layer
chore: update SvelteKit to v2.0
```

### Branching Strategy

- **Main branch**: `main`
- **Development branch**: None (direct to main with feature branches)
- **Feature branches**: `feat/description` (e.g., `feat/annotation-editor`)
- **Bug fix branches**: `fix/description` (e.g., `fix/ocr-memory-leak`)
- **Keep branches short-lived**: Merge within 1-3 days

### Merge Strategy

- **Preference**: Squash and merge for feature branches
- **Rationale**: Clean, linear history focused on features, not intermediate commits
- **Direct commits to main**: Only for trivial fixes or documentation

### Commit Frequency

- **Preference**: Commit logical units of work
- **Guideline**: Each commit should represent a complete, working change
- **WIP commits**: Avoid - use git stash or local branches instead

### Pre-Commit Requirements

- [ ] All tests passing (`npm test`)
- [ ] No TypeScript errors (`npm run check`)
- [ ] No linting errors (`npm run lint`)
- [ ] Build succeeds (`npm run build`)
- [ ] No console.log statements (use proper logging)

### Push Requirements

- [ ] Pre-commit checks pass
- [ ] Commit message follows format
- [ ] No sensitive data (API keys, credentials)
- [ ] No large binary files (use Git LFS if needed)

---

## 🎯 Development Approach

### Planning vs Coding

- **Approach**: Context engineering first for complex features
- **When to plan**: Multi-step features, architectural decisions, API integrations
- **Documentation**: Document architectural decisions as you go in ADRs (Architecture Decision Records)

### Error Handling

- **Strategy**: Fail gracefully with user-friendly messages
- **Critical errors**: GitHub storage failures - block further edits, display prominent warning
- **Recoverable errors**: API failures - retry with backoff, queue for later
- **User-facing errors**: Friendly messages with actionable suggestions
- **Logging**: Structured JSON logs in project repo for debugging

### Performance

- **Optimization timing**: Profile first, don't premature optimize
- **Priorities**: Correctness > Maintainability > Performance
- **Critical paths**: Annotation editor must be responsive (<100ms interactions)
- **Large datasets**: Handle 1000+ page books efficiently (lazy loading, virtual scrolling)

### Dependencies

- **Philosophy**: Use battle-tested libraries, minimize dependencies
- **Evaluation criteria**: Maintenance activity, bundle size, TypeScript support, community
- **Updates**: Security patches immediately, major versions conservatively
- **Avoid**: Large UI component libraries (Svelte is lightweight, keep it that way)

---

## 🏗️ Architecture Preferences

### Code Organization

- **Structure**: Feature-based with some layer separation

```
src/
  lib/
    components/       # Reusable Svelte components
    features/         # Feature modules (annotation, ocr, export)
    services/         # API clients (github, google-ai)
    stores/           # Global state management
    utils/            # Pure utility functions
    types/            # TypeScript type definitions
  routes/             # SvelteKit routes
    +page.svelte
    +layout.svelte
    api/              # API endpoints
  tests/              # Test files mirroring src structure
```

- **File size**: ~300 lines max (exceptions for complex UI components)
- **Function size**: Small, focused functions (15-30 lines typical)
- **Coupling**: Loose coupling, high cohesion

### Design Patterns

- **Preferred patterns**:
  - Repository pattern for data access (GitHub, file storage)
  - Strategy pattern for OCR engines (different languages)
  - Observer pattern for real-time updates
  - Factory pattern for creating annotation objects
- **Avoid patterns**: Singleton (use Svelte stores), God objects
- **When to use**: When pattern clarifies design, not for pattern's sake

### Abstraction Level

- **Philosophy**: YAGNI (You Aren't Gonna Need It) - build for today's needs
- **Abstractions**: Add when you have 3+ similar cases (Rule of Three)
- **Over-engineering**: Avoid premature abstractions, unnecessary configuration
- **Extensibility**: Design for extension at clear boundaries (OCR engines, export formats)

---

## 🔒 Security & Best Practices

### Data Handling

- **Sensitive data**: API keys in environment variables, never in code
- **Input validation**: Validate at boundaries (PDF uploads, API inputs)
- **Output encoding**: Sanitize user-generated content in annotations
- **File uploads**: Validate file types, scan for malware, enforce size limits (500MB max)

### Authentication & Authorization

- **Approach**: GitHub OAuth only (no password auth)
- **Token storage**: Server-side sessions, httpOnly cookies
- **Session management**: 7-day timeout, automatic refresh
- **Access control**: Check permissions on every API request, return 403 for unauthorized

### API Security

- **Rate limiting**: Per-user and per-IP limits
- **CSRF protection**: Enable for all state-changing operations
- **CORS**: Restrict to known origins only
- **XSS prevention**: Svelte auto-escapes by default, be careful with `@html`

### Dependencies

- **Security scanning**: Automated with `npm audit`
- **Update policy**: Security patches within 24 hours
- **Audit regularly**: Review dependencies monthly

---

## 📦 Cost Management

### Cloud API Usage

- **Track everything**: Log all API calls with costs
- **Budget awareness**: Check budget before queuing expensive operations
- **Display costs**: Show estimated costs before processing ("This will cost ~$1.05")
- **Optimize**: Batch operations, cache results, avoid redundant processing
- **Monthly caps**: Hard stop at budget limit to prevent runaway costs

### Development Practices

- **Mock in development**: Don't call real APIs during development
- **Test with samples**: Use small sample books for testing
- **Monitor in production**: Dashboard showing API usage and costs

---

## 🗣️ Communication Style

### Verbosity

- **Code explanations**: Concise, focus on why not what
- **Commit messages**: Descriptive subject, detailed body for complex changes
- **Documentation**: Essential information only, keep it updated

### Questions & Clarifications

- **Approach**: Ask questions when requirements are ambiguous
- **Ambiguity handling**: Make reasonable assumptions for minor details, clarify architectural decisions
- **User feedback**: Propose solutions, but defer to user for final decisions

### Code Review

- **Tone**: Constructive and respectful
- **Focus**: Correctness first, then maintainability, then style
- **Historical text handling**: Extra scrutiny for text processing logic

---

## 🔧 SvelteKit & Svelte 5 Conventions

### Component Structure

- **Composition over inheritance**: Build complex UIs from small, focused components
- **Props vs stores**: Props for component communication, stores for global state only
- **Reactive statements**: Use Svelte 5 runes (`$state`, `$derived`, `$effect`)

### State Management

- **Local state**: Default to `$state` within components
- **Global state**: Svelte stores for user session, project metadata
- **Form state**: Use Svelte 5 form bindings, validate on blur
- **Server state**: SvelteKit load functions, avoid client-side data fetching where possible

### Styling Approach

- **Scoped styles**: Component-level `<style>` tags (default Svelte behavior)
- **Global styles**: Minimal, in `app.css`
- **Utility classes**: Avoid utility-first CSS, prefer semantic styles
- **Responsive**: Mobile-first CSS even though app is desktop-focused (good practice)
- **Dark mode**: Not required for MVP

### SvelteKit Best Practices

- **Server vs client**: Prefer server-side rendering, use `+page.server.ts` for data loading
- **API routes**: Use SvelteKit endpoints (`+server.ts`) for backend APIs
- **Form actions**: Use SvelteKit form actions for mutations
- **Error handling**: Use SvelteKit error pages (`+error.svelte`)
- **Loading states**: Use SvelteKit's built-in loading states

---

## 📋 Project-Specific Guidelines

### Working with Historical Texts

- **Character encoding**: Always UTF-8, preserve special characters
- **Devanagari support**: Test with actual Sanskrit/Hindi text, not Lorem Ipsum
- **IAST transliteration**: Preserve diacritics accurately
- **Text direction**: Support left-to-right (all languages in scope)

### GitHub Integration

- **Plain text storage**: All annotations as JSON (git-friendly)
- **Commit granularity**: One commit per save action (with user attribution)
- **Repository structure**: Follow structure defined in REQUIREMENTS.md
- **Service account**: Backend uses dedicated GitHub service account

### OCR Pipeline

- **Incremental processing**: Process pages independently, allow working on completed pages
- **Confidence tracking**: Store OCR confidence scores, highlight low-confidence sections
- **Edit history**: Track original OCR → user edits → final version
- **Cost optimization**: Preview with sample pages before full processing

### Annotation Editor

- **Responsiveness**: Sub-100ms interaction latency for drag/resize operations
- **Visual distinction**: Clear visual difference between AI-generated and user-edited content
- **Keyboard shortcuts**: Support common operations (undo, delete, copy)
- **Zoom & pan**: Handle large page images efficiently

### Data Integrity

- **Autosave**: Save changes every 30 seconds
- **Validation**: Validate bounding box coordinates, text encoding
- **Backup**: GitHub provides versioning, but export project data regularly
- **Rollback**: Support reverting to previous versions

---

## 📊 Quick Reference Card

```yaml
Project: PageSage (Ancient Text OCR Platform)
Stack: SvelteKit, TypeScript, GitHub, Google AI APIs
Test Coverage: 80% minimum
Commit Format: conventional commits with no AI attribution
Merge Strategy: Squash and merge
CI/CD: GitHub Actions (TBD)
Key Conventions:
  - Use Svelte 5 runes for reactivity
  - Plain text storage (git-friendly)
  - Cost-aware API usage
  - GitHub OAuth only
  - Desktop-focused web app
  - Data integrity is paramount
```

---

## 🚀 Getting Started with This Project

When working on PageSage:

1. **Read REQUIREMENTS.md** first to understand scope and technical decisions
2. **Check existing code** patterns before adding new features
3. **Mock expensive APIs** during development (Google AI, GitHub when possible)
4. **Test with real data** - use actual Sanskrit/Hindi text samples
5. **Consider costs** - always think about API usage implications
6. **Preserve history** - all changes tracked with full attribution
7. **Think collaborative** - multiple users may work on same book
8. **Data first** - correctness and integrity over speed

---

## 📝 Notes

- This is Component 1 only - OCR/Annotation tool (see REQUIREMENTS.md for full project scope)
- Public website (Component 2) and cross-reference engine (Component 3) are separate future projects
- All book content is public domain (no copyright restrictions)
- Contributors don't pay - admin bears all costs
- Focus on desktop web experience (mobile out of scope)
