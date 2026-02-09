# Phase 15: Smart Grouping & Visual Hierarchy - Research

**Researched:** 2026-02-08
**Domain:** Visual hierarchy typography, accordion-based grouping, hero-overview-sections layout
**Confidence:** HIGH

## Summary

This phase implements visual hierarchy styling and smart grouping UI for detail views, building on the importance scoring (Phase 13) and grouping analysis already completed. The research validates that vertical accordions are significantly more effective than horizontal tabs for field organization (8% content overlooked vs 27% for tabs per UX research), and confirms that the three-tier visual hierarchy (primary/secondary/tertiary) is the standard pattern used across modern design systems.

The core technical challenge is rendering grouped vs ungrouped views conditionally while maintaining the existing DetailRenderer architecture. The research shows that Headless UI's Disclosure component (already used in the project) is the right foundation for accordions, though it requires external state management for "expand all" / "collapse all" controls since the component doesn't expose its open state via props.

For the hero-overview-sections layout pattern, 2026 design trends show hero sections are treated as "layout systems" with deliberate composition establishing rhythm and hierarchy from the first screen. The pattern follows: hero image → primary fields (large/bold) → overview fields (two-column) → grouped sections (accordions) → metadata (de-emphasized).

**Primary recommendation:** Extend DetailRenderer with conditional grouped/ungrouped rendering controlled by toggle state. Use Headless UI Disclosure for accordion sections, implement visual hierarchy via Tailwind typography scale (text-lg/font-semibold for primary, text-sm/text-gray-600 for tertiary), and provide "Show all (ungrouped)" escape hatch as a simple toggle button.

## Standard Stack

This phase uses existing dependencies already in the project, primarily Headless UI for accordions and Tailwind CSS for visual hierarchy styling.

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @headlessui/react | 2.2.9 | Disclosure component for accordions | Already used in DetailRenderer for nested fields, provides accessible accordion primitives |
| Tailwind CSS | 4.1.18 | Typography scale and design tokens | Project standard, supports responsive breakpoints and semantic color tokens |
| React useState | 19.2.0 | Toggle state for grouped/ungrouped view | Standard React hook for local component state |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| class-variance-authority | 0.7.1 | Variant-based styling (if needed) | Already used in Badge component for semantic variants |
| clsx / tailwind-merge | 2.1.1 / 3.4.0 | Conditional className composition | Standard utilities in project |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Headless UI Disclosure | Radix UI Accordion | Radix not in project, would add dependency; Headless UI already proven in codebase |
| Manual accordion state | Controlled Disclosure via props | Headless UI Disclosure doesn't expose open state via props (known limitation), requires wrapper state |
| Tabs component | Keep horizontal tabs | UX research shows 27% content overlooked in tabs vs 8% for accordions |

**Installation:**
```bash
# No new dependencies needed - all libraries already in package.json
```

## Architecture Patterns

### Recommended Project Structure
```
src/components/
├── renderers/
│   ├── DetailRenderer.tsx        # Extend with grouped/ungrouped modes
│   └── DetailRendererGrouped.tsx # New: grouped view with accordions (optional split)
├── ui/
│   └── accordion.tsx             # Optional: shadcn/ui-style accordion wrapper
└── config/
    └── ViewModeToggle.tsx        # New: "Show all (ungrouped)" toggle button
```

### Pattern 1: Conditional Grouped/Ungrouped Rendering

**What:** Toggle between grouped view (with accordions) and flat ungrouped view based on user preference

**When to use:** When grouping analysis detects >8 fields with clear clusters AND user hasn't explicitly toggled to ungrouped view

**Example:**
```typescript
// src/components/renderers/DetailRenderer.tsx
import { useState } from 'react'
import { Disclosure, DisclosureButton, DisclosurePanel } from '@headlessui/react'

export function DetailRenderer({ data, schema, path, depth }: RendererProps) {
  const { getAnalysisCache } = useAppStore()
  const analysis = getAnalysisCache(path)

  // State: show grouped view or ungrouped view
  const [showGrouped, setShowGrouped] = useState(true)

  // Determine if grouping should be applied
  const shouldGroup = analysis?.grouping?.groups.length > 0 &&
                      allFields.length > 8 &&
                      showGrouped

  if (shouldGroup) {
    return <DetailViewGrouped
      groups={analysis.grouping.groups}
      ungrouped={analysis.grouping.ungrouped}
      onToggleGrouping={() => setShowGrouped(false)}
    />
  }

  // Existing flat rendering with visual hierarchy
  return <DetailViewFlat fields={allFields} importance={analysis.importance} />
}
```

### Pattern 2: Visual Hierarchy Typography

**What:** Apply three-tier typography styling (primary/secondary/tertiary) based on importance scores from Phase 13

**When to use:** For all field rendering in detail views, both grouped and ungrouped modes

**Example:**
```typescript
// Visual hierarchy based on ImportanceTier
function getFieldStyles(tier: ImportanceTier) {
  switch (tier) {
    case 'primary':
      return {
        label: 'text-base font-semibold text-gray-700',
        value: 'text-lg font-semibold text-gray-900'
      }
    case 'secondary':
      return {
        label: 'text-sm font-medium text-gray-600',
        value: 'text-base text-gray-800'
      }
    case 'tertiary':
      return {
        label: 'text-xs font-medium text-gray-500',
        value: 'text-sm text-gray-600'
      }
  }
}

// Usage in field rendering
const importance = analysis.importance.get(fieldPath)
const tier = importance?.tier || 'secondary'
const styles = getFieldStyles(tier)

return (
  <div className="grid grid-cols-[auto_1fr] gap-x-3">
    <div className={styles.label}>{displayLabel}:</div>
    <div className={styles.value}>
      <PrimitiveRenderer data={value} schema={fieldDef.type} />
    </div>
  </div>
)
```

### Pattern 3: Accordion Sections with Headless UI

**What:** Render field groups as collapsible accordion sections using Disclosure component

**When to use:** When grouped view is active and groups are detected

**Example:**
```typescript
// src/components/renderers/DetailViewGrouped.tsx
function GroupedSection({ group, fields, importance }: GroupedSectionProps) {
  return (
    <Disclosure defaultOpen={true}>
      {({ open }) => (
        <>
          <DisclosureButton className="flex items-center justify-between w-full px-4 py-3 text-left text-sm font-medium text-gray-900 bg-gray-50 hover:bg-gray-100 rounded-lg">
            <span>{group.label}</span>
            <ChevronIcon open={open} />
          </DisclosureButton>
          <DisclosurePanel className="px-4 py-3 space-y-3">
            {group.fields.map(field => (
              <FieldRow
                key={field.path}
                field={field}
                importance={importance.get(field.path)}
              />
            ))}
          </DisclosurePanel>
        </>
      )}
    </Disclosure>
  )
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      className={`w-5 h-5 transition-transform ${open ? 'rotate-180' : ''}`}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  )
}
```

### Pattern 4: Hero + Overview + Sections Layout

**What:** Three-tier detail view layout: hero image at top, primary/secondary fields in overview, tertiary/grouped in sections below

**When to use:** For detail views with hero image and >8 fields

**Example:**
```typescript
function DetailViewWithHero({ heroImage, fields, groups }: Props) {
  return (
    <div className="space-y-6">
      {/* Hero */}
      {heroImage && (
        <img
          src={heroImage}
          alt="Hero"
          className="w-full max-h-96 object-cover rounded-lg"
        />
      )}

      {/* Overview: Primary + Secondary fields in two-column grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
        {primaryFields.map(renderField)}
        {secondaryFields.map(renderField)}
      </div>

      {/* Sections: Grouped tertiary fields in accordions */}
      <div className="space-y-3">
        {groups.map(group => <GroupedSection key={group.label} group={group} />)}
        {ungroupedTertiaryFields.map(renderField)}
      </div>
    </div>
  )
}
```

### Pattern 5: "Show All" Escape Hatch

**What:** Toggle button to switch between grouped and ungrouped views

**When to use:** Always present when grouped view is active, provides user control

**Example:**
```typescript
function ViewModeToggle({ showGrouped, onToggle }: Props) {
  return (
    <button
      onClick={onToggle}
      className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
    >
      {showGrouped ? (
        <>
          <ListIcon className="w-4 h-4" />
          Show all (ungrouped)
        </>
      ) : (
        <>
          <LayersIcon className="w-4 h-4" />
          Show grouped
        </>
      )}
    </button>
  )
}
```

### Anti-Patterns to Avoid

- **Deep nesting beyond two levels:** Limit to two-level grouping maximum (hero → sections → fields), avoid nested accordions within accordions
- **All panels closed by default:** At least one section should be open initially for discoverability
- **No escape hatch:** Always provide "show all ungrouped" toggle, never force grouping
- **Tabs for many sections:** Use accordions not tabs when >4 groups (tabs hide content)
- **Inconsistent open/close controls:** Use standard chevron icons that rotate on open

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Accessible accordion | Custom collapsible divs with onClick | Headless UI Disclosure | Handles aria-expanded, aria-controls, keyboard navigation, focus management automatically |
| Expand all / Collapse all | Complex state tree for each panel | Controlled state with panel IDs array | Headless UI requires external state for coordinated panels |
| Visual hierarchy variants | Inline conditional className strings | class-variance-authority (cva) | Type-safe variants, already used in Badge component |
| Chevron rotation animation | CSS transitions on transform | Tailwind transition-transform with conditional rotation class | Built-in, performant, matches project patterns |

**Key insight:** Accordion accessibility is complex (ARIA attributes, keyboard navigation, focus management). Headless UI provides all accessibility primitives while remaining unstyled. Don't attempt custom accordion implementation.

## Common Pitfalls

### Pitfall 1: Uncontrolled Disclosure State Coordination

**What goes wrong:** Multiple Disclosure components can't share state for "expand all" / "collapse all" because Disclosure doesn't expose open state via props

**Why it happens:** Headless UI's Disclosure is uncontrolled by design - each manages its own open state internally

**How to avoid:**
- Track which sections are expanded in parent state: `const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['section-1']))`
- Use Disclosure's `defaultOpen` prop with key remounting to force state updates
- Alternative: Build custom controlled accordion using Headless UI's lower-level primitives

**Warning signs:** "Expand all" button doesn't affect accordion panels, or panels reset when parent re-renders

### Pitfall 2: Over-Grouping with Too Few Fields

**What goes wrong:** Creating groups with only 1-2 fields creates orphan sections that add cognitive load instead of reducing it

**Why it happens:** Grouping algorithm detects semantic clusters without checking minimum field count

**How to avoid:** Apply grouping only when:
- Total fields >8 (Phase 13 decision)
- Each group has >=3 fields (no orphan sections)
- <20% fields ungrouped (avoid one huge "Other" section)

**Warning signs:** Accordion with single field, user feedback "too many sections"

### Pitfall 3: Losing Context in Deep Nesting

**What goes wrong:** Users lose track of where they are when drilling into nested accordions

**Why it happens:** Multiple levels of collapse/expand make navigation non-linear

**How to avoid:**
- Maximum two-level grouping: hero/overview → sections → fields (never sections → subsections → fields)
- Avoid nested accordions (accordion inside DisclosurePanel of another accordion)
- Use breadcrumb for drilldown instead of nested accordions

**Warning signs:** Users repeatedly open/close panels to find information, confusion about content location

### Pitfall 4: Inconsistent Visual Hierarchy

**What goes wrong:** Primary fields styled as tertiary in some contexts, inconsistent importance across grouped/ungrouped views

**Why it happens:** Rendering logic duplicated between grouped and ungrouped branches, importance tier not consistently applied

**How to avoid:**
- Extract field rendering to shared component: `<FieldRow field={field} importance={tier} />`
- Use getFieldStyles() helper consistently in all rendering modes
- Test that same field has same styling in grouped vs ungrouped view

**Warning signs:** Field changes visual prominence when toggling grouped mode

### Pitfall 5: No Escape Hatch for Auto-Grouping

**What goes wrong:** Users trapped in grouped view even when grouping doesn't make sense for their use case

**Why it happens:** Developer assumes grouping is always better, no UI control to disable

**How to avoid:**
- Always render "Show all (ungrouped)" toggle when grouped view active
- Store preference in component state (or configStore for persistence)
- Default to grouped but make ungrouped easily accessible

**Warning signs:** User complaints about "can't see all fields at once", confusion about field location

## Code Examples

Verified patterns from official sources and existing codebase:

### Disclosure with External State Control

```typescript
// Source: Headless UI docs + React state management
function ControlledAccordions() {
  // Track expanded sections by ID
  const [expanded, setExpanded] = useState<Set<string>>(
    new Set(['overview']) // First section open by default
  )

  const toggleSection = (id: string) => {
    setExpanded(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const expandAll = () => setExpanded(new Set(['overview', 'details', 'metadata']))
  const collapseAll = () => setExpanded(new Set())

  return (
    <div className="space-y-2">
      <div className="flex gap-2 mb-4">
        <button onClick={expandAll}>Expand All</button>
        <button onClick={collapseAll}>Collapse All</button>
      </div>

      {sections.map(section => (
        <Disclosure
          key={section.id}
          // Force re-render when expanded set changes via key
          // or use defaultOpen with manual panel content toggling
        >
          <DisclosureButton onClick={() => toggleSection(section.id)}>
            {section.label}
          </DisclosureButton>
          {expanded.has(section.id) && (
            <DisclosurePanel static>
              {section.content}
            </DisclosurePanel>
          )}
        </Disclosure>
      ))}
    </div>
  )
}
```

### Visual Hierarchy with CVA (Optional Enhancement)

```typescript
// Source: class-variance-authority docs (already used in Badge)
import { cva, type VariantProps } from "class-variance-authority"

const fieldStyles = cva(
  "grid grid-cols-[auto_1fr] gap-x-3 items-baseline", // base
  {
    variants: {
      importance: {
        primary: "py-2",
        secondary: "py-1",
        tertiary: "py-0.5 opacity-80"
      }
    },
    defaultVariants: {
      importance: "secondary"
    }
  }
)

const labelStyles = cva(
  "font-medium whitespace-nowrap",
  {
    variants: {
      importance: {
        primary: "text-base font-semibold text-gray-700",
        secondary: "text-sm text-gray-600",
        tertiary: "text-xs text-gray-500"
      }
    }
  }
)

const valueStyles = cva(
  "min-w-0",
  {
    variants: {
      importance: {
        primary: "text-lg font-semibold text-gray-900",
        secondary: "text-base text-gray-800",
        tertiary: "text-sm text-gray-600"
      }
    }
  }
)

// Usage
function FieldRow({ field, tier }: { field: FieldInfo; tier: ImportanceTier }) {
  return (
    <div className={fieldStyles({ importance: tier })}>
      <div className={labelStyles({ importance: tier })}>{field.name}:</div>
      <div className={valueStyles({ importance: tier })}>{field.value}</div>
    </div>
  )
}
```

### Grouped vs Ungrouped Toggle

```typescript
// Source: React state management patterns + project conventions
function DetailRenderer({ data, schema, path }: RendererProps) {
  const analysis = useAppStore(state => state.getAnalysisCache(path))
  const [viewMode, setViewMode] = useState<'grouped' | 'ungrouped'>('grouped')

  // Check if grouping is beneficial
  const shouldAllowGrouping =
    analysis?.grouping.groups.length > 0 &&
    allFields.length > 8 &&
    analysis.grouping.groups.every(g => g.fields.length >= 3)

  return (
    <div className="space-y-4">
      {shouldAllowGrouping && (
        <div className="flex justify-end">
          <button
            onClick={() => setViewMode(mode =>
              mode === 'grouped' ? 'ungrouped' : 'grouped'
            )}
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            {viewMode === 'grouped' ? '📋 Show all (ungrouped)' : '📁 Show grouped'}
          </button>
        </div>
      )}

      {viewMode === 'grouped' && shouldAllowGrouping ? (
        <GroupedView groups={analysis.grouping.groups} />
      ) : (
        <UngroupedView fields={allFields} />
      )}
    </div>
  )
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Horizontal tabs for sections | Vertical accordions | 2020s UX research | 8% vs 27% content overlooked, better mobile UX |
| Fixed visual hierarchy | Dynamic importance-based styling | 2024+ design systems | Content-aware emphasis, better scanning |
| All-or-nothing grouping | Escape hatch toggle | 2025+ accessibility guidelines | User control, prevents trapped states |
| Manual ARIA attributes | Headless UI primitives | 2021+ | Automatic accessibility, fewer bugs |

**Deprecated/outdated:**
- Horizontal tabs for field organization: UX research shows 27% content overlooked vs 8% for accordions
- More than two-level nesting: Accessibility research shows cognitive load increases sharply beyond two levels
- Forced grouping without escape: WCAG 2.2 emphasizes user control and multiple pathways to content

## Open Questions

Things that couldn't be fully resolved:

1. **Grouping threshold validation**
   - What we know: Phase 13 uses >8 fields threshold and >=3 fields per group
   - What's unclear: Real-world validation pending Phase 15 UAT
   - Recommendation: Start with conservative thresholds, add telemetry to measure effectiveness

2. **Expand all / Collapse all necessity**
   - What we know: Some accordion libraries provide this, UX value unclear
   - What's unclear: User testing needed to validate whether "expand all" is used
   - Recommendation: Implement in Phase 15, track usage, remove if unused

3. **Persistent grouping preference**
   - What we know: Component state works for session
   - What's unclear: Should preference persist across sessions in configStore?
   - Recommendation: Start with session-only state, add persistence if users frequently toggle

4. **Two-column grid for ungrouped view**
   - What we know: DetailRenderer currently uses md:grid-cols-2 for two-column
   - What's unclear: Should grouped view also use two-column within sections?
   - Recommendation: Single column within accordion sections for clarity, two-column only for overview

## Sources

### Primary (HIGH confidence)
- [Headless UI Disclosure - Official Documentation](https://headlessui.com/react/disclosure) - Disclosure component API, accessibility features, state management patterns
- [React Documentation - Conditional Rendering](https://react.dev/learn/conditional-rendering) - Standard patterns for conditional view rendering
- [Tailwind CSS Best Practices 2025-2026](https://www.frontendtools.tech/blog/tailwind-css-best-practices-design-system-patterns) - Design tokens, semantic colors, typography hierarchy
- [Tailwind CSS Theme Variables](https://tailwindcss.com/docs/theme) - CSS variables and design token system

### Secondary (MEDIUM confidence)
- [Designing Effective Accordion UIs - LogRocket](https://blog.logrocket.com/ux-design/accordion-ui-design/) - Accordion best practices, nesting limits, accessibility
- [Tabs vs Accordions UX - NN/G](https://www.nngroup.com/videos/tabs-vs-accordions/) - Nielsen Norman Group research on tabs vs accordions (27% vs 8% overlooked)
- [Little Details in UX: Tabs vs Accordions - UX Collective](https://uxdesign.cc/little-things-in-ux-design-part-1-tabs-v-s-accordions-47390e4910c3) - Content suitability, space efficiency patterns
- [Typography in Design Systems - EightShapes](https://medium.com/eightshapes-llc/typography-in-design-systems-6ed771432f1e) - Three-level typographic hierarchy (primary/secondary/tertiary)
- [Every Design Needs Three Levels - Design Shack](https://designshack.net/articles/typography/every-design-needs-three-levels-of-typographic-hierarchy/) - Three-tier visual hierarchy standard
- [Sharing State Between Components - React](https://react.dev/learn/sharing-state-between-components) - Lifting state up for coordinated components
- [Nested Tab UI Design Guidelines](https://www.designmonks.co/blog/nested-tab-ui) - Avoid deep nesting beyond two levels
- [Stunning Hero Sections 2026 - Lexington Themes](https://lexingtonthemes.com/blog/stunning-hero-sections-2026) - Hero section as layout system pattern

### Tertiary (LOW confidence)
- Web search results on form field grouping thresholds (no specific consensus found, using Phase 13 user decision)
- Community discussions on Headless UI Disclosure state management limitations (GitHub issues #433, #475, #589)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries already in project, Headless UI proven in DetailRenderer
- Architecture: HIGH - Patterns verified in official docs, existing code follows same conventions
- Pitfalls: HIGH - Based on documented Headless UI limitations and UX research findings
- Grouping thresholds: MEDIUM - Phase 13 user decisions validated conceptually but need real-world UAT

**Research date:** 2026-02-08
**Valid until:** 30 days (stable domain - design patterns change slowly)

**Key findings:**
1. Vertical accordions significantly outperform horizontal tabs (8% vs 27% content overlooked)
2. Three-tier visual hierarchy (primary/secondary/tertiary) is design system standard
3. Headless UI Disclosure requires external state for coordinated "expand all" / "collapse all"
4. Two-level grouping maximum prevents cognitive overload (hero → sections → fields)
5. "Show all ungrouped" escape hatch is critical for user control and accessibility
