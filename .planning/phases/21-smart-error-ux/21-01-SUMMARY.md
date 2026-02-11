---
phase: 21-smart-error-ux
plan: 01
subsystem: auth
tags: [error-handling, ux, authentication, shadcn-ui]

# Dependency graph
requires:
  - phase: 20-openapi-auto-detection
    provides: Auth panel UI and error handling infrastructure
provides:
  - Actionable 401 error with "Configure Authentication" button
  - Distinct 403 error with permission guidance text
  - Callback chain from AuthErrorDisplay through AuthPanel to URLInput
affects: [22-auto-retry-logic, future-error-handling]

# Tech tracking
tech-stack:
  added: []
  patterns: [callback-threading, error-recovery-actions]

key-files:
  created: []
  modified:
    - src/components/auth/AuthErrorDisplay.tsx
    - src/components/auth/AuthPanel.tsx
    - src/components/URLInput.tsx

key-decisions:
  - "Use shadcn Button component for 'Configure Authentication' action"
  - "Thread callback through three-layer component hierarchy for panel expansion"
  - "Provide onConfigureClick as optional prop to support future extensibility"

patterns-established:
  - "Error components accept optional action callbacks for contextual recovery"
  - "Auth errors trigger inline action buttons rather than passive messaging"

# Metrics
duration: 3min
completed: 2026-02-10
---

# Phase 21 Plan 01: Smart Error UX Summary

**401 errors now show actionable "Configure Authentication" button that opens auth panel; 403 errors display distinct permission guidance text**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-10T23:16:24Z
- **Completed:** 2026-02-10T23:19:13Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Enhanced AuthErrorDisplay with inline action button for 401 errors
- Distinct messaging for 401 (authentication required) vs 403 (insufficient permissions)
- Callback chain from URLInput through AuthPanel to AuthErrorDisplay enables panel expansion
- Fixed pre-existing TypeScript errors blocking builds

## Task Commits

Each task was committed atomically:

1. **Task 1: Enhance AuthErrorDisplay with action button and improved messaging** - `afdc036` (feat)
2. **Task 2: Thread onConfigureClick callback through AuthPanel and URLInput** - `8967e96` (feat)

## Files Created/Modified
- `src/components/auth/AuthErrorDisplay.tsx` - Added onConfigureClick prop, "Configure Authentication" button for 401, permission guidance for 403
- `src/components/auth/AuthPanel.tsx` - Added onConfigureClick prop passthrough to AuthErrorDisplay
- `src/components/URLInput.tsx` - Wired onConfigureClick callback to setAuthPanelOpen(true)
- `src/services/openapi/parser.ts` - Fixed TypeScript error filtering ReferenceObjects

## Decisions Made
- Used shadcn Button component (variant="outline", size="sm") for consistency with existing UI
- Made onConfigureClick optional to support contexts where panel expansion might not be available
- 401 message emphasizes action: "This API requires authentication. Configure now?"
- 403 message clarifies permission issue with guidance: "Credentials valid but insufficient permissions."

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed TypeScript error in AuthPanel useEffect**
- **Found during:** Task 2 (type checking)
- **Issue:** TypeScript error TS2532 - Object possibly undefined when accessing supportedSchemes[0].authType
- **Fix:** Moved supportedSchemes declaration before useEffect, used optional chaining with firstSupported?.authType
- **Files modified:** src/components/auth/AuthPanel.tsx
- **Verification:** `npx tsc --noEmit` passes
- **Committed in:** 8967e96 (Task 2 commit)

**2. [Rule 1 - Bug] Fixed TypeScript error in openapi parser**
- **Found during:** Task 2 (build verification)
- **Issue:** TypeScript error TS2345 - ReferenceObject in securitySchemes incompatible with expected type
- **Fix:** Filter out ReferenceObjects before passing to mapSecuritySchemes, only keep concrete SecuritySchemeObjects
- **Files modified:** src/services/openapi/parser.ts
- **Verification:** `npm run build` succeeds
- **Committed in:** 8967e96 (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (2 bugs)
**Impact on plan:** Both auto-fixes necessary for correctness. TypeScript errors were blocking builds and needed to be fixed to verify the plan's requirements. No scope creep.

## Issues Encountered
None - tasks executed smoothly after auto-fixing pre-existing TypeScript errors.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- ERR-01, ERR-02, ERR-03 complete
- Auth error UX foundation ready for auto-retry logic (Phase 21 Plan 02)
- No blockers for continuation

---
*Phase: 21-smart-error-ux*
*Completed: 2026-02-10*
