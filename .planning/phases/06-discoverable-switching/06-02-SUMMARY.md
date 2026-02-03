---
phase: 06-discoverable-switching
plan: 02
subsystem: ui
tags: [react, popover, context-menu, long-press, field-config, right-click]

# Dependency graph
requires:
  - phase: 05-smart-visual-defaults
    provides: PrimitiveRenderer with getAvailableRenderModes for component type options
  - phase: 06-01
    provides: ViewModeBadge and renderer integration patterns
provides:
  - FieldConfigPopover component for contextual field configuration
  - useLongPress hook for mobile long-press detection
  - Right-click/long-press integration in all four renderers
affects: [06-03-cross-navigation, 08-enhanced-details]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Staged state pattern: popover initializes from store, commits only on Apply"
    - "Inline touch timer pattern for long-press detection without hook per-element"
    - "Backdrop overlay pattern for click-outside dismissal"

key-files:
  created:
    - src/components/config/FieldConfigPopover.tsx
    - src/hooks/useLongPress.ts
  modified:
    - src/components/renderers/TableRenderer.tsx
    - src/components/renderers/CardListRenderer.tsx
    - src/components/renderers/DetailRenderer.tsx
    - src/components/renderers/ListRenderer.tsx

key-decisions:
  - "D-06-02-01: Used inline touch timer pattern instead of useLongPress hook per-element to avoid hook-in-loop issues"
  - "D-06-02-02: Viewport boundary detection flips popover left/upward when near edges"
  - "D-06-02-03: Component type selector only shown when multiple render modes available"

patterns-established:
  - "Staged popover state: initialize from store on open, commit only on Apply, discard on Cancel"
  - "Context menu integration: popoverState + handleFieldContextMenu pattern across renderers"

# Metrics
duration: 5min
completed: 2026-02-03
---

# Phase 6 Plan 2: FieldConfigPopover Summary

**Right-click/long-press contextual field configuration popover with staged visibility, label, and component type controls integrated into all four renderers**

## Performance

- **Duration:** 5 min
- **Started:** 2026-02-03T03:57:30Z
- **Completed:** 2026-02-03T04:02:50Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- Created FieldConfigPopover with staged state pattern (visibility toggle, custom label, component type selector)
- Created useLongPress hook for mobile long-press detection with timer-based approach
- Integrated right-click context menu handlers into all four renderers (Table, CardList, Detail, List)
- Added mobile long-press support via inline touch timer pattern in all renderers
- Popover respects viewport boundaries with flip positioning

## Task Commits

Each task was committed atomically:

1. **Task 1: Create useLongPress hook and FieldConfigPopover component** - `54902bc` (feat)
2. **Task 2: Integrate FieldConfigPopover into renderers** - `92ee7a1` (shared with 06-01 due to concurrent execution)

**Note:** Task 2 changes were committed as part of `92ee7a1` due to concurrent plan execution timing.

## Files Created/Modified
- `src/hooks/useLongPress.ts` - Mobile long-press detection hook with timer-based touch event handling
- `src/components/config/FieldConfigPopover.tsx` - Contextual popover with staged visibility, label, and component type controls
- `src/components/renderers/TableRenderer.tsx` - Added onContextMenu and touch handlers to table cells
- `src/components/renderers/CardListRenderer.tsx` - Added onContextMenu and touch handlers to card field rows
- `src/components/renderers/DetailRenderer.tsx` - Added onContextMenu and touch handlers to detail field values
- `src/components/renderers/ListRenderer.tsx` - Added onContextMenu and touch handlers to list item fields

## Decisions Made
- **D-06-02-01:** Used inline touch timer pattern instead of useLongPress hook per-element. The hook approach would require calling hooks inside map loops (violating React rules), so each renderer uses inline setTimeout/clearTimeout on touch events instead.
- **D-06-02-02:** Viewport boundary detection flips popover left when x + 256 > innerWidth, and upward when y + panelHeight > innerHeight. Ensures popover never clips off-screen.
- **D-06-02-03:** Component type selector (Display As dropdown) only renders when getAvailableRenderModes returns more than one option. For fields with only "text" as an option, the selector is hidden to avoid clutter.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed TypeScript strict null check on touch events**
- **Found during:** Task 2 (Renderer integration)
- **Issue:** `e.touches[0]` is possibly undefined in TypeScript strict mode, causing build failure
- **Fix:** Added null guard `if (!touch) return` and captured coordinates before setTimeout closure
- **Files modified:** DetailRenderer.tsx, ListRenderer.tsx
- **Verification:** `npm run build` succeeds
- **Committed in:** 92ee7a1

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Necessary for TypeScript strict mode compliance. No scope creep.

## Issues Encountered
- Task 2 renderer changes were committed as part of the concurrent 06-01 plan execution commit (`92ee7a1`) because both plans modified the same renderer files simultaneously. The code is correct and all changes are in git.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- FieldConfigPopover ready for cross-navigation integration in 06-03
- All four renderers have popover support
- Ready for 06-03-PLAN.md (Cross-navigation + onboarding tooltip)

---
*Phase: 06-discoverable-switching*
*Completed: 2026-02-03*
