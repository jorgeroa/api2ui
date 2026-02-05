# Milestone v1.1: UX Polish & Visual Intelligence

**Status:** Complete
**Phases:** 5-8
**Total Plans:** TBD (defined during phase planning)

## Overview

Transform api2ui from a functional data explorer into a visually polished directory-like experience. Four phases deliver smart visual defaults (auto-image detection, hero images, typography), discoverable component switching with per-element config, client-side pagination for large datasets, and enhanced detail views with two-column layouts and breadcrumb navigation.

## Phases

### Phase 5: Smart Visual Defaults

**Goal**: Data looks good out of the box without any configuration — images auto-rendered, cards have hero images, typography establishes visual hierarchy
**Depends on**: v1.0 (complete)
**Requirements**: VIZ-01, VIZ-02, VIZ-03, VIZ-04, VIZ-05
**Success Criteria** (what must be TRUE):
  1. URL fields ending in image extensions (.jpg, .png, .gif, .webp, .svg) render as `<img>` by default
  2. Card view detects first image-URL field and displays it as hero image
  3. Table view shows thumbnail previews for image-URL columns
  4. Primary fields (name/title/label) render with larger/bolder typography than secondary fields
  5. Detail views render image fields as full-width images with section headings for nested objects
**Plans**: 3 plans
- [x] 05-01-PLAN.md -- Image detection utility + PrimitiveRenderer auto-image rendering
- [x] 05-02-PLAN.md -- Card hero images + Table thumbnail previews
- [x] 05-03-PLAN.md -- Detail view full-width images + Typography hierarchy

### Phase 6: Discoverable Component Switching & Per-Element Config

**Goal**: Users can discover and switch component types without entering Configure mode, and configure individual elements in context
**Depends on**: Phase 5
**Requirements**: DSC-01, DSC-02, DSC-03, DSC-04
**Success Criteria** (what must be TRUE):
  1. A subtle badge/chip on each renderer allows switching component type in View mode
  2. ComponentPicker shows live previews and is accessible from the view-mode badge
  3. Clicking a field/element opens a contextual config popover (visibility, label, component type)
  4. ConfigPanel provides cross-navigation links to per-element config
**Plans**: 3 plans
- [x] 06-01-PLAN.md -- ViewModeBadge with carousel cycling + DynamicRenderer integration
- [x] 06-02-PLAN.md -- FieldConfigPopover with right-click/long-press + renderer integration
- [x] 06-03-PLAN.md -- Cross-navigation + onboarding tooltip

### Phase 7: Pagination & Large Dataset Handling

**Goal**: Large arrays are paginated with sensible defaults, improving both performance and browsing UX
**Depends on**: Phase 5 (can run in parallel with Phase 6)
**Requirements**: PAG-01, PAG-02, PAG-03, PAG-04
**Success Criteria** (what must be TRUE):
  1. Arrays with >20 items (tables) or >12 items (cards) are automatically paginated
  2. Page navigation shows prev/next, page numbers, and "Showing X-Y of Z" status
  3. Items-per-page is configurable via selector control
  4. Pagination preferences persist per-endpoint across sessions
**Plans**: 2 plans
- [x] 07-01-PLAN.md -- Pagination hook, types, and ConfigStore extension
- [x] 07-02-PLAN.md -- PaginationControls UI and renderer integration

### Phase 8: Enhanced Detail Views & Layout Polish

**Goal**: Detail views feel like polished product pages with hero images, two-column layouts, and breadcrumb navigation
**Depends on**: Phase 5, Phase 6
**Requirements**: DTL-01, DTL-02, DTL-03, DTL-04, DTL-05
**Success Criteria** (what must be TRUE):
  1. Detail views show hero image at top when an image field is detected
  2. Fields display in two-column layout with visual grouping of related fields
  3. Nested arrays can render as horizontal card scrollers (alternative to sub-tables)
  4. Breadcrumb navigation appears when drilling into nested detail views
  5. Card detail view mode is selectable (modal vs panel)
**Plans**: 2 plans
- [x] 08-01-PLAN.md -- DetailRenderer hero image, two-column layout, horizontal card scroller
- [x] 08-02-PLAN.md -- Panel drilldown mode and breadcrumb in all modes

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 5. Smart Visual Defaults | 3/3 | Complete | 2026-02-03 |
| 6. Discoverable Switching | 3/3 | Complete | 2026-02-03 |
| 7. Pagination | 2/2 | Complete | 2026-02-05 |
| 8. Enhanced Details | 2/2 | Complete | 2026-02-05 |
