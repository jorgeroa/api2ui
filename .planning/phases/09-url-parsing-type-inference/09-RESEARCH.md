# Phase 9: URL Parsing & Type Inference Foundation - Research

**Researched:** 2026-02-05
**Domain:** URL Query String Parsing, Type Inference from String Values, Parameter Persistence
**Confidence:** HIGH

## Summary

Phase 9 establishes the foundational infrastructure for parsing raw URL query strings into smart, editable form fields. The research covers four interconnected domains: (1) query string parsing with array notation support, (2) type inference from string values, (3) parameter grouping by prefix, and (4) per-endpoint persistence.

The recommended approach uses **native URLSearchParams** for basic parsing with a custom wrapper to handle bracket notation (`tag[]=x`) that the native API doesn't support. Type inference follows a **conservative, multi-signal validation** strategy with confidence levels - only showing specialized input types when detection confidence is HIGH. The user decision to never show confidence levels in UI means the inference engine must be conservative enough that false positives are rare. Parameter persistence extends the existing `configStore` pattern with Zustand persist middleware, adding per-endpoint storage with debounced autosave (300ms recommended).

**Primary recommendation:** Build a custom URL parser that combines URLSearchParams with bracket notation handling, pairs with a conservative type inferrer using multi-signal validation (field name + value pattern + reasonable range checks), and persists via existing Zustand patterns with debounced writes.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| URLSearchParams | Native | Parse query strings | Built-in browser API, no dependencies, handles repeated keys via getAll() |
| Zustand persist | 5.0.11 | Parameter persistence | Already used in codebase (configStore.ts), mature middleware |
| @headlessui/react | 2.2.9 | Accordion/Disclosure components | Already in codebase, handles accessible collapsible sections |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| lodash.debounce | 4.0.8 | Debounced persistence | If inline useEffect+setTimeout becomes unwieldy across multiple components |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Native URLSearchParams | qs (npm) | qs handles bracket notation natively but adds 8KB; for Phase 9 scope, custom wrapper is simpler |
| Native URLSearchParams | query-string (npm) | Same as qs - unnecessary dependency for our use case |
| Custom type inferrer | validator.js | 21KB library for validation; we need detection not validation, custom is lighter |

**Installation:**
```bash
# No new dependencies required - all tools already in codebase
# Optionally add lodash.debounce if needed later:
npm install lodash.debounce @types/lodash.debounce
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── services/
│   └── urlParser/
│       ├── parser.ts           # parseUrlParameters() - main entry point
│       ├── parser.test.ts      # Test cases for bracket notation, repeated keys
│       ├── typeInferrer.ts     # inferParameterType() with confidence levels
│       ├── typeInferrer.test.ts
│       └── types.ts            # TypeInferenceResult, UrlParseResult
├── store/
│   └── parameterStore.ts       # Per-endpoint parameter persistence (NEW)
├── components/
│   └── forms/
│       ├── ParameterForm.tsx   # Extended to use parameterStore + URL parsing
│       └── ParameterGroup.tsx  # Accordion wrapper for grouped params (NEW)
└── types/
    └── openapi.ts              # Extended ParsedParameter with inferredType
```

### Pattern 1: Format Convergence
**What:** Parse all parameter sources (OpenAPI, URL query strings) to unified `ParsedParameter[]` format early in pipeline
**When to use:** Always - eliminates dual-system collision, simplifies downstream components
**Example:**
```typescript
// Source: .planning/research/SUMMARY.md format convergence pattern
import type { ParsedParameter } from '../../services/openapi/types'

interface UrlParseResult {
  parameters: ParsedParameter[]
  groups: Map<string, string[]> // groupName -> paramNames
  warnings: string[] // Encoding fixes, duplicate warnings
}

export function parseUrlParameters(url: string): UrlParseResult {
  const urlObj = new URL(url)
  const params = new URLSearchParams(urlObj.search)
  const result: ParsedParameter[] = []
  const groups = new Map<string, string[]>()
  const warnings: string[] = []
  const seen = new Set<string>()

  // Handle both bracket notation and repeated keys
  for (const [rawKey] of params) {
    const key = rawKey.replace(/\[\]$/, '') // Normalize "tag[]" to "tag"
    if (seen.has(key)) continue
    seen.add(key)

    const values = params.getAll(rawKey)
    const isArray = rawKey.endsWith('[]') || values.length > 1

    // Extract group prefix (e.g., "ddcFilter[name]" -> "ddcFilter")
    const groupMatch = key.match(/^([a-zA-Z]+)\[/)
    if (groupMatch) {
      const groupName = groupMatch[1]
      if (!groups.has(groupName)) groups.set(groupName, [])
      groups.get(groupName)!.push(key)
    }

    result.push({
      name: key,
      in: 'query',
      required: false,
      description: '',
      schema: {
        type: isArray ? 'array' : inferBasicType(values[0]),
        // Type inference happens in second pass
      },
    })
  }

  return { parameters: result, groups, warnings }
}
```

### Pattern 2: Multi-Signal Type Inference
**What:** Use multiple signals (field name, value pattern, reasonable range) for type detection with confidence levels
**When to use:** For all inferred types - conservative detection prevents false positives
**Example:**
```typescript
// Source: .planning/research/PITFALLS.md type inference pattern
interface TypeInferenceResult {
  type: 'string' | 'number' | 'boolean' | 'date' | 'email' | 'url' | 'coordinates' | 'zip'
  confidence: 'LOW' | 'MEDIUM' | 'HIGH'
  reasons: string[] // For debugging/logging only, not shown to user
}

export function inferParameterType(
  name: string,
  value: string | undefined
): TypeInferenceResult {
  const nameLower = name.toLowerCase()
  const signals: string[] = []

  // Boolean detection (HIGH confidence with exact match)
  if (value === 'true' || value === 'false') {
    return { type: 'boolean', confidence: 'HIGH', reasons: ['exact boolean value'] }
  }

  // Number detection (HIGH confidence)
  if (value && /^-?\d+(\.\d+)?$/.test(value)) {
    return { type: 'number', confidence: 'HIGH', reasons: ['numeric value pattern'] }
  }

  // Date detection - CONSERVATIVE (require both pattern AND valid parse AND reasonable range)
  if (value && isDefinitelyDate(value)) {
    const hasDateInName = /date|time|created|updated|timestamp/i.test(nameLower)
    return {
      type: 'date',
      confidence: hasDateInName ? 'HIGH' : 'MEDIUM',
      reasons: hasDateInName ? ['date pattern + name hint'] : ['date pattern only']
    }
  }

  // Email detection - require @ with domain extension
  if (value && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)) {
    const hasEmailInName = /email|mail/i.test(nameLower)
    return {
      type: 'email',
      confidence: hasEmailInName ? 'HIGH' : 'MEDIUM',
      reasons: hasEmailInName ? ['email pattern + name hint'] : ['email pattern only']
    }
  }

  // URL detection
  if (value && /^https?:\/\/[^\s]+$/.test(value)) {
    return { type: 'url', confidence: 'HIGH', reasons: ['URL protocol prefix'] }
  }

  // Coordinate detection - require both lat AND lng in close proximity or name hint
  if (value && /^-?\d+\.?\d*,\s*-?\d+\.?\d*$/.test(value)) {
    const [lat, lng] = value.split(',').map(v => parseFloat(v.trim()))
    if (Math.abs(lat) <= 90 && Math.abs(lng) <= 180) {
      const hasCoordInName = /coord|lat|lng|location|position/i.test(nameLower)
      return {
        type: 'coordinates',
        confidence: hasCoordInName ? 'HIGH' : 'LOW',
        reasons: hasCoordInName ? ['coordinate pattern + name hint'] : ['coordinate pattern only - LOW confidence']
      }
    }
  }

  // ZIP code detection - require name hint (too many false positives otherwise)
  if (value && /^\d{5}(-\d{4})?$/.test(value)) {
    const hasZipInName = /zip|postal|code/i.test(nameLower)
    if (hasZipInName) {
      return { type: 'zip', confidence: 'HIGH', reasons: ['5-digit pattern + name hint'] }
    }
    // Without name hint, don't detect as zip (could be ID, price, etc.)
  }

  // Default to string
  return { type: 'string', confidence: 'HIGH', reasons: ['default string type'] }
}

function isDefinitelyDate(value: string): boolean {
  // ISO 8601 pattern
  const isoPattern = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:?\d{2})?)?$/
  if (!isoPattern.test(value)) return false

  const parsed = Date.parse(value)
  if (isNaN(parsed)) return false

  // Reject dates outside reasonable range
  const year = new Date(parsed).getFullYear()
  return year >= 1970 && year <= 2100
}
```

### Pattern 3: Debounced Autosave Persistence
**What:** Persist parameter values on change with debouncing to prevent excessive writes
**When to use:** For silent autosave behavior (per user decision)
**Example:**
```typescript
// Source: React debounce patterns + Zustand persist
import { useEffect, useRef } from 'react'

function useDebouncedPersist(
  endpoint: string,
  values: Record<string, string>,
  delay: number = 300
) {
  const persistRef = useRef<ReturnType<typeof setTimeout>>()
  const { setParameterValues } = useParameterStore()

  useEffect(() => {
    // Clear any pending persist
    if (persistRef.current) {
      clearTimeout(persistRef.current)
    }

    // Debounce the persist
    persistRef.current = setTimeout(() => {
      setParameterValues(endpoint, values)
    }, delay)

    return () => {
      if (persistRef.current) {
        clearTimeout(persistRef.current)
      }
    }
  }, [endpoint, values, delay, setParameterValues])
}
```

### Pattern 4: Accordion Parameter Groups (using existing Headless UI)
**What:** Group related parameters into collapsible sections using Disclosure
**When to use:** When parameters share a common prefix (e.g., `ddcFilter[*]`)
**Example:**
```typescript
// Source: Existing TagGroup.tsx pattern + Headless UI docs
import { Disclosure, DisclosureButton, DisclosurePanel } from '@headlessui/react'

interface ParameterGroupProps {
  groupName: string
  parameters: ParsedParameter[]
  values: Record<string, string>
  onChange: (name: string, value: string) => void
}

export function ParameterGroup({ groupName, parameters, values, onChange }: ParameterGroupProps) {
  // Humanize group name: "ddcFilter" -> "Filters"
  const displayName = humanizeGroupName(groupName)

  return (
    <Disclosure defaultOpen={false}>
      {({ open }) => (
        <>
          <DisclosureButton className="flex items-center justify-between w-full px-3 py-2 text-left hover:bg-gray-50">
            <span className="font-semibold text-sm">{displayName}</span>
            <svg
              className={`w-4 h-4 transition-transform ${open ? 'rotate-90' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </DisclosureButton>
          <DisclosurePanel className="space-y-3 pl-4">
            {parameters.map((param) => (
              <ParameterInput
                key={param.name}
                parameter={param}
                value={values[param.name] ?? ''}
                onChange={(value) => onChange(param.name, value)}
              />
            ))}
          </DisclosurePanel>
        </>
      )}
    </Disclosure>
  )
}

function humanizeGroupName(name: string): string {
  // "ddcFilter" -> "Filters", "searchParams" -> "Search"
  return name
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase())
    .replace(/filter|param|params|options?$/i, '')
    .trim() || name
}
```

### Anti-Patterns to Avoid
- **Type inference without confidence levels:** False positives destroy user trust - always implement conservative detection
- **Global parameter storage:** Use per-endpoint storage to prevent cross-endpoint pollution
- **Synchronous persistence on every keystroke:** Use debouncing (300ms) to prevent performance issues
- **Nested accordion groups:** User decision: single-level grouping only (no nested accordions)
- **Showing confidence levels in UI:** User decision: never show confidence - just apply inferred type or fall back to text

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Query string parsing | Custom string.split('&') logic | URLSearchParams API | Handles encoding, special chars, edge cases |
| Accordion components | Custom show/hide with useState | Headless UI Disclosure | Accessibility (ARIA), keyboard navigation, animation hooks |
| Debounced persistence | Inline setTimeout in multiple places | useEffect + setTimeout pattern OR lodash.debounce | Cleanup on unmount, memoization |
| localStorage sync | Raw localStorage.setItem calls | Zustand persist middleware | Handles serialization, versioning, migration |

**Key insight:** The codebase already has patterns for all these problems. Extend existing patterns (configStore, Disclosure) rather than creating parallel solutions.

## Common Pitfalls

### Pitfall 1: Bracket Notation Not Handled by URLSearchParams
**What goes wrong:** URLSearchParams treats `tag[]` as a literal key name, not as array notation
**Why it happens:** URLSearchParams is spec-compliant but bracket notation is a convention, not standard
**How to avoid:** Post-process URLSearchParams output to normalize `key[]` to `key` and use `getAll()` for values
**Warning signs:** Arrays appearing as single values, `[]` showing in parameter names in UI

### Pitfall 2: Type Inference False Positives
**What goes wrong:** String "2024-01-01" detected as date but it's a product code; date picker appears, user can't enter value
**Why it happens:** Regex pattern matches without semantic context
**How to avoid:** Multi-signal validation (require field name hint OR very strict pattern), confidence levels, conservative thresholds
**Warning signs:** Users immediately switching input type after form loads, support tickets about "wrong input type"

### Pitfall 3: localStorage Race Conditions (Multi-Tab)
**What goes wrong:** Tab A saves, Tab B overwrites with old state, parameters become corrupted
**Why it happens:** Zustand persist doesn't handle concurrent writes by default
**How to avoid:** Version timestamps per endpoint, storage event listeners for cross-tab sync, debounced writes
**Warning signs:** Parameters reverting to old values, inconsistent state across tabs

### Pitfall 4: Duplicate Non-Array Parameters
**What goes wrong:** URL has `foo=1&foo=2` but it's NOT an array - it's ambiguous
**Why it happens:** No standard for whether repeated keys mean array or error
**How to avoid:** User decision: Show all values with warning about ambiguity
**Warning signs:** User confused about which value is "active"

### Pitfall 5: Empty Parameters Hidden
**What goes wrong:** Parameters with empty values (`?foo=`) not shown in form
**Why it happens:** Developer assumes empty = not present
**How to avoid:** User decision: Show empty parameters as empty input fields
**Warning signs:** User can't find parameter they know exists in URL

## Code Examples

Verified patterns from official sources:

### Parse URL with Array Detection
```typescript
// Source: MDN URLSearchParams + custom array handling
export function parseQueryString(url: string): Map<string, string[]> {
  const result = new Map<string, string[]>()
  const urlObj = new URL(url)
  const params = new URLSearchParams(urlObj.search)

  for (const [rawKey] of params) {
    // Normalize bracket notation: "tag[]" -> "tag"
    const key = rawKey.replace(/\[\]$/, '')

    if (result.has(key)) continue // Already processed

    // Get all values for this key (handles both tag[]=x&tag[]=y AND tag=x&tag=y)
    const values = params.getAll(rawKey)
    result.set(key, values)
  }

  return result
}
```

### Icon Mapping for Inferred Types
```typescript
// Source: User decision on type icons
const TYPE_ICONS: Record<string, React.ReactNode> = {
  date: <CalendarIcon className="w-4 h-4 text-gray-400" />,
  email: <AtSymbolIcon className="w-4 h-4 text-gray-400" />,
  url: <LinkIcon className="w-4 h-4 text-gray-400" />,
  coordinates: <MapPinIcon className="w-4 h-4 text-gray-400" />,
  zip: <MapIcon className="w-4 h-4 text-gray-400" />,
  number: <HashtagIcon className="w-4 h-4 text-gray-400" />,
  boolean: <ToggleIcon className="w-4 h-4 text-gray-400" />,
}

// Dropdown on icon click to change type when inference is wrong
function TypeIcon({ type, onTypeChange }: { type: string; onTypeChange: (type: string) => void }) {
  return (
    <Menu>
      <MenuButton className="p-1 rounded hover:bg-gray-100">
        {TYPE_ICONS[type] || <TextIcon className="w-4 h-4 text-gray-400" />}
      </MenuButton>
      <MenuItems>
        {Object.entries(TYPE_ICONS).map(([t, icon]) => (
          <MenuItem key={t} onClick={() => onTypeChange(t)}>
            {icon} <span className="ml-2 capitalize">{t}</span>
          </MenuItem>
        ))}
      </MenuItems>
    </Menu>
  )
}
```

### Per-Endpoint Parameter Store
```typescript
// Source: Existing configStore.ts pattern + Zustand persist docs
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

interface ParameterState {
  // endpoint -> param name -> value
  values: Record<string, Record<string, string>>
  // endpoint -> timestamp (for race condition prevention)
  versions: Record<string, number>
}

interface ParameterStore extends ParameterState {
  getValues: (endpoint: string) => Record<string, string>
  setValue: (endpoint: string, name: string, value: string) => void
  setValues: (endpoint: string, values: Record<string, string>) => void
  clearEndpoint: (endpoint: string) => void
  clearAll: () => void
}

export const useParameterStore = create<ParameterStore>()(
  persist(
    (set, get) => ({
      values: {},
      versions: {},

      getValues: (endpoint) => get().values[endpoint] ?? {},

      setValue: (endpoint, name, value) =>
        set((state) => ({
          values: {
            ...state.values,
            [endpoint]: {
              ...state.values[endpoint],
              [name]: value,
            },
          },
          versions: {
            ...state.versions,
            [endpoint]: Date.now(),
          },
        })),

      setValues: (endpoint, values) =>
        set((state) => ({
          values: {
            ...state.values,
            [endpoint]: values,
          },
          versions: {
            ...state.versions,
            [endpoint]: Date.now(),
          },
        })),

      clearEndpoint: (endpoint) =>
        set((state) => {
          const { [endpoint]: _, ...rest } = state.values
          const { [endpoint]: __, ...restVersions } = state.versions
          return { values: rest, versions: restVersions }
        }),

      clearAll: () => set({ values: {}, versions: {} }),
    }),
    {
      name: 'api2ui-parameters',
      version: 1,
      storage: createJSONStorage(() => localStorage),
    }
  )
)
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| query-string npm package | Native URLSearchParams | 2020+ (browser support) | 0 dependencies for basic parsing |
| Full RFC 5322 email regex | Practical 99% coverage regex | Ongoing | Simpler, fewer edge case bugs |
| Inline confidence UI | Conservative inference (no UI) | Phase 9 decision | Cleaner UX, requires higher accuracy |
| Global parameter storage | Per-endpoint storage | Phase 9 architecture | Prevents cross-endpoint pollution |

**Deprecated/outdated:**
- **query-string library for simple cases:** URLSearchParams handles 90% of use cases natively; only need library for complex nested objects
- **Full RFC 5322 email validation:** Impractical - use simpler regex that covers 99% of real addresses

## Open Questions

Things that couldn't be fully resolved:

1. **Coordinate pair threshold values**
   - What we know: Latitude must be -90 to 90, longitude -180 to 180
   - What's unclear: How many decimal places to require? Should we require comma vs space separator?
   - Recommendation: Accept both comma and space separators, require at least 1 decimal place to avoid false positives on simple "1,2" inputs

2. **Debounce timing for autosave**
   - What we know: 300-500ms is standard for form autosave
   - What's unclear: Should different input types have different debounce times?
   - Recommendation: Start with 300ms globally, adjust if user testing reveals issues

3. **Group name humanization edge cases**
   - What we know: "ddcFilter" should become "Filters"
   - What's unclear: How to handle acronyms ("HTMLOptions"), numbers ("filter2")
   - Recommendation: Simple camelCase split + remove common suffixes, accept imperfect labels initially

## Sources

### Primary (HIGH confidence)
- [URLSearchParams - MDN](https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams) - Core parsing API
- [Headless UI Disclosure](https://headlessui.com/react/disclosure) - Accordion component pattern
- [Zustand persist middleware](https://zustand.docs.pmnd.rs/middlewares/persist) - State persistence pattern
- `.planning/research/SUMMARY.md` - v0.2 architecture decisions
- `.planning/research/PITFALLS.md` - Integration risk analysis

### Secondary (MEDIUM confidence)
- [qs npm package](https://github.com/ljharb/qs) - Reference for bracket notation parsing approach
- [Josh Comeau: Persisting React State in localStorage](https://www.joshwcomeau.com/react/persisting-react-state-in-localstorage/) - Persistence patterns
- [Shalvah: Arrays in Query Strings](https://blog.shalvah.me/posts/fun-stuff-representing-arrays-and-objects-in-query-strings) - Array notation conventions

### Tertiary (LOW confidence)
- [Regex Tester: Coordinate Validation](https://regex101.com/library/pJ6uS7) - Coordinate pattern reference
- [GeoPostcodes: International ZIP Validation](https://www.geopostcodes.com/blog/international-zip-code-validation/) - ZIP code complexity

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Uses native APIs and existing codebase patterns
- Architecture: HIGH - Extends established patterns (configStore, Disclosure)
- Type inference: MEDIUM - Conservative approach is sound but edge cases may emerge in testing
- Pitfalls: HIGH - Well-documented in prior v0.2 research

**Research date:** 2026-02-05
**Valid until:** 2026-03-05 (30 days - stable patterns, no fast-moving dependencies)

**User Decisions Applied:**
- Type icons next to inputs (subtle, not badges)
- Dropdown on icon to change type
- Never show confidence levels
- All groups collapsed by default
- Accordion panels with chevron
- Single-level grouping only
- Persist on input change (autosave)
- Silent persistence (no "Saved" indicators)
- Last write wins for multi-tab
- Inline error for parse failures
- Auto-fix encoding with warning
- Show duplicate non-array values with warning
- Empty parameters show as empty inputs
