# Architecture Patterns

**Domain:** API-to-UI Runtime Rendering Engine
**Researched:** 2026-02-01
**Confidence:** MEDIUM-LOW (based on training data and architectural first principles; web research tools unavailable)

## Executive Summary

An API-to-UI rendering engine requires clean separation between data acquisition, schema interpretation, configuration management, and presentation. The architecture must support two critical paths: (1) API URL → inferred schema → rendered UI, and (2) OpenAPI spec → parsed schema → rendered UI. Both paths converge at a unified schema representation that drives type-to-component mapping.

The recommended architecture follows a **pipeline pattern** with clear component boundaries and unidirectional data flow. This enables incremental development, testability, and future extensibility.

## Recommended Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Application Shell                        │
│  (Router, Mode Toggle, Landing Page)                            │
└────────────────┬────────────────────────────────────────────────┘
                 │
    ┌────────────┴────────────┐
    │                         │
┌───▼────────────┐    ┌──────▼──────────┐
│  Configure     │    │   View Mode     │
│  Mode          │    │                 │
│  (Settings UI) │    │   (Clean UI)    │
└───┬────────────┘    └──────┬──────────┘
    │                         │
    └────────────┬────────────┘
                 │
    ┌────────────▼────────────────────────────────────────┐
    │           Core Rendering Pipeline                   │
    │                                                      │
    │  ┌──────────┐  ┌──────────┐  ┌──────────┐         │
    │  │  Schema  │→ │ Type-to- │→ │ Component│         │
    │  │ Provider │  │Component │  │ Renderer │         │
    │  │          │  │  Mapper  │  │          │         │
    │  └────┬─────┘  └────┬─────┘  └────┬─────┘         │
    │       │             │              │               │
    └───────┼─────────────┼──────────────┼───────────────┘
            │             │              │
    ┌───────┴─────┐  ┌────▼──────┐  ┌───▼──────────┐
    │   Schema    │  │  Config   │  │  Component   │
    │   Layer     │  │  Store    │  │  Registry    │
    └─────────────┘  └───────────┘  └──────────────┘
         │
    ┌────┴──────────────────┐
    │                       │
┌───▼────────┐    ┌────────▼─────┐
│ API Fetcher│    │ OpenAPI      │
│ + Inferrer │    │ Parser       │
└────────────┘    └──────────────┘
```

## Component Boundaries

### 1. Application Shell
**Responsibility:** Top-level routing, mode management, landing page
**Communicates With:** Configure Mode, View Mode
**State:** Current mode (configure/view), current route
**Build Priority:** Phase 1 (Foundation)

This is the entry point that renders either the landing page or the main application. It manages:
- Route detection (landing page vs. API URL)
- Mode toggle state (configure/view)
- Global layout structure

### 2. Schema Provider
**Responsibility:** Unified schema representation from any source
**Communicates With:** API Fetcher, OpenAPI Parser, Type-to-Component Mapper
**State:** Current schema object (endpoints, types, relationships)
**Build Priority:** Phase 1 (Foundation)

**Core interface:**
```typescript
interface SchemaProvider {
  schema: UnifiedSchema | null
  loading: boolean
  error: Error | null

  // Two input paths converge here
  fromAPIUrl(url: string): Promise<void>
  fromOpenAPISpec(spec: OpenAPISpec): Promise<void>
}

interface UnifiedSchema {
  endpoints: Endpoint[]
  types: TypeDefinition[]
  metadata: {
    title?: string
    baseUrl: string
    version?: string
  }
}
```

This is the **critical convergence point**. Both inference and OpenAPI parsing produce the same schema format, enabling the rest of the pipeline to be source-agnostic.

### 3. API Fetcher + Schema Inferrer
**Responsibility:** HTTP requests and type inference from responses
**Communicates With:** Schema Provider
**State:** Fetch status, raw responses
**Build Priority:** Phase 2 (Schema Inference)

Handles the "no spec" path:
1. Fetch API URL
2. Parse JSON response
3. Infer types from structure
4. Detect patterns (arrays, objects, primitives)
5. Generate UnifiedSchema

**Key decisions:**
- Use fetch API (built-in, simple)
- Infer types recursively from response structure
- Detect common patterns (pagination, nesting)
- Handle CORS issues gracefully

### 4. OpenAPI Parser
**Responsibility:** Parse OpenAPI/Swagger specs into UnifiedSchema
**Communicates With:** Schema Provider
**State:** Parse status
**Build Priority:** Phase 3 (OpenAPI Support) - Can be deferred

Handles the "with spec" path:
1. Receive OpenAPI spec (URL or pasted JSON)
2. Parse paths, parameters, schemas
3. Map to UnifiedSchema format
4. Extract metadata

**Recommendation:** Use `@apidevtools/swagger-parser` or `openapi-typescript` for validation and parsing rather than implementing from scratch.

### 5. Type-to-Component Mapper
**Responsibility:** Map schema types to UI component choices
**Communicates With:** Schema Provider, Config Store, Component Renderer
**State:** Current mapping rules (defaults + overrides)
**Build Priority:** Phase 2 (Schema Inference)

**Core logic:**
```typescript
interface TypeMapping {
  // Input side: parameter type → form control
  parameterMappings: Map<TypeSignature, ComponentType>

  // Output side: response type → display component
  responseMappings: Map<TypeSignature, ComponentType>

  // User overrides
  overrides: Map<string, ComponentOverride>
}

type TypeSignature =
  | { kind: 'primitive', type: 'string' | 'number' | 'boolean' }
  | { kind: 'array', itemType: TypeSignature }
  | { kind: 'object', fields: Record<string, TypeSignature> }
```

**Default mapping examples:**
- `string` → `<input type="text">`
- `number` → `<input type="number">`
- `boolean` → `<input type="checkbox">`
- `array<object>` → Table or Card List
- `object` → Key-value display or detail view

### 6. Config Store
**Responsibility:** Persist and retrieve user configuration
**Communicates With:** Type-to-Component Mapper, Configure Mode UI
**State:** Configuration object
**Build Priority:** Phase 4 (Configuration System)

**Storage strategy:**
- Use localStorage for client-side persistence
- Key by API URL or spec identifier
- Store: component overrides, CSS customization, layout preferences

**Structure:**
```typescript
interface AppConfig {
  apiUrl: string
  componentOverrides: Record<string, ComponentChoice>
  cssCustomization: string
  layoutPreferences: {
    sidebarCollapsed: boolean
    defaultView: 'table' | 'cards' | 'detail'
  }
}
```

### 7. Component Registry
**Responsibility:** Available UI components for rendering
**Communicates With:** Component Renderer
**State:** Static registry of components
**Build Priority:** Phase 2 (Schema Inference)

**Fixed set for v1:**
- **Inputs:** TextInput, NumberInput, Checkbox, Select, DatePicker
- **Outputs:** Table, CardList, DetailView, KeyValue, JSONViewer
- **Navigation:** Sidebar, EndpointNav

Each component has:
- Type signature it handles
- Props interface
- Render function

### 8. Component Renderer
**Responsibility:** Render the actual UI based on schema + mapping
**Communicates With:** Type-to-Component Mapper, Component Registry
**State:** Rendered component tree
**Build Priority:** Phase 2 (Schema Inference)

**Rendering logic:**
1. Receive schema + type mappings
2. For each endpoint, render input controls based on parameters
3. Fetch data when user submits
4. Render response data based on type mappings
5. Handle loading/error states

### 9. Configure Mode UI
**Responsibility:** Settings panel and inline editing for configuration
**Communicates With:** Config Store, Type-to-Component Mapper
**State:** Current editing state
**Build Priority:** Phase 4 (Configuration System)

**Features:**
- Component override selector ("use Table instead of Cards")
- CSS editor (with preview)
- Layout toggles
- Export/import config

### 10. View Mode UI
**Responsibility:** Clean, consumer-facing interface
**Communicates With:** Component Renderer
**State:** None (just displays)
**Build Priority:** Phase 1 (Foundation)

Simply renders the output of Component Renderer without configuration controls.

## Data Flow

### Primary Flow: API URL → Rendered UI

```
User enters API URL
    │
    ▼
Application Shell
    │
    ▼
Schema Provider.fromAPIUrl()
    │
    ├──▶ API Fetcher
    │       │
    │       ├─ Fetch URL
    │       ├─ Parse response
    │       └─ Infer schema
    │           │
    │           ▼
    │       Return UnifiedSchema
    │
    ▼
Schema Provider (has schema)
    │
    ▼
Type-to-Component Mapper
    │
    ├──▶ Config Store (get overrides)
    │
    └──▶ Apply mapping rules
            │
            ▼
        Mapping object
            │
            ▼
Component Renderer
    │
    ├──▶ Component Registry (get components)
    │
    └──▶ Render inputs + outputs
            │
            ▼
        View Mode UI / Configure Mode UI
            │
            ▼
        User sees rendered interface
```

### Secondary Flow: OpenAPI Spec → Rendered UI

```
User provides OpenAPI spec
    │
    ▼
Schema Provider.fromOpenAPISpec()
    │
    ├──▶ OpenAPI Parser
    │       │
    │       ├─ Parse spec
    │       ├─ Extract endpoints
    │       └─ Map to UnifiedSchema
    │           │
    │           ▼
    │       Return UnifiedSchema
    │
    [Continues same as primary flow from Schema Provider]
```

### Configuration Flow

```
User changes component mapping in Configure Mode
    │
    ▼
Configure Mode UI
    │
    ▼
Config Store.save()
    │
    ├──▶ localStorage.setItem()
    │
    └──▶ Trigger re-render
            │
            ▼
Type-to-Component Mapper (picks up new override)
    │
    ▼
Component Renderer (re-renders with new component)
    │
    ▼
UI updates
```

## Patterns to Follow

### Pattern 1: Unidirectional Data Flow
**What:** Data flows in one direction through the pipeline
**When:** Always
**Why:** Predictable state changes, easier debugging, testable components

**Example:**
```typescript
// Good: Data flows down
<SchemaProvider>
  <TypeMapper schema={schema}>
    <Renderer mappings={mappings} />
  </TypeMapper>
</SchemaProvider>

// Bad: Circular dependencies
// Component Renderer reaches back to Schema Provider directly
```

### Pattern 2: Schema-First Architecture
**What:** All rendering decisions based on schema representation
**When:** Any rendering logic
**Why:** Source-agnostic (works for inference OR OpenAPI), consistent behavior

**Example:**
```typescript
// Good: Unified schema drives everything
const schema = await schemaProvider.fromAPIUrl(url)
const mappings = typeMapper.map(schema)
const ui = renderer.render(schema, mappings)

// Bad: Different code paths for inference vs OpenAPI
if (isOpenAPI) {
  renderFromSpec(spec)
} else {
  renderFromInference(data)
}
```

### Pattern 3: Configuration as Override Layer
**What:** Defaults work out-of-box, config only overrides
**When:** Component selection, styling, layout
**Why:** Zero-config experience, progressive enhancement

**Example:**
```typescript
// Good: Defaults + overrides
const componentType =
  config.overrides[fieldPath] ??
  defaultMapping.get(typeSignature)

// Bad: Requiring full configuration
const componentType = config.componentMap[fieldPath] // undefined if not set
```

### Pattern 4: Component as Pure Function
**What:** Components receive props, return UI, no side effects
**When:** All UI components in registry
**Why:** Testable, reusable, predictable

**Example:**
```typescript
// Good: Pure component
function TableComponent({ data, columns }) {
  return <table>...</table>
}

// Bad: Component with side effects
function TableComponent({ apiUrl }) {
  const [data, setData] = useState()
  useEffect(() => { fetch(apiUrl).then(setData) }, [])
  return <table>...</table>
}
```

### Pattern 5: Lazy Schema Resolution
**What:** Don't fetch/parse until needed
**When:** Multi-endpoint APIs, nested data
**Why:** Performance, handles large APIs

**Example:**
```typescript
// Good: Fetch endpoint details on demand
const endpoints = parseEndpointList(spec) // Just names/paths
// Later, when user clicks:
const endpointSchema = await resolveEndpoint(endpoint.path)

// Bad: Fetch everything upfront
const fullSchema = await parseEntireAPI(spec) // Could be huge
```

## Anti-Patterns to Avoid

### Anti-Pattern 1: Mixing Schema Sources in Rendering Logic
**What:** Different render paths for inferred vs. OpenAPI schemas
**Why bad:** Code duplication, inconsistent behavior, harder testing
**Instead:** Always convert to UnifiedSchema first, render from that

**Detection:** If you see `if (source === 'openapi')` in rendering code, you've violated this.

### Anti-Pattern 2: Premature Component Abstraction
**What:** Building configurable "universal" components before understanding patterns
**Why bad:** Over-engineering, unused flexibility, complexity
**Instead:** Start with 5-7 concrete components, extract commonality later

**Example:**
```typescript
// Bad: Premature abstraction
<UniversalComponent
  type={type}
  renderer={renderer}
  transformer={transformer}
  validator={validator} />

// Good: Concrete components first
<TableComponent data={data} columns={columns} />
```

### Anti-Pattern 3: Config Schema Sprawl
**What:** Exposing every internal detail as configurable
**Why bad:** Overwhelming UX, maintenance burden, migration hell
**Instead:** Start with minimal config surface (component type, CSS), expand based on user need

### Anti-Pattern 4: Blocking on OpenAPI Parser
**What:** Starting with OpenAPI parsing before proving inference works
**Why bad:** Complex dependency, delays core value delivery
**Instead:** Build inference-based flow first (Phases 1-2), add OpenAPI in Phase 3

### Anti-Pattern 5: Tight Coupling to Fetch Implementation
**What:** HTTP logic embedded in rendering components
**Why bad:** Hard to test, can't mock, blocks SSR/preview features
**Instead:** Separate fetch layer (API Fetcher component), pass data to renderer

## Build Order Implications

### Phase 1: Foundation (Week 1)
**Goal:** Skeleton that renders something

**Components to build:**
1. Application Shell (routing, mode toggle skeleton)
2. Schema Provider (interface only, hardcoded mock schema)
3. Component Registry (2-3 basic components: TextInput, Table, JSONViewer)
4. Component Renderer (basic rendering from mock schema)
5. View Mode UI (shell that displays renderer output)

**Validation:** Can render a hardcoded schema as UI

**Why this order:** Proves the rendering pipeline works before adding complexity

### Phase 2: Schema Inference (Week 2)
**Goal:** Real API URL → Working UI

**Components to build:**
1. API Fetcher (fetch + JSON parse)
2. Schema Inferrer (type detection from JSON)
3. Schema Provider implementation (fromAPIUrl)
4. Type-to-Component Mapper (default mappings)
5. Expand Component Registry (add 5-7 components total)

**Dependencies:**
- API Fetcher → Schema Inferrer (needs raw data)
- Schema Inferrer → Schema Provider (produces schema)
- Schema Provider → Type Mapper (consumes schema)
- Type Mapper → Renderer (consumes mappings)

**Validation:** Paste real API URL, see inferred UI

**Critical path:** API Fetcher → Inferrer → Provider → Mapper → Renderer

### Phase 3: OpenAPI Support (Week 3)
**Goal:** OpenAPI spec → Same rendered UI

**Components to build:**
1. OpenAPI Parser (spec → UnifiedSchema)
2. Schema Provider.fromOpenAPISpec implementation
3. Spec input UI (URL or paste JSON)

**Dependencies:**
- Parser → Schema Provider (produces same schema format)
- Everything else reuses Phase 2 components

**Validation:** Provide OpenAPI spec, see same quality UI as inference

**Why after inference:** Proves UnifiedSchema abstraction works, defers complex dependency

### Phase 4: Configuration System (Week 4)
**Goal:** User can customize component choices and CSS

**Components to build:**
1. Config Store (localStorage persistence)
2. Configure Mode UI (settings panel, component selectors)
3. Type-to-Component Mapper override logic
4. CSS customization editor

**Dependencies:**
- Config Store must integrate with Type Mapper
- Configure Mode UI reads/writes Config Store
- Renderer must react to config changes

**Validation:** User overrides Table→Cards, sees change, reloads page, preference persists

### Phase 5: Navigation & Multi-Endpoint (Week 5)
**Goal:** Handle APIs with multiple endpoints

**Components to build:**
1. Endpoint Navigator (sidebar)
2. Multi-endpoint schema support (extend UnifiedSchema)
3. Master-detail pattern components
4. Endpoint switching logic

**Dependencies:**
- Needs Phase 2 inference to detect multiple endpoints
- Needs Phase 3 OpenAPI to parse full API surface
- Needs Phase 4 config to store per-endpoint preferences

**Validation:** Load multi-endpoint API, navigate between endpoints

### Phase 6: Polish & Landing (Week 6)
**Goal:** Production-ready UX

**Components to build:**
1. Landing page with examples
2. Error handling UI
3. Loading states
4. Example API gallery

**Dependencies:** All previous phases complete

## Scalability Considerations

| Concern | v1 (MVP) | v2 (Growth) | v3 (Scale) |
|---------|----------|-------------|------------|
| **Schema size** | Infer from single response | Sample multiple responses | Intelligent sampling, schema caching |
| **API latency** | Direct fetch, show loading | Request caching, optimistic UI | Service worker, background sync |
| **Component count** | 5-7 fixed components | 10-15 components, plugin system design | Plugin architecture, lazy loading |
| **Config complexity** | localStorage per-API | Export/import, sharing | Cloud sync, templates |
| **OpenAPI spec size** | Parse in-memory | Stream parsing | Web Worker for parsing |

## Technology Recommendations

Based on the architecture, recommended stack:

- **Framework:** React (component model matches architecture perfectly)
- **State:** Context API for SchemaProvider, useState for local component state
- **Routing:** React Router (for landing page vs. app routes)
- **Storage:** localStorage (simple, no backend)
- **HTTP:** fetch API (built-in, sufficient for v1)
- **OpenAPI Parsing:** `@apidevtools/swagger-parser` (battle-tested)
- **Type Inference:** Custom (domain-specific, lightweight)

See STACK.md for detailed justification.

## Testing Strategy

### Unit Tests
- Schema Inferrer: JSON → schema conversion
- Type Mapper: type → component selection
- Each component in registry

### Integration Tests
- API Fetcher + Inferrer: real API → schema
- OpenAPI Parser: real spec → schema
- Full pipeline: schema → rendered output

### E2E Tests
- Paste API URL → see UI
- Paste OpenAPI spec → see UI
- Configure component → see change → reload → persisted

## Open Questions

These require implementation experience to answer:

1. **Schema inference accuracy:** How many response samples needed for confidence?
2. **Component granularity:** Are 7 components enough, or will we quickly need 15?
3. **Config scope:** Per-API, per-endpoint, or per-field configuration?
4. **Error handling:** How to handle partial schemas, failed inferences?

## Sources

**Confidence: MEDIUM-LOW**

This architecture is based on:
- First principles of pipeline architectures
- Common patterns in schema-driven rendering systems (Swagger UI, Redoc, PostMan)
- React architectural best practices
- Project requirements analysis

**Unable to verify:** WebSearch and WebFetch were unavailable during research. Recommendations are based on training data (January 2025 cutoff) and architectural reasoning, not current ecosystem verification.

**Validation needed:** Confirm current best practices for:
- OpenAPI parsing libraries (versions, maintenance status)
- Schema inference approaches in production tools
- Component registry patterns in modern React apps
