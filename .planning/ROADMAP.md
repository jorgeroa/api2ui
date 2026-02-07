# Roadmap: api2ui

## Milestones

- ✅ **v1.0 MVP** - Phases 1-4 (shipped 2026-01-XX)
- ✅ **v1.1 UX Polish** - Phases 5-8 (shipped 2026-02-05)
- ✅ **v1.2 Smart Parameters & Layout System** - Phases 9-11 (shipped 2026-02-07)

## Phases

<details>
<summary>✅ v1.0 MVP (Phases 1-4) - SHIPPED 2026-01-XX</summary>

### Phase 1: Foundation
**Goal**: Project scaffolding and core rendering engine
**Plans**: Completed

### Phase 2: Type-Based Defaults
**Goal**: Auto-map API data types to UI components
**Plans**: Completed

### Phase 3: Configuration System
**Goal**: Developer configuration tools
**Plans**: Completed

### Phase 4: Landing & Examples
**Goal**: User-friendly entry point
**Plans**: Completed

</details>

<details>
<summary>✅ v1.1 UX Polish (Phases 5-8) - SHIPPED 2026-02-05</summary>

### Phase 5: Smart Visual Defaults
**Goal**: Data looks good out of the box without any configuration — images auto-rendered, cards have hero images, typography establishes visual hierarchy
**Requirements**: VIZ-01, VIZ-02, VIZ-03, VIZ-04, VIZ-05
**Plans**: 3 plans
- [x] 05-01-PLAN.md -- Image detection utility + PrimitiveRenderer auto-image rendering
- [x] 05-02-PLAN.md -- Card hero images + Table thumbnail previews
- [x] 05-03-PLAN.md -- Detail view full-width images + Typography hierarchy

### Phase 6: Discoverable Component Switching & Per-Element Config
**Goal**: Users can discover and switch component types without entering Configure mode, and configure individual elements in context
**Requirements**: DSC-01, DSC-02, DSC-03, DSC-04
**Plans**: 3 plans
- [x] 06-01-PLAN.md -- ViewModeBadge with carousel cycling + DynamicRenderer integration
- [x] 06-02-PLAN.md -- FieldConfigPopover with right-click/long-press + renderer integration
- [x] 06-03-PLAN.md -- Cross-navigation + onboarding tooltip

### Phase 7: Pagination & Large Dataset Handling
**Goal**: Large arrays are paginated with sensible defaults, improving both performance and browsing UX
**Requirements**: PAG-01, PAG-02, PAG-03, PAG-04
**Plans**: 2 plans
- [x] 07-01-PLAN.md -- Pagination hook, types, and ConfigStore extension
- [x] 07-02-PLAN.md -- PaginationControls UI and renderer integration

### Phase 8: Enhanced Detail Views & Layout Polish
**Goal**: Detail views feel like polished product pages with hero images, two-column layouts, and breadcrumb navigation
**Requirements**: DTL-01, DTL-02, DTL-03, DTL-04, DTL-05
**Plans**: 2 plans
- [x] 08-01-PLAN.md -- DetailRenderer hero image, two-column layout, horizontal card scroller
- [x] 08-02-PLAN.md -- Panel drilldown mode and breadcrumb in all modes

</details>

<details>
<summary>✅ v1.2 Smart Parameters & Layout System (Phases 9-11) - SHIPPED 2026-02-07</summary>

**Milestone Goal:** Transform parameter handling with smart URL parsing, type inference, rich input components, and user-switchable layouts.

#### Phase 9: URL Parsing & Type Inference Foundation ✅
**Goal**: Parse raw URL query strings with smart type inference and parameter persistence
**Plans**: 7 plans completed

#### Phase 10: Layout System & Parameter Grouping ✅
**Goal**: User-selectable layout presets with responsive behavior
**Plans**: 5 plans completed

#### Phase 11: Rich Input Components & UX Polish ✅
**Goal**: Rich form components with inline re-fetch, validation, and applied filter chips
**Plans**: 7 plans completed

</details>

## Progress

**Execution Order:**
Phases execute in numeric order: 9 → 10 → 11

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Foundation | v1.0 | 3/3 | Complete | 2026-01-XX |
| 2. Type-Based Defaults | v1.0 | 2/2 | Complete | 2026-01-XX |
| 3. Configuration System | v1.0 | 2/2 | Complete | 2026-01-XX |
| 4. Landing & Examples | v1.0 | 1/1 | Complete | 2026-01-XX |
| 5. Smart Visual Defaults | v1.1 | 3/3 | Complete | 2026-02-03 |
| 6. Discoverable Component Switching | v1.1 | 3/3 | Complete | 2026-02-04 |
| 7. Pagination | v1.1 | 2/2 | Complete | 2026-02-04 |
| 8. Enhanced Detail Views | v1.1 | 2/2 | Complete | 2026-02-05 |
| 9. URL Parsing & Type Inference Foundation | v1.2 | 7/7 | Complete | 2026-02-05 |
| 10. Layout System & Parameter Grouping | v1.2 | 5/5 | Complete | 2026-02-07 |
| 11. Rich Input Components & UX Polish | v1.2 | 7/7 | Complete | 2026-02-07 |

---
*Last updated: 2026-02-07 after Phase 11 execution complete - v1.2 milestone shipped*
