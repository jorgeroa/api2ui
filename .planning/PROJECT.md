# api2ui

## What This Is

A web app that takes an API URL and automatically renders a live, interactive website for that API. Users paste an endpoint URL (or a Swagger/OpenAPI spec URL), and the engine infers the API's structure, maps data types to UI components, and renders an instant default view — no code generation, just runtime rendering. Developers configure the view via a settings panel and inline editing, non-technical users consume the clean rendered interface.

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

### Active

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

### Out of Scope

- CRUD / write operations (POST/PUT/DELETE) — v1 is read-only
- API authentication handling — v1 targets public APIs only
- AI-assisted CSS customization — deferred, not essential for v1
- Shareable links / hosted views — requires backend, defer
- Custom/extensible components — start with fixed set
- Smart param inference by name (e.g., "zip" -> zipcode input) — defer
- Backend for persistence — v1 uses local storage
- Mobile app — web-first

## Context

- **Shipped v1.0 MVP** with 6,099 lines of TypeScript/TSX/CSS across 207 files
- **Tech stack:** React 19, TypeScript 5.9, Vite 7, Tailwind CSS 4, Zustand, Headless UI, @dnd-kit, @apidevtools/swagger-parser
- The rendering engine has two symmetric sides: input (parameters -> form controls) and output (responses -> data components), both following type-based defaults with developer overrides
- Nesting is handled via master-detail: top-level collection (table/cards) -> click item -> detail view (modal/panel) with nested objects as sub-sections and nested arrays as sub-tables
- Two distinct modes: Configure mode (settings panel + inline editing) for developers, View mode (clean output) for consumers
- No code is generated — the engine renders at runtime based on configuration
- Known tech debt: Buffer polyfill for swagger-parser, orphaned SkeletonDetail.tsx, unused react-window dependency

## Constraints

- **Read-only**: v1 only renders GET responses, no write operations
- **Public APIs**: v1 does not handle authentication, only public endpoints
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

---
*Last updated: 2026-02-02 after v1.0 milestone*
