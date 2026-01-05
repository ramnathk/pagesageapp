# PageSage Bounding Box Annotation Editor - Implementation Plan

**Goal**: Build MVP annotation editor for reviewing and correcting AI-detected bounding boxes
**Timeline**: 2-4 weeks (phased delivery)
**User**: Single user (developer), functional > polished
**Architecture Constraint**: Database-free (GitHub + Google Drive storage)

---

## Decision Summary

After exploring the codebase and discussing with the user, we're building:

**Full spatial editing capabilities** (draw, move, resize, split, merge) delivered in **3 phases over 4 weeks**:

- Phase 1 (Weeks 1-2): Core editing (move, resize, edit text/labels, save)
- Phase 2 (Week 3): Drawing new boxes + split/merge operations
- Phase 3 (Week 4): Polish (zoom/pan, keyboard shortcuts, optimization)

**Technology choice**: HTML5 Canvas (no library) for faster MVP development

**Key insight from exploration**:

- Document AI Layout Parser ($7/book) provides accurate coordinates but lacks semantic classification
- Gemini 2.5 Flash ($0.27/book) was tested and FAILED on complex layouts (30-40% content missed, coordinate inaccuracy)
- User needs to: verify AI didn't miss content (visual boxes help), classify boxes semantically (verse/commentary/footnote), and occasionally fix spatial errors

---

## Architecture Overview

### Three Coordinate Systems

```
IMAGE COORDINATES (stored in page-NNN.json)
  ↓ imageToCanvas()
CANVAS COORDINATES (scaled for display)
  ↓ screenToCanvas()
SCREEN COORDINATES (mouse events)
```

**Key principle**: Always store IMAGE coordinates (source of truth), convert only for display

### Component Structure

```
src/lib/components/AnnotationEditor/
  ├── AnnotationEditor.svelte          # Main container, orchestrates child components
  ├── AnnotationCanvas.svelte          # Canvas with mouse handling (select, drag, resize, draw)
  ├── BoxMetadataPanel.svelte          # Sidebar: edit text, select type/language, delete
  ├── PageNavigation.svelte            # Prev/Next buttons, page jump
  └── VersionHistoryPanel.svelte       # Show edit history, revert capability

src/lib/services/
  ├── annotationService.ts             # Load/save page-NNN.json from GitHub
  ├── coordinateService.ts             # Coordinate transformation utilities
  └── versionService.ts                # Create version history entries

src/lib/stores/
  └── editorStore.ts                   # Canvas state (Svelte 5 runes: $state, $derived)

src/lib/utils/
  ├── canvasRenderer.ts                # Drawing functions (boxes, handles, labels)
  └── hitTest.ts                       # Click detection, hover detection

src/routes/api/projects/[id]/pages/[page]/
  └── +server.ts                       # GET (load), PUT (save) page annotations
```

### Data Flow

**Load page:**

1. Fetch `page-NNN.json` from GitHub (via API route)
2. Get image URL from Google Drive (driveFileId → signed URL)
3. Render: image + boxes overlay on canvas

**Edit box:**

1. User drags box → update canvas coordinates
2. Convert to image coordinates on mouse-up
3. Mark dirty, schedule auto-save (30s timer)

**Save changes:**

1. Create version history entry (timestamp, editedBy, changeType, changes)
2. PUT to API route → commits updated `page-NNN.json` to GitHub
3. Clear dirty flag, reset auto-save timer

---

## Phase 1: Core Editing (Weeks 1-2)

**Goal**: Review AI boxes, adjust position/size/labels, save changes

### Features

- Display page image with bounding boxes overlaid
- Visual distinction: AI-generated (blue outline) vs user-edited (green outline)
- Click to select box (highlight selected)
- **Move box**: Click inside box + drag
- **Resize box**: 8 handles (4 corners + 4 edges), drag to resize
- **Edit text**: Text area in sidebar (edit OCR text)
- **Change labels**: Dropdowns for contentType (verse/commentary/footnote/translation/heading/etc) + language (sanskrit/hindi/english/iast)
- **Delete box**: Delete button in sidebar
- **Save**: Auto-save every 30s (debounced) + manual "Save" button
- **Version tracking**: Every save creates version history entry with changes recorded
- **Page navigation**: Prev/Next buttons, "Go to page N" input

### Implementation Notes

**Canvas rendering:**

```typescript
// Render pipeline
function render(state: EditorState) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawImage(state.image, state.transform);

  for (const box of state.boxes) {
    const canvasCoords = imageToCanvas(box.coordinates, state.transform);

    // Color coding
    const strokeColor = box.source === "ai" ? "#3B82F6" : "#10B981"; // blue vs green
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = state.selectedBoxId === box.boxId ? 3 : 1;
    ctx.strokeRect(
      canvasCoords.x,
      canvasCoords.y,
      canvasCoords.width,
      canvasCoords.height,
    );

    drawLabel(box.contentType, canvasCoords);
    drawReadingOrder(box.readingOrder, canvasCoords);
  }

  if (state.selectedBoxId) {
    drawResizeHandles(selectedBox, state.transform);
  }
}
```

**Mouse interaction:**

```typescript
// Click detection
onMouseDown(event) {
  const canvasPos = screenToCanvas(event);

  // Check resize handles first (if box selected)
  const handle = hitTestHandles(canvasPos, selectedBox);
  if (handle) {
    mode = 'resize';
    resizeHandle = handle;
    return;
  }

  // Check boxes
  const clickedBox = findBoxAt(canvasPos, boxes);
  if (clickedBox) {
    selectBox(clickedBox.boxId);
    mode = 'move';
    dragStart = canvasPos;
  }
}

onMouseMove(event) {
  if (mode === 'move') {
    const delta = { x: event.x - dragStart.x, y: event.y - dragStart.y };
    moveBox(selectedBox.boxId, delta);
    requestRender();
  } else if (mode === 'resize') {
    resizeBox(selectedBox.boxId, resizeHandle, event);
    requestRender();
  }
}

onMouseUp(event) {
  if (mode === 'move' || mode === 'resize') {
    // Convert canvas coords back to image coords
    const imageCoords = canvasToImage(selectedBox.coordinates, transform);
    commitBoxUpdate(selectedBox.boxId, imageCoords);
    markDirty();
  }
  mode = 'idle';
}
```

**Auto-save logic:**

```typescript
let autoSaveTimer: number;
let isDirty = false;

function markDirty() {
  isDirty = true;
  scheduleAutoSave();
}

function scheduleAutoSave() {
  clearTimeout(autoSaveTimer);
  autoSaveTimer = setTimeout(() => {
    if (isDirty) saveCurrentPage();
  }, 30000); // 30 seconds
}

async function saveCurrentPage() {
  const changes = collectChanges(); // Compare current state vs original

  const versionEntry = {
    version: currentPage.versionHistory.length + 1,
    timestamp: new Date().toISOString(),
    editedBy: { name: "Your Name", githubUsername: "username", githubId: 123 },
    changeType: "manual_edit",
    changes: changes,
    note: "",
  };

  currentPage.versionHistory.push(versionEntry);

  await fetch(`/api/projects/${projectId}/pages/${pageNumber}`, {
    method: "PUT",
    body: JSON.stringify({ page: currentPage }),
  });

  isDirty = false;
}
```

### Week 1-2 Deliverable

- Can open page, see AI boxes overlaid on image
- Can select box, move it, resize it
- Can edit text and change classification (type + language)
- Can delete boxes
- Changes auto-save to GitHub with version tracking
- Can navigate between pages

---

## Phase 2: Drawing & Advanced Operations (Week 3)

**Goal**: Handle missed content + basic split/merge

### Features

- **Create new boxes**: "Draw mode" button → click-and-drag to draw rectangle
- **Split box** (simplified):
  - Select box → "Split Horizontal" or "Split Vertical" buttons
  - Creates two boxes with 50/50 split
  - Text divided in half (user can adjust)
  - User can resize boxes after split if needed
- **Merge boxes** (simplified):
  - Multi-select: Shift+Click to select multiple boxes
  - "Merge" button → creates single box with bounding rectangle
  - Text concatenated in reading order
- **Reading order**: Display numbers on boxes, drag to reorder in list

### Implementation Notes

**Draw mode:**

```typescript
let drawMode = false;
let drawStart: Point | null = null;
let drawCurrent: Point | null = null;

onMouseDown(event) {
  if (drawMode) {
    drawStart = screenToCanvas(event);
  }
}

onMouseMove(event) {
  if (drawMode && drawStart) {
    drawCurrent = screenToCanvas(event);
    requestRender(); // Show preview rectangle
  }
}

onMouseUp(event) {
  if (drawMode && drawStart && drawCurrent) {
    const newBox = {
      boxId: generateId(),
      coordinates: normalizeRect(drawStart, drawCurrent), // Ensure width/height > 0
      contentType: 'verse', // Default, user will change
      language: 'sanskrit',
      text: { ocr: '', corrected: '' },
      readingOrder: boxes.length + 1,
      confidence: 1.0,
      source: 'user',
      createdBy: { name: 'You', githubUsername: 'username' }
    };

    addBox(newBox);
    markDirty();
    drawStart = null;
    drawCurrent = null;
  }
}

// Draw preview in render()
if (drawStart && drawCurrent) {
  ctx.strokeStyle = '#10B981'; // green
  ctx.setLineDash([5, 5]); // dashed line
  const rect = normalizeRect(drawStart, drawCurrent);
  ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);
  ctx.setLineDash([]); // reset
}
```

**Split box (simplified):**

```typescript
function splitBoxHorizontal(boxId: string) {
  const box = findBox(boxId);
  const { x, y, width, height } = box.coordinates;

  const topHalf = {
    ...box,
    boxId: generateId(),
    coordinates: { x, y, width, height: height / 2 },
    text: {
      ...box.text,
      corrected: box.text.corrected.slice(0, Math.floor(length / 2)),
    },
    source: "user",
  };

  const bottomHalf = {
    ...box,
    boxId: generateId(),
    coordinates: { x, y: y + height / 2, width, height: height / 2 },
    text: {
      ...box.text,
      corrected: box.text.corrected.slice(Math.floor(length / 2)),
    },
    readingOrder: box.readingOrder + 1,
    source: "user",
  };

  replaceBox(boxId, [topHalf, bottomHalf]);
  markDirty();
}
```

**Merge boxes:**

```typescript
function mergeBoxes(boxIds: string[]) {
  const boxes = boxIds.map(findBox);

  // Calculate bounding rectangle
  const minX = Math.min(...boxes.map((b) => b.coordinates.x));
  const minY = Math.min(...boxes.map((b) => b.coordinates.y));
  const maxX = Math.max(
    ...boxes.map((b) => b.coordinates.x + b.coordinates.width),
  );
  const maxY = Math.max(
    ...boxes.map((b) => b.coordinates.y + b.coordinates.height),
  );

  // Concatenate text in reading order
  boxes.sort((a, b) => a.readingOrder - b.readingOrder);
  const mergedText = boxes.map((b) => b.text.corrected).join(" ");

  const merged = {
    ...boxes[0],
    boxId: generateId(),
    coordinates: { x: minX, y: minY, width: maxX - minX, height: maxY - minY },
    text: { ocr: mergedText, corrected: mergedText },
    source: "user",
  };

  removeBoxes(boxIds);
  addBox(merged);
  markDirty();
}
```

### Week 3 Deliverable

- Can draw new boxes for missed content
- Can split boxes horizontally or vertically
- Can merge multiple boxes
- Can adjust reading order

---

## Phase 3: Polish & Optimization (Week 4)

**Goal**: Make editor pleasant for daily use

### Features

- **Zoom & pan**:
  - Mouse wheel zoom (centered on cursor)
  - Space+drag to pan
  - Fit-to-screen button
- **Keyboard shortcuts**:
  - Arrow keys: Move selected box 1px
  - Delete: Delete selected box
  - Ctrl+S: Manual save
  - Escape: Deselect
- **Visual improvements**:
  - Confidence color coding: Red (<0.7), Yellow (0.7-0.9), Green (>0.9)
  - Hover highlights (box outline brightens on hover)
  - Smooth animations for selection
- **Performance**:
  - Request Animation Frame batching
  - Debounce drag updates (50ms)
  - Canvas off-screen buffering for large images

### Implementation Notes

**Zoom & pan:**

```typescript
interface Transform {
  scale: number;   // Zoom level (1.0 = fit to screen, 2.0 = 200%)
  offsetX: number; // Pan offset X
  offsetY: number; // Pan offset Y
}

onMouseWheel(event) {
  const zoomSpeed = 0.1;
  const newScale = transform.scale * (1 + event.deltaY * zoomSpeed);

  // Zoom centered on cursor
  const canvasPos = screenToCanvas(event);
  transform.offsetX = canvasPos.x - (canvasPos.x - transform.offsetX) * (newScale / transform.scale);
  transform.offsetY = canvasPos.y - (canvasPos.y - transform.offsetY) * (newScale / transform.scale);
  transform.scale = Math.max(0.1, Math.min(5.0, newScale)); // Clamp 0.1x to 5x

  requestRender();
}

onMouseDown(event) {
  if (event.key === ' ') { // Space key
    panMode = true;
    panStart = { x: event.clientX, y: event.clientY };
  }
}

onMouseMove(event) {
  if (panMode) {
    const dx = event.clientX - panStart.x;
    const dy = event.clientY - panStart.y;
    transform.offsetX += dx;
    transform.offsetY += dy;
    panStart = { x: event.clientX, y: event.clientY };
    requestRender();
  }
}
```

**Keyboard shortcuts:**

```typescript
onKeyDown(event) {
  if (!selectedBox) return;

  switch (event.key) {
    case 'ArrowUp':
      moveBox(selectedBox.boxId, { x: 0, y: -1 });
      break;
    case 'ArrowDown':
      moveBox(selectedBox.boxId, { x: 0, y: 1 });
      break;
    case 'ArrowLeft':
      moveBox(selectedBox.boxId, { x: -1, y: 0 });
      break;
    case 'ArrowRight':
      moveBox(selectedBox.boxId, { x: 1, y: 0 });
      break;
    case 'Delete':
      deleteBox(selectedBox.boxId);
      break;
    case 's':
      if (event.ctrlKey) {
        event.preventDefault();
        saveCurrentPage();
      }
      break;
    case 'Escape':
      deselectBox();
      break;
  }
}
```

### Week 4 Deliverable

- Smooth zoom/pan for detailed work
- Efficient keyboard-driven workflow
- Polished visuals with confidence indicators
- Optimized for 30-40 boxes per page (<100ms interaction)

---

## Critical Files & Integration Points

### Existing Files (Reference)

- `docs/data-schemas.md` - BoundingBox, PageAnnotations, VersionHistoryEntry schemas
- `docs/architecture-overview.md` - Database-free architecture, GitHub + Drive storage patterns
- `docs/system-modules.md` - Module 5: Interactive Annotation Editor requirements

### New Files (To Create)

**Frontend Components:**

- `src/lib/components/AnnotationEditor/AnnotationEditor.svelte` - Main container
- `src/lib/components/AnnotationEditor/AnnotationCanvas.svelte` - Canvas with mouse handling
- `src/lib/components/AnnotationEditor/BoxMetadataPanel.svelte` - Sidebar UI
- `src/lib/components/AnnotationEditor/PageNavigation.svelte` - Prev/Next buttons
- `src/lib/components/AnnotationEditor/VersionHistoryPanel.svelte` - Edit history display

**Services & Utilities:**

- `src/lib/services/annotationService.ts` - Load/save page-NNN.json
- `src/lib/services/coordinateService.ts` - imageToCanvas, canvasToImage conversions
- `src/lib/services/versionService.ts` - Create version entries, track changes
- `src/lib/stores/editorStore.ts` - Canvas state (Svelte 5 runes)
- `src/lib/utils/canvasRenderer.ts` - Drawing functions
- `src/lib/utils/hitTest.ts` - Click detection

**API Routes:**

- `src/routes/api/projects/[id]/pages/[page]/+server.ts` - GET (load), PUT (save) page data

**Page Route:**

- `src/routes/projects/[id]/annotate/[page]/+page.svelte` - Annotation editor page
- `src/routes/projects/[id]/annotate/[page]/+page.server.ts` - Load page data server-side

---

## Success Criteria

### Phase 1 Must-Haves (Weeks 1-2)

- ✅ Display page image with boxes overlaid
- ✅ Visual distinction (AI=blue, user=green)
- ✅ Select, move, resize boxes smoothly
- ✅ Edit text and change labels (type/language)
- ✅ Delete boxes
- ✅ Auto-save to GitHub (30s) with version tracking
- ✅ Navigate between pages
- ✅ <100ms interaction latency with 30-40 boxes

### Phase 2 (Week 3)

- ✅ Draw new boxes
- ✅ Split boxes (horizontal/vertical)
- ✅ Merge boxes (multi-select)
- ✅ Adjust reading order

### Phase 3 (Week 4)

- ✅ Zoom & pan
- ✅ Keyboard shortcuts
- ✅ Visual polish (confidence colors, hover effects)
- ✅ Performance optimized

### Out of Scope (Can defer)

- ❌ Undo/redo (use version history to revert)
- ❌ Multi-user concurrent editing
- ❌ Mobile support
- ❌ Complex snapping/alignment guides

---

## Risk Mitigation

**Risk: Coordinate math bugs**

- Mitigation: Comprehensive unit tests for coordinate conversions
- Fallback: Add debug overlay showing coordinates

**Risk: Performance issues with 30-40 boxes**

- Mitigation: RAF batching, debounce during drag
- Fallback: Reduce visual effects if needed

**Risk: Split/merge edge cases**

- Mitigation: Simple 50/50 split, user can manually adjust after
- Fallback: Defer if blocking, focus on core editing first

**Risk: GitHub save latency**

- Mitigation: Show "Saving..." indicator, debounce writes
- Fallback: Local cache + background sync

---

## Next Steps After Planning

1. **Test Document AI**: Run 20 sample pages (simple + complex) to measure actual accuracy
2. **Set up project structure**: Create component directories, install dependencies
3. **Start Phase 1**: Canvas rendering + basic mouse interactions
4. **Iterate**: Test with real book content, adjust based on usage

---

**End of Plan**
