---
phase: 19-auth-configuration-ui
plan: 02
subsystem: ui-integration
tags: [auth, ui, integration, url-input, error-handling]
requires:
  - phase: 19-auth-configuration-ui
    plan: 01
    provides: Auth UI components (LockIcon, AuthPanel, AuthTypeSelector, CredentialForm, AuthErrorDisplay)
provides:
  - Lock icon button integrated into URL input area
  - Auth panel wired into main app layout
  - Auth error auto-expansion on 401/403
  - Auth errors suppressed from general error display
affects:
  - phase: 20-openapi-auto-detection
    needs: Auth panel for pre-populating detected auth schemes
  - phase: 21-smart-error-ux
    needs: Auth error display infrastructure
tech-stack:
  added: []
  patterns:
    - Auth error detection via instanceof AuthError
    - Lock icon state derived from authError prop + authStore status
    - Local state in AuthPanel for type selection before credential entry
key-files:
  created: []
  modified:
    - src/components/URLInput.tsx
    - src/App.tsx
    - src/components/auth/AuthPanel.tsx
decisions:
  - decision: Derive lock status from authError prop (not just store status)
    rationale: AuthStore status isn't updated synchronously with error display; authError prop provides immediate visual feedback
    alternatives: ["Watch authStore.authStatus only"]
    chosen: "authError prop takes precedence"
  - decision: Add local state for selected type in AuthPanel
    rationale: Store only has activeType after credentials are entered; local state allows selecting a type before entering any values
    alternatives: ["Store empty credential on type select", "Use uncontrolled select"]
    chosen: "Local state synced with store"
  - decision: Suppress auth errors from general ErrorDisplay and toast
    rationale: Auth errors shown inline in auth panel; duplicate display confuses users
    alternatives: ["Show in both places", "Remove auth panel error"]
    chosen: "Auth panel only"
duration: ~180 seconds
completed: 2026-02-10
---

# Phase 19 Plan 02: Wire Auth Panel into URLInput — Summary

**One-liner:** Integrated lock icon and collapsible auth panel into URL input area with auth error auto-expansion, error suppression from general display, and three bug fixes found during Playwright testing.

## What Was Built

### URLInput Integration
- Lock icon button positioned between URL text input and Fetch button
- Three visual states: gray open lock (no auth), green lock (active), red lock (failed/auth error)
- `authError` prop drives lock icon red state immediately on 401/403
- `authPanelOpen` state toggled by lock icon click
- AuthPanel rendered below URL form with auth error pass-through
- useEffect auto-expands panel when authError becomes non-null

### App.tsx Auth Error Detection
- `AuthError` import from services/api/errors
- Derives `authError` object from error state using `instanceof AuthError`
- Passes `authError` to both URLInput instances (sidebar and centered layouts)
- Auth errors suppressed from general ErrorDisplay (`!authError` guard)
- Auth errors suppressed from toast notifications

### Bug Fixes (found during Playwright testing)
1. **Auth type selector not persisting**: AuthPanel derived `currentType` solely from store's `activeType`, which is null until credentials are entered. Added local `selectedType` state that syncs with store but allows selecting a type before entering values.
2. **Lock icon staying gray on 401**: Lock status was derived only from `authStore.getAuthStatus()`, which isn't updated in time. Added `authError` prop check as highest priority in lock status derivation.
3. **Auth error showing in both panel and general area**: Added `!authError` guard to ErrorDisplay conditions and toast effect in App.tsx.

## Verification Results (Playwright)

| Check | Status |
|-------|--------|
| Lock icon visible between URL input and Fetch | ✓ |
| Lock icon gray (no auth) | ✓ |
| Lock icon red on 401 error | ✓ |
| Click lock toggles auth panel | ✓ |
| Auth panel auto-expands on 401 | ✓ |
| Auth error inline in panel only | ✓ |
| No general error display for auth errors | ✓ |
| No toast for auth errors | ✓ |
| Bearer Token: token field appears | ✓ |
| Basic Auth: username + password fields appear | ✓ |
| API Key: header name + value fields appear | ✓ |
| Query Parameter: param name + value fields appear | ✓ |
| Type selector persists selection | ✓ |
| Eye toggle reveals/hides password | ✓ |
| "None" clears fields and credentials | ✓ |

## Commits

- `7710cc0` - feat(19-02): integrate LockIcon and AuthPanel into URLInput
- `ffbfb5c` - fix(19-02): fix auth type selector persistence, lock icon state, and error display

## Next Phase Readiness

**Ready for Phase 20:** OpenAPI Auto-Detection
- Auth panel infrastructure in place for pre-populating detected schemes
- AuthTypeSelector can be programmatically set from detected security schemes

**Ready for Phase 21:** Smart Error UX
- Auth error detection and panel expansion already working
- Error display infrastructure ready for enhanced contextual messaging
