# Phase 2: Advanced Rendering & OpenAPI - Research

**Researched:** 2026-02-01
**Domain:** OpenAPI parsing, nested data visualization, master-detail UI patterns, form generation
**Confidence:** HIGH

## Summary

Phase 2 extends the foundation by adding OpenAPI/Swagger spec parsing, master-detail navigation, nested data handling with depth limits, and parameter form generation. Research reveals a mature ecosystem for OpenAPI parsing in browsers, established React modal/drawer patterns compatible with our Tailwind+Headless UI stack, and proven approaches for recursive data rendering with depth control.

**Key findings:**
- **OpenAPI Parsing**: `@apidevtools/swagger-parser` is the industry standard, battle-tested on 1,500+ real-world APIs, works in browsers with bundlers (Vite), supports Swagger 2.0 and OpenAPI 3.0/3.1, includes TypeScript types
- **Modal/Drawer UI**: Headless UI Dialog and emerging Drawer components (v2.2+) provide accessible, unstyled primitives that integrate perfectly with existing Tailwind CSS 4 setup; React 19 compatibility confirmed in v2.2.1+
- **Master-Detail Pattern**: Well-established pattern with click → expanded view; implementation choices are modal overlay (simpler, mobile-friendly) vs side drawer/panel (desktop-optimized); modal recommended for v1 given simpler state management
- **Nested Rendering**: Existing depth tracking in DynamicRenderer.tsx (MAX_DEPTH=5) provides foundation; expand with collapsible sections using Headless UI Disclosure component; recursive rendering is standard React pattern
- **Form Generation**: OpenAPI parameter schemas map directly to HTML input types; React Hook Form + dynamic field generation is the modern approach; required/optional distinction is native to OpenAPI spec

**Primary recommendation:** Use `@apidevtools/swagger-parser` for OpenAPI parsing, extend existing DynamicRenderer depth logic for nested data, implement modal-based detail view with Headless UI Dialog, generate forms from OpenAPI parameters using component mapping pattern already established in registry.

## Standard Stack

The established libraries/tools for this domain:

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @apidevtools/swagger-parser | 10.x | Parse & validate OpenAPI/Swagger specs, resolve $ref pointers | Most mature (1,500+ APIs tested), browser-compatible, handles circular refs, supports OpenAPI 3.0 & Swagger 2.0 |
| @headlessui/react | 2.2.9+ | Accessible Dialog, Disclosure components for modals and collapsible sections | Official Tailwind companion, React 19 compatible (v2.2.1+), zero styles (perfect for Tailwind CSS 4), focus management built-in |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| react-hook-form | 7.x | Dynamic form generation from schemas | If form validation/submission needed (deferred to later phase for read-only v1) |
| @scalar/openapi-parser | - | Modern TypeScript OpenAPI parser | **ARCHIVED 8/2024** - moved to monorepo; @apidevtools is safer choice |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| @apidevtools/swagger-parser | @readme/openapi-parser | Hard fork with better error messages (better-ajv-errors), but also archived (moved to oas package); swagger-parser is more stable |
| Headless UI Dialog | Radix UI Dialog or react-modal | Radix is excellent but adds new dependency; react-modal is older pattern; Headless UI matches existing Tailwind stack |
| Modal detail view | Side drawer/panel | Drawer is desktop-optimized but more complex state; modal is simpler, works well mobile+desktop |

**Installation:**
```bash
npm install @apidevtools/swagger-parser @headlessui/react
```

Note: @headlessui/react may already be needed for Disclosure component (collapsible nested data); if not, add during implementation.

## Architecture Patterns

### Recommended Project Structure
```
src/
├── services/
│   ├── openapi/
│   │   ├── parser.ts          # Wraps @apidevtools/swagger-parser
│   │   ├── parameterMapper.ts # OpenAPI param schema → form input type
│   │   └── types.ts           # OpenAPI-specific types
│   └── api/                   # (existing)
├── components/
│   ├── detail/
│   │   ├── DetailModal.tsx    # Modal container for detail view
│   │   └── NestedSection.tsx  # Collapsible section for nested data
│   ├── forms/
│   │   ├── ParameterForm.tsx  # Form wrapper
│   │   └── ParameterInput.tsx # Individual input from OpenAPI param
│   ├── renderers/             # (existing, extend for nested data)
│   └── registry/              # (existing)
├── store/
│   └── appStore.ts            # Add: selectedItem, openApiSpec
└── types/
    └── openapi.ts             # OpenAPI domain types
```

### Pattern 1: OpenAPI Spec Parsing and Integration

**What:** Parse OpenAPI/Swagger URL or JSON, validate, dereference $ref pointers, extract operation definitions
**When to use:** When user provides OpenAPI spec URL (not raw API URL)
**Example:**
```typescript
// Source: @apidevtools/swagger-parser README + official docs
import SwaggerParser from '@apidevtools/swagger-parser'
import type { OpenAPI } from 'openapi-types'

async function parseOpenAPISpec(specUrl: string): Promise<OpenAPI.Document> {
  try {
    // Parse, validate, and dereference in one call
    const api = await SwaggerParser.dereference(specUrl) as OpenAPI.Document

    // api now contains fully resolved spec with all $refs expanded
    // Circular refs are preserved as actual circular references
    return api
  } catch (error) {
    // Validation errors include detailed path information
    throw new Error(`OpenAPI parsing failed: ${error.message}`)
  }
}
```

**Key capabilities:**
- `SwaggerParser.validate()` - Validates against OpenAPI schema
- `SwaggerParser.dereference()` - Resolves all $ref pointers (recommended)
- `SwaggerParser.bundle()` - Combines multiple files, keeps internal $refs
- Works with URLs or local specs; handles JSON and YAML

### Pattern 2: Master-Detail with Modal (Recommended)

**What:** Click row in table → open modal with full item details + nested data
**When to use:** Detail view for any array item, especially objects with nested structures
**Example:**
```typescript
// Source: Headless UI Dialog docs + TableRenderer pattern
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react'
import { useState } from 'react'

function TableWithDetail({ data, schema }: RendererProps) {
  const [selectedItem, setSelectedItem] = useState<unknown>(null)

  return (
    <>
      <table>
        {data.map((item, i) => (
          <tr
            key={i}
            onClick={() => setSelectedItem(item)}
            className="cursor-pointer hover:bg-gray-100"
          >
            {/* table cells */}
          </tr>
        ))}
      </table>

      <Dialog open={!!selectedItem} onClose={() => setSelectedItem(null)}>
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <DialogPanel className="max-w-2xl w-full bg-white rounded-lg p-6">
            <DialogTitle>Item Details</DialogTitle>
            {/* Render selectedItem with DetailRenderer or nested renderer */}
            <DynamicRenderer data={selectedItem} schema={itemSchema} depth={0} />
          </DialogPanel>
        </div>
      </Dialog>
    </>
  )
}
```

**Integration with existing code:**
- TableRenderer.tsx already has row rendering with `map((item, rowIndex) => ...)`
- Add onClick handler to row div, track selected item in Zustand store
- Dialog auto-handles focus trap, Esc key, outside click → no custom logic needed

### Pattern 3: Collapsible Nested Data

**What:** Nested arrays/objects in detail view render as collapsible sections to manage depth
**When to use:** When rendering objects or arrays at depth > 1, especially for deep nesting
**Example:**
```typescript
// Source: Headless UI Disclosure + recursive rendering patterns
import { Disclosure, DisclosureButton, DisclosurePanel } from '@headlessui/react'

function NestedObjectRenderer({ data, schema, path, depth }: RendererProps) {
  if (depth >= MAX_DEPTH) {
    return <JsonFallback data={data} schema={schema} path={path} depth={depth} />
  }

  const obj = data as Record<string, unknown>
  const fields = schema.kind === 'object' ? schema.fields : new Map()

  return (
    <div className="space-y-2">
      {Array.from(fields.entries()).map(([key, fieldDef]) => {
        const value = obj[key]
        const isComplex = fieldDef.type.kind === 'object' || fieldDef.type.kind === 'array'

        if (!isComplex) {
          // Simple field: render inline
          return <div key={key}>{key}: <PrimitiveRenderer data={value} ... /></div>
        }

        // Complex field: collapsible section
        return (
          <Disclosure key={key}>
            <DisclosureButton className="flex items-center gap-2 text-blue-600 hover:text-blue-800">
              <ChevronIcon />
              {key} ({getTypeLabel(fieldDef.type)})
            </DisclosureButton>
            <DisclosurePanel className="ml-4 mt-2 border-l-2 border-gray-200 pl-4">
              <DynamicRenderer data={value} schema={fieldDef.type} path={`${path}.${key}`} depth={depth + 1} />
            </DisclosurePanel>
          </Disclosure>
        )
      })}
    </div>
  )
}
```

**Depth management:**
- Existing `MAX_DEPTH = 5` in DynamicRenderer.tsx is appropriate
- At max depth, render JsonFallback (already implemented)
- Start detail modal at depth=0 so nested structures have full depth budget

### Pattern 4: OpenAPI Parameters to Form Controls

**What:** Map OpenAPI parameter schema to appropriate HTML input type and render with validation
**When to use:** When rendering API operation parameters as input form
**Example:**
```typescript
// Source: OpenAPI spec + React input mapping patterns
import type { OpenAPIV3 } from 'openapi-types'

type InputType = 'text' | 'number' | 'checkbox' | 'select' | 'textarea' | 'password' | 'date'

function mapParameterToInputType(param: OpenAPIV3.ParameterObject): InputType {
  const schema = param.schema as OpenAPIV3.SchemaObject

  if (schema.enum) return 'select'

  switch (schema.type) {
    case 'integer':
    case 'number':
      return 'number'
    case 'boolean':
      return 'checkbox'
    case 'string':
      if (schema.format === 'password') return 'password'
      if (schema.format === 'date' || schema.format === 'date-time') return 'date'
      if (schema.maxLength && schema.maxLength > 100) return 'textarea'
      return 'text'
    default:
      return 'text'
  }
}

function ParameterInput({ param }: { param: OpenAPIV3.ParameterObject }) {
  const inputType = mapParameterToInputType(param)
  const schema = param.schema as OpenAPIV3.SchemaObject

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium mb-1">
        {param.name}
        {param.required && <span className="text-red-500">*</span>}
      </label>
      {param.description && (
        <p className="text-xs text-gray-500 mb-1">{param.description}</p>
      )}
      {inputType === 'select' ? (
        <select className="w-full border rounded px-3 py-2">
          {(schema.enum || []).map(val => (
            <option key={String(val)} value={String(val)}>{String(val)}</option>
          ))}
        </select>
      ) : inputType === 'checkbox' ? (
        <input type="checkbox" className="..." />
      ) : (
        <input
          type={inputType}
          placeholder={schema.default ? String(schema.default) : undefined}
          className="w-full border rounded px-3 py-2"
        />
      )}
    </div>
  )
}
```

**Required vs Optional UI Pattern:**
```typescript
function ParametersForm({ parameters }: { parameters: OpenAPIV3.ParameterObject[] }) {
  const required = parameters.filter(p => p.required)
  const optional = parameters.filter(p => !p.required)

  return (
    <form>
      <div className="mb-6">
        <h3 className="font-semibold mb-3">Required Parameters</h3>
        {required.map(param => <ParameterInput key={param.name} param={param} />)}
      </div>

      {optional.length > 0 && (
        <Disclosure>
          <DisclosureButton className="text-blue-600 text-sm">
            + {optional.length} Optional Parameters
          </DisclosureButton>
          <DisclosurePanel className="mt-3">
            {optional.map(param => <ParameterInput key={param.name} param={param} />)}
          </DisclosurePanel>
        </Disclosure>
      )}
    </form>
  )
}
```

### Pattern 5: Extend Component Registry for New Renderers

**What:** Add detail-specific renderers to existing registry pattern
**When to use:** When creating specialized renderers for detail view context
**Example:**
```typescript
// Source: Existing src/components/registry/ComponentRegistry.tsx pattern
import type { ComponentMapping } from '../../types/components'
import { TableRenderer } from '../renderers/TableRenderer'
import { DetailRenderer } from '../renderers/DetailRenderer'
import { NestedArrayRenderer } from '../renderers/NestedArrayRenderer'  // New

const rendererMappings: ComponentMapping[] = [
  // Existing mappings...
  {
    match: (schema, context) =>
      schema.kind === 'array' &&
      schema.items.kind === 'object' &&
      context?.nested === true,
    component: NestedArrayRenderer  // Sub-table in detail view
  },
  {
    match: (schema, context) =>
      schema.kind === 'array' &&
      schema.items.kind === 'object' &&
      context?.nested !== true,
    component: TableRenderer  // Top-level array
  },
  // ...
]

export function getComponent(schema: TypeSignature, context?: { nested?: boolean }) {
  const mapping = rendererMappings.find(m => m.match(schema, context))
  return mapping?.component || JsonFallback
}
```

### Anti-Patterns to Avoid

- **Deeply nested modals**: Don't open modal from modal; use breadcrumb navigation or back button within single modal
- **Parsing OpenAPI on every render**: Parse once, cache result in Zustand store
- **Ignoring depth limits**: Always check depth before recursing; infinite recursion freezes browser
- **Manual focus management**: Let Headless UI handle focus trap; overriding causes accessibility bugs
- **Blocking UI during parse**: OpenAPI parsing can be slow for large specs; show loading state, parse in background

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| OpenAPI $ref resolution | Custom JSON pointer resolver | @apidevtools/swagger-parser.dereference() | Handles circular refs, external URLs, relative paths, YAML, security validations; tested on 1,500+ real specs |
| Modal focus trap | Custom keyboard event handlers | Headless UI Dialog | Manages focus cycle, Esc key, outside click, screen reader announcements, portal rendering; WCAG compliant |
| Collapsible sections | CSS-only details/summary | Headless UI Disclosure | Animation-ready, controlled state, accessible keyboard nav, works with React state |
| Form validation from OpenAPI | Custom validator | Existing schema confidence system (for now) | OpenAPI schema → validation is complex (allOf, anyOf, discriminators); defer to later phase |
| Type-safe OpenAPI types | Manual type definitions | openapi-types package | Comprehensive TypeScript types for OpenAPI 2.0 and 3.x; community-maintained |

**Key insight:** OpenAPI specs are deceptively complex. $ref pointers can be circular, cross-file, URL-based. Schemas support inheritance (allOf), polymorphism (discriminator), conditional logic (if/then/else). Parsing libraries have solved these edge cases; custom implementations inevitably hit spec corner cases.

## Common Pitfalls

### Pitfall 1: CORS Errors When Fetching OpenAPI Specs

**What goes wrong:** Many OpenAPI specs are hosted on domains without CORS headers; fetch fails in browser
**Why it happens:** OpenAPI spec URLs (e.g., `https://api.example.com/openapi.json`) are API docs endpoints, often not configured for CORS since they're meant for server-to-server tooling
**How to avoid:**
- Use existing CORS detection heuristic from Phase 1 (`fetcher.ts` with no-cors fallback)
- Display clear error message: "This OpenAPI spec cannot be loaded due to CORS restrictions. Try: [paste spec JSON directly]"
- Alternative: Allow user to paste spec JSON directly (no fetch needed)
**Warning signs:** Network error immediately after providing spec URL; browser console shows CORS error

### Pitfall 2: Excessive Depth in Detail View

**What goes wrong:** Recursive rendering of deeply nested data causes performance issues or stack overflow
**Why it happens:** Some API responses have 10+ levels of nesting (e.g., tree structures, graph data); recursive React components can exhaust call stack
**How to avoid:**
- Enforce MAX_DEPTH (existing pattern in DynamicRenderer.tsx)
- Start detail modal at depth=0, not inherited depth from table
- Render JsonFallback at max depth (already implemented)
- Consider lowering MAX_DEPTH to 3-4 for detail views (more conservative than root view)
**Warning signs:** Browser hangs when opening detail view; "Maximum call stack size exceeded" error

### Pitfall 3: Modal State Management Complexity

**What goes wrong:** Managing selected item state, modal open/closed, nested navigation becomes tangled
**Why it happens:** Multiple sources of truth (local useState, Zustand store, URL params); race conditions between modal animations and data updates
**How to avoid:**
- Single source of truth in Zustand: `selectedItem: unknown | null`
- Modal open state is derived: `open={!!selectedItem}`
- Close action: `setSelectedItem(null)` (not separate `setModalOpen(false)`)
- No nested modals; if detail has sub-items, replace modal content (or use tabs)
**Warning signs:** Modal opens/closes unexpectedly; selected item data is stale; modal flickers

### Pitfall 4: Treating All Parameters as Query Parameters

**What goes wrong:** Rendering path parameters (e.g., `/users/{userId}`) as form inputs when they're part of URL structure
**Why it happens:** OpenAPI has 4 parameter types (path, query, header, cookie); forms should mainly show query params
**How to avoid:**
- Filter parameters by `param.in === 'query'` for user-editable forms
- Path parameters are filled from route/context, not user input
- Header parameters (like Authorization) are typically set globally, not per-request
- Cookie parameters are browser-managed
**Warning signs:** Form has inputs for URL segments; API calls fail with "required path parameter missing"

### Pitfall 5: OpenAPI Spec Version Mismatch

**What goes wrong:** Parser fails or returns unexpected structure because spec is OpenAPI 3.1 but code assumes 3.0, or Swagger 2.0
**Why it happens:** OpenAPI 3.1 aligned with JSON Schema 2020-12; has breaking changes from 3.0 (e.g., `nullable` vs `type: null`)
**How to avoid:**
- Check spec version: `api.openapi` (3.x) vs `api.swagger` (2.0)
- Use `openapi-types` package types discriminated by version
- @apidevtools/swagger-parser normalizes some differences but not all
- Display spec version in UI for debugging
**Warning signs:** Type errors accessing spec properties; validation passes but rendering fails; schema fields missing

### Pitfall 6: Large OpenAPI Specs Blocking UI

**What goes wrong:** Parsing 5MB OpenAPI spec with hundreds of endpoints freezes UI for seconds
**Why it happens:** SwaggerParser.dereference() is CPU-intensive; runs on main thread
**How to avoid:**
- Show loading skeleton immediately when spec URL submitted
- Parse asynchronously (already async, but ensure no heavy processing before first paint)
- Consider limiting to single operation if spec has 100+ operations (e.g., "Select operation to try")
- Cache parsed specs in Zustand (don't re-parse on every render)
**Warning signs:** UI freezes after submitting spec URL; users report "app is broken"

## Code Examples

Verified patterns from official sources:

### OpenAPI Spec Parsing and Operation Extraction

```typescript
// Source: @apidevtools/swagger-parser documentation
import SwaggerParser from '@apidevtools/swagger-parser'
import type { OpenAPIV3 } from 'openapi-types'

async function loadAndParseSpec(specUrl: string) {
  // Dereference resolves all $ref pointers
  const spec = await SwaggerParser.dereference(specUrl) as OpenAPIV3.Document

  // Extract GET operations (read-only v1)
  const operations: Array<{
    path: string
    method: string
    operation: OpenAPIV3.OperationObject
  }> = []

  for (const [path, pathItem] of Object.entries(spec.paths || {})) {
    if (pathItem?.get) {
      operations.push({
        path,
        method: 'GET',
        operation: pathItem.get
      })
    }
  }

  return { spec, operations }
}
```

### Modal with Backdrop and Animations

```typescript
// Source: Headless UI Dialog documentation
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react'

function DetailModal({
  item,
  schema,
  onClose
}: {
  item: unknown | null
  schema: TypeSignature
  onClose: () => void
}) {
  return (
    <Dialog open={!!item} onClose={onClose} className="relative z-50">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

      {/* Modal positioning */}
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="mx-auto max-w-3xl w-full bg-white rounded-xl shadow-lg p-6 max-h-[80vh] overflow-y-auto">
          <DialogTitle className="text-xl font-bold mb-4">
            Item Details
          </DialogTitle>

          <DynamicRenderer
            data={item}
            schema={schema}
            path="$.selected"
            depth={0}  // Reset depth for detail view
          />

          <button
            onClick={onClose}
            className="mt-6 px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
          >
            Close
          </button>
        </DialogPanel>
      </div>
    </Dialog>
  )
}
```

### Collapsible Nested Array Renderer

```typescript
// Source: Headless UI Disclosure + existing renderer patterns
import { Disclosure, DisclosureButton, DisclosurePanel } from '@headlessui/react'

function NestedArrayRenderer({ data, schema, path, depth }: RendererProps) {
  if (!Array.isArray(data)) return <div className="text-red-500">Expected array</div>
  if (data.length === 0) return <div className="text-gray-500 italic">Empty array</div>

  const itemSchema = schema.kind === 'array' ? schema.items : { kind: 'primitive', type: 'unknown' }

  // For small arrays, show inline; for large arrays, show collapsed
  const shouldCollapse = data.length > 3

  if (!shouldCollapse) {
    return (
      <div className="space-y-2">
        {data.map((item, i) => (
          <div key={i} className="border-l-2 border-blue-200 pl-3">
            <DynamicRenderer
              data={item}
              schema={itemSchema}
              path={`${path}[${i}]`}
              depth={depth + 1}
            />
          </div>
        ))}
      </div>
    )
  }

  return (
    <Disclosure defaultOpen={false}>
      <DisclosureButton className="flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm">
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
        Show {data.length} items
      </DisclosureButton>
      <DisclosurePanel className="mt-2 space-y-2">
        {data.map((item, i) => (
          <div key={i} className="border-l-2 border-blue-200 pl-3">
            <DynamicRenderer
              data={item}
              schema={itemSchema}
              path={`${path}[${i}]`}
              depth={depth + 1}
            />
          </div>
        ))}
      </DisclosurePanel>
    </Disclosure>
  )
}
```

### OpenAPI Parameter Type Mapping

```typescript
// Source: OpenAPI 3.1 spec + React input best practices
import type { OpenAPIV3 } from 'openapi-types'

interface ParameterInputProps {
  parameter: OpenAPIV3.ParameterObject
  value: string
  onChange: (value: string) => void
}

function getInputType(schema: OpenAPIV3.SchemaObject): string {
  if (schema.enum) return 'select'

  switch (schema.type) {
    case 'integer':
    case 'number':
      return 'number'
    case 'boolean':
      return 'checkbox'
    case 'string':
      if (schema.format === 'date') return 'date'
      if (schema.format === 'date-time') return 'datetime-local'
      if (schema.format === 'password') return 'password'
      if (schema.format === 'email') return 'email'
      if (schema.format === 'uri') return 'url'
      return 'text'
    default:
      return 'text'
  }
}

function ParameterInput({ parameter, value, onChange }: ParameterInputProps) {
  const schema = (parameter.schema || {}) as OpenAPIV3.SchemaObject
  const inputType = getInputType(schema)

  const baseClasses = "w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"

  if (inputType === 'select' && schema.enum) {
    return (
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={baseClasses}
      >
        <option value="">Select...</option>
        {schema.enum.map(val => (
          <option key={String(val)} value={String(val)}>
            {String(val)}
          </option>
        ))}
      </select>
    )
  }

  if (inputType === 'checkbox') {
    return (
      <input
        type="checkbox"
        checked={value === 'true'}
        onChange={(e) => onChange(String(e.target.checked))}
        className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
      />
    )
  }

  return (
    <input
      type={inputType}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={schema.default ? String(schema.default) : undefined}
      min={schema.minimum}
      max={schema.maximum}
      className={baseClasses}
    />
  )
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual $ref resolution | @apidevtools/swagger-parser.dereference() | Established ~2018 | Industry standard; handles all edge cases |
| react-modal library | Headless UI Dialog | 2021 (Headless UI v1.0) | Better accessibility, composable, Tailwind-native |
| details/summary HTML | Headless UI Disclosure | 2021+ | Better React integration, animations, controlled state |
| Class-based modals | Function components + hooks | React 16.8 (2019) | Simpler code, better state management |
| Swagger 2.0 only | OpenAPI 3.0/3.1 support | 2017-2021 | Most APIs migrated to OpenAPI 3.x by 2023 |

**Deprecated/outdated:**
- `react-modal`: Still works but Headless UI is more modern; react-modal has class-based patterns
- `swagger-parser` (npm package without @apidevtools scope): Unmaintained; use @apidevtools/swagger-parser
- `@scalar/openapi-parser`: Archived 8/2024, moved to monorepo; use @apidevtools/swagger-parser instead
- CSS-only details/summary for collapsible sections: Works but not animation-friendly; Headless UI Disclosure is better for React apps

## Open Questions

Things that couldn't be fully resolved:

1. **OpenAPI 3.1 vs 3.0 schema differences**
   - What we know: @apidevtools/swagger-parser supports both; 3.1 uses JSON Schema 2020-12, 3.0 has diverged schema
   - What's unclear: Does parser normalize differences automatically, or do we need version-specific code paths?
   - Recommendation: Test with both versions during implementation; likely need version check only for edge cases

2. **Performance of modal animations with large detail data**
   - What we know: Headless UI Dialog has no built-in animations; Tailwind CSS transitions are CSS-based (performant)
   - What's unclear: Does rendering 1000-row nested table inside modal cause jank during open/close animation?
   - Recommendation: Implement without animations first; add CSS transitions if performance is acceptable

3. **Optimal MAX_DEPTH for detail views**
   - What we know: Existing MAX_DEPTH=5 works for root view; detail view may need different limit
   - What's unclear: User expectation for depth in detail modal vs. root table
   - Recommendation: Start with same MAX_DEPTH=5; make configurable per-renderer if needed

4. **Handling OpenAPI specs with 100+ operations**
   - What we know: Large specs parse successfully but UI may be cluttered with operation list
   - What's unclear: Should v1 support operation selection, or just auto-use first GET operation?
   - Recommendation: Auto-use first GET operation for v1; add operation picker in later phase if needed

## Sources

### Primary (HIGH confidence)

- [APIDevTools/swagger-parser GitHub](https://github.com/APIDevTools/swagger-parser) - OpenAPI parsing library documentation
- [@apidevtools/swagger-parser npm](https://www.npmjs.com/package/@apidevtools/swagger-parser) - Installation and version info
- [Headless UI Dialog documentation](https://headlessui.com/react/dialog) - React modal component API
- [Headless UI React v2.2.9+ npm](https://www.npmjs.com/package/@headlessui/react) - React 19 compatibility confirmed
- [OpenAPI Specification v3.1.0](https://spec.openapis.org/oas/v3.1.0.html) - Official parameter types, schema formats
- [@readme/openapi-parser GitHub](https://github.com/readmeio/openapi-parser) - Alternative parser analysis

### Secondary (MEDIUM confidence)

- [APIs You Won't Hate: OpenAPI Bundling Tools Compared](https://apisyouwonthate.com/blog/openapi-bundling-tools-compared-blog-post/) - Comparison of OpenAPI tooling
- [MUI Data Grid Master-Detail](https://mui.com/x/react-data-grid/master-detail/) - Master-detail pattern examples
- [shadcn/ui Drawer](https://www.shadcn.io/ui/drawer) - Modern drawer component patterns
- [React Hook Form Dynamic Forms](https://www.syncfusion.com/blogs/post/dynamic-forms-react-hook-forms) - Form generation patterns
- [Headless UI GitHub Issues - React 19 compatibility](https://github.com/tailwindlabs/headlessui/issues/3167) - Compatibility status
- [LogRocket: Focus Trap React](https://blog.logrocket.com/build-accessible-modal-focus-trap-react/) - Accessibility patterns

### Tertiary (LOW confidence)

- Web search results for "OpenAPI parameters to form controls" - No canonical mapping table found; derived from spec + community patterns
- Web search results for "recursive tree React max depth" - General patterns, not OpenAPI-specific
- Performance comparisons (map vs for loop) - General JS, not critical to this phase

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - @apidevtools/swagger-parser is battle-tested (1,500+ APIs), Headless UI is official Tailwind companion, both have active maintenance
- Architecture: HIGH - Patterns verified from official docs, align with existing Phase 1 architecture (Zustand store, component registry, DynamicRenderer depth tracking)
- Pitfalls: MEDIUM-HIGH - CORS issues are known from Phase 1; depth/performance pitfalls are inferred from general React patterns + OpenAPI complexity; modal state management is best practice but not OpenAPI-specific

**Research date:** 2026-02-01
**Valid until:** ~30 days (stable ecosystem; OpenAPI spec is mature standard; Headless UI is stable v2.x)
