# api2ui

## What This Is

A web app that takes an API URL and automatically renders a live, interactive website for that API. Users paste an endpoint URL (or a Swagger/OpenAPI spec URL), and the engine infers the API's structure, maps data types to UI components, and renders an instant default view — no code generation, just runtime rendering. The engine uses semantic field analysis to pick context-appropriate components (star ratings for ratings, currency formatting for prices, status badges for states), organizes fields into visual sections, and applies importance-based hierarchy. Supports authenticated APIs with 4 auth types (API Key, Bearer Token, Basic Auth, Query Parameter), auto-detecting auth requirements from OpenAPI specs. Developers configure the view via a settings panel and inline editing, non-technical users consume the clean rendered interface.

## Core Value

Any API becomes instantly usable through a visual interface — paste a URL, see your data rendered as a real UI.

## Requirements

### Validated

- User can paste an API URL and see an instant default render — v1.0
- Engine infers API structure from responses (or parses Swagger/OpenAPI spec) — v1.0
- Auto sidebar navigation for multi-endpoint APIs — v1.0
- Type-based default component mapping for responses (array->table/cards, object->detail, primitive->text) — v1.0
- Type-based default component mapping for parameters (string->text, number->number, enum->dropdown, bool->toggle) — v1.0
- Required params shown prominently, optional in expandable section — v1.0
- Master-detail pattern for nested data (collection -> click -> detail view) — v1.0
- Configurable max nesting depth — v1.0
- Developer can override component type, props, visibility, and field mapping at each level — v1.0
- Configure mode with settings panel (global) and inline editing (per-element) — v1.0
- View mode with clean output, no controls — v1.0
- CSS customizable styling — v1.0
- Landing page with URL input and clickable example APIs — v1.0
- Live data fetched on each page load — v1.0
- Local storage for saving view configurations — v1.0
- Fixed component set: tables, cards, lists, detail views, form inputs — v1.0
- Image URLs auto-detected and rendered as images by default — v1.1
- Cards display hero images from detected image-URL fields — v1.1
- Tables show inline thumbnail previews for image columns — v1.1
- Typography hierarchy distinguishes primary fields from secondary data — v1.1
- Component type switching discoverable in View mode (not just Configure mode) — v1.1
- Per-element contextual configuration popover — v1.1
- Client-side pagination for large arrays (tables and cards) — v1.1
- Configurable items-per-page with page navigation controls — v1.1
- Detail views with hero images, two-column layout, and visual grouping — v1.1
- Nested arrays render as horizontal card scrollers in detail views — v1.1
- Breadcrumb navigation for nested detail drill-down — v1.1
- Raw URL query param parsing with type inference (not just Swagger) — v1.2
- Parameter grouping by prefix (e.g., ddcFilter[*] -> "Filters" section) — v1.2
- Progressive param reveal: show breakdown first, then make editable — v1.2
- Smart type inference for params (dates, coordinates, zip codes, emails) — v1.2
- Richer input components (date pickers, sliders, tag inputs for multi-value) — v1.2
- Contextual defaults and placeholder examples for params — v1.2
- Inline validation feedback before submit — v1.2
- Smooth inline re-fetch with loading/error states — v1.2
- Parameter value persistence across sessions — v1.2
- User-selectable page layouts (sidebar, top bar, split view, drawer) — v1.2
- Polished UX that feels like a real product — v1.2
- Semantic component selection (reviews -> cards, specs -> key-value, images -> gallery) — v1.3
- Automatic section organization with accordions for complex objects — v1.3
- Field importance hierarchy (primary/secondary/tertiary visual tiers) — v1.3
- Smart defaults for detail views (Hero + Overview + Sections layout) — v1.3
- Context-aware components (status badges, star ratings, currency, dates, tag chips) — v1.3
- All existing components remain available via component switcher overrides — v1.3
- API Key, Bearer Token, Basic Auth, Query Parameter authentication — v1.4
- Auto-detect auth requirements from OpenAPI security schemes — v1.4
- 401/403 error prompts with actionable recovery buttons — v1.4
- Per-API credential scoping with sessionStorage persistence — v1.4
- Auth configuration UI with lock icon, type selector, credential forms — v1.4

### Active

(No active milestone — ready for `/gsd:new-milestone`)

### Out of Scope

- CRUD / write operations (POST/PUT/DELETE) — read-only for now
- AI-assisted CSS customization — deferred, not essential
- Shareable links / hosted views — requires backend, defer
- Custom/extensible components — start with fixed set
- Backend for persistence — uses local storage
- Mobile app — web-first
- ML/NLP for semantic detection — zero-dependency heuristics sufficient for well-defined patterns
- Horizontal tabs for field organization — UX research shows 27% overlooked vs 8% for accordions

## Context

- **Shipped v1.0 MVP** with 6,099 lines of TypeScript/TSX/CSS across 207 files
- **Shipped v1.1 UX Polish** with smart visual defaults, discoverable component switching, pagination, and enhanced detail views
- **Shipped v1.2 Smart Parameters & Layout System** with URL parsing, type inference, rich input components, applied filter chips, and user-selectable layouts
- **Shipped v1.3 Smart Default Selection** with semantic field analysis (22 patterns), importance scoring, auto-grouping (prefix + semantic clustering), smart component selection heuristics, and context-aware rendering components
- **Shipped v1.4 API Authentication** with 4 auth types (API Key, Bearer, Basic, Query Param), OpenAPI security scheme auto-detection, and smart error UX with actionable recovery
- **Current codebase:** 24,114 lines of TypeScript/TSX/CSS, 449 tests
- **Tech stack:** React 19, TypeScript 5.9, Vite 7, Tailwind CSS 4, Zustand, Headless UI, @dnd-kit, @apidevtools/swagger-parser, shadcn/ui, Sonner
- The rendering engine has two symmetric sides: input (parameters -> form controls) and output (responses -> data components), both following type-based defaults with developer overrides
- Smart defaults use three-tier precedence: user override > semantic smart default > type-based fallback
- Nesting is handled via master-detail: top-level collection (table/cards) -> click item -> detail view (modal/panel) with nested objects as sub-sections and nested arrays as sub-tables
- Two distinct modes: Configure mode (settings panel + inline editing) for developers, View mode (clean output) for consumers
- No code is generated — the engine renders at runtime based on configuration
- Known tech debt: Buffer polyfill for swagger-parser, orphaned SkeletonDetail.tsx, unused react-window dependency, CurrencyValue hardcoded currency field names

## Constraints

- **Read-only**: v1 only renders GET responses, no write operations
- **Authenticated APIs**: v1.4 added auth support (API Key, Bearer, Basic, Query Param)
- **Client-side**: No backend required, direct API calls from browser (CORS may limit some APIs)
- **Tech stack**: React 19, TypeScript 5.9, Vite 7, Tailwind CSS 4

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Read-only for v1 | Reduces complexity, focuses on the core rendering engine | Good |
| Public APIs only for v1 | Avoids auth complexity, simplifies first version | Good |
| Fixed component set for v1 | Extensibility adds complexity, start with curated defaults | Good |
| Master-detail for nesting | Natural pattern for browsing hierarchical data | Good |
| Two modes (configure/view) | Separates developer tooling from consumer experience | Good |
| Local storage for configs | No backend needed for v1, simplest persistence | Good |
| No code generation | Runtime rendering is the core differentiator | Good |
| CSS scrolling over react-window | react-window 2.x breaking API, CSS approach simpler | Good |
| Headless UI for Dialog/Disclosure | Accessible, composable, handles ARIA patterns | Good |
| @dnd-kit for drag-drop | Lightweight, accessible, React-first | Good |
| Zustand with persist middleware | Simple state management with built-in localStorage | Good |
| Tailwind CSS 4 with Vite plugin | CSS-first config, no PostCSS needed | Good |
| TypeScript strict + noUncheckedIndexedAccess | Catches array safety issues at compile time | Good |
| @apidevtools/swagger-parser | Full $ref resolution for OpenAPI specs | Good, needs Buffer polyfill |
| Zero-dependency heuristics for semantic detection | ML/NLP overkill for well-defined field patterns, keeps bundle small | Good |
| 75% confidence threshold for smart defaults | Balances false positives vs detection coverage | Good |
| Importance scoring: name 40%, richness 25%, presence 20%, position 15% | Weighted by signal reliability, name patterns most predictive | Good |
| Accordions over tabs for field grouping | UX research: 27% overlooked rate for tabs vs 8% for accordions | Good |
| Absolute-only date formatting | User decision: relative dates ("2 days ago") add ambiguity | Good |
| Three-tier precedence (override > smart > fallback) | Preserves user agency while improving defaults | Good |

| Session storage for secrets, localStorage for config | Balances security (no persistent credentials) with UX (auth config shape persists) | Good |
| Per-API auth scope by base URL origin | Simpler than per-endpoint, covers majority of use cases | Good |
| Zero new dependencies for auth | Native browser APIs (btoa, URLSearchParams, fetch headers) keep bundle small | Good |

---
*Last updated: 2026-02-10 after v1.4 milestone complete*
