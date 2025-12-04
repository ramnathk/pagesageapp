# Pre-Commit Quality Checks

You are running the full pre-commit checklist for PageSage before allowing a commit.

## Pre-Commit Requirements (from CLAUDE.md)
- [ ] All tests passing (`npm test`)
- [ ] No TypeScript errors (`npm run check`)
- [ ] No linting errors (`npm run lint`)
- [ ] Build succeeds (`npm run build`)
- [ ] No console.log statements (use proper logging)

## Your Task

1. **Run all checks in parallel**:

```bash
# Run these concurrently
npm test && \
npm run check && \
npm run lint && \
npm run build
```

2. **Check for prohibited patterns**:
   - Search for `console.log` statements in non-test files
   - Check for `.env` files or secrets in staged files
   - Verify no large binary files without Git LFS
   - Check for TODO comments without issue numbers

3. **Review staged changes**:
   - Run `git diff --staged` to see what's being committed
   - Verify changes match commit intent
   - Check for unintended debug code

4. **Test coverage check**:
   - Run coverage report
   - Ensure coverage hasn't decreased
   - Verify new files have tests

5. **PageSage-specific checks**:
   - [ ] Sanskrit/Hindi text properly encoded (UTF-8)
   - [ ] No hardcoded API keys or credentials
   - [ ] Bounding box coordinates validated (0-1 range)
   - [ ] All external API calls are mocked in tests
   - [ ] Git commit messages follow conventional commits format

## Expected Output

### ✅ All Checks Passed
```
✓ Tests passing (127/127)
✓ TypeScript check passed
✓ Linting passed
✓ Build succeeded
✓ No console.log statements found
✓ No secrets in staged files
✓ Test coverage: 92% (target: 90%)

Ready to commit! ✨
```

### ❌ Checks Failed
```
✗ Tests failing: 3 failed, 124 passed
  - src/lib/ocr/processor.test.ts:42
  - src/lib/annotations/validator.test.ts:18
  - src/routes/api/ocr/+server.test.ts:56

✗ TypeScript errors: 2 errors
  - src/lib/types/ocr.ts:23 - Type 'string' is not assignable to type 'Language'
  - src/routes/+page.svelte:45 - Property 'annotations' does not exist on type 'PageData'

✓ Linting passed
✓ Build succeeded
✗ Found 4 console.log statements:
  - src/lib/debug.ts:12
  - src/routes/api/process/+server.ts:34

❌ Cannot commit. Fix the errors above first.
```

## Commands to Run

```bash
# Full check
npm test && npm run check && npm run lint && npm run build

# Quick check (skip build)
npm test && npm run check && npm run lint

# Coverage report
npm run test:coverage

# Find console.log statements
grep -r "console.log" src/ --exclude-dir=tests

# Check staged files
git diff --staged --name-only

# Review changes
git diff --staged
```

## Troubleshooting

### Tests Failing
- Run specific test: `npm test src/path/to/test.ts`
- Watch mode: `npm test -- --watch`
- Debug: Add `debugger` statement and run with `--inspect`

### TypeScript Errors
- Check type definitions in `/src/lib/types/`
- Verify imports are correct
- Run `npm run check -- --watch` for incremental checking

### Linting Errors
- Auto-fix: `npm run lint -- --fix`
- Ignore specific line: `// eslint-disable-next-line rule-name`
- Check `.eslintrc.cjs` for custom rules

### Build Failures
- Clear `.svelte-kit` cache: `rm -rf .svelte-kit`
- Check for circular dependencies
- Verify all imports resolve correctly

## After All Checks Pass

Remind the user:
1. Review the commit message format:
   ```
   <type>: <subject>

   <body>
   ```

2. Suggested types:
   - `feat`: New feature
   - `fix`: Bug fix
   - `test`: Adding/updating tests
   - `refactor`: Code restructuring
   - `docs`: Documentation
   - `chore`: Dependencies, config

3. Commit without AI attribution in message

## Notes
- This command should be run BEFORE every commit
- Consider setting up a git pre-commit hook to automate
- If checks take too long, can skip build during development
- Always run full checks before pushing to main
