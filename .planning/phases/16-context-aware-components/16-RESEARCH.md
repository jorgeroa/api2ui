# Phase 16: Context-Aware Components - Research

**Researched:** 2026-02-09
**Domain:** React component rendering with semantic-aware display
**Confidence:** HIGH

## Summary

Phase 16 implements specialized rendering for detected semantic types (status, tags, ratings, prices, dates) by enhancing the existing PrimitiveRenderer component with context-aware formatting. The architecture already supports semantic detection (Phase 12), field importance (Phase 13), and component selection (Phase 14), so this phase focuses purely on visual presentation enhancements.

The standard approach uses native browser APIs (Intl.NumberFormat, Intl.DateTimeFormat) for internationalization, simple inline components for badges and chips (no external libraries needed beyond existing shadcn/ui), and Unicode stars for ratings. This approach maintains the zero-dependency philosophy while providing professional, accessible UI components.

User decisions from CONTEXT.md define specific requirements: semantic color mapping for status badges (green/red/yellow/gray), pill-shaped badge design, star ratings with half-star precision, currency detection via sibling fields, locale-aware formatting via navigator.language, absolute-only date formatting (no relative dates), monochrome tag chips with copy-on-click, and truncation with "+N more" expansion.

**Primary recommendation:** Extend PrimitiveRenderer with semantic-aware branches that render specialized components (StatusBadge, TagChips, StarRating, CurrencyValue, FormattedDate) when high-confidence semantic metadata is available in the analysis cache. All components should be inline, use existing shadcn/ui Badge for status, native Intl APIs for formatting, and Unicode for star ratings.

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | ^19.2.0 | UI framework | Already in use (existing) |
| Intl.NumberFormat | Native | Currency/number formatting | Zero-dependency, locale-aware, browser-native API |
| Intl.DateTimeFormat | Native | Date/time formatting | Zero-dependency, locale-aware, browser-native API |
| shadcn/ui Badge | Existing | Status badge component | Already installed, customizable variants |
| sonner | ^2.0.7 | Toast notifications | Already installed, for copy-to-clipboard feedback |
| Tailwind CSS | ^4.1.18 | Styling | Already in use (existing) |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| lucide-react | ^0.563.0 | Icon library | Already in use - for check/X icons in boolean badges |
| class-variance-authority | ^0.7.1 | Variant management | Already in use - for badge color variants |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Unicode stars (★) | react-rating library | Unicode is zero-dependency but less customizable; react-rating adds 15kb bundle size |
| Inline badge component | Separate StatusBadge library | Inline keeps code simple; external library adds dependency |
| Native Intl APIs | date-fns/currency.js | Native APIs are zero-dependency; libraries offer more features but add bundle size |

**Installation:**
```bash
# No new installations needed - all dependencies already present
# Phase uses existing: React, Tailwind CSS, shadcn/ui Badge, sonner
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── components/
│   ├── renderers/
│   │   ├── PrimitiveRenderer.tsx       # Enhanced with semantic branches
│   │   ├── semantic/                   # NEW: Semantic component directory
│   │   │   ├── StatusBadge.tsx         # Status badge with semantic colors
│   │   │   ├── TagChips.tsx            # Tag chips with copy-on-click
│   │   │   ├── StarRating.tsx          # Star rating display
│   │   │   ├── CurrencyValue.tsx       # Currency formatting
│   │   │   └── FormattedDate.tsx       # Date/time formatting
├── services/
│   ├── semantic/                       # Existing - detection patterns
│   └── analysis/                       # Existing - importance & grouping
├── hooks/
│   └── useSchemaAnalysis.ts            # Existing - populates cache
└── store/
    └── appStore.ts                     # Existing - analysis cache
```

### Pattern 1: Semantic-Aware Rendering

**What:** PrimitiveRenderer checks analysis cache for semantic metadata, then renders specialized component when high-confidence (>=0.75) semantic type detected.

**When to use:** When rendering primitive values (string, number, boolean) in detail views where semantic metadata is available.

**Example:**
```typescript
// Source: Phase 16 design pattern
export function PrimitiveRenderer({ data, schema, path }: RendererProps) {
  const { getAnalysisCache } = useAppStore()

  // Check for semantic metadata in cache
  const cached = getAnalysisCache(normalizePath(path))
  const semantics = cached?.semantics?.get(path)

  // Render semantic component if high confidence
  if (semantics && semantics.level === 'high') {
    switch (semantics.detectedCategory) {
      case 'status':
        return <StatusBadge value={data as string} />
      case 'tags':
        return <TagChips tags={data as string[]} />
      case 'rating':
        return <StarRating value={data as number} />
      case 'price':
        return <CurrencyValue amount={data} path={path} />
      case 'date':
      case 'timestamp':
        return <FormattedDate value={data} />
    }
  }

  // Fallback to existing rendering logic
  // ... existing code ...
}
```

### Pattern 2: Sibling Field Currency Detection

**What:** For price fields, detect currency by looking for sibling fields (currency_code, currency) in the same object.

**When to use:** When rendering price/amount fields with semantic category 'price'.

**Example:**
```typescript
// Source: Phase 16 currency detection pattern
function detectCurrency(path: string, data: unknown): string {
  // Extract parent path (e.g., $.product.price -> $.product)
  const pathParts = path.split('.')
  const parentPath = pathParts.slice(0, -1).join('.')

  // Navigate to parent object
  const parent = getValueAtPath(data, parentPath)
  if (!parent || typeof parent !== 'object') return 'USD'

  // Check for currency_code, currency, currency_id fields
  const obj = parent as Record<string, unknown>
  const currencyCode = obj.currency_code || obj.currency || obj.currency_id

  if (typeof currencyCode === 'string' && /^[A-Z]{3}$/.test(currencyCode)) {
    return currencyCode
  }

  return 'USD' // Fallback
}
```

### Pattern 3: Semantic Color Mapping

**What:** Map status values to semantic colors using keyword patterns.

**When to use:** When rendering status/state fields as badges.

**Example:**
```typescript
// Source: User decision from CONTEXT.md + React Spectrum standards
function getStatusVariant(value: string): 'success' | 'destructive' | 'warning' | 'secondary' {
  const normalized = value.toLowerCase().trim()

  // Positive states (green)
  if (/^(active|success|published|verified|approved|complete|enabled|paid|delivered)$/i.test(normalized)) {
    return 'success'
  }

  // Negative states (red)
  if (/^(error|failed|deleted|banned|rejected|cancelled|inactive|disabled)$/i.test(normalized)) {
    return 'destructive'
  }

  // In-progress states (yellow/orange)
  if (/^(pending|processing|review|scheduled|syncing|indexing)$/i.test(normalized)) {
    return 'warning'
  }

  // Neutral/unknown (gray)
  return 'secondary'
}
```

### Pattern 4: Locale-Aware Formatting

**What:** Use navigator.language for Intl API locale parameter to respect user's browser locale.

**When to use:** When formatting currency or dates.

**Example:**
```typescript
// Source: MDN Intl.NumberFormat + Intl.DateTimeFormat docs
function formatCurrency(amount: number, currencyCode: string): string {
  try {
    return new Intl.NumberFormat(navigator.language, {
      style: 'currency',
      currency: currencyCode,
    }).format(amount)
  } catch {
    // Fallback if currency code invalid
    return new Intl.NumberFormat(navigator.language, {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }
}

function formatDate(value: string | Date, showTime: boolean): string {
  const date = typeof value === 'string' ? new Date(value) : value

  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }

  if (showTime) {
    options.hour = '2-digit'
    options.minute = '2-digit'
  }

  return new Intl.DateTimeFormat(navigator.language, options).format(date)
}
```

### Pattern 5: Tag Chip Truncation with Expansion

**What:** Show limited number of chips with "+N more" link that expands to show all.

**When to use:** When rendering tag arrays with many items.

**Example:**
```typescript
// Source: Common UX pattern from Material UI Chip documentation
function TagChips({ tags, maxVisible = 5 }: { tags: string[]; maxVisible?: number }) {
  const [expanded, setExpanded] = useState(false)
  const visibleTags = expanded ? tags : tags.slice(0, maxVisible)
  const hiddenCount = tags.length - maxVisible

  return (
    <div className="flex flex-wrap gap-1.5">
      {visibleTags.map((tag, idx) => (
        <TagChip key={idx} value={tag} />
      ))}
      {!expanded && hiddenCount > 0 && (
        <button
          onClick={() => setExpanded(true)}
          className="text-sm text-blue-600 hover:underline"
        >
          +{hiddenCount} more
        </button>
      )}
    </div>
  )
}
```

### Anti-Patterns to Avoid

- **Don't recreate Intl formatters on every render:** Memoize Intl.NumberFormat and Intl.DateTimeFormat instances or use useMemo to avoid re-creating on every render
- **Don't use relative dates in this phase:** User decision defers relative dates ("2 days ago") to future configuration phase
- **Don't render semantic components for low-confidence detections:** Only render when semantics.level === 'high' (confidence >= 0.75)
- **Don't add color semantics to tag chips:** User decision specifies monochrome/neutral chips (all same color)
- **Don't hardcode currency symbols:** Use Intl.NumberFormat with detected currency code instead of hardcoding $ or €

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Half-star rendering | Custom SVG clipping logic | Unicode ★/☆ + CSS for half | Unicode stars are simple and performant; SVG adds complexity |
| Currency formatting | Custom regex/string manipulation | Intl.NumberFormat | Handles locale-specific formatting (1.234,50 in Germany, 1,234.50 in US), currency symbols, decimal places |
| Date formatting | Manual date string manipulation | Intl.DateTimeFormat | Handles locale formats (DD/MM/YYYY vs MM/DD/YYYY), month names, 12/24 hour clock |
| Copy to clipboard | Manual document.execCommand | navigator.clipboard API + sonner toast | Modern API with promise support, existing toast system for feedback |
| Status color mapping | Large switch statement | Pattern matching with regex | Extensible, handles variations (e.g., "ACTIVE" vs "active"), easier to maintain |

**Key insight:** Browser-native Intl APIs handle internationalization edge cases (currency symbols, decimal separators, date formats, time zones) that custom implementations miss. Using these APIs ensures professional, locale-aware display without adding dependencies.

## Common Pitfalls

### Pitfall 1: Intl API Throws on Invalid Currency Codes

**What goes wrong:** Intl.NumberFormat throws error if currency code is invalid (e.g., "XXX", "usd" lowercase).

**Why it happens:** Currency detection may extract non-standard values from API data (placeholder codes, typos).

**How to avoid:** Wrap Intl.NumberFormat in try/catch with fallback to USD. Validate currency code format (/^[A-Z]{3}$/) before passing to Intl.

**Warning signs:** Error in console: "RangeError: Invalid currency code", currency fields showing "undefined".

### Pitfall 2: Path Normalization for Drill-Down

**What goes wrong:** Semantic metadata stored with generic path ($.items[].price) but drill-down uses indexed path ($.items[0].price), cache lookup fails.

**Why it happens:** Analysis runs once on schema (generic paths), but rendering happens per item (indexed paths).

**How to avoid:** Use normalizePath helper (existing from Phase 15) to convert indexed paths to generic before cache lookup: `path.replace(/\[\d+\]/g, '[]')`.

**Warning signs:** Semantic rendering works for array-of-objects view but not in detail drill-down view.

### Pitfall 3: Boolean Fields Not Detected as Status

**What goes wrong:** Boolean fields (is_active, enabled) render as green "true" / gray "false" instead of semantic badges.

**Why it happens:** Semantic detection only runs for string status fields, booleans are detected as type 'boolean' not category 'status'.

**How to avoid:** Add boolean badge rendering in PrimitiveRenderer boolean branch, map field name patterns (is_*, has_*, enabled, active, verified) to badge display.

**Warning signs:** User sees "true" text instead of "Active" badge for is_active fields.

### Pitfall 4: Time Component Detection Ambiguity

**What goes wrong:** ISO date strings (2026-02-09) and ISO timestamps (2026-02-09T14:30:00Z) both detected as 'date' category, but user wants time shown for timestamps.

**Why it happens:** Semantic detection may not distinguish between date-only and date-time formats.

**How to avoid:** In FormattedDate component, parse the string value and check if it includes 'T' or time components, show time conditionally.

**Warning signs:** Timestamp fields showing only date without time (e.g., "Feb 9, 2026" instead of "Feb 9, 2026, 2:30 PM").

### Pitfall 5: Tag Chip Expansion State Lost on Re-render

**What goes wrong:** User expands tag chips to show all, parent re-renders, expansion state resets to collapsed.

**Why it happens:** Local useState in TagChips component doesn't persist across re-renders.

**How to avoid:** For most use cases, local state is fine (expected behavior). If persistence needed, lift state to parent or use session storage.

**Warning signs:** User reports "tags keep collapsing" after interacting with page.

## Code Examples

Verified patterns from official sources and user decisions:

### Status Badge with Semantic Colors

```typescript
// Source: User decision from CONTEXT.md + shadcn/ui Badge API
import { Badge } from '@/components/ui/badge'
import { Check, X } from 'lucide-react'

interface StatusBadgeProps {
  value: string | boolean
}

export function StatusBadge({ value }: StatusBadgeProps) {
  // Handle boolean fields
  if (typeof value === 'boolean') {
    return (
      <Badge variant={value ? 'success' : 'secondary'}>
        {value ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
        {value ? 'True' : 'False'}
      </Badge>
    )
  }

  const normalized = value.toLowerCase().trim()

  // Semantic color mapping
  let variant: 'success' | 'destructive' | 'warning' | 'secondary' = 'secondary'

  if (/^(active|success|published|verified|approved|complete|enabled)$/i.test(normalized)) {
    variant = 'success'
  } else if (/^(error|failed|deleted|banned|rejected|cancelled)$/i.test(normalized)) {
    variant = 'destructive'
  } else if (/^(pending|processing|review|scheduled|syncing)$/i.test(normalized)) {
    variant = 'warning'
  }

  return (
    <Badge variant={variant}>
      {value}
    </Badge>
  )
}
```

### Star Rating Display with Half Stars

```typescript
// Source: Unicode star symbols + half-star precision from user decision
interface StarRatingProps {
  value: number
  max?: number
}

export function StarRating({ value, max = 5 }: StarRatingProps) {
  const clamped = Math.min(max, Math.max(0, value))
  const fullStars = Math.floor(clamped)
  const hasHalf = (clamped - fullStars) >= 0.5
  const emptyStars = max - fullStars - (hasHalf ? 1 : 0)

  return (
    <span className="inline-flex items-center gap-0.5" title={`${value} out of ${max}`}>
      {Array.from({ length: fullStars }, (_, i) => (
        <span key={`full-${i}`} className="text-yellow-400 text-base">★</span>
      ))}
      {hasHalf && <span className="text-yellow-300 text-base">★</span>}
      {Array.from({ length: emptyStars }, (_, i) => (
        <span key={`empty-${i}`} className="text-gray-300 text-base">☆</span>
      ))}
      <span className="text-xs text-gray-600 ml-1.5">({value.toFixed(1)})</span>
    </span>
  )
}
```

### Currency Formatting with Sibling Detection

```typescript
// Source: User decision + Intl.NumberFormat MDN docs
import { useAppStore } from '@/store/appStore'

interface CurrencyValueProps {
  amount: number | string
  path: string
}

export function CurrencyValue({ amount, path }: CurrencyValueProps) {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount

  // Detect currency from sibling fields
  const currencyCode = detectCurrency(path, useAppStore.getState().data)

  const formatted = new Intl.NumberFormat(navigator.language, {
    style: 'currency',
    currency: currencyCode,
  }).format(numAmount)

  return <span>{formatted}</span>
}

function detectCurrency(path: string, data: unknown): string {
  const pathParts = path.split('.')
  const fieldName = pathParts.pop() // Remove price field
  const parentPath = pathParts.join('.')

  // Navigate to parent object
  let current: any = data
  for (const part of pathParts) {
    if (!current || typeof current !== 'object') return 'USD'

    // Handle array indexing
    if (part.includes('[')) {
      const [arrName, indexStr] = part.split('[')
      const index = parseInt(indexStr.replace(']', ''))
      current = current[arrName]?.[index]
    } else {
      current = current[part]
    }
  }

  if (!current || typeof current !== 'object') return 'USD'

  // Look for currency fields
  const currencyCode = current.currency_code || current.currency || current.currency_id

  if (typeof currencyCode === 'string' && /^[A-Z]{3}$/.test(currencyCode)) {
    return currencyCode
  }

  return 'USD'
}
```

### Locale-Aware Date Formatting

```typescript
// Source: User decision (absolute only, show time when present) + Intl.DateTimeFormat MDN docs
interface FormattedDateProps {
  value: string | Date
}

export function FormattedDate({ value }: FormattedDateProps) {
  const date = typeof value === 'string' ? new Date(value) : value

  if (isNaN(date.getTime())) {
    return <span className="text-gray-400 italic">Invalid date</span>
  }

  // Detect if time component present (ISO string includes 'T')
  const hasTime = typeof value === 'string' && value.includes('T')

  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }

  if (hasTime) {
    options.hour = '2-digit'
    options.minute = '2-digit'
  }

  const formatted = new Intl.DateTimeFormat(navigator.language, options).format(date)

  return <span title={typeof value === 'string' ? value : date.toISOString()}>{formatted}</span>
}
```

### Tag Chips with Copy-on-Click and Truncation

```typescript
// Source: User decision (monochrome, copy-on-click, +N more) + sonner toast
import { toast } from 'sonner'
import { useState } from 'react'

interface TagChipsProps {
  tags: string[]
  maxVisible?: number
}

export function TagChips({ tags, maxVisible = 5 }: TagChipsProps) {
  const [expanded, setExpanded] = useState(false)

  const visibleTags = expanded ? tags : tags.slice(0, maxVisible)
  const hiddenCount = tags.length - maxVisible

  const handleCopy = async (tag: string) => {
    try {
      await navigator.clipboard.writeText(tag)
      toast.success('Copied to clipboard')
    } catch (err) {
      toast.error('Failed to copy')
    }
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {visibleTags.map((tag, idx) => (
        <button
          key={idx}
          onClick={() => handleCopy(tag)}
          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors cursor-pointer"
          title="Click to copy"
        >
          {tag}
        </button>
      ))}
      {!expanded && hiddenCount > 0 && (
        <button
          onClick={() => setExpanded(true)}
          className="inline-flex items-center px-2.5 py-0.5 text-xs font-medium text-blue-600 hover:underline"
        >
          +{hiddenCount} more
        </button>
      )}
    </div>
  )
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| toLocaleString() | Intl.NumberFormat | ECMAScript 2012+ | More control over currency display, explicit currency codes |
| Custom date parsing | Intl.DateTimeFormat | ECMAScript 2012+ | Locale-aware month names, date order (DD/MM vs MM/DD) |
| Font-based star icons | Unicode ★/☆ or SVG | 2020+ | Unicode is simpler and zero-dependency; SVG for more control |
| document.execCommand('copy') | navigator.clipboard API | Chrome 63+ (2017) | Promise-based, better security, works in modern browsers |
| External badge libraries | Inline badge components | 2024+ React trends | Reduced bundle size, easier customization, no version conflicts |

**Deprecated/outdated:**
- **document.execCommand('copy')**: Deprecated in favor of navigator.clipboard.writeText() - use modern API
- **toLocaleString() for currency**: Replaced by Intl.NumberFormat({ style: 'currency' }) for better control
- **react-rating libraries for display-only**: Overkill for non-interactive star display - Unicode stars sufficient
- **Relative date libraries (date-fns, moment.js)**: Not needed for Phase 16 - user deferred relative dates to future phase

## Open Questions

1. **Status badge color customization**
   - What we know: User defined semantic mapping (green/red/yellow/gray), exact hex values are Claude's discretion
   - What's unclear: Should we match shadcn/ui theme colors exactly or use custom shades for better contrast?
   - Recommendation: Use shadcn/ui Badge variants (success/destructive/warning/secondary) for consistency with existing UI theme

2. **Tag chip truncation threshold**
   - What we know: User wants "+N more" expand link when many tags
   - What's unclear: What is "many"? 5 tags? 10 tags? Should it be configurable?
   - Recommendation: Start with maxVisible={5} as default, can make configurable later if needed

3. **Star icon implementation choice**
   - What we know: User wants half-star precision support
   - What's unclear: Unicode (★/☆) vs SVG gradient vs icon library (lucide-react)?
   - Recommendation: Use Unicode stars (★ filled, ☆ empty, ★ dimmed for half) - simplest, zero-dependency, sufficient for display-only ratings

4. **Copy-to-clipboard feedback mechanism**
   - What we know: User wants copy-on-click for tag chips
   - What's unclear: Toast notification, tooltip, or icon animation?
   - Recommendation: Use sonner toast (already installed) - non-blocking, familiar pattern, accessible

5. **Time presence detection in date strings**
   - What we know: User wants time shown when present in data
   - What's unclear: Best heuristic to detect time component (check for 'T' in ISO string? Parse and check hours/minutes?)
   - Recommendation: Check if ISO string includes 'T' character - reliable indicator of datetime vs date-only format

## Sources

### Primary (HIGH confidence)

- **Intl.NumberFormat API**: [MDN Web Docs - Intl.NumberFormat](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat) - Official browser API documentation
- **Intl.DateTimeFormat API**: [MDN Web Docs - Intl.DateTimeFormat](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat) - Official browser API documentation
- **shadcn/ui Badge Component**: [shadcn/ui Badge](https://www.shadcn.io/ui/badge) - Existing component in project
- **sonner Toast Library**: [shadcn/ui Sonner](https://www.shadcn.io/ui/sonner) - Existing toast system in project (v2.0.7)
- **Navigator Clipboard API**: [MDN Web Docs - Clipboard API](https://developer.mozilla.org/en-US/docs/Web/API/Clipboard_API) - Modern copy-to-clipboard standard
- **User Decisions**: .planning/phases/16-context-aware-components/16-CONTEXT.md - Implementation decisions from /gsd:discuss-phase

### Secondary (MEDIUM confidence)

- [Simplify Currency Formatting in React with Intl API](https://dev.to/josephciullo/simplify-currency-formatting-in-react-a-zero-dependency-solution-with-intl-api-3kok) - Zero-dependency React pattern (Sept 2025)
- [React Spectrum Badge Semantic Colors](https://react-spectrum.adobe.com/react-spectrum/Badge.html) - Industry standard color semantics (gray/green/orange/red)
- [Material UI Chip Component](https://mui.com/material-ui/react-chip/) - Tag chip design patterns
- [Badges vs Pills vs Chips vs Tags - Smart Interface Design Patterns](https://smart-interface-design-patterns.com/articles/badges-chips-tags-pills/) - UI terminology and use cases
- [Copy to Clipboard Success Message Best Practices 2026](https://copyprogramming.com/howto/display-success-message-after-copying-url-to-clipboard) - UX patterns for clipboard feedback
- [Unicode Star Symbols](https://www.htmlsymbols.xyz/star-symbols) - HTML entities for stars (★ U+2605, ☆ U+2606)

### Tertiary (LOW confidence)

- [React SVG vs Unicode Performance](https://blog.theodo.com/2021/03/icon-library-react-why-inline-svg-better-than-font/) - General icon performance discussion (not specific to stars)
- [Build a half-star rating component in React](https://blog.logrocket.com/build-a-half-star-rating-component-in-react-from-scratch/) - Custom implementation guide (overkill for display-only)

## Metadata

**Confidence breakdown:**
- Standard stack: **HIGH** - All dependencies already in project (React, shadcn/ui, sonner, Tailwind), native Intl APIs well-documented
- Architecture: **HIGH** - Clear integration point (PrimitiveRenderer), analysis cache already populated by Phase 12-13, patterns match existing codebase structure
- Pitfalls: **MEDIUM** - Identified from user decisions and common Intl API gotchas, but not all tested in this specific codebase context

**Research date:** 2026-02-09
**Valid until:** 2026-03-09 (30 days - stable domain, native APIs and established patterns unlikely to change)
