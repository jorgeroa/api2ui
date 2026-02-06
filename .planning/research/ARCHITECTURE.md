# Architecture Research: v1.2 Smart Parameters & Layout System

**Researched:** 2026-02-05
**Confidence:** HIGH
**Context:** Subsequent milestone — extending existing api2ui architecture

## Summary

The Smart Parameters & Layout System milestone adds four key capabilities to api2ui: (1) parsing raw URL query strings into the same `ParsedParameter[]` format used by OpenAPI, (2) smart type inference to automatically detect parameter types from query string values, (3) parameter value persistence per-endpoint for better UX, and (4) layout preset switching between sidebar and centered layouts. All features integrate cleanly with the existing architecture by extending existing components rather than introducing parallel systems.

**Key integration principle:** New features extend the existing pipeline rather than creating parallel code paths. Query string parsing produces the same `ParsedParameter[]` format that OpenAPI parsing uses, smart type inference extends the existing `ParameterInput` component type mapping, parameter persistence leverages the existing `configStore` pattern, and layout switching builds on the existing two-layout structure in `App.tsx`.

## Integration Points

### Query String Parsing → Unified Parameter Model

**Current state:**
- `parser.ts` has `parseParameter()` function that converts OpenAPI parameter definitions to `ParsedParameter[]`
- `ParameterForm.tsx` consumes `ParsedParameter[]` and renders form inputs
- `ParameterInput.tsx` maps parameter types to input components

**Integration approach:**
Create a new parser that converts URL query strings to the **same** `ParsedParameter[]` format:

```typescript
// NEW: services/querystring/parser.ts
function parseQueryString(url: string): ParsedParameter[] {
  const urlObj = new URL(url)
  const params: ParsedParameter[] = []

  urlObj.searchParams.forEach((value, name) => {
    params.push({
      name,
      in: 'query',
      required: false,  // All query params default to optional
      description: '',
      schema: inferTypeFromValue(value)  // Smart type inference
    })
  })

  return params
}
```

**Data flow:**
```
Raw URL with query string
    ↓
parseQueryString() → ParsedParameter[]
    ↓
ParameterForm.tsx (EXISTING, no changes)
    ↓
ParameterInput.tsx (EXISTING, renders correctly)
```

**Why this works:**
`ParsedParameter[]` is already the unified format. Both OpenAPI parameters and query string parameters produce the same structure, so downstream components (ParameterForm, ParameterInput) need **zero** changes to support query string parameters.

**Build order:**
1. Create `services/querystring/parser.ts` with `parseQueryString()` function
2. Create `services/querystring/inferrer.ts` with `inferTypeFromValue()` utility
3. Modify `useAPIFetch.ts` to detect query strings and call `parseQueryString()`
4. Store parsed parameters in `appStore.parsedSpec.operations[0].parameters`

**Architectural benefit:**
- No duplicate form rendering code
- Type inference is isolated in one utility
- Existing parameter validation/submission logic reused

### Smart Type Inference Layer

**Current state:**
- `ParameterInput.tsx` has type-to-component mapping based on `schema.type` and `schema.format`
- Supports: string, number, integer, boolean, date, date-time, email, uri, enum
- Always uses schema from OpenAPI spec (explicit types)

**Integration approach:**
Add type inference **before** the parameter reaches ParameterInput:

```typescript
// NEW: services/querystring/inferrer.ts
function inferTypeFromValue(value: string): ParsedParameter['schema'] {
  // Boolean inference
  if (value === 'true' || value === 'false') {
    return { type: 'boolean', example: value }
  }

  // Number inference
  if (/^-?\d+$/.test(value)) {
    return { type: 'integer', example: value }
  }
  if (/^-?\d+\.\d+$/.test(value)) {
    return { type: 'number', example: value }
  }

  // Date inference
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return { type: 'string', format: 'date', example: value }
  }

  // Email inference
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    return { type: 'string', format: 'email', example: value }
  }

  // URL inference
  if (/^https?:\/\//.test(value)) {
    return { type: 'string', format: 'uri', example: value }
  }

  // Default: string
  return { type: 'string', example: value }
}
```

**Why this approach:**
- Inference happens during parsing, producing a complete `schema` object
- ParameterInput receives the same schema structure it already expects
- No "if query string, do X; if OpenAPI, do Y" logic in rendering layer
- Type inference is **pure function** — easy to test

**Extended ParameterInput (optional enhancement):**
For query strings with multiple values of the same type, we could detect arrays:

```typescript
// Enhanced: services/querystring/parser.ts
function parseQueryString(url: string): ParsedParameter[] {
  const urlObj = new URL(url)
  const paramMap = new Map<string, string[]>()

  // Group values by param name
  urlObj.searchParams.forEach((value, name) => {
    const existing = paramMap.get(name) || []
    paramMap.set(name, [...existing, value])
  })

  const params: ParsedParameter[] = []
  paramMap.forEach((values, name) => {
    if (values.length > 1) {
      // Multiple values → detect as enum
      params.push({
        name,
        in: 'query',
        required: false,
        description: `Detected ${values.length} possible values`,
        schema: {
          type: 'string',
          enum: values,
          example: values[0]
        }
      })
    } else {
      // Single value → infer type
      params.push({
        name,
        in: 'query',
        required: false,
        description: '',
        schema: inferTypeFromValue(values[0])
      })
    }
  })

  return params
}
```

**Build order:**
1. Implement basic `inferTypeFromValue()` with primitives (boolean, number, string)
2. Add format detection (date, email, uri)
3. Add enum detection for multi-value params (optional)
4. Test with diverse query strings

**Architectural benefit:**
- Type inference is **centralized** in one utility
- Easy to extend with new patterns (e.g., UUID detection)
- No special-casing in ParameterInput component

### Parameter Persistence → Extend configStore

**Current state:**
- `appStore.ts`: Session-only state (loading, data, schema, parameterValues)
- `configStore.ts`: Persisted preferences (fieldConfigs, styleOverrides, theme, paginationConfigs)
- `configStore` uses Zustand persist middleware with localStorage

**Decision: Use configStore, not appStore**

**Rationale:**
- **User expectation:** Parameter values should persist across sessions (like other preferences)
- **Existing pattern:** configStore already persists per-endpoint data (endpointOverrides, paginationConfigs)
- **Key structure:** configStore already uses path-based keys (e.g., `paginationConfigs[path]`)

**Integration approach:**
Extend configStore with a new `parameterDefaults` object:

```typescript
// MODIFIED: store/configStore.ts
interface ConfigStore extends ConfigState {
  // ... existing methods

  // NEW: Parameter defaults
  setParameterDefault: (endpoint: string, paramName: string, value: string) => void
  getParameterDefaults: (endpoint: string) => Record<string, string>
  clearParameterDefaults: (endpoint: string) => void
}

interface ConfigState {
  // ... existing state

  // NEW: Persisted parameter defaults keyed by endpoint
  parameterDefaults: Record<string, Record<string, string>>
  // Example: { "/users": { "limit": "20", "sort": "name" } }
}
```

**Key structure:**
- **Outer key:** Endpoint path (e.g., `/users`, `/posts/{id}`)
- **Inner object:** Parameter name → default value
- **Persistence:** Included in Zustand persist middleware

**Modified ParameterForm initialization:**

```typescript
// MODIFIED: components/forms/ParameterForm.tsx
export function ParameterForm({ parameters, endpoint, onSubmit }: ParameterFormProps) {
  const { getParameterDefaults } = useConfigStore()

  const [values, setValues] = useState<Record<string, string>>(() => {
    const persisted = getParameterDefaults(endpoint)  // NEW: Load from configStore
    const initial: Record<string, string> = {}

    for (const param of parameters) {
      // Priority: persisted > schema.default > schema.example > empty
      initial[param.name] =
        persisted[param.name] ??
        (param.schema.default !== undefined ? String(param.schema.default) : '') ||
        (param.schema.example !== undefined ? String(param.schema.example) : '') ||
        ''
    }
    return initial
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // NEW: Persist parameter values on submit
    const { setParameterDefault } = useConfigStore.getState()
    Object.entries(values).forEach(([name, value]) => {
      if (value) {  // Only persist non-empty values
        setParameterDefault(endpoint, name, value)
      }
    })

    onSubmit(values)
  }

  // ... rest of component unchanged
}
```

**Why this storage strategy:**
- **Per-endpoint isolation:** Different endpoints can have different defaults for same parameter name (e.g., `limit`)
- **Selective persistence:** Empty values not persisted (avoids clutter)
- **Backwards compatible:** Existing configStore persist logic handles new field automatically
- **Clear separation:** appStore = runtime data, configStore = user preferences

**Build order:**
1. Add `parameterDefaults` to ConfigState interface
2. Implement `setParameterDefault`, `getParameterDefaults`, `clearParameterDefaults` in configStore
3. Update `partialize` in persist middleware to include `parameterDefaults`
4. Modify ParameterForm to load from configStore on mount
5. Modify ParameterForm to save to configStore on submit

**Architectural benefit:**
- Consistent with existing persistence patterns
- No new storage mechanism needed
- Zustand persist middleware handles serialization/hydration
- Easy to add UI for clearing parameter history later

### Layout System → Modify App.tsx

**Current state:**
- `App.tsx` has two layout branches:
  - **Sidebar layout:** When `parsedSpec` has 2+ operations (line 97-194)
  - **Centered layout:** Single operation or direct URL (line 196-317)
- Layout choice is **derived** from data, not user preference
- No state management for layout preferences

**Integration approach:**
Add layout preset selection to configStore and conditional rendering in App.tsx:

```typescript
// MODIFIED: types/config.ts
export type LayoutPreset = 'auto' | 'sidebar' | 'centered'

export interface ConfigState {
  // ... existing state

  // NEW: Layout preference
  layoutPreset: LayoutPreset  // Default: 'auto'
}
```

```typescript
// MODIFIED: store/configStore.ts
export const useConfigStore = create<ConfigStore>()(
  persist(
    (set, get) => ({
      // ... existing state
      layoutPreset: 'auto' as LayoutPreset,

      // NEW: Layout methods
      setLayoutPreset: (preset) => set({ layoutPreset: preset }),

      // ... existing methods
    }),
    {
      name: 'api2ui-config',
      version: 3,  // Increment version for migration
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        // ... existing partialize fields
        layoutPreset: state.layoutPreset,  // NEW: Persist layout
      }),
      // ... existing merge
    }
  )
)
```

```typescript
// MODIFIED: App.tsx
function App() {
  const { layoutPreset } = useConfigStore()
  const { parsedSpec } = useAppStore()

  // Derive layout choice from preference + data
  const hasMultipleOperations = parsedSpec !== null && parsedSpec.operations.length >= 2

  const shouldShowSidebar =
    layoutPreset === 'sidebar' ? true :
    layoutPreset === 'centered' ? false :
    hasMultipleOperations  // 'auto' mode: use existing logic

  return (
    <>
      {/* Existing ThemeApplier, ConfigToggle, etc. */}

      {shouldShowSidebar ? (
        // Existing sidebar layout (unchanged)
        <div className="flex min-h-screen bg-background text-text">
          <Sidebar ... />
          <main ...>
            {/* Existing content */}
          </main>
        </div>
      ) : (
        // Existing centered layout (unchanged)
        <div className="min-h-screen bg-background text-text py-8 px-4">
          {/* Existing content */}
        </div>
      )}

      {/* NEW: Layout preset selector (in ConfigPanel or header) */}
      <ConfigPanel />
    </>
  )
}
```

**Layout preset selector UI:**

```typescript
// NEW: components/config/LayoutPresetSelector.tsx
export function LayoutPresetSelector() {
  const { layoutPreset, setLayoutPreset } = useConfigStore()

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Layout</label>
      <div className="flex gap-2">
        <button
          onClick={() => setLayoutPreset('auto')}
          className={`px-3 py-2 rounded ${layoutPreset === 'auto' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
        >
          Auto
        </button>
        <button
          onClick={() => setLayoutPreset('sidebar')}
          className={`px-3 py-2 rounded ${layoutPreset === 'sidebar' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
        >
          Sidebar
        </button>
        <button
          onClick={() => setLayoutPreset('centered')}
          className={`px-3 py-2 rounded ${layoutPreset === 'centered' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
        >
          Centered
        </button>
      </div>
      <p className="text-xs text-gray-500">
        Auto: Sidebar for 2+ endpoints, centered otherwise
      </p>
    </div>
  )
}
```

**Why this approach:**
- **Preserves existing logic:** Auto mode maintains current behavior (no breaking change)
- **User override capability:** Sidebar/Centered modes let user force a layout
- **Minimal modification:** App.tsx only changes layout selection logic, not layout structure
- **Persistent preference:** Layout choice saved in configStore

**Build order:**
1. Add `LayoutPreset` type and `layoutPreset` state to configStore
2. Add `setLayoutPreset` method to configStore
3. Update configStore persist config to include `layoutPreset`
4. Modify App.tsx layout selection logic
5. Create `LayoutPresetSelector` component
6. Add selector to ConfigPanel

**Architectural benefit:**
- Existing layout code unchanged (no risk of breaking existing functionality)
- Layout preference treated as configuration (consistent with other settings)
- Easy to extend with additional layouts later (e.g., 'compact', 'wide')

## New Components/Services

### Services (Data Layer)

| File | Purpose | Exports |
|------|---------|---------|
| `services/querystring/parser.ts` | Parse URL query strings to ParsedParameter[] | `parseQueryString(url: string): ParsedParameter[]` |
| `services/querystring/inferrer.ts` | Infer parameter types from values | `inferTypeFromValue(value: string): ParameterSchema` |
| `services/querystring/__tests__/parser.test.ts` | Unit tests for query string parsing | Test suite |
| `services/querystring/__tests__/inferrer.test.ts` | Unit tests for type inference | Test suite |

### Components (UI Layer)

| File | Purpose | Props |
|------|---------|-------|
| `components/config/LayoutPresetSelector.tsx` | UI for switching layout presets | None (uses configStore) |
| `components/config/ParameterHistory.tsx` | (Optional) UI for viewing/clearing persisted params | `endpoint: string` |

### Types

| File | Purpose | Exports |
|------|---------|---------|
| `types/querystring.ts` | (Optional) Type definitions if needed | Query string-specific types |

## Modified Components

### Critical Path (Must Modify)

| File | Modification | Rationale |
|------|-------------|-----------|
| `store/configStore.ts` | Add `parameterDefaults` and `layoutPreset` state + methods | Persistence for parameter values and layout preference |
| `hooks/useAPIFetch.ts` | Detect query strings, call `parseQueryString()` | Entry point for query string parsing |
| `App.tsx` | Update layout selection logic to use `layoutPreset` | Enable layout switching |
| `components/forms/ParameterForm.tsx` | Load initial values from configStore, persist on submit | Parameter persistence |
| `types/config.ts` | Add `LayoutPreset` type and extend `ConfigState` | Type safety for new features |

### Optional Enhancements

| File | Modification | Rationale |
|------|-------------|-----------|
| `components/config/ConfigPanel.tsx` | Add LayoutPresetSelector and ParameterHistory sections | UI for new features |
| `components/forms/ParameterInput.tsx` | Add visual indicator for persisted values | User feedback |

## Data Flow

### Query String Parsing Flow

```
User enters URL with query string
  ↓
URLInput component → setUrl() → appStore.url
  ↓
useAPIFetch.fetchAndInfer(url)
  ↓
  ├─ Detect query string: parseQueryString(url)
  │    ↓
  │    ├─ Parse URLSearchParams
  │    ├─ inferTypeFromValue() for each param
  │    └─ Return ParsedParameter[]
  │
  ├─ Create mock ParsedSpec with parsed parameters
  │    spec = {
  │      title: 'Query String Parameters',
  │      operations: [{
  │        path: pathname,
  │        parameters: parsedParams  ← ParsedParameter[]
  │      }]
  │    }
  │
  └─ appStore.specSuccess(spec)
       ↓
App.tsx renders ParameterForm
  ↓
ParameterForm loads defaults from configStore.parameterDefaults[endpoint]
  ↓
User modifies values, submits
  ↓
ParameterForm.handleSubmit()
  ├─ Persist values: configStore.setParameterDefault()
  └─ Fetch API: fetchOperation()
```

### Layout Switching Flow

```
User opens ConfigPanel
  ↓
LayoutPresetSelector displays current layoutPreset
  ↓
User clicks "Sidebar" button
  ↓
configStore.setLayoutPreset('sidebar')
  ↓
  ├─ Update state: layoutPreset = 'sidebar'
  ├─ Persist to localStorage (Zustand persist middleware)
  └─ Trigger React re-render
       ↓
App.tsx re-renders
  ↓
shouldShowSidebar = layoutPreset === 'sidebar' ? true : ...
  ↓
Render sidebar layout (even if only 1 operation)
```

### Parameter Persistence Flow

```
First visit to endpoint
  ↓
ParameterForm initializes
  ↓
configStore.getParameterDefaults(endpoint) → {}
  ↓
Use schema.default or schema.example
  ↓
User fills form, submits
  ↓
configStore.setParameterDefault(endpoint, paramName, value)
  ↓
Values saved to localStorage

Second visit to same endpoint
  ↓
ParameterForm initializes
  ↓
configStore.getParameterDefaults(endpoint) → { "limit": "20", "sort": "name" }
  ↓
Form pre-filled with previous values
```

## Build Order

Suggested implementation sequence that respects dependencies:

### Phase 1: Query String Parsing (Foundation)

**Goal:** Parse query strings into ParsedParameter[] format

1. Create `services/querystring/inferrer.ts`
   - Implement `inferTypeFromValue()` with basic types (string, number, boolean)
   - Add format detection (date, email, uri)
   - Write unit tests

2. Create `services/querystring/parser.ts`
   - Implement `parseQueryString()` using URLSearchParams
   - Call inferrer for each parameter
   - Handle multi-value params (enum detection)
   - Write unit tests

3. Modify `hooks/useAPIFetch.ts`
   - Add query string detection heuristic
   - Call `parseQueryString()` when query string detected
   - Create mock ParsedSpec with parsed parameters
   - Store in appStore

**Validation:** Enter URL with query string → See parameter form with inferred types

### Phase 2: Parameter Persistence

**Goal:** Remember parameter values across sessions

4. Extend `types/config.ts`
   - Add `parameterDefaults: Record<string, Record<string, string>>` to ConfigState

5. Modify `store/configStore.ts`
   - Add `parameterDefaults` state
   - Implement `setParameterDefault()`, `getParameterDefaults()`, `clearParameterDefaults()`
   - Update `partialize` to include `parameterDefaults`
   - Increment version to 3 for migration

6. Modify `components/forms/ParameterForm.tsx`
   - Add `endpoint: string` prop
   - Load initial values from `configStore.getParameterDefaults(endpoint)`
   - Persist values on submit via `setParameterDefault()`

**Validation:** Submit parameters → Reload page → Form pre-filled with previous values

### Phase 3: Layout System

**Goal:** Allow user to switch between sidebar and centered layouts

7. Extend `types/config.ts`
   - Add `LayoutPreset` type
   - Add `layoutPreset: LayoutPreset` to ConfigState

8. Modify `store/configStore.ts`
   - Add `layoutPreset` state (default: 'auto')
   - Implement `setLayoutPreset()`
   - Update `partialize` to include `layoutPreset`

9. Modify `App.tsx`
   - Calculate `shouldShowSidebar` based on `layoutPreset` + data
   - Keep existing layout structures unchanged

10. Create `components/config/LayoutPresetSelector.tsx`
    - Radio buttons for auto/sidebar/centered
    - Visual preview icons
    - Help text explaining each mode

11. Modify `components/config/ConfigPanel.tsx`
    - Add LayoutPresetSelector section

**Validation:** Change layout preset → Layout switches immediately and persists across reload

### Phase 4: Polish & Optional Enhancements

12. (Optional) Create `components/config/ParameterHistory.tsx`
    - Show saved parameter values for current endpoint
    - Allow clearing individual parameters or all defaults

13. (Optional) Enhance `components/forms/ParameterInput.tsx`
    - Visual indicator (badge/icon) for parameters with persisted values
    - Tooltip showing last submitted value

14. (Optional) Add enum detection for repeated query params
    - Extend parser to detect `?tag=foo&tag=bar` → enum schema

## Architectural Patterns

### Pattern 1: Format Convergence

**What:** Convert diverse input formats to unified internal representation early in the pipeline

**Where:** Query string parsing produces ParsedParameter[], same as OpenAPI parsing

**Why:**
- Downstream components don't need to know data source
- Eliminates conditional rendering logic
- Makes adding new parameter sources trivial (GraphQL introspection, gRPC reflection, etc.)

**Example:**
```typescript
// Good: Unified format
const params = isQueryString(url)
  ? parseQueryString(url)  // → ParsedParameter[]
  : parseOpenAPIParams(spec)  // → ParsedParameter[]

renderForm(params)  // Same rendering code

// Bad: Source-specific rendering
if (isQueryString(url)) {
  renderQueryStringForm(url)
} else {
  renderOpenAPIForm(spec)
}
```

### Pattern 2: Store Separation by Volatility

**What:** Session-only data in appStore, persistent preferences in configStore

**Where:**
- appStore: loading, error, data, schema (runtime state)
- configStore: parameterDefaults, layoutPreset, fieldConfigs (user preferences)

**Why:**
- Clear mental model: "What should survive a refresh?"
- Prevents accidental persistence of sensitive data (API responses)
- Makes state serialization predictable

**Example:**
```typescript
// Good: Volatile data in appStore
const { data, loading, error } = useAppStore()

// Good: Persistent preferences in configStore
const { layoutPreset, parameterDefaults } = useConfigStore()

// Bad: Mixing persistence models
const { data, layoutPreset } = useMixedStore()  // Confusing!
```

### Pattern 3: Derived Layout State

**What:** Layout choice is computed from preference + data, not stored independently

**Where:** App.tsx calculates `shouldShowSidebar` from `layoutPreset` and `parsedSpec`

**Why:**
- Single source of truth (layoutPreset in configStore)
- Auto mode can intelligently choose layout based on data
- No sync issues between stored layout and actual layout

**Example:**
```typescript
// Good: Derived state
const shouldShowSidebar =
  layoutPreset === 'sidebar' ? true :
  layoutPreset === 'centered' ? false :
  hasMultipleOperations  // Auto mode

// Bad: Independent state
const [layoutPreset, setLayoutPreset] = useState('auto')
const [actualLayout, setActualLayout] = useState('sidebar')  // Can desync!
```

### Pattern 4: Progressive Type Inference

**What:** Start with basic type detection, refine with additional patterns over time

**Where:** `inferTypeFromValue()` has clear extension points for new patterns

**Why:**
- Delivers value quickly (basic inference works day 1)
- Easy to add specialized detection (UUID, ISO timestamps, etc.)
- Testable incrementally (each pattern is independent)

**Example:**
```typescript
// Good: Extensible inference
function inferTypeFromValue(value: string): ParameterSchema {
  if (isBooleanPattern(value)) return { type: 'boolean' }
  if (isNumberPattern(value)) return { type: 'number' }
  if (isDatePattern(value)) return { type: 'string', format: 'date' }
  if (isEmailPattern(value)) return { type: 'string', format: 'email' }
  // Easy to add:
  // if (isUUIDPattern(value)) return { type: 'string', format: 'uuid' }
  return { type: 'string' }
}

// Bad: Monolithic inference
function inferType(value) {
  // 500 lines of regex spaghetti
}
```

### Pattern 5: Persistence Granularity

**What:** Persist at endpoint granularity, not globally

**Where:** `parameterDefaults` keyed by endpoint path

**Why:**
- Different endpoints often have same parameter name but different semantics (limit, offset)
- Prevents wrong defaults being applied to unrelated endpoints
- Allows per-endpoint clearing of history

**Example:**
```typescript
// Good: Per-endpoint persistence
parameterDefaults: {
  "/users": { "limit": "20", "sort": "name" },
  "/posts": { "limit": "10", "sort": "date" }
}

// Bad: Global persistence
parameterDefaults: {
  "limit": "20",  // Which endpoint is this for?
  "sort": "name"  // Could be wrong for /posts
}
```

## Anti-Patterns to Avoid

### Anti-Pattern 1: Parallel Rendering Paths

**What:** Separate rendering logic for query string vs. OpenAPI parameters

**Why bad:**
- Code duplication
- Behavior divergence over time
- Testing burden doubles

**Instead:** Use format convergence pattern — parse both sources to ParsedParameter[]

**Detection:** If you see `if (isQueryString) { renderQueryStringForm() }` you've violated this

### Anti-Pattern 2: Premature Type Detection

**What:** Complex heuristics trying to detect every possible type on day 1

**Why bad:**
- Over-engineering
- High false positive rate (e.g., "123" could be string ID, not number)
- Complexity blocks shipping

**Instead:** Start with conservative inference (boolean, number, string), add patterns incrementally based on real usage

**Detection:** If your inferrer has >10 type patterns before shipping v1, you're over-engineering

### Anti-Pattern 3: Layout State Duplication

**What:** Storing both `layoutPreset` and `currentLayout` separately

**Why bad:**
- Sync issues (what if they disagree?)
- Unclear source of truth
- Extra state to manage

**Instead:** Store preference only, derive actual layout from preference + data

**Detection:** If you have two pieces of state that both influence layout, you've duplicated

### Anti-Pattern 4: Mixing Parameter Sources in Store

**What:** Storing query string parameters differently from OpenAPI parameters

**Why bad:**
- Components need to know source to render correctly
- Can't switch between sources without data migration
- Violates format convergence pattern

**Instead:** Store all parameters as ParsedParameter[] regardless of source

**Detection:** If appStore has separate fields for queryParams and openapiParams, you've violated this

### Anti-Pattern 5: Global Parameter Persistence

**What:** Persisting parameter values globally, not per-endpoint

**Why bad:**
- Same parameter name means different things on different endpoints
- Wrong defaults applied when switching endpoints
- No way to clear per-endpoint history

**Instead:** Key persistence by endpoint path

**Detection:** If clearing parameter history affects all endpoints, you've gone global incorrectly

## Testing Strategy

### Unit Tests

**Query String Parser:**
```typescript
describe('parseQueryString', () => {
  it('parses simple query string', () => {
    const params = parseQueryString('https://api.example.com/users?limit=10')
    expect(params).toMatchObject([
      { name: 'limit', schema: { type: 'integer', example: '10' } }
    ])
  })

  it('detects boolean values', () => {
    const params = parseQueryString('https://api.example.com/users?active=true')
    expect(params[0].schema.type).toBe('boolean')
  })

  it('handles multi-value params as enum', () => {
    const params = parseQueryString('https://api.example.com/users?tag=foo&tag=bar')
    expect(params[0].schema.enum).toEqual(['foo', 'bar'])
  })
})
```

**Type Inferrer:**
```typescript
describe('inferTypeFromValue', () => {
  it('infers boolean from true/false', () => {
    expect(inferTypeFromValue('true')).toMatchObject({ type: 'boolean' })
  })

  it('infers integer from digits', () => {
    expect(inferTypeFromValue('123')).toMatchObject({ type: 'integer' })
  })

  it('infers date format from ISO date', () => {
    expect(inferTypeFromValue('2026-02-05')).toMatchObject({
      type: 'string',
      format: 'date'
    })
  })
})
```

**ConfigStore:**
```typescript
describe('configStore parameter persistence', () => {
  it('persists parameter defaults', () => {
    const { setParameterDefault, getParameterDefaults } = useConfigStore.getState()

    setParameterDefault('/users', 'limit', '20')
    const defaults = getParameterDefaults('/users')

    expect(defaults).toEqual({ limit: '20' })
  })

  it('isolates defaults by endpoint', () => {
    const { setParameterDefault, getParameterDefaults } = useConfigStore.getState()

    setParameterDefault('/users', 'limit', '20')
    setParameterDefault('/posts', 'limit', '10')

    expect(getParameterDefaults('/users').limit).toBe('20')
    expect(getParameterDefaults('/posts').limit).toBe('10')
  })
})
```

### Integration Tests

**Query String to Form Rendering:**
```typescript
describe('Query string to parameter form', () => {
  it('renders parameter form from query string', async () => {
    const { fetchAndInfer } = useAPIFetch()

    await fetchAndInfer('https://api.example.com/users?limit=10&sort=name')

    const { parsedSpec } = useAppStore.getState()
    expect(parsedSpec.operations[0].parameters).toHaveLength(2)
    expect(parsedSpec.operations[0].parameters[0].name).toBe('limit')
  })
})
```

**Parameter Persistence:**
```typescript
describe('Parameter persistence across sessions', () => {
  it('pre-fills form with previous values', () => {
    const { setParameterDefault } = useConfigStore.getState()
    setParameterDefault('/users', 'limit', '50')

    render(<ParameterForm endpoint="/users" parameters={mockParams} onSubmit={jest.fn()} />)

    expect(screen.getByDisplayValue('50')).toBeInTheDocument()
  })
})
```

**Layout Switching:**
```typescript
describe('Layout preset switching', () => {
  it('forces sidebar layout when preset is sidebar', () => {
    const { setLayoutPreset } = useConfigStore.getState()
    setLayoutPreset('sidebar')

    render(<App />)

    expect(screen.getByRole('navigation')).toBeInTheDocument()  // Sidebar present
  })
})
```

### E2E Tests

**Full Query String Flow:**
```typescript
test('User enters URL with query string, sees form, submits, values persist', async () => {
  // Enter URL with query string
  await userEvent.type(screen.getByRole('textbox'), 'https://api.example.com/users?limit=10')
  await userEvent.click(screen.getByText('Fetch'))

  // Verify form rendered with inferred types
  expect(screen.getByLabelText('limit')).toHaveAttribute('type', 'number')

  // Change value and submit
  await userEvent.clear(screen.getByLabelText('limit'))
  await userEvent.type(screen.getByLabelText('limit'), '20')
  await userEvent.click(screen.getByText('Fetch Data'))

  // Reload page
  window.location.reload()

  // Verify value persisted
  expect(screen.getByDisplayValue('20')).toBeInTheDocument()
})
```

## Migration Strategy

### ConfigStore Version Migration

Since we're adding new fields to configStore, increment the version and handle migration:

```typescript
// store/configStore.ts
{
  name: 'api2ui-config',
  version: 3,  // Increment from 2 to 3
  storage: createJSONStorage(() => localStorage),
  partialize: (state) => ({
    fieldConfigs: state.fieldConfigs,
    drilldownMode: state.drilldownMode,
    globalTheme: state.globalTheme,
    styleOverrides: state.styleOverrides,
    endpointOverrides: state.endpointOverrides,
    paginationConfigs: state.paginationConfigs,
    parameterDefaults: state.parameterDefaults,  // NEW
    layoutPreset: state.layoutPreset,  // NEW
  }),
  migrate: (persistedState: unknown, version: number) => {
    if (version < 3) {
      // Add default values for new fields
      return {
        ...persistedState,
        parameterDefaults: {},
        layoutPreset: 'auto',
      }
    }
    return persistedState
  },
}
```

### Backwards Compatibility

**ParameterForm signature:**
Current signature: `ParameterForm({ parameters, onSubmit, loading })`
New signature: `ParameterForm({ parameters, endpoint, onSubmit, loading })`

Make `endpoint` optional to maintain backwards compatibility:

```typescript
interface ParameterFormProps {
  parameters: ParsedParameter[]
  endpoint?: string  // Optional — defaults to pathname if not provided
  onSubmit: (values: Record<string, string>) => void
  loading?: boolean
}
```

If `endpoint` not provided, derive from URL:
```typescript
const endpoint = props.endpoint ?? window.location.pathname
```

## Open Questions

Questions to resolve during implementation:

1. **Type inference accuracy:** Should we infer types conservatively (fewer false positives) or aggressively (more convenience)?
   - **Recommendation:** Start conservative, add patterns based on user feedback

2. **Parameter history UI:** Should we expose parameter history in ConfigPanel, or keep it implicit (just pre-fill)?
   - **Recommendation:** Start implicit, add UI if users request it

3. **Layout preset icons:** What visual metaphor for layout presets (icons, previews, labels)?
   - **Recommendation:** Icons + labels (clearest for all users)

4. **Enum detection threshold:** How many values before treating repeated param as enum vs. array?
   - **Recommendation:** 2+ distinct values = enum (simple rule)

5. **Parameter clearing:** Should users be able to clear persisted values individually or only all at once?
   - **Recommendation:** Start with all-at-once (simpler), add per-param clearing if requested

## Performance Considerations

### Query String Parsing

- **URLSearchParams:** Native API, zero dependencies, fast
- **Type inference:** Regex matching, O(n) where n = parameter count (not a concern for typical query strings)
- **Caching:** Not needed — parsing is fast enough to run on every URL change

### Parameter Persistence

- **localStorage writes:** Only on form submit (not on every keystroke)
- **localStorage reads:** Only on component mount (not on every render)
- **Zustand persist:** Uses batched writes, efficient for multiple parameter updates

### Layout Switching

- **No re-mounting:** Layout switch is CSS-only (flex direction, padding), components don't re-mount
- **No network:** Layout preference is client-side only, no API calls

## Security Considerations

### Query String Injection

**Risk:** Malicious query strings could inject unexpected parameter types or values

**Mitigation:**
- Type inference is read-only (doesn't execute user input)
- ParameterInput renders values as text/number inputs (HTML escaping by React)
- API fetch uses URLSearchParams for serialization (prevents injection)

### Persisted Parameter XSS

**Risk:** Persisted parameter values could contain malicious scripts

**Mitigation:**
- React escapes all text content by default
- ParameterInput uses controlled inputs (value prop)
- No `dangerouslySetInnerHTML` in parameter rendering

### localStorage Overflow

**Risk:** Unlimited parameter persistence could fill localStorage

**Mitigation:**
- Only persist non-empty values (reduces storage)
- Per-endpoint isolation (prevents one endpoint from dominating)
- Future: Add UI for clearing old parameter defaults

## Sources

**URL Query String Parsing (HIGH confidence):**
- [A Comprehensive Guide to URLSearchParams in TypeScript](https://dev.to/bugudiramu/a-comprehensive-guide-to-urlsearchparams-in-typescript-51f7)
- [How to Manage Query Params in TypeScript - Upmostly](https://upmostly.com/typescript/how-to-manage-query-params-in-typescript)
- [query-string - npm](https://www.npmjs.com/package/query-string)
- [How to Parse URL in JavaScript - Dmitri Pavlutin](https://dmitripavlutin.com/parse-url-javascript/)

**Type Inference (MEDIUM confidence):**
- [Decode URL search params at the type level - Total TypeScript](https://www.totaltypescript.com/tips/decode-url-search-params-at-the-type-level-with-ts-toolbelt)
- [Extreme TypeScript Challenge: ParseQueryString - Medium](https://medium.com/@taitasciore/extreme-typescript-challenge-parsequerystring-c7bc64d73af2)

**React Layout Patterns (HIGH confidence):**
- [Modern Layout Design Techniques in ReactJS (2025 Guide) - DEV](https://dev.to/er-raj-aryan/modern-layout-design-techniques-in-reactjs-2025-guide-3868)
- [Sidebar: Architecting a Scalable Sidebar System in React - Medium](https://medium.com/@rivainasution/shadcn-ui-react-series-part-11-sidebar-architecting-a-scalable-sidebar-system-in-react-f45274043863)
- [React-admin - The Layout Component](https://marmelab.com/react-admin/Layout.html)

**Zustand Persistence (HIGH confidence):**
- [Persisting store data - Zustand](https://zustand.docs.pmnd.rs/integrations/persisting-store-data)
- [persist - Zustand](https://zustand.docs.pmnd.rs/middlewares/persist)
- [How to Use Zustand in React (With Local Storage Persistence) - Medium](https://medium.com/@jalish.dev/how-to-use-zustand-in-react-with-local-storage-persistence-fd67ab0cc5a0)

**OpenAPI Parameter Best Practices (MEDIUM confidence):**
- [Query Parameters in OpenAPI best practices - Speakeasy](https://www.speakeasy.com/openapi/requests/parameters/query-parameters)
- [Request Parameters in OpenAPI best practices - Speakeasy](https://www.speakeasy.com/openapi/requests/parameters)
