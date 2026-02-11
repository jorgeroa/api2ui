---
phase: 20-openapi-auto-detection
plan: 02
subsystem: auth
tags: [openapi, authentication, ui, react, security-schemes]

# Dependency graph
requires:
  - phase: 20-01
    provides: OpenAPI security scheme parser with ParsedSecurityScheme type
provides:
  - OpenAPI security scheme auto-detection in auth panel UI
  - Pre-populated auth type selection from spec
  - Pre-populated credential metadata (header names, param names)
  - Unsupported scheme warnings (OAuth 2.0, OpenID Connect)
  - Auto-expansion of auth panel when spec has security schemes
affects: [future auth features, OpenAPI spec integrations]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Prop threading pattern for detected auth (App → URLInput → AuthPanel → CredentialForm/AuthTypeSelector)"
    - "Conditional auto-expansion based on detected scheme support"
    - "Visual hints for auto-detected vs manually selected auth types"
    - "Metadata pre-population without auto-save (user must enter secrets)"

key-files:
  created: []
  modified:
    - src/App.tsx
    - src/components/URLInput.tsx
    - src/components/auth/AuthPanel.tsx
    - src/components/auth/AuthTypeSelector.tsx
    - src/components/auth/CredentialForm.tsx

key-decisions:
  - "Auto-select first supported scheme only when no existing credentials configured"
  - "Pre-populated metadata does NOT auto-save empty credentials to store"
  - "Show amber warning for unsupported schemes with scheme name and reason"
  - "Display 'Detected from spec' hint next to auth type selector when type matches detected"

patterns-established:
  - "Detected auth flows from parsedSpec.securitySchemes → detectedAuth prop → UI components"
  - "Auto-expansion triggers only for supported schemes, not unsupported-only specs"
  - "Metadata pre-fills form fields but doesn't create credentials until user enters secrets"

# Metrics
duration: 2.5min
completed: 2026-02-10
---

# Phase 20 Plan 02: OpenAPI UI Integration Summary

**Auth panel auto-detects and pre-populates authentication from OpenAPI specs, with warnings for unsupported schemes and "Detected from spec" hints**

## Performance

- **Duration:** 2.5 min (147 seconds)
- **Started:** 2026-02-10T22:36:51Z
- **Completed:** 2026-02-10T22:39:18Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- OpenAPI security schemes flow from parsedSpec to auth panel UI with auto-detection
- First supported scheme auto-selects when no existing credentials present
- Unsupported schemes (OAuth 2.0, OpenID Connect) display amber warning with reason
- Credential metadata (header name, param name) pre-populates from spec
- Auth panel auto-expands when spec has supported security schemes
- User can still manually override pre-selected auth type and metadata

## Task Commits

Each task was committed atomically:

1. **Task 1: Thread detected auth from parsedSpec to AuthPanel** - `e93f75a` (feat)
   - App.tsx: pass parsedSpec.securitySchemes as detectedAuth to URLInput
   - URLInput: accept detectedAuth, auto-expand for supported schemes, forward to AuthPanel
   - AuthPanel: accept detectedAuth, auto-select first supported scheme, show warnings for unsupported

2. **Task 2: Pre-populate credential form fields from detected metadata** - `70a34de` (feat)
   - CredentialForm: accept detectedMetadata, pre-fill headerName/paramName from spec
   - AuthTypeSelector: show "Detected from spec" hint when type matches detected
   - Pre-populated metadata does NOT auto-save empty credentials

## Files Created/Modified
- `src/App.tsx` - Pass parsedSpec.securitySchemes as detectedAuth prop to both URLInput instances (sidebar and centered layouts)
- `src/components/URLInput.tsx` - Accept detectedAuth prop, auto-expand panel for supported schemes, forward to AuthPanel
- `src/components/auth/AuthPanel.tsx` - Accept detectedAuth, auto-select first supported scheme, display amber warning for unsupported schemes, pass matched metadata to CredentialForm
- `src/components/auth/AuthTypeSelector.tsx` - Accept detectedType prop, show "Detected from spec" hint when value matches detected type
- `src/components/auth/CredentialForm.tsx` - Accept detectedMetadata prop, pre-populate headerName/paramName fields and placeholders from detected values

## Decisions Made

**Auto-selection timing**
- Only auto-select first supported scheme when user has NOT already configured credentials (apiCreds is null or activeType is 'none')
- Prevents overwriting user's existing auth configuration when switching between APIs

**Pre-population without auto-save**
- Pre-populated metadata (header name, param name) fills form fields but does NOT create empty credentials in store
- User must still enter the actual secret value (API key, token, password) before credentials get saved
- Prevents pollution of auth store with incomplete/invalid credentials

**Unsupported scheme warnings**
- Display amber warning box ABOVE AuthTypeSelector when unsupported schemes detected
- Show scheme name and description (e.g., "petstore_auth: OAuth 2.0 requires browser-based authorization flow")
- Warning always visible when panel is open, doesn't block interaction with supported schemes

**Visual detection hints**
- Show "Detected from spec" label next to auth type selector when current type matches detected type
- Subtle blue text, doesn't interfere with dropdown interaction
- Helps user understand why auth type was pre-selected

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- OpenAPI auto-detection fully integrated into auth panel UI
- Ready for user acceptance testing with real-world OpenAPI specs (Petstore, Stripe, GitHub, etc.)
- No blockers for next phase

---
*Phase: 20-openapi-auto-detection*
*Completed: 2026-02-10*
