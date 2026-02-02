# Phase 4: Navigation & Polish - Research

**Researched:** 2026-02-02
**Domain:** React sidebar navigation, landing page UX, state preservation
**Confidence:** HIGH

## Summary

Phase 4 requires implementing auto-generated sidebar navigation for multi-endpoint APIs and polishing the landing page with clickable example APIs that auto-fetch. The research reveals that the current codebase already has all necessary building blocks in place: Headless UI Disclosure for accessible navigation, Zustand for state preservation, and tag metadata from OpenAPI specs for grouping endpoints.

The standard approach for navigation without React Router is state-based routing using Zustand to track the selected operation index while preserving configurations. For landing page polish, the 2026 pattern is hero section with prominent URL input plus interactive example cards that trigger immediate API fetches. Tag-based grouping follows OpenAPI's native tags array, which can be rendered as nested Disclosure components for collapsible navigation sections.

Key insight: Configuration preservation requires separating endpoint-specific state (data, schema, parameters) from global config (fieldConfigs, styleOverrides), which the current architecture already supports via per-endpoint overrides in configStore.

**Primary recommendation:** Use Headless UI Disclosure for tag-grouped sidebar navigation, enhance URLInput with card-based examples that call fetchAndInfer directly, and preserve configurations by NOT clearing configStore when switching operations.

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Headless UI | 2.x | Disclosure component for collapsible navigation | Already in use, accessible, works with Tailwind |
| Zustand | 4.x | State management for selected operation | Already in use, preserves state across renders |
| @dnd-kit | 6.x | Optional: drag-to-reorder sidebar items | Already in use, could enhance navigation UX |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| N/A | N/A | All needed libraries already installed | No new dependencies required |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| State-based routing | React Router | Router adds URL syncing but unnecessary for single-page state switching |
| Headless UI Disclosure | Custom accordion | Custom solution requires reimplementing accessibility and keyboard navigation |
| Tag grouping | Flat list | Flat list simpler but harder to navigate with 10+ endpoints |

**Installation:**
```bash
# No new packages needed - all dependencies already installed
```

## Architecture Patterns

### Recommended Project Structure

```
src/
├── components/
│   ├── navigation/           # NEW: Sidebar navigation components
│   │   ├── Sidebar.tsx       # Main sidebar container (fixed/slide-over)
│   │   ├── TagGroup.tsx      # Disclosure-based tag grouping
│   │   └── OperationItem.tsx # Individual operation link
│   ├── URLInput.tsx          # ENHANCE: Add auto-fetch example cards
│   └── ...
├── store/
│   ├── appStore.ts           # PRESERVE: Don't clear data on operation switch
│   └── configStore.ts        # Already supports per-endpoint overrides
```

### Pattern 1: Tag-Based Sidebar Navigation with Disclosure

**What:** Group operations by tags array, render each tag group as a collapsible Disclosure section
**When to use:** Multi-endpoint APIs with 3+ operations and meaningful tags
**Example:**
```typescript
// Source: Headless UI docs + OpenAPI tag patterns
import { Disclosure } from '@headlessui/react'

interface TagGroupProps {
  tag: string
  operations: ParsedOperation[]
  selectedIndex: number
  onSelect: (index: number) => void
}

function TagGroup({ tag, operations, selectedIndex, onSelect }: TagGroupProps) {
  return (
    <Disclosure defaultOpen>
      <DisclosureButton className="flex w-full items-center gap-2 px-4 py-2 text-left">
        <ChevronRightIcon className="data-[open]:rotate-90 transition" />
        <span className="font-semibold">{tag}</span>
      </DisclosureButton>
      <DisclosurePanel className="pl-8">
        {operations.map((op, idx) => (
          <button
            key={idx}
            onClick={() => onSelect(idx)}
            className={selectedIndex === idx ? 'bg-blue-100' : ''}
          >
            {op.method} {op.path}
          </button>
        ))}
      </DisclosurePanel>
    </Disclosure>
  )
}
```

**Grouping logic:**
```typescript
// Group operations by tags (operations can have multiple tags)
function groupOperationsByTags(operations: ParsedOperation[]): Map<string, number[]> {
  const groups = new Map<string, number[]>()

  operations.forEach((op, index) => {
    // If operation has no tags, put in "Uncategorized"
    const tags = op.tags.length > 0 ? op.tags : ['Uncategorized']

    tags.forEach(tag => {
      if (!groups.has(tag)) {
        groups.set(tag, [])
      }
      groups.get(tag)!.push(index)
    })
  })

  return groups
}
```

### Pattern 2: State Preservation When Switching Operations

**What:** Preserve configurations (fieldConfigs, styleOverrides) while allowing data/schema to update per operation
**When to use:** Always - users expect their configuration work to persist
**Example:**
```typescript
// Source: Zustand patterns + React state management best practices
// Current appStore.setSelectedOperation clears data/schema - GOOD
// configStore persists to localStorage - GOOD
// Pattern: Keep these separate, never clear configStore

// In appStore.ts (CURRENT implementation is correct):
setSelectedOperation: (index) => set({
  selectedOperationIndex: index,
  parameterValues: {},
  data: null,        // Clear operation-specific data
  schema: null       // Clear operation-specific schema
  // NOTE: Does NOT touch configStore
})

// Per-endpoint style overrides (already supported):
const endpointKey = operation.operationId || `${operation.method}-${operation.path}`
const styles = configStore.getEndpointStyleOverrides(endpointKey)
```

### Pattern 3: Landing Page with Auto-Fetch Example Cards

**What:** Replace inline text links with card-based examples that fetch immediately on click
**When to use:** Landing page initial state to reduce friction and show instant value
**Example:**
```typescript
// Source: 2026 SaaS landing page patterns
interface ExampleCard {
  title: string
  description: string
  url: string
  icon?: string
}

const EXAMPLES: ExampleCard[] = [
  {
    title: 'User Directory',
    description: 'JSONPlaceholder users API - array of objects',
    url: 'https://jsonplaceholder.typicode.com/users',
  },
  {
    title: 'Product Catalog',
    description: 'DummyJSON products with pagination',
    url: 'https://dummyjson.com/products',
  },
  {
    title: 'Pet Store (OpenAPI)',
    description: 'Multi-endpoint Swagger Petstore spec',
    url: 'https://petstore.swagger.io/v2/swagger.json',
  }
]

function ExampleCards({ onSelectExample }: { onSelectExample: (url: string) => void }) {
  return (
    <div className="grid grid-cols-3 gap-4">
      {EXAMPLES.map(example => (
        <button
          key={example.url}
          onClick={() => onSelectExample(example.url)}
          className="p-4 border rounded-lg hover:border-blue-500 hover:shadow-md transition text-left"
        >
          <h3 className="font-semibold mb-1">{example.title}</h3>
          <p className="text-sm text-gray-600">{example.description}</p>
        </button>
      ))}
    </div>
  )
}

// In URLInput.tsx - enhance existing handleExampleClick:
const handleExampleClick = (exampleUrl: string) => {
  setUrl(exampleUrl)
  setValidationError(null)
  fetchAndInfer(exampleUrl)  // AUTO-FETCH instead of just populating URL
}
```

### Pattern 4: Sidebar Layout Options

**What:** Choose between fixed sidebar or slide-over panel based on viewport and user preference
**When to use:** Multi-endpoint APIs where navigation needs persistent visibility
**Example:**
```typescript
// Source: Headless UI Dialog for slide-over, CSS for fixed sidebar
// Option A: Fixed sidebar (desktop, always visible)
function FixedSidebar() {
  return (
    <div className="flex h-screen">
      <aside className="w-64 border-r border-border bg-surface overflow-y-auto">
        {/* Navigation content */}
      </aside>
      <main className="flex-1 overflow-y-auto">
        {/* Main content */}
      </main>
    </div>
  )
}

// Option B: Slide-over sidebar (mobile-first, toggleable)
// NOTE: Current app uses max-w-6xl centered layout - sidebar would need layout change
// RECOMMENDATION: Start with fixed sidebar for multi-endpoint, keep current layout for single endpoint
```

### Anti-Patterns to Avoid

- **Clearing configStore on operation switch** - Loses user's configuration work, frustrating UX
- **Rebuilding sidebar on every render** - Tag grouping is expensive, memoize with useMemo
- **No loading state during auto-fetch** - User clicks example, nothing happens, clicks again
- **Positive tabindex values** - Creates unexpected tab order, breaks keyboard navigation
- **Missing skip link** - Keyboard users can't skip navigation section

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Collapsible navigation groups | Custom accordion with useState | Headless UI Disclosure | Handles accessibility, keyboard navigation, ARIA attributes automatically |
| Keyboard navigation | Custom onKeyDown handlers | Semantic HTML nav + button elements | Browser provides keyboard support for free |
| Focus management | Manual focus() calls | Headless UI's built-in focus management | Handles edge cases like nested disclosures and focus trap |
| Tag hierarchy | Custom tree structure | OpenAPI tags array + grouping function | Tags are flat by design, hierarchy via x-tagGroups extension (optional) |

**Key insight:** Navigation accessibility is harder than it looks. Skip links, ARIA labels, keyboard navigation, focus management - all critical for usability. Headless UI solves this.

## Common Pitfalls

### Pitfall 1: Not Preserving User Configuration on Navigation

**What goes wrong:** User customizes field visibility, labels, styles for endpoint A, switches to endpoint B to customize it, switches back to A - all customization is lost
**Why it happens:** Clearing entire config state on navigation instead of only operation-specific data
**How to avoid:** Separate concerns: appStore owns operation data (data, schema, params), configStore owns configuration (fieldConfigs, styleOverrides). Only clear appStore on switch.
**Warning signs:** User complaints about "having to redo everything", configurations resetting unexpectedly

### Pitfall 2: Non-Semantic Navigation Structure

**What goes wrong:** Screen readers announce "button button button" instead of "navigation landmark with 3 items"
**Why it happens:** Not wrapping navigation in `<nav>` element, not using proper list structure
**How to avoid:**
```typescript
<nav aria-label="API endpoints">
  <ul>
    <li><button>GET /users</button></li>
    <li><button>GET /posts</button></li>
  </ul>
</nav>
```
**Warning signs:** Screen reader testing reveals no navigation landmark, axe DevTools reports accessibility violations

### Pitfall 3: Example Links That Don't Auto-Fetch

**What goes wrong:** User clicks "Products example", URL field populates, nothing happens, user confused whether to click Fetch button
**Why it happens:** Following form pattern (populate field, user submits) instead of action pattern (click triggers action)
**How to avoid:** On example click, call `fetchAndInfer(url)` directly after `setUrl(url)`
**Warning signs:** User clicks example multiple times, hesitation before clicking Fetch button

### Pitfall 4: Rebuilding Tag Groups on Every Render

**What goes wrong:** With 20+ operations, grouping logic runs 60 times/second, causing lag
**Why it happens:** Calling groupOperationsByTags() in render without memoization
**How to avoid:**
```typescript
const tagGroups = useMemo(
  () => groupOperationsByTags(operations),
  [operations]
)
```
**Warning signs:** Sidebar feels sluggish, React DevTools profiler shows expensive renders

### Pitfall 5: Missing Skip Navigation Link

**What goes wrong:** Keyboard users must tab through entire sidebar (10+ links) to reach main content
**Why it happens:** Forgetting that not everyone uses a mouse, no accessibility testing
**How to avoid:** Add skip link as first focusable element:
```typescript
<a href="#main-content" className="sr-only focus:not-sr-only">
  Skip to main content
</a>
{/* Sidebar */}
<main id="main-content">
  {/* Content */}
</main>
```
**Warning signs:** Keyboard navigation requires many tab presses to reach content

## Code Examples

Verified patterns from official sources:

### Headless UI Disclosure for Navigation

```typescript
// Source: https://headlessui.com/react/disclosure
import { Disclosure, DisclosureButton, DisclosurePanel } from '@headlessui/react'

function NavigationGroup({ title, children }) {
  return (
    <Disclosure as="div" defaultOpen>
      <DisclosureButton className="flex w-full items-center gap-2 px-4 py-2">
        {({ open }) => (
          <>
            <ChevronRightIcon
              className={`${open ? 'rotate-90' : ''} h-5 w-5 transition`}
            />
            <span className="font-semibold">{title}</span>
          </>
        )}
      </DisclosureButton>
      <DisclosurePanel className="pl-6">
        {children}
      </DisclosurePanel>
    </Disclosure>
  )
}
```

### State-Based Operation Switching

```typescript
// Source: Zustand patterns for view switching
// In component:
const { selectedOperationIndex, setSelectedOperation } = useAppStore()
const { getFieldConfig } = useConfigStore()

function handleOperationClick(index: number) {
  // This clears operation-specific data but preserves config
  setSelectedOperation(index)
  // Configurations automatically preserved via localStorage persistence
}

// Field configs remain intact:
const fieldConfig = getFieldConfig('$.name') // Still has user's custom label, visibility
```

### Auto-Fetch Example Pattern

```typescript
// Source: Modern SaaS landing page patterns 2026
import { useAPIFetch } from '../hooks/useAPIFetch'

function ExampleAPI({ title, url, description }) {
  const { fetchAndInfer } = useAPIFetch()
  const { setUrl } = useAppStore()
  const [isLoading, setIsLoading] = useState(false)

  const handleClick = async () => {
    setIsLoading(true)
    setUrl(url)
    await fetchAndInfer(url)
    setIsLoading(false)
  }

  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      className="relative p-4 border rounded-lg hover:shadow-lg transition"
    >
      {isLoading && <Spinner />}
      <h3 className="font-semibold">{title}</h3>
      <p className="text-sm text-gray-600">{description}</p>
    </button>
  )
}
```

### Accessible Skip Link

```typescript
// Source: React accessibility best practices
function Layout({ children }) {
  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white"
      >
        Skip to main content
      </a>
      <Sidebar />
      <main id="main-content" tabIndex={-1}>
        {children}
      </main>
    </>
  )
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| React Router for all navigation | State-based routing for SPA views | 2022+ | Simpler for single-page state switching, no URL syncing overhead |
| Custom accordions with useState | Headless UI Disclosure | 2021+ | Accessibility built-in, less code, better keyboard support |
| Text links for examples | Interactive cards with auto-fetch | 2025+ | Lower friction, instant gratification, clearer affordances |
| Flat endpoint lists | Tag-based grouping | OpenAPI 3.0+ | Better organization for APIs with 10+ endpoints |

**Deprecated/outdated:**
- **Hand-rolled accordions**: Headless UI Disclosure is standard, handles accessibility
- **Click-to-populate-only examples**: 2026 pattern is click-to-fetch for instant demo

## Open Questions

Things that couldn't be fully resolved:

1. **Should sidebar be fixed or slide-over?**
   - What we know: Current layout is centered max-w-6xl, sidebar would need layout restructure
   - What's unclear: User preference for always-visible vs toggleable navigation
   - Recommendation: Start with conditional rendering - show sidebar only when parsedSpec has 3+ operations, keep current layout otherwise. If sidebar shown, switch to full-width flex layout.

2. **How to handle operations with multiple tags?**
   - What we know: OpenAPI allows operations to have multiple tags, operation appears in multiple groups
   - What's unclear: Duplicate navigation items confusing or helpful?
   - Recommendation: Allow duplicates (standard pattern), show operation in all relevant tag groups. Alternative: primary tag only (first in tags array).

3. **What if spec has no tags or all operations untagged?**
   - What we know: tags array can be empty
   - What's unclear: Best fallback UX
   - Recommendation: Create single "Uncategorized" group, or show flat list if all operations untagged (no grouping overhead).

## Sources

### Primary (HIGH confidence)

- [Headless UI Disclosure Component](https://headlessui.com/react/disclosure) - Official documentation for collapsible navigation
- [OpenAPI Tags Specification](https://swagger.io/docs/specification/v3_0/grouping-operations-with-tags/) - How tags work in OpenAPI specs
- [React Preserving and Resetting State](https://react.dev/learn/preserving-and-resetting-state) - Official React patterns
- [Zustand GitHub](https://github.com/pmndrs/zustand) - State management patterns

### Secondary (MEDIUM confidence)

- [Creating a Type-Safe Router for React Without Browser Navigation](https://hackernoon.com/creating-a-type-safe-router-for-react-without-browser-navigation) - State-based routing patterns
- [10 SaaS Landing Page Trends for 2026](https://www.saasframe.io/blog/10-saas-landing-page-trends-for-2026-with-real-examples) - Interactive demo patterns
- [React Accessibility Best Practices](https://www.allaccessible.org/blog/react-accessibility-best-practices-guide) - Skip links, semantic HTML
- [Zustand Architecture Patterns at Scale](https://brainhub.eu/library/zustand-architecture-patterns-at-scale) - State preservation patterns
- [Add OpenAPI tags for next-level API descriptions](https://redocly.com/blog/add-openapi-tags-for-next-level-api-descriptions) - Tag organization best practices

### Tertiary (LOW confidence)

- [Data Fetching Patterns in Single-Page Applications](https://martinfowler.com/articles/data-fetch-spa.html) - General patterns, not React-specific
- [Top 8 Click-Through Demo Software](https://www.storylane.io/blog/click-through-demo-software) - Demo tools, not implementation patterns

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries already in use, well-documented
- Architecture: HIGH - Patterns verified with official docs, existing codebase already structured well
- Pitfalls: HIGH - Based on React accessibility guidelines and community experiences

**Research date:** 2026-02-02
**Valid until:** 2026-03-02 (30 days - stable domain, React and Headless UI are mature)
