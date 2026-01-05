# PageSage v1 - Performance Requirements & Validation

**Generated:** 2025-12-01
**Status:** Pre-implementation
**Key Target:** <100ms annotation editor interactions

---

## Executive Summary

This document validates the feasibility of PageSage v1 performance requirements and provides implementation recommendations.

**Verdict:** All performance targets are ACHIEVABLE with proper implementation strategies.

---

## Performance Requirements

### Critical Performance Target (Flow 5: Annotation Editor)

**Requirement:** <100ms interaction latency for all editor operations

**Operations in scope:**

- Bounding box drag
- Bounding box resize
- Create new box
- Pan canvas
- Zoom in/out

**Validation:** ✅ ACHIEVABLE

---

## Feasibility Analysis

### Target: <100ms Interaction Latency

**Human Perception Thresholds:**

- <100ms: Feels instant
- 100-300ms: Slight delay noticeable
- 300-1000ms: Feels sluggish
- 1000ms+: Frustrating

**Target Justification:** 100ms is the gold standard for UI responsiveness.

---

### Factors Affecting Performance

#### 1. Canvas Technology Choice

**Options:**

**A. HTML5 Canvas**

- **Pros:** Fast rendering, GPU-accelerated
- **Cons:** Full repaint on changes
- **Performance:** Excellent for up to 500 boxes
- **Recommendation:** ✅ PRIMARY CHOICE

**B. SVG**

- **Pros:** Vector-based, selective updates, native DOM
- **Cons:** Slower with many elements (>200)
- **Performance:** Good for <200 boxes
- **Recommendation:** ⚠️ FALLBACK

**C. WebGL**

- **Pros:** Maximum performance, thousands of objects
- **Cons:** Complex implementation, overkill for v1
- **Performance:** Excellent
- **Recommendation:** ❌ DEFER TO v2

**D. Hybrid (Canvas + SVG)**

- **Pros:** Canvas for image, SVG for boxes
- **Cons:** Coordination complexity
- **Performance:** Excellent
- **Recommendation:** ✅ CONSIDER IF NEEDED

**Decision:** Start with HTML5 Canvas. Optimize with offscreen rendering and requestAnimationFrame.

---

#### 2. Number of Bounding Boxes

**Load Scenarios:**

| Scenario | Box Count | Expected Performance | Mitigation              |
| -------- | --------- | -------------------- | ----------------------- |
| Light    | 10-20     | <50ms                | None needed             |
| Normal   | 50-100    | <100ms               | Standard rendering      |
| Heavy    | 200-300   | ~150ms               | Virtualization          |
| Extreme  | 500+      | ~300ms+              | Virtualization REQUIRED |

**Maximum:** 500 boxes per page (as per scale limits)

**Strategy:** Implement box virtualization (render only visible boxes).

---

#### 3. Image Size & Resolution

**Challenges:**

| Image Size | Dimensions | File Size | Load Time | Rendering |
| ---------- | ---------- | --------- | --------- | --------- |
| Small      | 2000x3000  | 1-2MB     | <1s       | Fast      |
| Medium     | 4000x6000  | 3-5MB     | 1-2s      | Moderate  |
| Large      | 8000x12000 | 8-15MB    | 3-5s      | Slow      |

**Mitigation Strategies:**

1. **Image Pyramid (Multiple Resolutions)**
   - Thumbnail: 500x750 (for page list)
   - Preview: 2000x3000 (for editing)
   - Full-res: 4000x6000 (for zoomed view)

2. **Progressive Loading**
   - Load preview first
   - Load full-res in background
   - Swap when ready

3. **Lazy Loading**
   - Only load images when page is viewed
   - Unload images for off-screen pages

4. **Image Format Optimization**
   - Use WebP (30% smaller than JPEG)
   - Fallback to JPEG for compatibility

---

#### 4. Browser & Device Variability

**Target Platform:** Desktop browsers (no mobile for v1)

**Supported Browsers:**

- Chrome 100+ ✓
- Firefox 100+ ✓
- Safari 15+ ✓
- Edge 100+ ✓
- No IE11 ❌

**Minimum Hardware:**

- CPU: Modern dual-core (2015+)
- RAM: 8GB
- GPU: Integrated graphics sufficient

**Performance Budget:**

| Metric                         | Target | Acceptable | Failure |
| ------------------------------ | ------ | ---------- | ------- |
| FCP (First Contentful Paint)   | <1.0s  | <2.0s      | >3.0s   |
| LCP (Largest Contentful Paint) | <2.0s  | <3.0s      | >4.0s   |
| TBT (Total Blocking Time)      | <100ms | <300ms     | >600ms  |
| CLS (Cumulative Layout Shift)  | <0.1   | <0.25      | >0.25   |
| Annotation interaction         | <100ms | <150ms     | >200ms  |

---

## Implementation Strategies

### 1. Rendering Optimization

**Use requestAnimationFrame:**

```typescript
function updateBox(boxId: string, x: number, y: number) {
  requestAnimationFrame(() => {
    // Update box position
    // Redraw canvas
  });
}
```

**Benefits:** 60fps, synchronized with browser repaint

---

### 2. Box Virtualization

**Concept:** Only render boxes that are visible in viewport.

```typescript
function getVisibleBoxes(allBoxes, viewport) {
  return allBoxes.filter(
    (box) =>
      box.x < viewport.right &&
      box.x + box.width > viewport.left &&
      box.y < viewport.bottom &&
      box.y + box.height > viewport.top,
  );
}
```

**Impact:** 500 boxes → render only ~50 visible boxes → 10x performance improvement

---

### 3. Debouncing & Throttling

**Autosave (Debounce):**

```typescript
const debouncedSave = debounce(saveChanges, 30000); // 30s
```

**Pan/Zoom (Throttle):**

```typescript
const throttledPan = throttle(updateViewport, 16); // 60fps
```

---

### 4. Web Workers for Heavy Computation

**Offload:**

- Reading order calculation
- Coordinate transformations
- Version diff calculations

**Don't offload:**

- DOM manipulation
- Canvas rendering (must be on main thread)

---

### 5. Offscreen Canvas

**Pre-render image on offscreen canvas:**

```typescript
const offscreen = new OffscreenCanvas(width, height);
const offscreenCtx = offscreen.getContext("2d");
// Draw image once
offscreenCtx.drawImage(pageImage, 0, 0);

// Main canvas uses offscreen
mainCtx.drawImage(offscreen, 0, 0);
```

**Benefit:** Avoid re-decoding image on every render.

---

### 6. State Management Optimization

**Use Immer for immutable updates:**

```typescript
const nextState = produce(state, (draft) => {
  draft.boxes[boxId].x += deltaX;
  draft.boxes[boxId].y += deltaY;
});
```

**Benefit:** Efficient state updates, easy undo/redo.

---

## Performance Budgets

### Initial Page Load

| Resource   | Budget | Actual | Status |
| ---------- | ------ | ------ | ------ |
| HTML       | <20KB  | TBD    | -      |
| CSS        | <50KB  | TBD    | -      |
| JavaScript | <300KB | TBD    | -      |
| Fonts      | <100KB | TBD    | -      |
| Total      | <500KB | TBD    | -      |

### Annotation Editor Page

| Resource        | Budget | Notes                  |
| --------------- | ------ | ---------------------- |
| Page image      | 3-5MB  | Progressive load       |
| Annotation data | <50KB  | JSON file              |
| Total           | ~5MB   | Acceptable for desktop |

### API Response Times

| Endpoint                 | Target    | Acceptable | Notes            |
| ------------------------ | --------- | ---------- | ---------------- |
| GET /api/projects        | <200ms    | <500ms     | List projects    |
| GET /api/pages/:id       | <300ms    | <1s        | Load page data   |
| POST /api/pages/:id/save | <500ms    | <2s        | Save annotations |
| POST /api/ocr/process    | 2-5s/page | 10s/page   | OCR processing   |

---

## Performance Testing Strategy

### 1. Automated Performance Tests

**Tool:** Lighthouse CI

**Metrics:**

- Performance score >90
- Accessibility score >90
- Best Practices score >90
- SEO score >80 (not critical for v1)

**Run:** On every PR, block merge if score drops >5 points

---

### 2. Real User Monitoring (RUM)

**Metrics to track:**

- Page load times
- API response times
- Annotation interaction latency
- Error rates

**Tool:** Custom logging to repository (no external service for v1)

---

### 3. Load Testing

**Scenarios:**

**Scenario A: Heavy annotation load**

- 500 boxes on page
- Measure drag/resize latency
- Target: <150ms (acceptable), <100ms (ideal)

**Scenario B: Large image**

- 8000x12000 pixel image
- Measure load time
- Measure pan/zoom responsiveness

**Scenario C: Rapid edits**

- Create 50 boxes rapidly
- Measure UI responsiveness
- Ensure no UI freezing

**Tool:** Playwright with performance timing

---

### 4. Memory Profiling

**Scenarios:**

**Memory Leak Detection:**

- Navigate through 100 pages
- Check memory usage
- Ensure memory released

**Target:** <2GB memory usage for annotation editor

**Tool:** Chrome DevTools Memory Profiler

---

## Performance Test Cases

See test-specifications.md for detailed test cases:

- PERF-ANNOT-001: Box drag response time (<100ms)
- PERF-ANNOT-002: Box resize response time (<100ms)
- PERF-ANNOT-003: Create new box (<100ms)
- PERF-ANNOT-004: Pan canvas (<100ms)
- PERF-ANNOT-005: Zoom in/out (<100ms)
- PERF-ANNOT-006: Heavy load - 500 boxes (<1s initial, <100ms interactions)

---

## Optimization Checklist

### Pre-Launch Optimization

- [ ] Implement image pyramid (multiple resolutions)
- [ ] Add box virtualization (render only visible)
- [ ] Use requestAnimationFrame for all animations
- [ ] Offscreen canvas for image pre-rendering
- [ ] Debounce autosave (30s)
- [ ] Throttle pan/zoom (60fps)
- [ ] Web Workers for reading order calculation
- [ ] Code splitting (lazy load editor)
- [ ] Tree shaking (remove unused code)
- [ ] Minification and compression

### Post-Launch Optimization (if needed)

- [ ] Service Worker for offline support
- [ ] IndexedDB for local caching
- [ ] WebAssembly for intensive calculations
- [ ] WebGL rendering (if Canvas insufficient)
- [ ] HTTP/2 Server Push
- [ ] CDN for static assets

---

## Monitoring & Alerts

### Performance Degradation Alerts

**Trigger alerts when:**

- Average annotation latency >150ms
- Page load time >5s
- API response time >2s
- Memory usage >3GB
- Error rate >1%

**Action:** Investigate and optimize

---

## Known Performance Risks

### Risk 1: Large PDFs (1000+ pages)

- **Impact:** High memory usage, slow navigation
- **Mitigation:** Virtualize page list, lazy load thumbnails
- **Likelihood:** Medium
- **Severity:** Medium

### Risk 2: Complex Layouts (500+ boxes)

- **Impact:** Slow rendering, laggy interactions
- **Mitigation:** Box virtualization, throttling
- **Likelihood:** Low (most pages <100 boxes)
- **Severity:** Medium

### Risk 3: Slow Networks

- **Impact:** Long image load times
- **Mitigation:** Progressive loading, show progress
- **Likelihood:** Low (desktop, fast connection assumed)
- **Severity:** Low

### Risk 4: Old Hardware

- **Impact:** Slow overall performance
- **Mitigation:** Set minimum requirements, graceful degradation
- **Likelihood:** Low (target 2015+ hardware)
- **Severity:** Medium

---

## Browser Compatibility Matrix

| Feature               | Chrome | Firefox | Safari | Edge | Notes        |
| --------------------- | ------ | ------- | ------ | ---- | ------------ |
| Canvas API            | ✓      | ✓       | ✓      | ✓    | Universal    |
| requestAnimationFrame | ✓      | ✓       | ✓      | ✓    | Universal    |
| Web Workers           | ✓      | ✓       | ✓      | ✓    | Universal    |
| OffscreenCanvas       | ✓      | ✓       | ⚠️     | ✓    | Safari 16.4+ |
| WebP images           | ✓      | ✓       | ✓      | ✓    | Universal    |
| CSS Grid              | ✓      | ✓       | ✓      | ✓    | Universal    |

⚠️ = Partial support or recent addition

---

## Performance Validation: <100ms Target

### Analysis

**Best Case (10-20 boxes):**

- Canvas redraw: ~10ms
- State update: ~2ms
- Event handling: ~3ms
- **Total: ~15ms** ✅

**Normal Case (50-100 boxes):**

- Canvas redraw: ~30ms
- State update: ~5ms
- Event handling: ~3ms
- **Total: ~38ms** ✅

**Heavy Case (200-300 boxes, no virtualization):**

- Canvas redraw: ~120ms
- State update: ~10ms
- Event handling: ~5ms
- **Total: ~135ms** ⚠️ (exceeds target)

**Heavy Case (200-300 boxes, WITH virtualization):**

- Canvas redraw: ~40ms (only 50 visible)
- State update: ~10ms
- Event handling: ~5ms
- **Total: ~55ms** ✅

**Extreme Case (500 boxes, WITH virtualization):**

- Canvas redraw: ~60ms (only 50 visible)
- State update: ~15ms
- Event handling: ~5ms
- **Total: ~80ms** ✅

---

## Conclusion

**Verdict:** <100ms annotation editor target is ACHIEVABLE

**Requirements:**

1. ✅ Use HTML5 Canvas
2. ✅ Implement box virtualization
3. ✅ Use requestAnimationFrame
4. ✅ Progressive image loading
5. ✅ Throttle/debounce where appropriate

**Confidence:** HIGH

With proper implementation, PageSage v1 will meet all performance requirements including the critical <100ms interaction latency target.

---

## References

- Web Performance Working Group: https://www.w3.org/webperf/
- Chrome DevTools Performance: https://developer.chrome.com/docs/devtools/performance/
- Lighthouse: https://developer.chrome.com/docs/lighthouse/
- MDN Performance: https://developer.mozilla.org/en-US/docs/Web/Performance

---

## Change Log

- **2025-12-01:** Initial performance requirements and validation
