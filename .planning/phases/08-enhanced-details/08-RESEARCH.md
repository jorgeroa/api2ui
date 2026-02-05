# Phase 8: Enhanced Detail Views & Layout Polish - Research

**Researched:** 2026-02-05
**Domain:** React UI detail view layouts, CSS Grid responsive patterns, horizontal scrollers
**Confidence:** HIGH

## Summary

This phase enhances the existing DetailRenderer and DetailModal components with polished product-page-style layouts. The research focused on five key areas: hero image placement, two-column responsive layouts, horizontal card scrollers, breadcrumb navigation integration, and modal vs panel presentation modes.

The standard approach for modern detail pages uses CSS Grid with named template areas for responsive two-column layouts, CSS scroll-snap for native horizontal scrolling, and Gestalt principles (proximity, common region) for visual field grouping. The existing codebase already has hero image detection (Phase 5), breadcrumb components (Phase 6), and drilldown mode selection infrastructure in place, making this phase primarily about enhancing the DetailRenderer layout and adding a panel-based alternative to the modal.

**Primary recommendation:** Use CSS Grid with `grid-template-areas` for mobile-first responsive detail layouts, implement horizontal card scrollers with native CSS `scroll-snap-type: x mandatory`, group related fields using whitespace and subtle visual containers, integrate existing Breadcrumb component into nested detail views, and extend drilldownMode to support 'panel' as a third option alongside 'page' and 'dialog'.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| CSS Grid | Native | Two-column responsive layouts | Modern standard for complex layouts, eliminates framework dependencies, supports named template areas for maintainability |
| CSS Scroll Snap | Native | Horizontal card scrolling | Native browser API, excellent mobile support, smooth UX without JavaScript |
| Tailwind CSS | 4.x | Layout utilities | Already in use, provides grid/spacing utilities (grid-cols-*, gap-*, space-y-*) |
| Headless UI | 2.2.9 | Dialog component base | Already in use for DetailModal, can be extended for panel/drawer patterns |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @headlessui/react Transition | 2.2.9 | Slide-in panel animations | For drawer/panel mode, smooth entry/exit transitions |
| React hooks (useState, useEffect) | 19.2.0 | Component state management | Managing panel open/closed state, breadcrumb visibility |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| CSS Grid | CSS Flexbox | Flexbox works but requires more wrapper elements, harder to maintain complex responsive layouts |
| CSS Scroll Snap | react-window horizontal list | Library adds bundle size, CSS scroll-snap is native and performant |
| Custom drawer component | radix-ui drawer | Headless UI Dialog with custom positioning achieves same result, avoids new dependency |
| Container queries | Media queries | Container queries are ideal but browser support still maturing (2026), media queries more reliable |

**Installation:**
```bash
# No new dependencies needed
# All requirements met by existing stack
```

## Architecture Patterns

### Recommended Project Structure
```
src/components/
├── detail/
│   ├── DetailModal.tsx          # Existing modal (dialog mode)
│   ├── DetailPanel.tsx          # NEW: Side panel (panel mode)
│   └── DetailLayout.tsx         # NEW: Shared detail layout logic
├── renderers/
│   ├── DetailRenderer.tsx       # Enhanced with hero + two-column layout
│   └── HorizontalCardScroller.tsx  # NEW: For nested arrays
└── navigation/
    └── Breadcrumb.tsx           # Existing, integrate into detail views
```

### Pattern 1: Two-Column Detail Layout with CSS Grid

**What:** Mobile-first responsive layout that stacks vertically on mobile, then switches to two-column on desktop with hero image spanning full width at top.

**When to use:** For detail views with multiple fields that benefit from visual grouping and hierarchy.

**Example:**
```typescript
// DetailRenderer.tsx enhancement
// Source: MDN CSS Grid - Common Grid Layouts

// Mobile-first: single column
<div className="space-y-6">
  {/* Hero image - full width */}
  {heroImage && (
    <div className="w-full">
      <img src={heroImage.url} alt="..." className="w-full max-h-96 object-cover rounded-lg" />
    </div>
  )}

  {/* Fields grid - responsive two-column */}
  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
    {fields.map(([fieldName, fieldDef]) => (
      <div key={fieldName} className="space-y-1">
        <div className="text-sm font-medium text-gray-600">{displayLabel}</div>
        <div className="text-base text-gray-900">
          <PrimitiveRenderer data={value} schema={fieldDef.type} path={fieldPath} depth={depth + 1} />
        </div>
      </div>
    ))}
  </div>
</div>
```

### Pattern 2: Visual Field Grouping with Gestalt Principles

**What:** Use whitespace (gap-y-*) and subtle containers to group related fields without explicit labels or heavy borders.

**When to use:** When fields naturally cluster (e.g., contact info, address fields, metadata).

**Example:**
```typescript
// Source: Nielsen Norman Group - Form Design White Space

// Group 1: Primary info (larger spacing after)
<div className="space-y-3 pb-6 border-b border-gray-200">
  <FieldRow field="name" />
  <FieldRow field="title" />
</div>

// Group 2: Contact details (larger spacing after)
<div className="space-y-3 pb-6 border-b border-gray-200">
  <FieldRow field="email" />
  <FieldRow field="phone" />
</div>

// Group 3: Metadata (no bottom border)
<div className="space-y-3">
  <FieldRow field="created_at" />
  <FieldRow field="updated_at" />
</div>
```

**Spacing hierarchy:**
- Within group: `gap-y-3` (12px)
- Between groups: `gap-y-6` or `pb-6` (24px) — 2x within-group spacing
- Creates visual "common region" without explicit containers

### Pattern 3: Horizontal Card Scroller with CSS Scroll Snap

**What:** Native CSS-based horizontal scroller for nested arrays, no JavaScript library needed.

**When to use:** For nested array fields in detail views (e.g., "related products", "team members", "attachments").

**Example:**
```typescript
// HorizontalCardScroller.tsx
// Source: MDN CSS Scroll Snap - Basic Concepts

export function HorizontalCardScroller({ items, schema, path }: { items: unknown[], schema: TypeSignature, path: string }) {
  return (
    <div className="overflow-x-auto scroll-smooth" style={{ scrollSnapType: 'x mandatory' }}>
      <div className="inline-flex gap-4 p-4">
        {items.map((item, index) => (
          <div
            key={index}
            className="flex-none w-72"
            style={{ scrollSnapAlign: 'start' }}
          >
            <CardContent item={item} />
          </div>
        ))}
      </div>
    </div>
  )
}
```

**CSS properties:**
- Container: `scroll-snap-type: x mandatory` (or `x proximity` for more flexibility)
- Children: `scroll-snap-align: start` (or `center` for centered snapping)
- Spacing: `scroll-padding` on container reserves space for UI chrome

### Pattern 4: Breadcrumb Integration in Detail Views

**What:** Show breadcrumb navigation when depth > 0 (nested detail views) using existing Breadcrumb component.

**When to use:** When drilling down from list → detail → nested detail.

**Example:**
```typescript
// DetailRenderer.tsx (for nested detail views)
// DetailPanel.tsx or DetailModal.tsx (for top-level details)

import { Breadcrumb } from '../navigation/Breadcrumb'
import { useNavigation } from '../../contexts/NavigationContext'

// In component:
const nav = useNavigation()

{depth > 0 && nav && (
  <div className="mb-4">
    <Breadcrumb
      rootLabel="Back to list"
      stack={nav.stack}
      onNavigate={(index) => nav.navigateTo(index)}
    />
  </div>
)}
```

### Pattern 5: Modal vs Panel Mode Selection

**What:** Extend existing drilldownMode from ('page' | 'dialog') to ('page' | 'dialog' | 'panel').

**When to use:**
- **Dialog (modal):** Quick focus on single item, blocks interaction with parent (current default)
- **Panel (drawer):** Show detail while keeping list visible, allows comparison, non-blocking
- **Page:** Replace entire view for deep navigation (already exists)

**Example:**
```typescript
// configStore.ts - extend DrilldownMode type
export type DrilldownMode = 'page' | 'dialog' | 'panel'

// DrilldownModeToggle.tsx - add third button
<button onClick={() => setDrilldownMode('panel')}>Panel</button>

// CardListRenderer.tsx - render DetailPanel instead of DetailModal
{nav && nav.drilldownMode === 'panel' && (
  <DetailPanel item={selectedItem} schema={schema.items} onClose={() => setSelectedItem(null)} />
)}
```

**Panel implementation with Headless UI:**
```typescript
// DetailPanel.tsx - slide from right
// Source: Headless UI Dialog + custom positioning

import { Dialog, DialogPanel, Transition } from '@headlessui/react'

export function DetailPanel({ item, schema, onClose }: DetailPanelProps) {
  return (
    <Dialog open={item !== null} onClose={onClose} className="relative z-50">
      {/* Backdrop - less opacity than modal */}
      <div className="fixed inset-0 bg-black/20" aria-hidden="true" />

      {/* Panel container - positioned right */}
      <div className="fixed inset-0 flex justify-end">
        <DialogPanel className="w-full max-w-2xl bg-surface shadow-xl h-full overflow-y-auto">
          {/* Panel content */}
        </DialogPanel>
      </div>
    </Dialog>
  )
}
```

### Anti-Patterns to Avoid

- **Using `scroll-snap-type: x mandatory` with overflowing content:** Users can't scroll overflowing content into view. Use `proximity` instead for flexible scrolling.
- **Explicit section headings for every field group:** Over-labeling reduces visual clarity. Rely on whitespace and proximity for grouping.
- **Media queries for grid columns without mobile-first approach:** Leads to layout bugs on small screens. Always define single-column base, then enhance.
- **JavaScript-based horizontal scrolling:** Adds complexity and bundle size. CSS scroll-snap provides native, performant scrolling.
- **Too many nested grids:** Keep grid to top-level layout only, use flexbox or simple divs for internal field layouts.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Horizontal scrolling carousel | Custom scroll logic with refs and animation | CSS `scroll-snap-type: x mandatory` | Native browser API handles touch gestures, momentum scrolling, accessibility, smooth snap animations without JavaScript |
| Responsive two-column layout | Manual breakpoint calculations, flexbox wrappers | CSS Grid `grid-cols-1 md:grid-cols-2` | Grid handles alignment automatically, cleaner markup, easier to maintain and modify |
| Drawer/panel component | New dependency (radix-ui, react-drawer) | Headless UI Dialog + custom positioning | Already using Headless UI, Dialog with fixed positioning achieves same result |
| Field grouping visual containers | Explicit fieldset/legend, heavy borders | Whitespace + subtle separators | User research shows whitespace creates clearer boundaries, reduces visual noise (NNG research) |
| Breadcrumb trail logic | Custom stack management | Existing Breadcrumb component + NavigationContext | Phase 6 already implemented navigation stack, just needs integration into detail views |

**Key insight:** Modern CSS (Grid, Scroll Snap) has matured to the point where many "interactive" patterns no longer need JavaScript. Leveraging native browser capabilities reduces bundle size, improves performance, and provides better accessibility and mobile UX out of the box.

## Common Pitfalls

### Pitfall 1: Scroll Snap Mandatory with Variable Content

**What goes wrong:** Using `scroll-snap-type: x mandatory` causes users to be unable to scroll content that overflows a snap point into view.

**Why it happens:** Mandatory snap forces scrolling to stop at defined snap points, ignoring overflowing content.

**How to avoid:**
- Use `scroll-snap-type: x proximity` for more flexible behavior
- Ensure all content fits within snap point containers
- Test with long content (text overflow, large images)

**Warning signs:**
- Users report "can't see full content"
- Content clipped at edges of cards
- Poor mobile experience with small screens

### Pitfall 2: Grid Column Misalignment at Breakpoints

**What goes wrong:** Fields that should span full width (like images, descriptions) inadvertently get constrained to one grid column on desktop.

**Why it happens:** Not explicitly setting `grid-column: 1 / -1` (span all columns) for full-width elements.

**How to avoid:**
```typescript
// Full-width elements need explicit spanning
<div className="md:col-span-2">  // Spans both columns on desktop
  <img src={heroImage.url} className="w-full" />
</div>
```

**Warning signs:**
- Hero images squeezed into half-width on desktop
- Long text descriptions awkwardly split across columns
- Nested arrays appearing in single column when they should span

### Pitfall 3: Insufficient Spacing Between Field Groups

**What goes wrong:** Related fields blend together visually, users can't distinguish logical sections.

**Why it happens:** Using uniform spacing throughout detail view without hierarchy.

**How to avoid:**
- Within-group spacing: 12px (`gap-y-3`)
- Between-group spacing: 24px (`gap-y-6` or `pb-6 mb-6`)
- Use subtle separators (1px border) between major sections
- Test with 10+ fields to verify grouping is clear

**Warning signs:**
- Users describe detail view as "wall of text"
- Confusion about which fields relate to each other
- Requests to "organize the information better"

### Pitfall 4: Panel Mode Without Backdrop Dimming

**What goes wrong:** Panel appears but users don't realize main content is not interactive, click parent and close panel unintentionally.

**Why it happens:** Missing or too-subtle backdrop overlay.

**How to avoid:**
```typescript
// Panel backdrop - visible but less aggressive than modal
<div className="fixed inset-0 bg-black/20" aria-hidden="true" />
```

**Warning signs:**
- Users report panel "keeps closing"
- Confusion about whether main content is interactive
- Accidental clicks on parent content

### Pitfall 5: Breadcrumb Appearing at Wrong Depth

**What goes wrong:** Breadcrumb shows on top-level detail views (depth 0) where it's not needed, or fails to show in nested detail views where navigation context is critical.

**Why it happens:** Incorrect depth checking or missing navigation context.

**How to avoid:**
```typescript
// Only show breadcrumb for nested detail views (depth > 0)
{depth > 0 && nav && nav.stack.length > 0 && (
  <Breadcrumb rootLabel="Back" stack={nav.stack} onNavigate={nav.navigateTo} />
)}
```

**Warning signs:**
- Breadcrumb on first detail view (redundant with back button)
- Missing breadcrumb when drilling into nested objects
- Breadcrumb stack showing incorrect hierarchy

## Code Examples

Verified patterns from official sources:

### Hero Image + Two-Column Grid Layout
```typescript
// Source: MDN CSS Grid Common Layouts + Tailwind CSS Grid utilities

export function DetailRenderer({ data, schema, path, depth }: RendererProps) {
  const obj = data as Record<string, unknown>
  const fields = Array.from(schema.fields.entries())

  // Detect hero image (existing Phase 5 utility)
  const heroImage = getHeroImageField(obj, fields)

  return (
    <div className="space-y-6">
      {/* Hero image - full width */}
      {heroImage && (
        <div className="w-full">
          <img
            src={heroImage.url}
            alt="Detail hero"
            loading="lazy"
            className="w-full max-h-96 object-cover rounded-lg border border-gray-200"
            onError={(e) => { e.currentTarget.style.display = 'none' }}
          />
        </div>
      )}

      {/* Breadcrumb for nested views */}
      {depth > 0 && nav && (
        <Breadcrumb
          rootLabel="Back to list"
          stack={nav.stack}
          onNavigate={(index) => nav.navigateTo(index)}
        />
      )}

      {/* Fields in responsive two-column grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
        {fields
          .filter(([name]) => name !== heroImage?.fieldName) // Skip hero field
          .map(([fieldName, fieldDef]) => (
            <div key={fieldName} className="space-y-1">
              <div className="text-sm font-medium text-gray-600">
                {formatLabel(fieldName)}
              </div>
              <div className="text-base text-gray-900">
                <PrimitiveRenderer
                  data={obj[fieldName]}
                  schema={fieldDef.type}
                  path={`${path}.${fieldName}`}
                  depth={depth + 1}
                />
              </div>
            </div>
          ))}
      </div>
    </div>
  )
}
```

### Horizontal Card Scroller for Nested Arrays
```typescript
// Source: MDN CSS Scroll Snap Basic Concepts

interface HorizontalCardScrollerProps {
  items: unknown[]
  schema: TypeSignature
  path: string
  depth: number
}

export function HorizontalCardScroller({ items, schema, path, depth }: HorizontalCardScrollerProps) {
  if (schema.kind !== 'object') {
    return null
  }

  const fields = Array.from(schema.fields.entries())

  return (
    <div className="space-y-2">
      <div className="text-sm font-medium text-gray-600">
        {items.length} items
      </div>

      {/* Horizontal scroller with CSS scroll-snap */}
      <div
        className="overflow-x-auto scroll-smooth pb-2"
        style={{ scrollSnapType: 'x proximity' }}  // Proximity for flexibility
      >
        <div className="inline-flex gap-4">
          {items.map((item, index) => {
            const obj = item as Record<string, unknown>
            const heroImage = getHeroImageField(obj, fields)

            return (
              <div
                key={index}
                className="flex-none w-64 border border-border rounded-lg overflow-hidden shadow-sm hover:shadow-md cursor-pointer transition-all"
                style={{ scrollSnapAlign: 'start' }}
              >
                {heroImage && (
                  <div className="w-full h-40 bg-gray-100">
                    <img
                      src={heroImage.url}
                      alt={getItemLabel(item)}
                      loading="lazy"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="p-3">
                  <div className="font-medium text-sm mb-2">
                    {getItemLabel(item)}
                  </div>
                  <div className="space-y-1">
                    {fields.slice(0, 3).map(([fieldName, fieldDef]) => {
                      if (heroImage && fieldName === heroImage.fieldName) return null
                      const value = obj[fieldName]
                      return (
                        <div key={fieldName} className="text-xs text-gray-600 truncate">
                          <span className="font-medium">{formatLabel(fieldName)}:</span> {String(value)}
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
```

### Detail Panel (Drawer Mode)
```typescript
// Source: Headless UI Dialog documentation + community drawer patterns

import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react'

interface DetailPanelProps {
  item: unknown | null
  schema: TypeSignature
  onClose: () => void
}

export function DetailPanel({ item, schema, onClose }: DetailPanelProps) {
  const open = item !== null

  return (
    <Dialog open={open} onClose={onClose} className="relative z-50">
      {/* Backdrop - lighter than modal to indicate parent is visible */}
      <div className="fixed inset-0 bg-black/20" aria-hidden="true" />

      {/* Panel container - positioned at right edge */}
      <div className="fixed inset-0 flex justify-end">
        <DialogPanel className="w-full max-w-2xl bg-surface text-text shadow-xl h-full overflow-y-auto">
          {/* Header with close button */}
          <div className="sticky top-0 bg-surface border-b border-border px-6 py-4 flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold">
              {getItemLabel(item, 'Item Details')}
            </DialogTitle>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
              aria-label="Close panel"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Panel content */}
          <div className="p-6">
            {item !== null && (
              <DynamicRenderer
                data={item}
                schema={schema}
                path="$.selected"
                depth={0}
              />
            )}
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  )
}
```

### Visual Field Grouping with Spacing Hierarchy
```typescript
// Source: Nielsen Norman Group - Form Design Best Practices

// Group fields by logical category with spacing hierarchy
function renderFieldGroups(fields: [string, FieldDefinition][], obj: Record<string, unknown>) {
  // Auto-detect groups (simplified - could be smarter based on field names)
  const primaryFields = fields.filter(([name]) => isPrimaryField(name))
  const contactFields = fields.filter(([name]) => /email|phone|address/.test(name.toLowerCase()))
  const metaFields = fields.filter(([name]) => /created|updated|modified|timestamp/.test(name.toLowerCase()))
  const otherFields = fields.filter(f =>
    !primaryFields.includes(f) && !contactFields.includes(f) && !metaFields.includes(f)
  )

  return (
    <div className="space-y-6">  {/* Between-group spacing: 24px */}

      {/* Primary info group */}
      {primaryFields.length > 0 && (
        <div className="space-y-3 pb-6 border-b border-gray-200">
          {primaryFields.map(([name, def]) => (
            <FieldRow key={name} fieldName={name} fieldDef={def} value={obj[name]} />
          ))}
        </div>
      )}

      {/* Contact details group */}
      {contactFields.length > 0 && (
        <div className="space-y-3 pb-6 border-b border-gray-200">
          <h3 className="text-xs uppercase tracking-wider text-gray-500 font-semibold">
            Contact Information
          </h3>
          {contactFields.map(([name, def]) => (
            <FieldRow key={name} fieldName={name} fieldDef={def} value={obj[name]} />
          ))}
        </div>
      )}

      {/* Other fields group */}
      {otherFields.length > 0 && (
        <div className="space-y-3 pb-6 border-b border-gray-200">
          {otherFields.map(([name, def]) => (
            <FieldRow key={name} fieldName={name} fieldDef={def} value={obj[name]} />
          ))}
        </div>
      )}

      {/* Metadata group - no bottom border since it's last */}
      {metaFields.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs uppercase tracking-wider text-gray-500 font-semibold">
            Metadata
          </h3>
          {metaFields.map(([name, def]) => (
            <FieldRow key={name} fieldName={name} fieldDef={def} value={obj[name]} />
          ))}
        </div>
      )}

    </div>
  )
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| JavaScript carousel libraries | CSS `scroll-snap-type` | ~2020-2021 | Native browser API eliminates bundle size, better mobile UX with native touch gestures |
| Float-based two-column layouts | CSS Grid with named template areas | ~2019-2020 | Simpler markup, easier responsive design, better maintainability |
| Media queries for responsive components | Container queries | 2023-2024 (emerging) | Components respond to their own size, not viewport; still early adoption in 2026 |
| Modal-only detail views | Modal + Drawer/Panel options | 2022-2024 | Drawer pattern less disruptive, allows comparison with parent content, better for dense data apps |
| Explicit fieldset grouping | Whitespace + Gestalt principles | Ongoing | User research (NNG 2020+) shows whitespace creates clearer boundaries with less visual noise |

**Deprecated/outdated:**
- **react-slick, swiper.js for horizontal scrolling**: CSS scroll-snap provides same UX natively, these libraries add unnecessary bundle size
- **Bootstrap grid system (12-column with row/col classes)**: CSS Grid is more flexible and doesn't require framework-specific markup
- **Explicit `<fieldset>` and `<legend>` for visual grouping**: Still semantic for forms, but overkill for read-only detail views; whitespace achieves same visual result

## Open Questions

Things that couldn't be fully resolved:

1. **Auto-detection of field groups for visual organization**
   - What we know: Can detect primary fields (name/title), contact fields (email/phone), metadata (timestamps)
   - What's unclear: Best heuristic for grouping arbitrary domain fields (e.g., product specs, user preferences)
   - Recommendation: Start with simple name-based detection (primary, contact, meta, other), allow manual override via FieldConfig in future phase

2. **Horizontal scroller indicator/controls**
   - What we know: CSS scroll-snap provides smooth scrolling, but no built-in pagination dots or next/prev buttons
   - What's unclear: Whether users need explicit indicators for horizontal scrollable areas
   - Recommendation: Start with visual cue (fade-out gradient at edges), add pagination dots if user testing shows confusion

3. **Panel width on desktop**
   - What we know: Common pattern is 50-67% of viewport width (400-800px)
   - What's unclear: Optimal width for data-dense detail views vs. simple detail views
   - Recommendation: Start with `max-w-2xl` (672px), make configurable in future if needed

4. **Breadcrumb vs. back button in detail views**
   - What we know: Breadcrumb shows full path, back button is simpler for single-level navigation
   - What's unclear: User preference in this specific app context (drilldown-heavy navigation)
   - Recommendation: Use breadcrumb for depth > 0, rely on header back button for depth = 0

5. **Nested array threshold for horizontal scroller vs. table**
   - What we know: Horizontal scroller works well for 2-10 items, tables work for 10+
   - What's unclear: Exact threshold, whether to auto-switch or user preference
   - Recommendation: Default to horizontal scroller for nested arrays, let user switch to table via component picker (existing Phase 6 infrastructure)

## Sources

### Primary (HIGH confidence)
- MDN CSS Scroll Snap - Basic Concepts: https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Scroll_snap/Basic_concepts
- MDN CSS Grid - Common Grid Layouts: https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Grid_layout/Common_grid_layouts
- Headless UI Dialog documentation: https://headlessui.com/react/dialog
- Tailwind CSS Grid utilities: https://tailwindcss.com/docs/grid-template-columns

### Secondary (MEDIUM confidence)
- Nielsen Norman Group - Form Design White Space: https://www.nngroup.com/articles/form-design-white-space/ (WebSearch verified pattern)
- Product detail page layout best practices 2026: https://scandiweb.com/blog/best-practices-for-product-detail-pages/ (Multiple sources agree)
- Modal vs Drawer UX patterns: https://medium.com/@ninad.kotasthane/modal-vs-drawer-when-to-use-the-right-component-af0a76b952da (Community consensus)
- CSS Tricks Grid Layout Guide: https://css-tricks.com/css-grid-layout-guide/ (Established reference)

### Tertiary (LOW confidence)
- React carousel library comparisons (2026 listings): General ecosystem awareness, not making specific library recommendations
- Visual hierarchy design principles: General UX principles, not specific technical implementation

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries already in use, CSS features are native and well-documented
- Architecture: HIGH - Patterns verified with MDN official docs, existing codebase provides structure
- Pitfalls: MEDIUM - Based on common issues documented in MDN/NNG, but not all tested in this specific codebase context
- Code examples: HIGH - Based on official documentation (MDN, Headless UI), adapted to existing project patterns

**Research date:** 2026-02-05
**Valid until:** ~60 days (CSS/browser features stable, React patterns slow-moving)
