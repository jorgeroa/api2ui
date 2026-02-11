---
phase: 19-auth-configuration-ui
plan: 01
subsystem: ui-components
tags: [auth, ui, components, forms, disclosure, zustand]
requires:
  - phase: 17-auth-store
    provides: authStore with credential management
  - phase: 17-auth-store
    provides: auth types (AuthType, Credential, AuthStatus)
provides:
  - LockIcon component with 3 visual states (gray/green/red)
  - AuthTypeSelector dropdown with 5 auth options
  - CredentialForm with dynamic field rendering per auth type
  - AuthErrorDisplay with 401/403 distinction
  - AuthPanel collapsible container
affects:
  - phase: 19-auth-configuration-ui-plan-02
    needs: Auth UI components for integration into main layout
tech-stack:
  added: []
  patterns:
    - Controlled form components with auto-save to store
    - Password field masking with visibility toggle (Eye/EyeOff icons)
    - Conditional rendering for collapsible UI (controlled open state)
    - Discriminated union pattern for auth type-specific forms
key-files:
  created:
    - src/components/auth/LockIcon.tsx
    - src/components/auth/AuthTypeSelector.tsx
    - src/components/auth/AuthErrorDisplay.tsx
    - src/components/auth/CredentialForm.tsx
    - src/components/auth/AuthPanel.tsx
  modified: []
decisions:
  - decision: Use conditional rendering instead of Headless UI Disclosure
    rationale: Headless UI Disclosure doesn't support controlled `open` prop in v2. Conditional rendering provides explicit control over visibility state.
    alternatives: ["Custom Disclosure wrapper", "Manage internal Disclosure state"]
    chosen: "Conditional rendering"
  - decision: Auto-save credentials on every input change
    rationale: Eliminates need for Save button, provides instant feedback, matches modern UX patterns (like auto-save in editors)
    alternatives: ["Manual Save button", "Save on blur"]
    chosen: "Auto-save on change"
  - decision: Store each auth type's credentials separately
    rationale: Allows users to configure multiple auth types and switch between them without re-entering credentials
    alternatives: ["Single credential slot", "Replace on type change"]
    chosen: "Per-type credential storage"
duration: 152 seconds
completed: 2026-02-10
---

# Phase 19 Plan 01: Auth UI Components Summary

**One-liner:** Complete auth configuration interface with lock icon (3 states), type selector (5 options), dynamic credential forms (masked inputs with visibility toggles), inline error display (401/403), and collapsible panel container.

## What Was Built

### LockIcon Component
- Three visual states mapped to auth status:
  - **Gray LockOpen**: No authentication configured (`status='untested'`, no `activeType`)
  - **Green Lock**: Authentication active (`status='success'` or active credential exists)
  - **Red Lock**: Authentication failed (`status='failed'`)
- Native `title` attribute for tooltips
- Tailwind color classes: `text-gray-400`, `text-green-600`, `text-red-500`
- Renders as shadcn Button with `variant="ghost" size="icon"`
- Format helper for displaying auth type names ("Bearer Token", "Basic Auth", etc.)

### AuthTypeSelector Component
- Native HTML `<select>` dropdown with 5 options:
  1. None (value: "none") - clears credentials
  2. Bearer Token (value: "bearer")
  3. Basic Auth (value: "basic")
  4. API Key (value: "apiKey")
  5. Query Parameter (value: "queryParam")
- Tailwind styling matching existing form inputs
- Label: "Auth Type"

### AuthErrorDisplay Component
- Inline error message for authentication failures
- Distinct rendering for 401 vs 403:
  - **401 (Unauthorized)**: Red-tinted box, "Authentication required — configure credentials above"
  - **403 (Forbidden)**: Orange-tinted box, "Insufficient permissions — check your credentials"
- Lucide `AlertCircle` icon
- Returns `null` when no error present

### CredentialForm Component
Dynamic form that adapts to selected auth type:

**Bearer Token:**
- Single "Token" field (password input with eye toggle)

**Basic Auth:**
- "Username" field (text input)
- "Password" field (password input with eye toggle)

**API Key:**
- "Header Name" field (text, placeholder "X-API-Key")
- "Value" field (password input with eye toggle)

**Query Parameter:**
- "Parameter Name" field (text, placeholder "api_key")
- "Value" field (password input with eye toggle)

**Key Features:**
- All secret values use `type="password"` with Eye/EyeOff toggle button
- Auto-save to `authStore.setCredential()` on every input change
- Loads initial values from `authStore.getCredentials(url)` on mount
- Local state management to prevent input focus loss during typing
- Returns `null` for `type="none"`

### AuthPanel Component
Collapsible container that composes all auth components:

**Structure:**
```
<div> (wrapper with transition classes)
  {isOpen && (
    <div> (content panel)
      <AuthErrorDisplay error={authError} />
      <AuthTypeSelector value={currentType} onChange={handleTypeChange} />
      <CredentialForm type={currentType} url={url} />
    </div>
  )}
</div>
```

**Behavior:**
- Reads `getCredentials(url)` to determine current auth type
- Defaults to `'none'` if no credentials configured
- When type changes to `'none'`: calls `clearForApi(url)` to remove credentials
- When type changes to auth type: CredentialForm handles credential creation on input
- Controlled visibility via `isOpen` prop (parent manages state)
- Smooth expand/collapse with transition classes

## Integration Points

### Consumes from Phase 17 (Auth Store)
- `useAuthStore().getCredentials(url)` - load existing credentials
- `useAuthStore().setCredential(url, credential)` - save credentials (auto-save)
- `useAuthStore().clearForApi(url)` - clear credentials (when selecting "None")
- `AuthType`, `Credential`, `AuthStatus` types from `src/types/auth.ts`

### Provides to Next Plans
- Complete set of auth UI components ready for integration
- Standalone components that can be tested independently
- No dependencies on main app layout (pure UI components)

## Deviations from Plan

None - plan executed exactly as written.

**Note on Headless UI:** Initial implementation attempted to use `<Disclosure open={isOpen}>` for controlled state, but Headless UI v2 doesn't support the `open` prop. Switched to simple conditional rendering (`{isOpen && <div>...</div>}`) which provides the same controlled behavior. This is a cleaner solution for this use case.

## Next Phase Readiness

**Ready for Plan 02:** Integrate AuthPanel into main app layout

**Blockers:** None

**Required for Plan 02:**
1. Identify integration point in main layout (likely near URL input)
2. Wire up LockIcon button to toggle AuthPanel visibility
3. Pass auth errors from API fetch to AuthPanel
4. Ensure authStore credential updates trigger re-fetch with new auth

**Verification approach for Plan 02:**
- Visual verification: LockIcon appears in UI, AuthPanel expands on click
- Functional verification: Configure credentials, see them applied to API requests
- Error verification: Trigger 401/403, see appropriate error messages

## Technical Notes

### Component Patterns
- **Compound component structure:** AuthPanel composes smaller focused components
- **Controlled state:** Parent manages `isOpen`, AuthPanel is purely presentational for visibility
- **Auto-save pattern:** No explicit Save button, changes sync to store immediately
- **Local state + store sync:** CredentialForm uses local state for immediate UI updates, syncs to store on change

### Password Visibility Toggle
All secret fields use this pattern:
```tsx
<div className="relative">
  <Input
    type={showValue ? 'text' : 'password'}
    value={value}
    onChange={handleChange}
    className="pr-10"
  />
  <Button
    variant="ghost"
    size="icon-sm"
    onClick={() => setShowValue(!showValue)}
    className="absolute right-1 top-1/2 -translate-y-1/2"
  >
    {showValue ? <EyeOff /> : <Eye />}
  </Button>
</div>
```

### Type Safety
- All components properly typed with TypeScript
- Discriminated union pattern for `Credential` ensures type-safe field rendering
- AuthType used throughout for consistency

## Testing Strategy (for future UAT)

1. **LockIcon states:** Verify gray (no auth), green (active), red (failed) render correctly
2. **AuthTypeSelector:** Select each option, verify CredentialForm adapts
3. **CredentialForm fields:**
   - Bearer: single token field
   - Basic: username + password
   - API Key: header name + value
   - Query Param: param name + value
4. **Password masking:** Toggle visibility on all secret fields
5. **Auto-save:** Enter credentials, verify stored in authStore (use React DevTools)
6. **Clear credentials:** Select "None", verify credentials removed from store
7. **Error display:** Pass 401 and 403 errors, verify distinct messages

## Metrics

- **Tasks completed:** 2/2
- **Components created:** 5
- **Lines of code:** ~600 (total across 5 files)
- **Build time:** ~4s
- **Zero type errors:** ✓
- **Duration:** 152 seconds (~2.5 minutes)

## Commits

- `9f8010c` - feat(19-01): create LockIcon, AuthTypeSelector, and AuthErrorDisplay components
- `f46d24b` - feat(19-01): create CredentialForm and AuthPanel components
