# Requirements: api2ui

**Defined:** 2026-02-01
**Core Value:** Any API becomes instantly usable through a visual interface — paste a URL, see your data rendered as a real UI.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Core Engine

- [ ] **ENG-01**: App infers API structure by analyzing response JSON (type detection, nesting, arrays)
- [ ] **ENG-02**: App parses OpenAPI/Swagger spec when user provides spec URL
- [ ] **ENG-03**: Engine maps detected types to default UI components (array→table, object→detail, string→text, number→number, enum→dropdown, bool→toggle)
- [ ] **ENG-04**: App fetches live data from API on each page load (direct browser fetch, CORS-enabled APIs only)

### UI Rendering

- [ ] **RND-01**: Arrays render as table, card list, or list view (user-selectable)
- [ ] **RND-02**: Objects render as detail/key-value view
- [ ] **RND-03**: Master-detail navigation: click item in collection → detail view (modal or panel)
- [ ] **RND-04**: Nested data handled with configurable max depth, deeper levels collapsed
- [ ] **RND-05**: API parameters render as form controls (required params prominent, optional expandable)

### Configuration

- [ ] **CFG-01**: Configure mode with settings panel (global) and inline editing (per-element)
- [ ] **CFG-02**: View mode with clean output, no configuration controls
- [ ] **CFG-03**: Developer can override component type for any field
- [ ] **CFG-04**: Developer can set field visibility (show/hide fields)
- [ ] **CFG-05**: Developer can map field names to display labels
- [ ] **CFG-06**: CSS customizable styling
- [ ] **CFG-07**: View configurations persist in local storage

### Navigation & UX

- [ ] **NAV-01**: Auto-generated sidebar navigation for multi-endpoint APIs
- [ ] **NAV-02**: Landing page with URL input and clickable example APIs
- [ ] **NAV-03**: Loading states (spinners/skeletons) during API calls
- [ ] **NAV-04**: Specific error messages for CORS, network, API, and parse failures

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Mutations

- **MUT-01**: User can execute POST requests to create resources
- **MUT-02**: User can execute PUT/PATCH requests to update resources
- **MUT-03**: User can execute DELETE requests to remove resources

### Authentication

- **AUTH-01**: User can provide API key or bearer token for authenticated APIs
- **AUTH-02**: User can configure OAuth flow for APIs requiring it

### Advanced Features

- **ADV-01**: AI-assisted CSS customization via natural language
- **ADV-02**: Shareable links to configured API views
- **ADV-03**: CORS proxy fallback when direct browser fetch blocked
- **ADV-04**: Custom/extensible component system (developer-registered components)
- **ADV-05**: Smart parameter inference by field name (e.g., "zip" → zipcode input)

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Code generation | Core differentiator is runtime rendering, not codegen |
| Visual drag-drop builder | Complexity explosion, undermines simplicity |
| Custom component DSL | Vendor lock-in, standard React components preferred |
| Backend/database | v1 is client-side only, local storage sufficient |
| GraphQL support | REST-first, different paradigm entirely |
| Workflow automation | Different product category, not API rendering |
| Real-time/webhook support | Deferred, adds complexity beyond v1 scope |
| Mobile app | Web-first |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| ENG-01 | Phase 1 | Pending |
| ENG-02 | Phase 2 | Pending |
| ENG-03 | Phase 1 | Pending |
| ENG-04 | Phase 1 | Pending |
| RND-01 | Phase 1 | Pending |
| RND-02 | Phase 1 | Pending |
| RND-03 | Phase 2 | Pending |
| RND-04 | Phase 2 | Pending |
| RND-05 | Phase 2 | Pending |
| CFG-01 | Phase 3 | Pending |
| CFG-02 | Phase 3 | Pending |
| CFG-03 | Phase 3 | Pending |
| CFG-04 | Phase 3 | Pending |
| CFG-05 | Phase 3 | Pending |
| CFG-06 | Phase 3 | Pending |
| CFG-07 | Phase 3 | Pending |
| NAV-01 | Phase 4 | Pending |
| NAV-02 | Phase 4 | Pending |
| NAV-03 | Phase 1 | Pending |
| NAV-04 | Phase 1 | Pending |

**Coverage:**
- v1 requirements: 20 total
- Mapped to phases: 20
- Unmapped: 0 ✓

---
*Requirements defined: 2026-02-01*
*Last updated: 2026-02-01 after roadmap creation*
