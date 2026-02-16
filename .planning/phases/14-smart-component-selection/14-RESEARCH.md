# Phase 14: Smart Component Selection - Research

**Researched:** 2026-02-08
**Domain:** Semantic-driven UI component selection heuristics
**Confidence:** HIGH

## Summary

This phase implements intelligent component selection based on semantic analysis and content richness patterns. Rather than relying solely on structural type matching (array → table, object → detail), the system will use semantic categories from Phase 12 and importance/grouping analysis from Phase 13 to select context-appropriate renderers.

The research focused on UX heuristics for choosing between cards, tables, galleries, timelines, and key-value displays. Key findings show that component selection should prioritize content semantics over field count, with cards favored for rich content (reviews, descriptions, images) and tables for scannable, comparable data. The existing codebase already has all required renderers implemented; this phase adds a smart selection layer.

User decisions from CONTEXT.md constrain the implementation: content richness trumps field count, cards display only primary/secondary tier fields, timeline requires event-like semantics (not just chronological ordering), and review cards use visual star ratings with truncation at ~150 characters.

**Primary recommendation:** Implement a strategy pattern-based component selector that evaluates semantic signals (from Phase 12) and importance tiers (from Phase 13) to return the most appropriate renderer, falling back to type-based defaults when confidence <75%.

## Standard Stack

No new libraries required. This phase uses existing project dependencies and patterns.

### Core (Already in Project)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React 18 | 18.x | UI framework | Project foundation |
| TypeScript | 5.x | Type safety | Project-wide typing |
| Tailwind CSS | 3.x | Responsive layouts | Current styling approach |

### Supporting (Already Implemented)
| Component | Location | Purpose | Current Status |
|-----------|----------|---------|----------------|
| TableRenderer | src/components/renderers/TableRenderer.tsx | Scannable tabular data | ✓ Exists |
| CardListRenderer | src/components/renderers/CardListRenderer.tsx | Rich content cards | ✓ Exists with pagination |
| GalleryRenderer | src/components/renderers/GalleryRenderer.tsx | Image-forward display | ✓ Exists with masonry |
| TimelineRenderer | src/components/renderers/TimelineRenderer.tsx | Chronological events | ✓ Exists with vertical layout |
| StatsRenderer | src/components/renderers/StatsRenderer.tsx | Numeric summaries | ✓ Exists |

### No External Dependencies
This phase requires no new npm packages. Implementation uses existing semantic detection (Phase 12) and analysis (Phase 13) infrastructure.

## Architecture Patterns

### Recommended Project Structure
```
src/
├── services/
│   ├── semantic/          # Phase 12 detection (existing)
│   ├── analysis/          # Phase 13 importance/grouping (existing)
│   └── selection/         # NEW: Smart component selection
│       ├── index.ts       # Public API: selectComponent()
│       ├── heuristics.ts  # Selection rules
│       └── types.ts       # Result types
├── components/
│   ├── DynamicRenderer.tsx   # UPDATE: Use smart defaults
│   └── registry/
│       └── ComponentRegistry.tsx  # UPDATE: Add smart selection
```

### Pattern 1: Strategy Pattern for Component Selection
**What:** Create a selector function that evaluates multiple heuristics and returns the best component type name.
**When to use:** When choosing between multiple valid renderers based on semantic signals.
**Example:**
```typescript
// Source: Codebase analysis + UX research patterns
interface SelectionResult {
  componentType: string
  confidence: number
  reason: string
}

function selectComponent(
  schema: TypeSignature,
  semantics: Map<string, SemanticMetadata>,
  importance: Map<string, ImportanceScore>,
  grouping: GroupingResult
): SelectionResult {
  // Apply heuristics in priority order
  if (schema.kind === 'array' && schema.items.kind === 'object') {
    // Check composite patterns (reviews, events)
    const composite = checkCompositePatterns(schema, semantics)
    if (composite) return composite

    // Check image-heavy content
    const imageCheck = checkImageContent(schema, semantics)
    if (imageCheck) return imageCheck

    // Check timeline semantics
    const timeline = checkTimelinePattern(schema, semantics)
    if (timeline) return timeline

    // Card vs table heuristic
    return selectCardOrTable(schema, semantics, importance)
  }

  // Fall back to type-based defaults
  return {
    componentType: getDefaultTypeName(schema),
    confidence: 0,
    reason: 'type-based-default'
  }
}
```

### Pattern 2: Heuristic Evaluation with Confidence Scoring
**What:** Each selection heuristic returns a confidence score (0-1) that triggers selection at >= 0.75 threshold.
**When to use:** For all semantic-based component decisions.
**Example:**
```typescript
// Source: Phase 12 semantic detection patterns
function checkReviewPattern(
  schema: ArraySchema,
  semantics: Map<string, SemanticMetadata>
): SelectionResult | null {
  const fields = Array.from(schema.items.fields.entries())

  // Check for rating + comment/review fields
  const hasRating = fields.some(([name, def]) =>
    semantics.get(`$[].${name}`)?.category === 'rating'
  )
  const hasReview = fields.some(([name, def]) =>
    semantics.get(`$[].${name}`)?.category === 'reviews' ||
    /comment|review|text|body/i.test(name)
  )

  if (hasRating && hasReview) {
    return {
      componentType: 'card-list',
      confidence: 0.85,
      reason: 'review-pattern-detected'
    }
  }

  return null
}
```

### Pattern 3: Content Richness Analysis
**What:** Use importance tier distribution to determine if cards are more appropriate than tables.
**When to use:** For card vs table decision when no specific pattern detected.
**Example:**
```typescript
// Source: UX research + Phase 13 importance analysis
function selectCardOrTable(
  schema: ArraySchema,
  semantics: Map<string, SemanticMetadata>,
  importance: Map<string, ImportanceScore>
): SelectionResult {
  const fields = Array.from(schema.items.fields.entries())

  // Count fields by importance tier
  let primaryCount = 0
  let secondaryCount = 0
  let hasLongText = false

  for (const [name, def] of fields) {
    const fieldPath = `$[].${name}`
    const tier = importance.get(fieldPath)?.tier
    const semantic = semantics.get(fieldPath)

    if (tier === 'primary') primaryCount++
    if (tier === 'secondary') secondaryCount++

    // Check for rich content types
    if (semantic?.category === 'description' ||
        semantic?.category === 'reviews' ||
        semantic?.category === 'image') {
      hasLongText = true
    }
  }

  // User decision: content richness trumps field count
  if (hasLongText && (primaryCount + secondaryCount) <= 8) {
    return {
      componentType: 'card-list',
      confidence: 0.8,
      reason: 'rich-content-detected'
    }
  }

  // Default to table for scannable data
  return {
    componentType: 'table',
    confidence: 0.6,
    reason: 'scannable-data-default'
  }
}
```

### Pattern 4: Responsive Grid Layout with CSS Grid
**What:** Use CSS Grid auto-fit/auto-fill for responsive column counts in galleries and card grids.
**When to use:** For image galleries and card layouts that need to adapt to screen width.
**Example:**
```css
/* Source: CSS Grid best practices research */
.gallery-grid {
  display: grid;
  /* Auto-fit collapses empty columns, auto-fill preserves structure */
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

/* Responsive breakpoints for card lists */
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

/* For smaller screens, enforce single column */
@media (max-width: 640px) {
  .card-grid {
    grid-template-columns: 1fr;
  }
}
```

### Pattern 5: Timeline Grouping for Large Datasets
**What:** Group timeline entries by month/year when count exceeds threshold (20+).
**When to use:** Timeline renderer with large datasets.
**Example:**
```typescript
// Source: Timeline UI research + user decisions
interface TimelineGroup {
  label: string  // "January 2026"
  items: unknown[]
}

function groupTimelineItems(
  items: unknown[],
  dateField: string,
  threshold = 20
): TimelineGroup[] | null {
  if (items.length < threshold) return null

  const groups = new Map<string, unknown[]>()

  for (const item of items) {
    const date = new Date(String((item as Record<string, unknown>)[dateField]))
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    const label = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' })

    if (!groups.has(key)) {
      groups.set(key, [])
    }
    groups.get(key)!.push(item)
  }

  return Array.from(groups.entries()).map(([key, items]) => ({
    label: new Date(key).toLocaleDateString('en-US', { year: 'numeric', month: 'long' }),
    items
  }))
}
```

### Anti-Patterns to Avoid
- **Field count as sole decision factor:** User explicitly stated content richness trumps field count. Don't select table just because there are 10+ fields if they're mostly tertiary metadata.
- **Timeline for chronological ordering alone:** User decision requires event-like semantics (date + title/description). Don't trigger timeline just because data has timestamps.
- **Ignoring confidence thresholds:** Always check `confidence >= 0.75` before applying smart default. Lower confidence should fall back to type-based defaults.
- **Breaking v0.2 behavior:** INT-01 requirement states smart defaults must not break existing behavior. User overrides (from configStore) always win.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Responsive column counts | Custom breakpoint logic | CSS Grid auto-fit/auto-fill | Handles all screen sizes automatically, no media queries needed |
| Date formatting | String manipulation | Intl.DateTimeFormat or date.toLocaleDateString() | Handles localization, timezones, edge cases |
| Text truncation | Substring + "..." | CSS line-clamp or dedicated component | Handles word breaks, ellipsis, responsiveness |
| Star rating display | Custom SVG/Unicode logic | React component with aria-label | Accessibility, consistent sizing, half-star support |
| Pagination state | Manual page/offset tracking | usePagination hook (already exists) | Already implemented in codebase |

**Key insight:** The codebase already has robust renderers for all component types. Don't rebuild card layouts, gallery grids, or timeline displays—focus solely on the selection logic that chooses the right one.

## Common Pitfalls

### Pitfall 1: Over-Relying on Field Count for Card Selection
**What goes wrong:** Traditional heuristic "< 8 fields → cards, 10+ → table" fails for semantic-rich data. A dataset with 12 fields where 8 are metadata (IDs, timestamps) and 4 are rich content (title, description, image, rating) should use cards, not table.
**Why it happens:** Simple field count is easy to implement but ignores content semantics.
**How to avoid:** Use importance tier analysis. Count only primary + secondary tier fields for richness check. User decision: "Content richness trumps field count."
**Warning signs:** Users manually override table → card-list frequently, indicating heuristic failure.

### Pitfall 2: Timeline Trigger on Chronological Data Without Event Semantics
**What goes wrong:** Any array with date/timestamp fields triggers timeline, even for financial transactions or log entries that are better suited to tables.
**Why it happens:** Confusing "has dates" with "is an event timeline."
**How to avoid:** User decision: "Timeline trigger requires event-like semantics (date + title/description + optional status)." Check for narrative fields, not just timestamps.
**Warning signs:** Timeline view displays dense tabular data awkwardly with lots of truncated numeric fields.

### Pitfall 3: Ignoring Confidence Thresholds
**What goes wrong:** Low-confidence semantic matches (0.5-0.6) trigger component changes, causing inconsistent behavior.
**Why it happens:** Not checking `result.confidence >= 0.75` before applying smart default.
**How to avoid:** Requirement ARR-09 states fallback to type-based defaults when confidence <75%. Always check threshold.
**Warning signs:** Component selection feels random or unstable across similar datasets.

### Pitfall 4: Breaking User Overrides
**What goes wrong:** Smart defaults override user's manual component selection from configStore.
**Why it happens:** Not checking for existing override before applying smart default.
**How to avoid:** DynamicRenderer already checks `override` parameter first. Smart defaults only apply when override is undefined. Requirement INT-01: don't break v0.2 behavior.
**Warning signs:** User sets card-list via component switcher, but it reverts to table on data refresh.

### Pitfall 5: Card Display Clutter with All Fields
**What goes wrong:** Card renderer displays all fields, creating cluttered cards with tertiary metadata (IDs, internal codes).
**Why it happens:** Not filtering by importance tier.
**How to avoid:** User decision: "Cards display primary + secondary tier fields only; tertiary fields hidden from card view." Update CardListRenderer to filter fields.
**Warning signs:** Cards show 12+ fields including technical IDs and internal codes, defeating purpose of focused card layout.

### Pitfall 6: Image Gallery Without Grid Structure
**What goes wrong:** Image arrays render as list of full-width images instead of responsive grid.
**Why it happens:** Not using CSS Grid auto-fit for responsive columns.
**How to avoid:** User decision: "Default to fixed-column grid layout (responsive column count based on image count and screen width)." Use `grid-template-columns: repeat(auto-fit, minmax(200px, 1fr))`.
**Warning signs:** Gallery displays one image per row on desktop, poor space utilization.

## Code Examples

Verified patterns from codebase and research:

### Selection Service Public API
```typescript
// Source: Codebase architecture + strategy pattern research
// Location: src/services/selection/index.ts

import type { TypeSignature } from '../../types/schema'
import type { SemanticMetadata } from '../semantic/types'
import type { ImportanceScore, GroupingResult } from '../analysis/types'

export interface ComponentSelection {
  componentType: string
  confidence: number
  reason: string
}

/**
 * Select the most appropriate component type for rendering data.
 *
 * Priority order:
 * 1. User override (from configStore) - always wins
 * 2. High-confidence semantic patterns (>= 0.75)
 * 3. Type-based defaults (current v0.2 behavior)
 *
 * @param schema - Type signature of the data
 * @param semantics - Semantic metadata from Phase 12 detection
 * @param analysis - Importance & grouping from Phase 13
 * @returns Component selection with confidence score
 */
export function selectComponent(
  schema: TypeSignature,
  semantics: Map<string, SemanticMetadata>,
  analysis: {
    importance: Map<string, ImportanceScore>
    grouping: GroupingResult
  }
): ComponentSelection {
  // Only apply smart selection for arrays of objects
  if (schema.kind !== 'array' || schema.items.kind !== 'object') {
    return {
      componentType: getDefaultTypeName(schema),
      confidence: 0,
      reason: 'not-applicable'
    }
  }

  // Try heuristics in priority order
  const heuristics = [
    checkReviewPattern,
    checkImageGalleryPattern,
    checkTimelinePattern,
    selectCardOrTable,
  ]

  for (const heuristic of heuristics) {
    const result = heuristic(schema, semantics, analysis)
    if (result && result.confidence >= 0.75) {
      return result
    }
  }

  // Fall back to type-based default
  return {
    componentType: 'table',
    confidence: 0,
    reason: 'fallback-to-default'
  }
}
```

### Review Pattern Detection
```typescript
// Source: User decisions from CONTEXT.md + semantic patterns
// Location: src/services/selection/heuristics.ts

function checkReviewPattern(
  schema: ArraySchema,
  semantics: Map<string, SemanticMetadata>,
  analysis: AnalysisContext
): ComponentSelection | null {
  const fields = Array.from(schema.items.fields.entries())

  // Detect rating field
  const ratingField = fields.find(([name]) =>
    semantics.get(`$[].${name}`)?.category === 'rating'
  )

  // Detect comment/review text field
  const textField = fields.find(([name]) => {
    const sem = semantics.get(`$[].${name}`)
    const importance = analysis.importance.get(`$[].${name}`)
    return (
      (sem?.category === 'reviews' || sem?.category === 'description') &&
      (importance?.tier === 'primary' || importance?.tier === 'secondary')
    )
  })

  // User decision: reviews pattern = rating + comment with high importance
  if (ratingField && textField) {
    return {
      componentType: 'card-list',
      confidence: 0.85,
      reason: 'review-pattern-detected'
    }
  }

  return null
}
```

### Image Gallery Pattern Detection
```typescript
// Source: User decisions + ARR-03 requirement
function checkImageGalleryPattern(
  schema: ArraySchema,
  semantics: Map<string, SemanticMetadata>,
  analysis: AnalysisContext
): ComponentSelection | null {
  const fields = Array.from(schema.items.fields.entries())

  // Count image fields
  const imageFields = fields.filter(([name]) => {
    const sem = semantics.get(`$[].${name}`)
    return sem?.category === 'image' ||
           sem?.category === 'thumbnail' ||
           sem?.category === 'avatar'
  })

  // ARR-03: Arrays of image URLs default to gallery/grid view
  // User decision: Default to fixed-column grid layout
  if (imageFields.length >= 1 && fields.length <= 4) {
    return {
      componentType: 'gallery',
      confidence: 0.9,
      reason: 'image-heavy-content'
    }
  }

  // Images mixed with other fields: use cards with thumbnail strip
  if (imageFields.length >= 1 && fields.length > 4) {
    return {
      componentType: 'card-list',
      confidence: 0.75,
      reason: 'images-with-other-fields'
    }
  }

  return null
}
```

### Timeline Pattern Detection
```typescript
// Source: User decisions from CONTEXT.md
function checkTimelinePattern(
  schema: ArraySchema,
  semantics: Map<string, SemanticMetadata>,
  analysis: AnalysisContext
): ComponentSelection | null {
  const fields = Array.from(schema.items.fields.entries())

  // User decision: Timeline requires event-like semantics
  // Not just chronological ordering
  const dateField = fields.find(([name]) =>
    semantics.get(`$[].${name}`)?.category === 'date' ||
    semantics.get(`$[].${name}`)?.category === 'timestamp'
  )

  const titleField = fields.find(([name]) =>
    semantics.get(`$[].${name}`)?.category === 'title'
  )

  const descriptionField = fields.find(([name]) =>
    semantics.get(`$[].${name}`)?.category === 'description'
  )

  // ARR-06: Event-like semantics required
  if (dateField && (titleField || descriptionField)) {
    return {
      componentType: 'timeline',
      confidence: 0.8,
      reason: 'event-timeline-pattern'
    }
  }

  return null
}
```

### Card vs Table Heuristic
```typescript
// Source: UX research + user decisions
function selectCardOrTable(
  schema: ArraySchema,
  semantics: Map<string, SemanticMetadata>,
  analysis: AnalysisContext
): ComponentSelection {
  const fields = Array.from(schema.items.fields.entries())

  // Categorize fields by importance
  const primaryFields: string[] = []
  const secondaryFields: string[] = []
  let hasRichContent = false

  for (const [name] of fields) {
    const fieldPath = `$[].${name}`
    const tier = analysis.importance.get(fieldPath)?.tier
    const semantic = semantics.get(fieldPath)

    if (tier === 'primary') primaryFields.push(name)
    if (tier === 'secondary') secondaryFields.push(name)

    // Check for rich content types (user decision)
    if (semantic?.category === 'description' ||
        semantic?.category === 'reviews' ||
        semantic?.category === 'image' ||
        semantic?.category === 'title') {
      hasRichContent = true
    }
  }

  const visibleFieldCount = primaryFields.length + secondaryFields.length

  // User decision: Content richness trumps field count
  // ARR-04: <8 fields + rich content → cards
  if (hasRichContent && visibleFieldCount <= 8) {
    return {
      componentType: 'card-list',
      confidence: 0.75,
      reason: 'rich-content-low-field-count'
    }
  }

  // ARR-04: 10+ fields → table
  if (visibleFieldCount >= 10) {
    return {
      componentType: 'table',
      confidence: 0.8,
      reason: 'high-field-count'
    }
  }

  // Default to table for ambiguous cases
  return {
    componentType: 'table',
    confidence: 0.5,
    reason: 'ambiguous-default-table'
  }
}
```

### Responsive Grid CSS
```css
/* Source: CSS Grid research - auto-fit best practices */

/* Gallery: auto-fit collapses empty columns */
.gallery-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  padding: 1rem;
}

/* Card list: auto-fill preserves structure */
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
  padding: 1rem;
}

/* Mobile: enforce single column */
@media (max-width: 640px) {
  .card-grid,
  .gallery-grid {
    grid-template-columns: 1fr;
  }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Pure structural matching (array → table) | Semantic + importance-driven selection | Phase 14 (this phase) | More context-appropriate defaults |
| Field count heuristic (< 8 → cards) | Content richness + tier analysis | Phase 14 | Better card/table decisions |
| Manual component selection only | Smart defaults with user override | Phase 14 | Improved out-of-box UX |
| Fixed table columns | Importance tier filtering | Phase 14 | Cleaner card displays |

**Deprecated/outdated:**
- None. This phase extends existing patterns without breaking v0.2 behavior.

## Open Questions

Things that couldn't be fully resolved:

1. **Exact responsive breakpoints for grid columns**
   - What we know: CSS Grid auto-fit/auto-fill handles this automatically with minmax()
   - What's unclear: Specific pixel values for minmax() first argument (200px? 250px? 300px?)
   - Recommendation: Start with 250px for galleries, 300px for cards. User decision: "Claude's discretion" for exact values. Test with real datasets and adjust.

2. **Timeline grouping threshold**
   - What we know: User specified "Large timelines (20+): Group by month/year"
   - What's unclear: Exact threshold number (20? 25? 30?)
   - Recommendation: Use 20 as initial threshold per user guidance. User decision: "Claude's discretion" for exact threshold. Make it configurable via ANALYSIS_CONFIG.

3. **Star icon styling details**
   - What we know: User wants "Visual star icons (★★★☆☆) as default"
   - What's unclear: Size, color, spacing, half-star support
   - Recommendation: Use Unicode stars initially (★☆) for simplicity. User decision: "Claude's discretion" for specific styling. Can enhance with SVG later if needed.

4. **Text truncation character limit**
   - What we know: User specified "~150 chars, truncate longer with 'Read more' expand"
   - What's unclear: Exact character count, word break behavior
   - Recommendation: Use 150 characters as initial limit. Truncate at word boundaries (don't break mid-word). User decision gives approximate guidance, allowing refinement.

5. **Confidence threshold calibration**
   - What we know: Requirement ARR-09 states fallback when confidence <75%
   - What's unclear: Will 75% threshold be too aggressive or too conservative in practice?
   - Recommendation: Start with 75% threshold. Monitor in UAT for false positives (wrong component selected) and false negatives (missed opportunities). Adjust if needed.

## Sources

### Primary (HIGH confidence)
- Codebase analysis (existing renderers, semantic detection, analysis modules) - Directly examined TypeScript source files
- User decisions from CONTEXT.md - Authoritative project constraints
- [Material-UI React Rating component](https://mui.com/material-ui/react-rating/) - Star rating component patterns
- [CSS-Tricks: Auto-Sizing Columns in CSS Grid: auto-fill vs auto-fit](https://css-tricks.com/auto-sizing-columns-css-grid-auto-fill-vs-auto-fit/) - CSS Grid responsive patterns

### Secondary (MEDIUM confidence)
- [UX Patterns Dev: Table vs List vs Cards](https://uxpatterns.dev/pattern-guide/table-vs-list-vs-cards) - Verified with multiple UX sources
- [Medium: Strategy pattern for conditional rendering](https://medium.com/@marcioc0sta/strategy-pattern-for-conditional-rendering-797d9a3261f7) - React pattern verified with official React docs
- [Medium: Large data display: Cards or a table?](https://medium.com/design-bootcamp/when-to-use-which-component-a-case-study-of-card-view-vs-table-view-7f5a6cff557b) - Card vs table heuristics
- [UX Collective: 8 best practices for UI card design](https://uxdesign.cc/8-best-practices-for-ui-card-design-898f45bb60cc) - Card design patterns
- [Baymard Institute: 6 Guidelines for Truncation Design](https://baymard.com/blog/truncation-design) - Text truncation best practices
- [Wendy Zhou: Timeline UI Design Inspiration & Tips](https://www.wendyzhou.se/blog/10-gorgeous-timeline-ui-design-inspiration-tips/) - Timeline layout patterns
- [OneUpTime: TypeScript Discriminated Unions for React Component Props](https://oneuptime.com/blog/post/2026-01-15-typescript-discriminated-unions-react-props/view) - Component selection typing patterns

### Tertiary (LOW confidence)
- WebSearch results on data visualization heuristics - Academic papers but not directly applicable to this use case
- General UI design trends 2026 articles - Broad guidance, not specific implementation patterns

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - No new dependencies, uses existing codebase infrastructure
- Architecture: HIGH - Strategy pattern well-documented, codebase already has all renderers
- Heuristics: MEDIUM - User decisions provide clear constraints, but exact thresholds need validation in practice
- UX patterns: MEDIUM - Multiple authoritative sources agree on card/table/timeline principles

**Research date:** 2026-02-08
**Valid until:** 2026-03-08 (30 days - stable domain, UX patterns don't change rapidly)
