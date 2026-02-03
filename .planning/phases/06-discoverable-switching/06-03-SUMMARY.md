---
phase: 06-discoverable-switching
plan: 03
subsystem: ui
tags: [react, onboarding, tooltip, cross-navigation, custom-events, localStorage]

# Dependency graph
requires:
  - phase: 06-02
    provides: FieldConfigPopover with right-click/long-press integration in all four renderers
  - phase: 06-01
    provides: ViewModeBadge and ConfigPanel with FieldListPanel
provides:
  - OnboardingTooltip component for one-time discovery of right-click feature
  - Bidirectional cross-navigation between ConfigPanel and FieldConfigPopover via custom DOM events
  - data-field-path attributes on field rows for scroll-to-field targeting
affects: [07-responsive-touch, 08-enhanced-details]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Custom DOM event pattern for cross-component navigation without store pollution"
    - "One-time tooltip with localStorage persistence and delayed show"
    - "Scroll-to-field with temporary highlight ring for visual feedback"

key-files:
  created:
    - src/components/config/OnboardingTooltip.tsx
  modified:
    - src/components/config/ConfigPanel.tsx
    - src/components/config/FieldListPanel.tsx
    - src/components/config/FieldConfigPopover.tsx
    - src/components/DynamicRenderer.tsx
    - src/components/renderers/TableRenderer.tsx
    - src/components/renderers/CardListRenderer.tsx
    - src/components/renderers/DetailRenderer.tsx
    - src/components/renderers/ListRenderer.tsx

key-decisions:
  - "D-06-03-01: Custom DOM events (api2ui:configure-field, api2ui:open-config-panel) for cross-navigation instead of store state"
  - "D-06-03-02: FieldConfigPopover 'More settings...' always visible, dispatches event rather than using prop callback"

patterns-established:
  - "Custom DOM event pattern: components dispatch/listen for namespaced events (api2ui:*) to coordinate across disconnected trees"
  - "data-field-path attribute convention for targeting field elements across panels and renderers"

# Metrics
duration: 4min
completed: 2026-02-03
---

# Phase 6 Plan 3: Cross-Navigation and Onboarding Tooltip Summary

**One-time onboarding tooltip with bidirectional cross-navigation between ConfigPanel and FieldConfigPopover via custom DOM events**

## Performance

- **Duration:** 4 min
- **Started:** 2026-02-03T04:06:30Z
- **Completed:** 2026-02-03T04:10:57Z
- **Tasks:** 2
- **Files modified:** 9

## Accomplishments
- Created OnboardingTooltip that shows "Right-click any field to customize it" after 3s delay, dismissed permanently via localStorage
- Added bidirectional cross-navigation: ConfigPanel field rows open contextual popover in renderer, popover "More settings..." opens ConfigPanel scrolled to field
- All four renderers (Table, CardList, Detail, List) listen for api2ui:configure-field events
- ConfigPanel listens for api2ui:open-config-panel events with scroll-to-field and temporary highlight ring
- FieldListPanel has data-field-path attributes and "configure in context" gear button per field row

## Task Commits

Each task was committed atomically:

1. **Task 1: Create OnboardingTooltip and add cross-navigation to ConfigPanel/FieldListPanel** - `7ec86fa` (feat)
2. **Task 2: Wire OnboardingTooltip and cross-navigation events into DynamicRenderer and renderers** - `c32c175` (feat)

## Files Created/Modified
- `src/components/config/OnboardingTooltip.tsx` - One-time tooltip with localStorage persistence and 3s delayed show
- `src/components/config/ConfigPanel.tsx` - Added scrollToField, api2ui:open-config-panel listener, handleConfigureField
- `src/components/config/FieldListPanel.tsx` - Added data-field-path attributes, onConfigureField prop, gear icon button
- `src/components/config/FieldConfigPopover.tsx` - "More settings..." always visible, dispatches api2ui:open-config-panel event
- `src/components/DynamicRenderer.tsx` - Renders OnboardingTooltip at depth 0 when data present
- `src/components/renderers/TableRenderer.tsx` - api2ui:configure-field listener, data-field-path on header cells
- `src/components/renderers/CardListRenderer.tsx` - api2ui:configure-field listener
- `src/components/renderers/DetailRenderer.tsx` - api2ui:configure-field listener
- `src/components/renderers/ListRenderer.tsx` - api2ui:configure-field listener

## Decisions Made
- **D-06-03-01:** Used custom DOM events (api2ui:configure-field, api2ui:open-config-panel) for cross-navigation instead of adding state to configStore. The event pattern avoids store pollution and works cleanly across disconnected component trees (ConfigPanel dialog vs renderer tree).
- **D-06-03-02:** Changed FieldConfigPopover "More settings..." to always be visible and dispatch a DOM event rather than relying on an optional prop callback. This ensures all popovers (regardless of which renderer created them) can navigate to ConfigPanel.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed unused variable TypeScript error in TableRenderer**
- **Found during:** Task 2 (Renderer integration)
- **Issue:** `fieldDef` destructured from match but never used, causing TypeScript strict build error
- **Fix:** Changed `const [fieldName, fieldDef] = match` to `const [fieldName] = match`
- **Files modified:** TableRenderer.tsx
- **Verification:** `npm run build` succeeds
- **Committed in:** c32c175

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Necessary for TypeScript strict mode compliance. No scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Phase 06 (Discoverable Component Switching) is now complete with all 3 plans executed
- ViewModeBadge (06-01), FieldConfigPopover (06-02), and cross-navigation + onboarding (06-03) all integrated
- Ready to proceed to Phase 07 or 08

---
*Phase: 06-discoverable-switching*
*Completed: 2026-02-03*
