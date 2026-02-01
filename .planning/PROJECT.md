# api2ui

## What This Is

A web app that takes an API URL and automatically renders a live, interactive website for that API. Users paste an endpoint URL (with an optional Swagger/OpenAPI spec), and the engine infers the API's structure, maps data types to UI components, and renders an instant default view — no code generation, just runtime rendering. Developers configure the view, non-technical users consume it.

## Core Value

Any API becomes instantly usable through a visual interface — paste a URL, see your data rendered as a real UI.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] User can paste an API URL and see an instant default render
- [ ] Engine infers API structure from responses (or parses Swagger/OpenAPI spec)
- [ ] Auto sidebar navigation for multi-endpoint APIs
- [ ] Type-based default component mapping for responses (array→table/cards, object→detail, primitive→text)
- [ ] Type-based default component mapping for parameters (string→text, number→number, enum→dropdown, bool→toggle)
- [ ] Required params shown prominently, optional in expandable section
- [ ] Master-detail pattern for nested data (collection → click → detail view)
- [ ] Configurable max nesting depth
- [ ] Developer can override component type, props, visibility, and field mapping at each level
- [ ] Configure mode with settings panel (global) and inline editing (per-element)
- [ ] View mode with clean output, no controls
- [ ] CSS customizable styling
- [ ] Landing page with URL input and clickable example APIs
- [ ] Live data fetched on each page load
- [ ] Local storage for saving view configurations
- [ ] Fixed component set: tables, cards, lists, detail views, form inputs

### Out of Scope

- CRUD / write operations (POST/PUT/DELETE) — v1 is read-only
- API authentication handling — v1 targets public APIs only
- AI-assisted CSS customization — deferred, not essential for v1
- Shareable links / hosted views — requires backend, defer
- Custom/extensible components — start with fixed set
- Smart param inference by name (e.g., "zip" → zipcode input) — defer
- Backend for persistence — v1 uses local storage
- Mobile app — web-first

## Context

- The project name is "api2ui" — the idea is that an API is a language with schema and semantics, and this tool gives it a visual representation
- The rendering engine has two symmetric sides: input (parameters → form controls) and output (responses → data components), both following the same pattern of type-based defaults with developer overrides
- Nesting is handled via master-detail: top-level collection (table/cards) → click item → detail view (modal/panel) with nested objects as sub-sections and nested arrays as sub-tables
- The audience is dual: developers configure the view, non-technical users consume the rendered interface
- Two distinct modes: Configure mode (settings panel + inline editing) for developers, View mode (clean output) for consumers
- No code is generated — the engine renders at runtime based on configuration

## Constraints

- **Read-only**: v1 only renders GET responses, no write operations
- **Public APIs**: v1 does not handle authentication, only public endpoints
- **Client-side**: No backend required for v1, direct API calls from browser (CORS may limit some APIs)
- **Tech stack**: To be determined from research

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Read-only for v1 | Reduces complexity, focuses on the core rendering engine | — Pending |
| Public APIs only for v1 | Avoids auth complexity, simplifies first version | — Pending |
| Fixed component set for v1 | Extensibility adds complexity, start with curated defaults | — Pending |
| Master-detail for nesting | Natural pattern for browsing hierarchical data | — Pending |
| Two modes (configure/view) | Separates developer tooling from consumer experience | — Pending |
| Local storage for configs | No backend needed for v1, simplest persistence | — Pending |
| No code generation | Runtime rendering is the core differentiator | — Pending |

---
*Last updated: 2026-02-01 after initialization*
