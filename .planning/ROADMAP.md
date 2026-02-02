# Roadmap: api2ui

## Overview

Transform any API into a visual interface through four focused phases: establish the foundation with basic URL-to-UI rendering, add sophisticated handling for nested data and OpenAPI specs, enable user customization with persistence, and complete the experience with multi-endpoint navigation and a polished landing page. Each phase delivers observable value, building from core engine to production-ready tool.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Foundation & Core Rendering** - Prove the pipeline: URL → schema → UI
- [x] **Phase 2: Advanced Rendering & OpenAPI** - Handle complexity and industry standards
- [ ] **Phase 3: Configuration System** - Enable customization and persistence
- [ ] **Phase 4: Navigation & Polish** - Complete the user experience

## Phase Details

### Phase 1: Foundation & Core Rendering
**Goal**: User can paste an API URL and see live data rendered as a functional UI with basic components
**Depends on**: Nothing (first phase)
**Requirements**: ENG-01, ENG-03, ENG-04, RND-01, RND-02, NAV-03, NAV-04
**Success Criteria** (what must be TRUE):
  1. User pastes a REST API URL and sees data rendered automatically
  2. Arrays display as tables with columns for each field
  3. Objects display as detail views with key-value pairs
  4. Loading states appear during data fetch
  5. Specific error messages show for CORS, network, and parse failures
**Plans**: 3 plans

Plans:
- [x] 01-01-PLAN.md — Project scaffold + types + API fetch service
- [x] 01-02-PLAN.md — Schema inference engine (TDD)
- [x] 01-03-PLAN.md — UI components + registry + store + app shell wiring

### Phase 2: Advanced Rendering & OpenAPI
**Goal**: User can handle complex APIs with nested data, parameters, and OpenAPI spec support
**Depends on**: Phase 1
**Requirements**: ENG-02, RND-03, RND-04, RND-05
**Success Criteria** (what must be TRUE):
  1. User can provide OpenAPI/Swagger spec URL and get rendered UI
  2. User can click item in table to see detail view in modal or panel
  3. Nested arrays render as sub-tables within detail views
  4. Deep nesting is handled with configurable max depth (deeper levels collapsed)
  5. API parameters render as form controls with required params prominent and optional params expandable
**Plans**: 3 plans

Plans:
- [x] 02-01-PLAN.md — Master-detail modal + collapsible nested sections
- [x] 02-02-PLAN.md — OpenAPI parser service (TDD)
- [x] 02-03-PLAN.md — Parameter forms + store integration + app wiring

### Phase 3: Configuration System
**Goal**: User can customize component types, visibility, labels, and styling with configurations persisting across sessions
**Depends on**: Phase 2
**Requirements**: CFG-01, CFG-02, CFG-03, CFG-04, CFG-05, CFG-06, CFG-07
**Success Criteria** (what must be TRUE):
  1. Developer can toggle between Configure mode (with settings panel and inline editing) and View mode (clean output)
  2. Developer can override component type for any field (e.g., change table to cards)
  3. Developer can hide/show individual fields
  4. Developer can map field names to custom display labels
  5. Developer can customize CSS styling
  6. Configurations persist in local storage and reload on page refresh
**Plans**: 5 plans

Plans:
- [x] 03-01-PLAN.md — Config store with persist middleware + theme CSS variables
- [x] 03-02-PLAN.md — Configure toggle button + slide-out panel + theme applier
- [ ] 03-03-PLAN.md — Field visibility controls + label editing (inline + panel)
- [ ] 03-04-PLAN.md — Component type overrides + preview picker + new renderers
- [ ] 03-05-PLAN.md — Drag-and-drop reordering + style customization panel

### Phase 4: Navigation & Polish
**Goal**: User can navigate multi-endpoint APIs seamlessly and new users can discover value through polished landing page with examples
**Depends on**: Phase 3
**Requirements**: NAV-01, NAV-02
**Success Criteria** (what must be TRUE):
  1. Multi-endpoint APIs auto-generate sidebar navigation
  2. Landing page displays URL input field and clickable example APIs
  3. User can click example API and immediately see rendered result
  4. Navigation between endpoints preserves configurations
**Plans**: TBD

Plans:
- [ ] TBD during planning

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation & Core Rendering | 3/3 | Complete | 2026-02-01 |
| 2. Advanced Rendering & OpenAPI | 3/3 | Complete | 2026-02-01 |
| 3. Configuration System | 2/5 | In Progress | - |
| 4. Navigation & Polish | 0/TBD | Not started | - |

---
*Created: 2026-02-01*
