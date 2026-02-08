# Roadmap: api2ui

## Milestones

- ✅ **v1.0 MVP** - Phases 1-4 (shipped 2026-01-XX)
- ✅ **v1.1 UX Polish** - Phases 5-8 (shipped 2026-02-05)
- ✅ **v1.2 Smart Parameters & Layout System** - Phases 9-11 (shipped 2026-02-07)
- 🚧 **v1.3 Smart Default Selection** - Phases 12-16 (active)

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

<details open>
<summary>🚧 v1.3 Smart Default Selection (Phases 12-16) - ACTIVE</summary>

**Milestone Goal:** Make the rendering engine smarter about picking default components through semantic field analysis and intelligent component selection.

### Phase 12: Core Semantic Detection ✅
**Goal**: Engine accurately classifies common field patterns and assigns semantic meaning
**Dependencies**: None (foundation phase)
**Requirements**: SEM-01, SEM-02, SEM-03, SEM-04
**Plans**: 3 plans
- [x] 12-01-PLAN.md -- Foundation types, confidence scoring, memoization cache, schema extension
- [x] 12-02-PLAN.md -- Pattern library (22 patterns) and detection engine
- [x] 12-03-PLAN.md -- Comprehensive tests and validation (98 tests)

**Success Criteria:**
1. Pattern library detects 20-30 common field types (reviews, images, price, rating, status, tags, specifications, etc.)
2. Multi-signal detection validates name + type + values before HIGH confidence classification
3. OpenAPI hints (description, format, title) successfully inform semantic classification when present
4. Confidence scoring determines fallback behavior: >=75% confidence applies smart default, <75% falls back to type-based default
5. Classification runs once per API response with <100ms overhead

### Phase 13: Field Importance & Grouping Analysis ✅
**Goal**: System identifies primary fields, de-emphasizes metadata, and detects logical groupings
**Dependencies**: Phase 12 (semantic detection)
**Requirements**: SEM-05, IMP-01, IMP-02, IMP-03, IMP-04, GRP-01, GRP-04, INT-02, INT-03, INT-04
**Plans**: 2 plans
- [x] 13-01-PLAN.md -- Foundation types, config, importance scoring algorithm with tests
- [x] 13-02-PLAN.md -- Grouping detection (prefix + semantic clustering) with public API

**Success Criteria:**
1. Primary fields (name, title, headline) automatically detected and flagged for prominent display
2. Metadata fields (IDs, timestamps, internal fields) automatically detected and flagged for de-emphasis
3. Importance scoring algorithm ranks fields using: name pattern (40%), visual richness (25%), data presence (20%), position (15%)
4. Prefix-based grouping detects common patterns (billing*, shipping*, contact*) and creates section suggestions
5. Semantic clustering groups related fields (email + phone + address → "Contact") even without shared prefix
6. Feature flag enables/disables smart defaults with kill switch
7. v1.2 configurations preserved during upgrade through config versioning
8. Analysis metadata cached in appStore with <100ms overhead per API response
9. User overrides in configStore always take precedence over smart defaults

### Phase 14: Smart Component Selection
**Goal**: Arrays and objects render with context-appropriate components based on semantic analysis
**Dependencies**: Phase 13 (field importance & grouping)
**Requirements**: ARR-01, ARR-02, ARR-03, ARR-04, ARR-05, ARR-06, INT-01, INT-05
**Plans**: 2 plans
- [ ] 14-01-PLAN.md -- Selection service foundation with heuristics and tests
- [ ] 14-02-PLAN.md -- DynamicRenderer integration and CardListRenderer tier filtering

**Success Criteria:**
1. Arrays with review/comment semantics default to card layout instead of table
2. Arrays with specification/attribute semantics default to key-value pairs
3. Arrays of image URLs default to gallery/grid view
4. Table vs cards heuristic applies: <8 fields + rich content → cards; 10+ fields → table
5. Arrays with rating + comment fields render as cards with star rating components
6. Arrays with date/timestamp progression render as timeline view
7. Smart defaults integrate with DynamicRenderer without breaking v1.2 behavior
8. Component switcher continues to work for user overrides (INT-05)
9. Analysis falls back to type-based defaults when confidence <75%

### Phase 15: Smart Grouping & Visual Hierarchy
**Goal**: Detail views organize into visual sections with hero layout and accordion-based grouping
**Dependencies**: Phase 14 (smart component selection)
**Requirements**: IMP-05, GRP-02, GRP-03, GRP-05, GRP-06
**Plans**: Pending

**Success Criteria:**
1. Detail views apply visual hierarchy with primary/secondary/tertiary styling based on importance scores
2. Sections use vertical accordions (not horizontal tabs) when >8 fields with clear clusters
3. "Show all (ungrouped)" escape hatch always available for flat view
4. Detail views use Hero + Overview + Sections layout pattern when appropriate
5. Maximum two-level grouping enforced to prevent over-nesting
6. Grouping only applies when beneficial: >8 total fields AND clear semantic clusters AND no tab with <3 fields

### Phase 16: Context-Aware Components
**Goal**: Specialized components render for detected semantic types with proper formatting
**Dependencies**: Phase 15 (smart grouping)
**Requirements**: CTX-01, CTX-02, CTX-03, CTX-04, CTX-05
**Plans**: Pending

**Success Criteria:**
1. Status/state fields render as colored badges with appropriate color semantics
2. Tags/categories arrays render as tag chips (pill-shaped labels)
3. Rating fields render as star rating display components
4. Price fields render with currency formatting using Intl.NumberFormat
5. Date fields render as relative ("2 days ago") or formatted display with localization
6. Context-aware components integrate with existing component switcher
7. Components degrade gracefully when semantic detection has low confidence

</details>

## Progress

**Execution Order:**
Phases execute in numeric order: 12 → 13 → 14 → 15 → 16

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
| 12. Core Semantic Detection | v1.3 | 3/3 | Complete | 2026-02-07 |
| 13. Field Importance & Grouping Analysis | v1.3 | 2/2 | Complete | 2026-02-08 |
| 14. Smart Component Selection | v1.3 | 0/2 | Planned | - |
| 15. Smart Grouping & Visual Hierarchy | v1.3 | 0/? | Pending | - |
| 16. Context-Aware Components | v1.3 | 0/? | Pending | - |

---
*Last updated: 2026-02-08 after Phase 14 planning*
