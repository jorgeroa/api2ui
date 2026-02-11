---
phase: 17-auth-store-error-foundation
plan: 01
subsystem: auth
tags: [typescript, authentication, error-handling, credentials, bearer, basic-auth, api-key]

# Dependency graph
requires:
  - phase: none
    provides: Starting foundation for v1.4
provides:
  - Discriminated union for 4 credential types (bearer, basic, apiKey, queryParam)
  - AuthError class distinguishing 401 from 403 with contextual suggestions
  - Extended ErrorKind union with 'auth' error type
  - AuthStatus and ApiCredentials types for per-API state tracking
affects: [18-fetch-integration, 19-auth-store, 21-error-display, 22-auth-ui]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Discriminated unions for type-safe credential handling"
    - "AppError implementation pattern for auth errors"

key-files:
  created:
    - src/types/auth.ts
  modified:
    - src/types/errors.ts
    - src/services/api/errors.ts

key-decisions:
  - "All credential fields are JSON-serializable strings for sessionStorage compatibility"
  - "AuthError distinguishes 401 (authentication failed) from 403 (authorization denied) with specific suggestions"
  - "ApiCredentials uses Record<AuthType, Credential | null> pattern for one slot per auth type"

patterns-established:
  - "Credential type discrimination via 'type' field for exhaustive TypeScript checking"
  - "AuthError follows existing error class pattern with kind/message/suggestion structure"

# Metrics
duration: 1min
completed: 2026-02-09
---

# Phase 17 Plan 01: Type Foundation Summary

**Discriminated credential union (bearer/basic/apiKey/queryParam) and AuthError class with 401/403 distinction**

## Performance

- **Duration:** 1 min 5 sec
- **Started:** 2026-02-09T23:03:08Z
- **Completed:** 2026-02-09T23:04:13Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Created type-safe discriminated union for 4 authentication methods
- Extended error handling system with AuthError for 401/403 responses
- Established per-API credential storage types (ApiCredentials, AuthStatus)
- All types ready for auth store, fetch integration, and UI implementation

## Task Commits

Each task was committed atomically:

1. **Task 1: Create auth credential types** - `269fa7a` (feat)
2. **Task 2: Extend ErrorKind and create AuthError class** - `5ef52b2` (feat)

## Files Created/Modified
- `src/types/auth.ts` - Credential discriminated union, AuthType, AuthStatus, ApiCredentials for per-origin storage
- `src/types/errors.ts` - Extended ErrorKind union to include 'auth'
- `src/services/api/errors.ts` - AuthError class with 401/403 handling and contextual suggestions

## Decisions Made
None - followed plan as specified.

## Deviations from Plan
None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
All type foundations ready for:
- **Plan 02:** Auth store implementation (will use Credential, ApiCredentials, AuthStatus types)
- **Phase 18:** Fetch integration (will use AuthError for 401/403 handling)
- **Phase 21:** Error display (will render AuthError suggestions)
- **Phase 22:** Auth UI (will use credential types for form rendering)

No blockers. TypeScript compilation verified with zero errors.

---
*Phase: 17-auth-store-error-foundation*
*Completed: 2026-02-09*
