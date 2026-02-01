# Phase 1: Foundation & Core Rendering - Research

**Researched:** 2026-02-01
**Domain:** Client-side API-to-UI runtime rendering engine
**Confidence:** HIGH

## Summary

Phase 1 establishes the foundation for api2ui: user pastes an API URL, the system fetches data, infers its schema, maps types to UI components, and renders a functional interface with loading/error states. This research validates the technical stack, identifies proven patterns for schema inference and dynamic rendering, and documents critical pitfalls that must be avoided from day one.

The standard approach uses React 19 with TypeScript 5.9, Vite 7, and Tailwind CSS 4 for the foundation. Schema inference requires multi-sample analysis (2-3 responses) with confidence tracking to handle real-world API variance. Dynamic component rendering follows a component registry pattern with type-based mapping. Virtualization must be implemented from the start for performance with large datasets (1000+ items). CORS handling is the critical architectural decision that determines whether a proxy layer is needed.

**Primary recommendation:** Build with strict module boundaries (fetch → infer → map → render) from the start using native fetch API, implement virtualization immediately using react-window, and handle CORS errors gracefully with clear user messaging about limitations.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | 19.2.x | UI framework | Industry standard for dynamic rendering, hooks enable clean patterns, largest ecosystem, React 19 stable as of Jan 2026 |
| TypeScript | 5.9.x | Type safety | Essential for type inference from API schemas, catches runtime errors at compile time, TypeScript 7 (Go-based) coming mid-2026 |
| Vite | 7.3.x | Build tool | Fast dev server, native TypeScript support, minimal config, Vite 7 stable (Vite 8 beta uses Rolldown) |
| Tailwind CSS | 4.0.x | Styling | Rapid UI development, CSS-first config (@import), 5x faster builds, officially released Jan 2025 |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Zustand | 5.0.x | State management | Lightweight (1KB), built-in persistence, perfect for storing config and schema cache |
| react-window | 1.8.x | Virtualization | Efficient rendering of large lists (1000+ items), essential for performance with API data |
| React Hook Form | 7.x | Form handling | Parameter input forms with minimal re-renders, built-in validation |
| Zod | 3.x | Runtime validation | Type-safe schema validation, pairs perfectly with React Hook Form and TypeScript |
| react-loading-skeleton | 3.x | Loading states | Better UX than spinners, shows layout structure while loading |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| React 19 | Vue 3 / Svelte | Smaller ecosystems for dynamic rendering, React's component model more flexible for runtime schemas |
| Vite | Webpack | Webpack slower and more complex, legacy choice for new projects |
| Tailwind CSS | CSS Modules | More control but slower development, Tailwind 4's CSS-first approach eliminates previous objections |
| Zustand | Redux Toolkit | Redux massive overkill for config storage, too much boilerplate |
| Native fetch | Axios | Axios better for complex scenarios (auth, retries), but fetch sufficient for v1 GET-only |
| Custom components | TanStack Table | TanStack powerful but complex, defer until proven need (Phase 2+) |

**Installation:**
```bash
# Initialize Vite with React + TypeScript
npm create vite@latest api2ui -- --template react-ts
cd api2ui

# Core dependencies
npm install zustand react-window

# Form handling (for parameter inputs)
npm install react-hook-form zod @hookform/resolvers

# UI components
npm install react-loading-skeleton

# Styling
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# Development tools
npm install -D vitest @testing-library/react @testing-library/jest-dom
npm install -D @typescript-eslint/parser @typescript-eslint/eslint-plugin
npm install -D prettier eslint-config-prettier
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── components/          # UI components (Table, DetailView, inputs)
│   ├── registry/       # Component registry for dynamic rendering
│   ├── tables/         # Table component variants
│   ├── forms/          # Form input components
│   └── loading/        # Loading states, skeletons
├── services/           # Business logic (API fetcher, schema inference)
│   ├── api/           # API client and CORS handling
│   ├── schema/        # Schema inference and mapping
│   └── cache/         # Schema caching logic
├── types/             # TypeScript type definitions
│   ├── schema.ts      # UnifiedSchema interface
│   └── components.ts  # Component type definitions
├── store/             # Zustand stores
│   ├── schemaStore.ts # Schema and API state
│   └── configStore.ts # User configuration (Phase 3+)
├── hooks/             # Custom React hooks
│   ├── useAPIFetch.ts # API fetching with CORS handling
│   └── useSchema.ts   # Schema inference hook
└── utils/             # Helper functions
    ├── typeDetection.ts # Type inference utilities
    └── validators.ts    # Input validation
```

### Pattern 1: Unidirectional Pipeline Architecture
**What:** Clear data flow from URL → Schema → Mapping → UI with no circular dependencies
**When to use:** All rendering logic in Phase 1
**Example:**
```typescript
// Source: Based on React best practices and domain research
// services/api/fetcher.ts
export async function fetchAPI(url: string): Promise<APIResponse> {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new APIError(response.status);
    return await response.json();
  } catch (error) {
    if (error.message === 'Failed to fetch') {
      throw new CORSError('CORS blocked. API must allow browser requests.');
    }
    throw error;
  }
}

// services/schema/inferrer.ts
export function inferSchema(responses: unknown[]): UnifiedSchema {
  // Multi-sample analysis (2-3 responses)
  const fields = analyzeFields(responses);
  const types = detectTypes(fields);
  return { types, confidence: calculateConfidence(responses) };
}

// services/schema/mapper.ts
export function mapToComponents(schema: UnifiedSchema): ComponentMap {
  const mappings = new Map();
  for (const [path, type] of schema.types) {
    mappings.set(path, selectComponent(type));
  }
  return mappings;
}

// components/DynamicRenderer.tsx
export function DynamicRenderer({ schema, data }: Props) {
  const mappings = mapToComponents(schema);
  return <ComponentRegistry render={mappings} data={data} />;
}
```

### Pattern 2: Component Registry for Dynamic Rendering
**What:** Map from type signatures to component implementations, allowing runtime component selection
**When to use:** Type-to-component mapping in Phase 1
**Example:**
```typescript
// Source: Based on React dynamic rendering patterns research
// components/registry/ComponentRegistry.tsx
type ComponentType = 'table' | 'detail' | 'input' | 'number' | 'checkbox';

interface ComponentRegistryEntry {
  type: ComponentType;
  component: React.ComponentType<any>;
  accepts: TypeSignature;
}

const registry: ComponentRegistryEntry[] = [
  { type: 'table', component: TableComponent, accepts: { kind: 'array' } },
  { type: 'detail', component: DetailView, accepts: { kind: 'object' } },
  { type: 'input', component: TextInput, accepts: { kind: 'primitive', type: 'string' } },
  // ... more mappings
];

export function selectComponent(typeSignature: TypeSignature): React.ComponentType {
  const entry = registry.find(e => matchesType(e.accepts, typeSignature));
  return entry?.component ?? JSONViewer; // Fallback
}

export function DynamicField({ type, data, path }: FieldProps) {
  const Component = selectComponent(type);
  return <Component data={data} path={path} />;
}
```

### Pattern 3: Virtualized Lists for Performance
**What:** Only render visible items in large arrays, not entire dataset
**When to use:** Any array rendering (tables, lists) from the start
**Example:**
```typescript
// Source: react-window documentation and best practices
import { FixedSizeList } from 'react-window';

interface TableProps {
  data: Record<string, unknown>[];
  columns: string[];
}

export function VirtualizedTable({ data, columns }: TableProps) {
  const Row = ({ index, style }) => {
    const item = data[index];
    return (
      <div style={style} className="table-row">
        {columns.map(col => (
          <div key={col} className="table-cell">{item[col]}</div>
        ))}
      </div>
    );
  };

  return (
    <FixedSizeList
      height={600}
      itemCount={data.length}
      itemSize={50}
      width="100%"
      overscanCount={5} // Render 5 extra items for smooth scrolling
    >
      {Row}
    </FixedSizeList>
  );
}
```

### Pattern 4: Multi-Sample Schema Inference
**What:** Analyze 2-3 API responses before finalizing schema to handle variance
**When to use:** Schema inference from API responses
**Example:**
```typescript
// Source: Based on critical pitfalls research
interface FieldAnalysis {
  name: string;
  types: Set<string>;
  nullCount: number;
  missingCount: number;
  samples: unknown[];
}

export function analyzeMultiSample(responses: unknown[]): UnifiedSchema {
  const fields = new Map<string, FieldAnalysis>();

  // Analyze each response
  for (const response of responses) {
    analyzeObject(response, fields);
  }

  // Determine final types with confidence
  const schema = new Map<string, TypeDefinition>();
  for (const [name, analysis] of fields) {
    const confidence = calculateConfidence(analysis);
    const type = inferType(analysis);
    const optional = analysis.missingCount > 0;

    schema.set(name, { type, optional, confidence });
  }

  return { types: schema, sampleCount: responses.length };
}

function calculateConfidence(analysis: FieldAnalysis): 'high' | 'medium' | 'low' {
  const typeVariance = analysis.types.size;
  const presenceRate = 1 - (analysis.missingCount / analysis.samples.length);

  if (typeVariance === 1 && presenceRate === 1) return 'high';
  if (typeVariance <= 2 && presenceRate >= 0.7) return 'medium';
  return 'low';
}
```

### Pattern 5: CORS Error Detection and Handling
**What:** Detect CORS failures and provide actionable error messages
**When to use:** All API fetching
**Example:**
```typescript
// Source: Fetch API error handling research
export class CORSError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CORSError';
  }
}

export async function fetchWithCORSDetection(url: string): Promise<Response> {
  try {
    const response = await fetch(url, {
      mode: 'cors',
      credentials: 'omit',
    });
    return response;
  } catch (error) {
    // TypeError: Failed to fetch = CORS or network error
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new CORSError(
        'API blocked by CORS. The API must include Access-Control-Allow-Origin header. ' +
        'Try APIs like JSONPlaceholder or enable CORS on your API.'
      );
    }
    throw error;
  }
}

// In UI component
function ErrorDisplay({ error }: { error: Error }) {
  if (error instanceof CORSError) {
    return (
      <div className="error cors-error">
        <h3>CORS Error</h3>
        <p>{error.message}</p>
        <details>
          <summary>What is CORS?</summary>
          <p>CORS (Cross-Origin Resource Sharing) is a security feature...</p>
        </details>
      </div>
    );
  }
  // ... other error types
}
```

### Pattern 6: Suspense with Skeleton Screens
**What:** Use React Suspense with skeleton screens instead of spinners
**When to use:** All loading states
**Example:**
```typescript
// Source: React 19 Suspense documentation and skeleton screen research
import Skeleton from 'react-loading-skeleton';
import { Suspense } from 'react';

function TableSkeleton() {
  return (
    <div className="table-skeleton">
      <Skeleton count={5} height={40} />
    </div>
  );
}

function APIDataView({ url }: { url: string }) {
  return (
    <Suspense fallback={<TableSkeleton />}>
      <DataTable url={url} />
    </Suspense>
  );
}

// DataTable component throws Promise on initial render
// React Suspense catches it and shows skeleton
```

### Anti-Patterns to Avoid
- **Tight coupling between fetching and rendering:** Never put fetch() calls inside component useEffect. Separate into services layer.
- **Single-sample schema inference:** Don't infer types from one response. Always analyze 2-3 samples minimum.
- **Component selection in render:** Don't use switch/if statements to pick components. Use registry pattern.
- **Rendering entire large arrays:** Never map over 1000+ items without virtualization. Causes browser hangs.
- **Generic "Error" messages:** Always have specific error types (CORSError, NetworkError, ParseError) with actionable messages.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Virtual scrolling for large lists | Custom windowing logic | react-window | Complex math for scroll position, item sizing, buffer management. Library handles edge cases. |
| Form state management | Manual useState for each field | React Hook Form | Handles validation, dirty state, touched fields, errors. Optimizes re-renders. |
| Runtime type validation | Manual type checking (typeof, Array.isArray) | Zod | Handles nested objects, unions, refinements. Type-safe with TypeScript. |
| Skeleton loading screens | Custom placeholder divs | react-loading-skeleton | Automatic shimmer animation, responsive sizing, consistent styling. |
| Type inference from values | Switch statements on typeof | Zod z.infer or custom type guards | Misses edge cases (null vs undefined, Date objects, nested arrays). |
| JSON pretty-printing | Manual string formatting | JSON.stringify with spacing + syntax highlighting library | Handles circular refs, long strings, proper indentation. |
| Debouncing API calls | setTimeout/clearTimeout | Use-debounce hook or Lodash debounce | Handles cleanup, edge cases, TypeScript types. |

**Key insight:** Schema inference, virtualization, and form handling have hidden complexity. Type coercion (string "123" vs number 123), null vs undefined vs missing, and array polymorphism (mixed types) are harder than they appear. Use battle-tested libraries.

## Common Pitfalls

### Pitfall 1: Naive Single-Sample Schema Inference
**What goes wrong:** Inferring schema from one API response, then breaking when subsequent responses have different shapes (null fields, missing properties, different array item types).
**Why it happens:** First response looks complete, developer assumes it represents the full schema.
**How to avoid:**
- Fetch 2-3 responses before finalizing schema
- Track field presence across samples (field appears in 2/3 = optional)
- Distinguish between null (present but empty) and missing (undefined)
- For arrays, analyze first 10-20 items to detect polymorphism
**Warning signs:**
- "Worked first time, broke on refresh" user reports
- Undefined property access errors after initial success
- Inconsistent UI rendering on page reload

### Pitfall 2: CORS as Afterthought
**What goes wrong:** Building entire app assuming direct API access, discovering most public APIs block CORS from browser origins.
**Why it happens:** Testing with CORS-friendly APIs (JSONPlaceholder) or using browser extensions that disable CORS.
**How to avoid:**
- Test CORS on real target APIs immediately in Phase 1
- Implement clear CORS error detection and messaging from start
- Document API requirements (must include Access-Control-Allow-Origin header)
- Design for graceful degradation (show CORS error with explanation)
- Accept client-side limitation as v1 constraint, plan proxy for v2
**Warning signs:**
- "Works in Postman, fails in browser" reports
- Console shows "Failed to fetch" with no response
- TypeError in fetch without clear cause

### Pitfall 3: No Virtualization Until Performance Problem
**What goes wrong:** Rendering all array items directly, app works fine with 10-item arrays, grinds to halt with 1000+ item response.
**Why it happens:** Testing with small, curated datasets during development.
**How to avoid:**
- Use react-window from the start for all array rendering
- Test with realistic data (1000+ items) during development
- Set performance budget (must render 1000 items in <500ms)
- Sample for schema inference (analyze first 100 items, not all 10,000)
**Warning signs:**
- Browser becomes unresponsive during large data render
- Lighthouse performance score drops with real data
- CPU spikes to 100% on initial render

### Pitfall 4: Tight Coupling Between Modules
**What goes wrong:** Schema inference logic embedded in React components, making it impossible to test, reuse, or swap implementations.
**Why it happens:** "Quick prototype" fetches and infers data in useEffect, spreads throughout component tree.
**How to avoid:**
- Pure function for inference: inferSchema(response): Schema
- Separate hooks: useAPIFetch() and useSchemaInfer()
- Services layer (services/schema/, services/api/) independent of components
- Schema as first-class data (JSON-serializable, cacheable)
**Warning signs:**
- Can't test schema inference without mounting React components
- Changing inference algorithm requires touching component code
- No way to cache or inspect schema outside component tree

### Pitfall 5: Generic Error Messages
**What goes wrong:** All errors (CORS, network, 404, 500, parse failure) show same "Error loading data" message.
**Why it happens:** Catch-all error handling without error type discrimination.
**How to avoid:**
- Specific error classes: CORSError, NetworkError, APIError, ParseError
- Error-specific UI with actionable guidance
- Check error instanceof before displaying
- Include suggestions (CORS → "API must allow browser requests")
**Warning signs:**
- Users report "error" without ability to diagnose
- Same error message for network timeout and 404
- No way to tell CORS failure from server error

### Pitfall 6: Ignoring Type Coercion
**What goes wrong:** Displaying number as string "123", boolean as "true" text, dates as ISO timestamps.
**Why it happens:** Direct rendering of JSON values without type-aware components.
**How to avoid:**
- Type-specific renderers (NumberCell, BooleanCell, DateCell)
- Detect ISO date strings (regex match) and convert to Date
- Format numbers with locale (toLocaleString())
- Render booleans as checkbox or badge, not text
**Warning signs:**
- Dates show as "2026-02-01T12:00:00Z" instead of "Feb 1, 2026"
- Numbers lack thousand separators
- Booleans show as "true"/"false" text

## Code Examples

Verified patterns from official sources:

### Vite + React + TypeScript Project Setup
```bash
# Source: Vite 7 official documentation
npm create vite@latest api2ui -- --template react-ts
cd api2ui
npm install

# Install Phase 1 dependencies
npm install zustand react-window react-hook-form zod @hookform/resolvers react-loading-skeleton
npm install -D tailwindcss postcss autoprefixer vitest @testing-library/react

# Initialize Tailwind CSS 4
npx tailwindcss init -p
```

### Tailwind CSS 4 Configuration
```javascript
// Source: Tailwind CSS 4.0 official docs
// tailwind.config.js
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      // User-customizable theme (Phase 3)
    },
  },
}
```

```css
/* Source: Tailwind CSS 4 CSS-first config */
/* src/index.css */
@import "tailwindcss";

/* Custom styles */
@layer base {
  body {
    @apply bg-white text-gray-900;
  }
}
```

### React 19 Suspense with Error Boundary
```typescript
// Source: React 19 official documentation
import { Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import Skeleton from 'react-loading-skeleton';

function APIView({ url }: { url: string }) {
  return (
    <ErrorBoundary
      fallback={({ error }) => <ErrorDisplay error={error} />}
    >
      <Suspense fallback={<TableSkeleton />}>
        <DataRenderer url={url} />
      </Suspense>
    </ErrorBoundary>
  );
}

function TableSkeleton() {
  return <Skeleton count={10} height={50} />;
}
```

### Zustand Store with Persistence
```typescript
// Source: Zustand 5.0 documentation
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SchemaStore {
  schemas: Map<string, UnifiedSchema>;
  addSchema: (url: string, schema: UnifiedSchema) => void;
  getSchema: (url: string) => UnifiedSchema | undefined;
}

export const useSchemaStore = create<SchemaStore>()(
  persist(
    (set, get) => ({
      schemas: new Map(),
      addSchema: (url, schema) =>
        set((state) => ({
          schemas: new Map(state.schemas).set(url, schema),
        })),
      getSchema: (url) => get().schemas.get(url),
    }),
    {
      name: 'api2ui-schemas',
      // Custom serialization for Map
      storage: {
        getItem: (name) => {
          const str = localStorage.getItem(name);
          if (!str) return null;
          const { state } = JSON.parse(str);
          return {
            state: {
              ...state,
              schemas: new Map(state.schemas),
            },
          };
        },
        setItem: (name, value) => {
          const str = JSON.stringify({
            state: {
              ...value.state,
              schemas: Array.from(value.state.schemas.entries()),
            },
          });
          localStorage.setItem(name, str);
        },
        removeItem: (name) => localStorage.removeItem(name),
      },
    }
  )
);
```

### React Hook Form with Zod Validation
```typescript
// Source: React Hook Form + Zod integration guide 2026
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const urlSchema = z.object({
  url: z.string().url('Must be a valid URL'),
  method: z.enum(['GET', 'POST']).default('GET'),
});

type URLFormData = z.infer<typeof urlSchema>;

export function URLInput({ onSubmit }: Props) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<URLFormData>({
    resolver: zodResolver(urlSchema),
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input
        {...register('url')}
        placeholder="https://api.example.com/data"
      />
      {errors.url && <span className="error">{errors.url.message}</span>}

      <select {...register('method')}>
        <option value="GET">GET</option>
        <option value="POST">POST</option>
      </select>

      <button type="submit">Fetch API</button>
    </form>
  );
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Create React App | Vite | 2023 (CRA deprecated) | 10x faster dev server, simpler config, native ESM |
| React 18 | React 19 | Jan 2026 | Stable concurrent features, better Suspense, improved error boundaries |
| Tailwind 3.x with @tailwind directives | Tailwind 4.x with @import | Jan 2025 | 5x faster builds, CSS-first config, simplified setup |
| CSS-in-JS (Styled Components) | Tailwind or CSS Modules | 2024-2025 | Runtime performance, compile-time CSS preferred |
| Redux for all state | Zustand/Context | 2023-2024 | Redux overkill for simple apps, Zustand 1KB vs Redux 20KB+ |
| Manual virtualization | react-window/react-virtuoso | 2020+ | Complex math delegated to library, better performance |
| Spinners for loading | Skeleton screens | 2022+ | Better perceived performance, shows layout structure |
| Class components | Function components with hooks | 2019+ | Simpler, less boilerplate, better composition |

**Deprecated/outdated:**
- Create React App: Deprecated 2023, use Vite
- @tailwind directives: Tailwind 4 uses @import "tailwindcss"
- Class-based error boundaries: Use react-error-boundary library
- Redux for simple state: Use Zustand or Context for config storage
- Axios for simple GET: Native fetch sufficient for v1

## Open Questions

Things that couldn't be fully resolved:

1. **CORS Proxy Strategy**
   - What we know: Client-side apps can't bypass CORS, third-party proxies unsafe for production
   - What's unclear: Acceptable UX for "this API doesn't allow browser access"
   - Recommendation: Accept limitation for v1, clearly document CORS requirement, plan serverless proxy for v2

2. **Schema Inference Sample Size**
   - What we know: Single sample insufficient, multi-sample analysis required
   - What's unclear: Optimal number of samples (2? 3? 5?) vs latency cost
   - Recommendation: Start with 2 samples, make configurable, measure accuracy in Phase 2

3. **Component Library Choice**
   - What we know: TanStack Table powerful but complex, custom components lighter
   - What's unclear: At what complexity does TanStack become worth the bundle size?
   - Recommendation: Build custom for Phase 1, evaluate TanStack in Phase 2 if table features lacking

4. **TypeScript 7 Migration Timing**
   - What we know: TypeScript 7 (Go-based) releases mid-2026 with 5-10x faster compiles
   - What's unclear: Breaking changes, ecosystem compatibility, migration effort
   - Recommendation: Start with TypeScript 5.9, monitor TypeScript 7 release, plan migration for Phase 3+

## Sources

### Primary (HIGH confidence)
- [React 19 Versions](https://react.dev/versions) - React 19.2.4 current stable (Jan 2026)
- [Vite 7 Releases](https://vite.dev/releases) - Vite 7.3.1 current, Vite 8 beta available
- [Tailwind CSS v4.0 Blog](https://tailwindcss.com/blog/tailwindcss-v4) - Tailwind 4.0 released Jan 22, 2025
- [TypeScript Releases](https://github.com/microsoft/typescript/releases) - TypeScript 5.9.3 latest stable
- [Zustand npm](https://www.npmjs.com/package/zustand) - Zustand 5.0.10 latest (6 days ago)
- [React Suspense Documentation](https://react.dev/reference/react/Suspense) - Official React 19 docs
- [Vite Guide](https://vite.dev/guide/) - Official Vite setup docs

### Secondary (MEDIUM confidence)
- [CORS Proxy Solutions 2026](https://httptoolkit.com/blog/cors-proxies/) - Security implications, proxy patterns
- [Fetch API Error Handling](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch) - CORS detection patterns
- [React Window Best Practices](https://web.dev/articles/virtualize-long-lists-react-window) - Virtualization guide
- [TanStack Table v8 Docs](https://tanstack.com/table/v8) - Table library features
- [React Hook Form + Zod 2026](https://dev.to/marufrahmanlive/react-hook-form-with-zod-complete-guide-for-2026-1em1) - Integration patterns
- [Skeleton Screen Best Practices](https://blog.logrocket.com/handling-react-loading-states-react-loading-skeleton/) - Loading UX
- [JSON Schema Inference Tools](https://github.com/triggerdotdev/schema-infer) - Schema inference libraries
- [Vite React TypeScript Setup 2026](https://medium.com/@robinviktorsson/complete-guide-to-setting-up-react-with-typescript-and-vite-2025-468f6556aaf2) - Project setup guide
- [Dynamic Component Rendering React](https://www.patterns.dev/react/react-2026/) - Component registry patterns

### Tertiary (LOW confidence)
- Prior domain research (ARCHITECTURE.md, PITFALLS.md, STACK.md) - Unverified but comprehensive architectural patterns

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All versions verified via official sources, WebSearch confirmed current releases
- Architecture: HIGH - Patterns verified via official React/Vite docs and multiple authoritative sources
- Pitfalls: HIGH - Based on established domain knowledge, verified with current best practices
- CORS handling: MEDIUM - Clear technical constraints, but UX implications need user validation
- Schema inference: MEDIUM - Pattern established, but sample size optimization requires empirical testing
- Component choice: MEDIUM - Trade-offs clear, but optimal decision point (custom vs library) needs validation

**Research date:** 2026-02-01
**Valid until:** 2026-03-01 (30 days - stable technologies, long validity)

**Critical Phase 1 decisions validated:**
1. React 19 + TypeScript 5.9 + Vite 7 + Tailwind 4: All current stable versions confirmed
2. CORS must be addressed from start: Architecture decision, not implementation detail
3. Multi-sample schema inference: Critical pitfall confirmed, pattern established
4. Virtualization from start: Performance requirement validated with react-window
5. Skeleton screens over spinners: UX best practice confirmed for 2026
6. Component registry pattern: Necessary for dynamic rendering, well-established pattern
