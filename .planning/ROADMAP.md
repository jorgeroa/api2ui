# Roadmap: api2ui

## Milestones

- ✅ **v1.0 MVP** - Phases 1-4 (shipped 2026-01-XX)
- ✅ **v1.1 UX Polish** - Phases 5-8 (shipped 2026-02-05)
- 🚧 **v1.2 Smart Parameters & Layout System** - Phases 9-11 (in progress)

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

### 🚧 v1.2 Smart Parameters & Layout System (In Progress)

**Milestone Goal:** Transform parameter handling with smart URL parsing, type inference, rich input components, and user-switchable layouts.

#### Phase 9: URL Parsing & Type Inference Foundation ✅
**Goal**: Parse raw URL query strings with smart type inference and parameter persistence
**Depends on**: Phase 8
**Requirements**: PARSE-01, PARSE-02, PARSE-03, PARSE-04, PARSE-05, PARSE-06, PARSE-07, PARSE-08
**Success Criteria** (what must be TRUE):
  1. User can paste any URL with query params and see them parsed into editable form fields
  2. Array parameters work in both bracket notation (tag[]=x) and repeated key formats (tag=x&tag=y)
  3. Parameters with common prefixes auto-group into collapsible sections (e.g., ddcFilter[*] → "Filters")
  4. Date strings, emails, URLs, coordinates, and zip codes are automatically detected and shown with appropriate input types
  5. Parameter values persist across browser sessions per endpoint
**Plans**: 7 plans

Plans:
- [x] 09-01-PLAN.md — URL parser with array detection (TDD)
- [x] 09-02-PLAN.md — Type inferrer service (TDD)
- [x] 09-03-PLAN.md — Parameter persistence store
- [x] 09-04-PLAN.md — Parameter grouping UI
- [x] 09-05-PLAN.md — Type icons and override dropdown
- [x] 09-06-PLAN.md — ParameterForm integration
- [x] 09-07-PLAN.md — App.tsx integration (gap closure)

#### Phase 10: Layout System & Parameter Grouping ✅
**Goal**: User-selectable layout presets with responsive behavior
**Depends on**: Phase 9
**Requirements**: LAYOUT-01, LAYOUT-02, LAYOUT-03, LAYOUT-04, LAYOUT-05, LAYOUT-06
**Success Criteria** (what must be TRUE):
  1. User can switch between sidebar, top bar, split view, and drawer layouts with a visible control
  2. Layout choice persists per endpoint across sessions
  3. On mobile (viewport < 768px), layout defaults to collapsible drawer for optimal touch interaction
  4. Layout transitions are smooth without losing form state or scroll position
  5. Parameter groups from Phase 9 adapt to each layout mode appropriately
**Plans**: 5 plans

Plans:
- [x] 10-01-PLAN.md — Layout preference store + useMediaQuery hook
- [x] 10-02-PLAN.md — Sidebar and TopBar layout components
- [x] 10-03-PLAN.md — Split and Drawer layout components
- [x] 10-04-PLAN.md — LayoutSwitcher and LayoutContainer
- [x] 10-05-PLAN.md — App.tsx integration with verification

#### Phase 11: Rich Input Components & UX Polish
**Goal**: Rich form components with inline re-fetch, validation, and applied filter chips
**Depends on**: Phase 10
**Requirements**: FORM-01, FORM-02, FORM-03, FORM-04, FORM-05, FORM-06, FETCH-01, FETCH-02, FETCH-03, FETCH-04, FETCH-05, FETCH-06, FETCH-07
**Success Criteria** (what must be TRUE):
  1. Date/datetime fields show calendar picker instead of plain text input
  2. Array parameters render as tag input with chip UI (add/remove individual values)
  3. Numeric ranges show slider components when min/max are known or inferred
  4. User receives inline validation feedback on blur (not on keystroke) before submitting
  5. Active filters display as removable chips above results with "Clear all" button
  6. Clicking "Apply" or changing params triggers smooth inline re-fetch with loading state (no full page reload)
  7. URL preview shows what will be fetched before user clicks Apply
**Plans**: 7 plans

Plans:
- [ ] 11-01-PLAN.md — shadcn/ui setup and component installation
- [ ] 11-02-PLAN.md — DateTimePicker and TagInput components
- [ ] 11-03-PLAN.md — RangeSlider and EnumCheckboxGroup components
- [ ] 11-04-PLAN.md — AppliedFilters and URLPreview components
- [ ] 11-05-PLAN.md — ParameterInput integration with rich components
- [ ] 11-06-PLAN.md — Hybrid re-fetch behavior and error toast
- [ ] 11-07-PLAN.md — Full App.tsx integration and verification

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
| 11. Rich Input Components & UX Polish | v1.2 | 0/7 | Not started | - |

---
*Last updated: 2026-02-07 after Phase 11 planning complete*
