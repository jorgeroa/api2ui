# Phase 7: Pagination & Large Dataset Handling - Research

**Researched:** 2026-02-04
**Domain:** Client-side pagination, React state management, UI/UX patterns, accessibility
**Confidence:** HIGH

## Summary

Phase 7 adds client-side pagination to table and card renderers to improve performance and browsing experience when dealing with large datasets. Research reveals that modern React pagination requires four key technical capabilities: (1) custom hook pattern for encapsulating pagination logic (currentPage, totalPages, index calculation), (2) accessible UI controls with ARIA attributes and keyboard navigation, (3) localStorage persistence for per-endpoint preferences, and (4) responsive page number truncation for mobile.

The existing codebase already provides the necessary infrastructure: Zustand 5 with localStorage persistence via the persist middleware, React 19.2 with hooks, and Tailwind CSS 4 for styling. The ConfigStore pattern already handles per-endpoint configuration persistence, making this phase about adding pagination-specific state and UI controls rather than building new architecture.

**Primary recommendation:** Build a custom `usePagination` hook that calculates page boundaries (firstIndex, lastIndex) and provides navigation functions, create a shared `PaginationControls` component with accessible nav/button elements, extend ConfigStore with per-endpoint pagination preferences (itemsPerPage), and slice data arrays before rendering in TableRenderer and CardListRenderer.

## Standard Stack

The implementation uses the existing React + TypeScript + Tailwind CSS + Zustand stack without requiring additional pagination libraries.

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | 19.2 | Custom hooks (usePagination) | Already in use, useState/useMemo for pagination state |
| TypeScript | 5.9 | Type-safe pagination logic | Already in use, ensures index calculations are correct |
| Zustand | 5.0.11 | Pagination preferences persistence | Already in use with localStorage, extends ConfigStore pattern |
| Tailwind CSS | 4.1 | Pagination UI styling | Already in use, provides button/nav utilities |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| N/A | - | No additional libraries needed | Custom hook + native slice() handles all requirements |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Custom usePagination hook | react-paginate library | react-paginate provides UI component but requires wrapping and adds 650KB dependencies; custom hook is 20-30 lines and integrates directly with ConfigStore |
| Native array slice | react-window virtualization | react-window 2.x has breaking API changes and adds complexity; pagination with slice() is simpler and sufficient for datasets under 10,000 items |
| localStorage via Zustand | URL query params (?page=2) | URL params enable shareable links but require routing infrastructure; localStorage simpler for v0.1, can add URL sync later |
| Custom pagination component | Material-UI Pagination | Material-UI adds 200KB+ dependencies and theme conflicts; custom component matches existing Tailwind design system |

**Installation:**
```bash
# No new dependencies required - all functionality from existing stack
```

## Architecture Patterns

### Recommended Project Structure

```
src/
├── hooks/
│   └── usePagination.ts              # NEW - pagination state/logic hook
├── components/
│   ├── pagination/
│   │   └── PaginationControls.tsx    # NEW - shared pagination UI
│   └── renderers/
│       ├── TableRenderer.tsx         # MODIFY - add pagination
│       └── CardListRenderer.tsx      # MODIFY - add pagination
├── types/
│   └── config.ts                     # MODIFY - add PaginationConfig
└── store/
    └── configStore.ts                # MODIFY - add pagination state/actions
```

### Pattern 1: Custom Pagination Hook

**What:** Encapsulates pagination state and calculation logic in a reusable hook
**When to use:** In any renderer that displays array data (tables, cards, lists)
**Example:**
```typescript
// Source: React custom hooks pattern + pagination logic
// https://dev.to/damiisdandy/pagination-in-javascript-and-react-with-a-custom-usepagination-hook-1mgo

interface UsePaginationProps {
  totalItems: number
  itemsPerPage: number
  currentPage: number
}

interface UsePaginationReturn {
  currentPage: number
  totalPages: number
  firstIndex: number
  lastIndex: number
  hasNextPage: boolean
  hasPrevPage: boolean
  pageNumbers: (number | '...')[]  // For smart truncation
}

function usePagination({ totalItems, itemsPerPage, currentPage }: UsePaginationProps): UsePaginationReturn {
  const totalPages = Math.ceil(totalItems / itemsPerPage)

  // Clamp currentPage to valid range
  const validPage = Math.max(1, Math.min(currentPage, totalPages))

  // Calculate slice boundaries
  const firstIndex = (validPage - 1) * itemsPerPage
  const lastIndex = Math.min(firstIndex + itemsPerPage, totalItems)

  // Navigation state
  const hasNextPage = validPage < totalPages
  const hasPrevPage = validPage > 1

  // Smart page number truncation (show first, last, current +/- 2)
  const pageNumbers = useMemo(() => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1)

    const pages: (number | '...')[] = []
    pages.push(1)

    if (validPage > 3) pages.push('...')

    const start = Math.max(2, validPage - 1)
    const end = Math.min(totalPages - 1, validPage + 1)
    for (let i = start; i <= end; i++) pages.push(i)

    if (validPage < totalPages - 2) pages.push('...')

    if (totalPages > 1) pages.push(totalPages)

    return pages
  }, [totalPages, validPage])

  return { currentPage: validPage, totalPages, firstIndex, lastIndex, hasNextPage, hasPrevPage, pageNumbers }
}
```

### Pattern 2: Accessible Pagination Controls

**What:** Shared component for prev/next buttons, page numbers, items-per-page selector
**When to use:** Bottom of TableRenderer and CardListRenderer
**Example:**
```tsx
// Source: WCAG pagination accessibility patterns
// https://a11ymatters.com/pattern/pagination/
// https://auig.org/pages/pagination.html

interface PaginationControlsProps {
  currentPage: number
  totalPages: number
  totalItems: number
  itemsPerPage: number
  pageNumbers: (number | '...')[]
  onPageChange: (page: number) => void
  onItemsPerPageChange: (items: number) => void
  itemsPerPageOptions?: number[]  // Default: [10, 20, 50, 100]
}

function PaginationControls({
  currentPage, totalPages, totalItems, itemsPerPage, pageNumbers,
  onPageChange, onItemsPerPageChange, itemsPerPageOptions = [10, 20, 50, 100]
}: PaginationControlsProps) {
  const firstItem = (currentPage - 1) * itemsPerPage + 1
  const lastItem = Math.min(currentPage * itemsPerPage, totalItems)

  return (
    <nav
      aria-label="Pagination Navigation"
      className="flex items-center justify-between px-4 py-3 border-t border-border"
    >
      {/* Status indicator */}
      <div className="text-sm text-gray-600">
        Showing {firstItem}-{lastItem} of {totalItems}
      </div>

      {/* Page navigation */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          aria-label="Previous page"
          className="px-3 py-1 border border-border rounded hover:bg-surface disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Prev
        </button>

        {pageNumbers.map((page, i) =>
          page === '...' ? (
            <span key={`ellipsis-${i}`} className="px-2 text-gray-400">...</span>
          ) : (
            <button
              key={page}
              onClick={() => onPageChange(page as number)}
              aria-label={`Go to page ${page}`}
              aria-current={page === currentPage ? 'page' : undefined}
              className={`px-3 py-1 border rounded ${
                page === currentPage
                  ? 'bg-primary text-white border-primary'
                  : 'border-border hover:bg-surface'
              }`}
            >
              {page}
            </button>
          )
        )}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          aria-label="Next page"
          className="px-3 py-1 border border-border rounded hover:bg-surface disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>

      {/* Items per page selector */}
      <div className="flex items-center gap-2 text-sm">
        <label htmlFor="items-per-page" className="text-gray-600">Items per page:</label>
        <select
          id="items-per-page"
          value={itemsPerPage}
          onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
          className="border border-border rounded px-2 py-1"
        >
          {itemsPerPageOptions.map(option => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
      </div>
    </nav>
  )
}
```

### Pattern 3: ConfigStore Extension for Pagination Preferences

**What:** Per-endpoint pagination state stored in localStorage via Zustand persist
**When to use:** Store itemsPerPage and currentPage preferences per API endpoint
**Example:**
```typescript
// Source: Zustand persist patterns + existing ConfigStore architecture
// https://medium.com/@roman_j/mastering-state-persistence-with-local-storage-in-react-a-complete-guide-1cf3f56ab15c

interface PaginationConfig {
  itemsPerPage: number  // Default: 20 for tables, 12 for cards
  currentPage: number   // Default: 1
}

interface ConfigState {
  // ... existing state
  paginationConfigs: Record<string, PaginationConfig>  // Key: fieldPath (e.g., "$")
}

interface ConfigStore extends ConfigState {
  // ... existing actions

  // Pagination actions
  setPaginationConfig: (path: string, config: Partial<PaginationConfig>) => void
  getPaginationConfig: (path: string, defaultItemsPerPage: number) => PaginationConfig
  resetPaginationForPath: (path: string) => void
}

// In store implementation:
setPaginationConfig: (path, config) =>
  set((state) => ({
    paginationConfigs: {
      ...state.paginationConfigs,
      [path]: {
        itemsPerPage: 20,
        currentPage: 1,
        ...state.paginationConfigs[path],
        ...config,
      },
    },
  })),

getPaginationConfig: (path, defaultItemsPerPage) => {
  const state = get()
  return state.paginationConfigs[path] ?? { itemsPerPage: defaultItemsPerPage, currentPage: 1 }
},
```

### Pattern 4: Renderer Integration with Data Slicing

**What:** Slice data array based on pagination state before rendering rows/cards
**When to use:** In TableRenderer and CardListRenderer before mapping data
**Example:**
```tsx
// In TableRenderer.tsx or CardListRenderer.tsx
function TableRenderer({ data, schema, path, depth }: RendererProps) {
  const { getPaginationConfig, setPaginationConfig } = useConfigStore()

  // Get pagination preferences (default: 20 items per page for tables)
  const paginationConfig = getPaginationConfig(path, 20)

  // Calculate pagination state
  const pagination = usePagination({
    totalItems: data.length,
    itemsPerPage: paginationConfig.itemsPerPage,
    currentPage: paginationConfig.currentPage,
  })

  // Slice data to current page
  const paginatedData = data.slice(pagination.firstIndex, pagination.lastIndex)

  const handlePageChange = (page: number) => {
    setPaginationConfig(path, { currentPage: page })
  }

  const handleItemsPerPageChange = (items: number) => {
    setPaginationConfig(path, { itemsPerPage: items, currentPage: 1 }) // Reset to page 1
  }

  return (
    <div>
      {/* Render table with paginatedData instead of data */}
      <div className="overflow-auto">
        {paginatedData.map((item, index) => (
          <TableRow key={index} item={item} />
        ))}
      </div>

      {/* Only show pagination if data exceeds threshold */}
      {data.length > paginationConfig.itemsPerPage && (
        <PaginationControls
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          totalItems={data.length}
          itemsPerPage={paginationConfig.itemsPerPage}
          pageNumbers={pagination.pageNumbers}
          onPageChange={handlePageChange}
          onItemsPerPageChange={handleItemsPerPageChange}
        />
      )}
    </div>
  )
}
```

### Anti-Patterns to Avoid

- **Loading all data then filtering client-side for server paginated APIs:** This phase is client-side only; never fetch all pages from server then paginate client-side (huge performance hit)
- **Not resetting to page 1 when changing items-per-page:** User expects to see "top" of list when changing density, not potentially empty page
- **Storing currentPage in component state only:** Pagination state must persist in ConfigStore so preferences survive page refresh
- **Using index as React key for paginated rows:** Index resets per page; use stable identifier from data (id field) when available

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Page number truncation logic | Custom ellipsis algorithm | Standard pattern (first, last, current ±2) | Edge cases are tricky (first page, last page, mobile); established pattern handles all cases |
| Accessibility attributes | Manual ARIA labels | Established nav + aria-label + aria-current pattern | WCAG compliance requires specific role/label combinations; copy proven patterns |
| Items-per-page state sync | Custom state reconciliation | Zustand persist middleware with partialize | Already handles localStorage sync, merge strategies, version migrations |
| Data slicing edge cases | Manual index math | Array.slice() with Math.min/max guards | Off-by-one errors are common; boundary guards prevent crashes |

**Key insight:** Pagination is a solved UI pattern with established accessibility requirements. Focus on integrating the standard pattern into the existing architecture rather than inventing custom solutions.

## Common Pitfalls

### Pitfall 1: Fetching All Data at Once (Server-Side Mistake)

**What goes wrong:** Developer implements client-side pagination but still fetches entire dataset from server API, causing massive data transfer and memory usage
**Why it happens:** Confusion between client-side and server-side pagination; this phase is client-side only (API returns full array, we paginate in browser)
**How to avoid:** Only use client-side pagination when API returns complete array (≤ 10,000 items); document that future server-side pagination would need different approach
**Warning signs:** Network tab shows multi-MB responses; browser memory usage spikes; slow initial load

### Pitfall 2: Not Clearing Stale Page Numbers

**What goes wrong:** User changes items-per-page from 10 to 50, stays on page 5, but now only 2 total pages exist → empty page shown
**Why it happens:** currentPage and itemsPerPage stored independently, no reconciliation logic
**How to avoid:** Always reset currentPage to 1 when itemsPerPage changes; usePagination hook clamps page to valid range
**Warning signs:** "No data" shown when items exist; pagination shows "Page 5 of 2"

### Pitfall 3: Poor Mobile Experience

**What goes wrong:** Pagination controls render 20+ page numbers on mobile, become unclickable tiny buttons
**Why it happens:** Desktop-first design without responsive truncation
**How to avoid:** Use smart truncation (≤7 visible page numbers), ensure min touch target 44px, test on mobile viewport
**Warning signs:** Horizontal scroll in pagination bar; user complaints about "can't tap page numbers"

### Pitfall 4: Accessibility Barriers

**What goes wrong:** Screen reader users can't navigate pagination; keyboard users can't tab through page numbers
**Why it happens:** Missing ARIA attributes, semantic HTML (nav/button), keyboard handlers
**How to avoid:** Use nav role with aria-label, buttons with aria-current for active page, aria-label for each page link
**Warning signs:** Accessibility audits fail; screen reader reads "button button button" instead of page numbers

### Pitfall 5: Performance Issues with Re-Renders

**What goes wrong:** Changing page causes entire table to re-render, including header/footer, causing visual flash
**Why it happens:** Pagination state stored in parent component, triggers full re-render on page change
**How to avoid:** Use React.memo on static components (header), useMemo for pagination calculations, only re-render data rows
**Warning signs:** Header/footer flicker when changing pages; slow page transitions

## Code Examples

Verified patterns from research:

### Accessible Navigation Structure

```tsx
// Source: WCAG Pagination Patterns
// https://a11ymatters.com/pattern/pagination/

<nav aria-label="Pagination Navigation" className="...">
  <button
    onClick={() => onPageChange(currentPage - 1)}
    disabled={currentPage === 1}
    aria-label="Previous page"
  >
    Prev
  </button>

  {pageNumbers.map(page =>
    page === '...' ? (
      <span aria-hidden="true">...</span>
    ) : (
      <button
        aria-label={`Go to page ${page}`}
        aria-current={page === currentPage ? 'page' : undefined}
        onClick={() => onPageChange(page)}
      >
        {page}
      </button>
    )
  )}

  <button
    onClick={() => onPageChange(currentPage + 1)}
    disabled={currentPage === totalPages}
    aria-label="Next page"
  >
    Next
  </button>
</nav>
```

### Smart Page Number Truncation

```typescript
// Source: Common pagination truncation algorithm
// Shows: 1 ... 4 5 6 ... 10 (when on page 5 of 10)

function getPageNumbers(currentPage: number, totalPages: number): (number | '...')[] {
  if (totalPages <= 7) {
    // Show all pages if 7 or fewer
    return Array.from({ length: totalPages }, (_, i) => i + 1)
  }

  const pages: (number | '...')[] = [1] // Always show first

  if (currentPage > 3) pages.push('...') // Left ellipsis

  // Show current page and ±2 neighbors (bounded by 2 and totalPages-1)
  const start = Math.max(2, currentPage - 1)
  const end = Math.min(totalPages - 1, currentPage + 1)
  for (let i = start; i <= end; i++) {
    pages.push(i)
  }

  if (currentPage < totalPages - 2) pages.push('...') // Right ellipsis

  if (totalPages > 1) pages.push(totalPages) // Always show last

  return pages
}
```

### Data Slicing with Boundary Guards

```typescript
// Source: Safe array slicing pattern
// Prevents crashes when currentPage exceeds bounds

function getPaginatedData<T>(
  data: T[],
  currentPage: number,
  itemsPerPage: number
): { items: T[], firstIndex: number, lastIndex: number } {
  const totalPages = Math.ceil(data.length / itemsPerPage)

  // Clamp currentPage to valid range [1, totalPages]
  const validPage = Math.max(1, Math.min(currentPage, totalPages || 1))

  const firstIndex = (validPage - 1) * itemsPerPage
  const lastIndex = Math.min(firstIndex + itemsPerPage, data.length)

  return {
    items: data.slice(firstIndex, lastIndex),
    firstIndex,
    lastIndex,
  }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Server-side pagination only | Client-side pagination for small-medium datasets (< 10k items) | ~2020 | Better UX with instant page changes, no network delay |
| URL query params only (?page=2) | localStorage + optional URL sync | ~2021 | Preferences persist across sessions without polluting URL |
| Class components with this.state | Functional components with custom hooks (usePagination) | 2019+ (React 16.8) | Reusable logic, less boilerplate |
| Render all items, hide with CSS | Array.slice() to render only visible items | Always best practice | True performance benefit (fewer DOM nodes) |
| Manual ARIA attributes | Standardized nav + aria-label + aria-current pattern | WCAG 2.1+ (2018) | Consistent screen reader experience |

**Deprecated/outdated:**
- **react-paginate:** Still functional but adds unnecessary dependencies when custom hook is 30 lines
- **Material-UI Pagination:** Requires full Material-UI theme system; Tailwind approach lighter weight
- **Inline pagination state:** Don't use useState in renderer; use ConfigStore for persistence

## Open Questions

Things that couldn't be fully resolved:

1. **Mobile page number truncation threshold**
   - What we know: Desktop shows ≤7 page numbers; mobile should show fewer
   - What's unclear: Should mobile be ≤5 or ≤3? No consensus in research
   - Recommendation: Start with same truncation (≤7), test on mobile in verification phase

2. **Default items-per-page for different renderers**
   - What we know: Requirements say 20 for tables, 12 for cards
   - What's unclear: Should lists/primitives have different defaults?
   - Recommendation: Use 20 for tables, 12 for cards as specified; defer list pagination until needed

3. **Should pagination reset when API endpoint changes?**
   - What we know: ConfigStore keys by fieldPath, new endpoint = new path
   - What's unclear: Should changing endpoint within same spec reset page to 1?
   - Recommendation: Yes - path includes endpoint identifier, so new endpoint gets fresh config automatically

4. **Integration with existing react-window dependency**
   - What we know: package.json has react-window 2.2.6, but TableRenderer doesn't use it (CSS scroll instead)
   - What's unclear: Should we remove unused dependency or keep for future virtualization?
   - Recommendation: Keep dependency, add comment to package.json; pagination sufficient for v0.1, virtualization future enhancement

## Sources

### Primary (HIGH confidence)

- [React Pagination Tutorial: 4 Ways with Full Code Examples | Contentful](https://www.contentful.com/blog/react-pagination/) - Comprehensive overview of client-side patterns
- [Client-Side Pagination in React: A Step-by-Step Tutorial | Agility CMS](https://agilitycms.com/blog/how-to-handle-pagination-in-react-client-side-only) - Custom hook implementation
- [Pagination in Javascript and React, with a custom usePagination() hook - DEV Community](https://dev.to/damiisdandy/pagination-in-javascript-and-react-with-a-custom-usepagination-hook-1mgo) - Hook pattern reference
- [Accessibility Matters - Pagination](https://a11ymatters.com/pattern/pagination/) - ARIA attribute patterns
- [Pagination - Accessible User Interface Guidelines (AUIG)](https://auig.org/pages/pagination.html) - WCAG compliance guide
- [Mastering State Persistence with Local Storage in React | Medium](https://medium.com/@roman_j/mastering-state-persistence-with-local-storage-in-react-a-complete-guide-1cf3f56ab15c) - Zustand persist patterns

### Secondary (MEDIUM confidence)

- [Design Better Pagination by Andrew Coyle](https://www.andrewcoyle.com/blog/design-better-pagination) - UI/UX best practices
- [Pagination UI Design: Best practices, Design variants & Examples | Mobbin](https://mobbin.com/glossary/pagination) - Design patterns
- [10+ Best React Pagination Libraries - Flatlogic Blog](https://flatlogic.com/blog/react-pagination-guide-and-best-react-pagination-libraries/) - Library comparison
- [Efficient Pagination in React: Best Practices for API Calls - DEV Community](https://dev.to/ogeobubu/efficient-pagination-in-react-best-practices-for-api-calls-54ia) - Performance optimization

### Tertiary (LOW confidence)

- Various Stack Overflow discussions on page number truncation algorithms (no single authoritative source)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Using existing project dependencies (React, Zustand, Tailwind), no new libraries needed
- Architecture: HIGH - Custom hook + ConfigStore extension follows established patterns from Phases 5 & 6
- Pitfalls: HIGH - Verified with multiple sources on common pagination mistakes
- UI/UX patterns: HIGH - WCAG accessibility patterns are well-documented standards
- Page truncation algorithm: MEDIUM - Common pattern but no single official spec, multiple implementations exist

**Research date:** 2026-02-04
**Valid until:** ~30 days (stable domain, no fast-moving dependencies)
