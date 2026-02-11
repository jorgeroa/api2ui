# Phase 21: Smart Error UX - Research

**Researched:** 2026-02-10
**Domain:** Authentication error UX with contextual prompts and actionable recovery paths
**Confidence:** HIGH

## Summary

Phase 21 adds smart error UX for authentication failures, transforming 401/403 errors from dead-ends into actionable recovery moments. The system already detects auth errors (AuthError in Phase 17), displays them in the auth panel (AuthErrorDisplay in Phase 19), and auto-expands the panel on errors (URLInput lines 74-78). This phase enhances those foundations with inline action prompts, clear 401 vs 403 messaging, and no-retry guarantees.

**Current state analysis:**
- AuthError already captures 401/403 with distinct messages and authContext
- AuthErrorDisplay shows inline messages with color-coded severity (red for 401, orange for 403)
- Auth panel auto-expands on authError detection (useEffect in URLInput.tsx)
- No auto-retry exists — user must manually reconfigure and click Fetch

**Key gaps to close:**
1. **ERR-01**: Add "Configure now?" action button to AuthErrorDisplay (currently passive text only)
2. **ERR-02**: Strengthen 401/403 message distinction (currently good but can be clearer)
3. **ERR-03**: Verify no auto-retry exists (already confirmed — manual re-fetch only)

**Primary recommendation:** Enhance AuthErrorDisplay with an inline action button using shadcn/ui Button component with "Configure Authentication" CTA for 401 errors and "Contact Support" guidance for 403 errors. Strengthen messaging to explicitly state "You need to add credentials" (401) vs "Your credentials lack permission" (403). No new libraries needed — use existing Button, icons, and auth panel expansion logic.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| lucide-react | 0.563.0 | Icons (Settings for configure action) | Already used throughout codebase, comprehensive icon set |
| shadcn/ui Button | — | Action buttons in error messages | Already in codebase at src/components/ui/button.tsx, accessible design |
| React hooks | 19.2.0 | useState for interaction state | Native React patterns, no additional deps |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| sonner | 2.0.7 | Toast notifications (optional for success feedback) | Already installed, could show "Auth configured" toast on save |
| clsx / tailwind-merge | 2.1.1 / 3.4.0 | Conditional styling | Already used via @/lib/utils cn() helper |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Inline button | Modal dialog | Modal adds friction, inline action keeps user in context per UX best practices |
| Custom button | Native button with Tailwind | shadcn Button provides accessibility, focus states, and variant system for free |
| Separate error component | Extend ErrorDisplay | AuthErrorDisplay already exists and is auth-specific, cleaner to enhance it |

**Installation:**
```bash
# All dependencies already installed
# No new packages needed
```

## Architecture Patterns

### Recommended Component Structure
```
src/
├── components/
│   ├── auth/
│   │   ├── AuthErrorDisplay.tsx    # ENHANCE: Add action button, improve messaging
│   │   └── AuthPanel.tsx           # ENHANCE: Expose onOpen callback for programmatic expansion
│   └── URLInput.tsx                # ENHANCE: Pass onOpenAuthPanel to AuthErrorDisplay
```

### Pattern 1: Inline Action Button in Error Message
**What:** Contextual action button placed directly within error message, not separated
**When to use:** Authentication errors where clear recovery path exists (configure credentials)
**Example:**
```typescript
// Source: https://blog.logrocket.com/ux-design/writing-clear-error-messages-ux-guidelines-examples/
// Error messages should provide actionable next steps
import { Button } from '@/components/ui/button'
import { Settings } from 'lucide-react'

function AuthErrorDisplay({ error, onConfigureClick }: Props) {
  const is401 = error.status === 401

  return (
    <div className="flex items-start gap-2 rounded-md border p-3 bg-red-50 border-red-200">
      <AlertCircle className="h-4 w-4 text-red-700 mt-0.5" />
      <div className="flex-1">
        <p className="text-sm text-red-700 mb-2">
          {is401
            ? 'This API requires authentication. You need to add credentials.'
            : 'Your credentials are valid but lack permission for this resource.'}
        </p>
        {is401 && (
          <Button
            variant="outline"
            size="sm"
            onClick={onConfigureClick}
          >
            <Settings className="h-3 w-3" />
            Configure Authentication
          </Button>
        )}
      </div>
    </div>
  )
}
```

### Pattern 2: Programmatic Panel Expansion
**What:** Parent component controls child panel's open state via callback
**When to use:** Action button needs to open auth panel (already collapsed/expanded controlled)
**Example:**
```typescript
// URLInput.tsx already has authPanelOpen state and setAuthPanelOpen
// Pass down as callback to AuthErrorDisplay

function URLInput() {
  const [authPanelOpen, setAuthPanelOpen] = useState(false)

  return (
    <>
      <AuthPanel
        isOpen={authPanelOpen}
        onToggle={() => setAuthPanelOpen(!authPanelOpen)}
        authError={authError}
      />

      {/* Pass expansion callback to error display */}
      <AuthErrorDisplay
        error={authError}
        onConfigureClick={() => setAuthPanelOpen(true)}
      />
    </>
  )
}
```

### Pattern 3: 401 vs 403 User Guidance
**What:** Distinct messaging and actions based on error status code
**When to use:** Different recovery paths for authentication (401) vs authorization (403)
**Example:**
```typescript
// Source: https://www.permit.io/blog/401-vs-403-error-whats-the-difference
// 401 = retry with credentials, 403 = server-side permission change needed

const errorGuidance = {
  401: {
    title: 'Authentication Required',
    message: 'This API requires authentication. You need to add credentials.',
    action: 'Configure Authentication',
    canRecover: true, // User can fix by adding credentials
  },
  403: {
    title: 'Permission Denied',
    message: 'Your credentials are valid but lack permission for this resource.',
    action: 'Contact Support', // External action needed
    canRecover: false, // User cannot fix client-side
  }
}

function AuthErrorDisplay({ error }: Props) {
  const guidance = errorGuidance[error.status]

  return (
    <div>
      <h4>{guidance.title}</h4>
      <p>{guidance.message}</p>
      {guidance.canRecover ? (
        <Button onClick={onConfigureClick}>{guidance.action}</Button>
      ) : (
        <p className="text-xs text-gray-600">
          Contact your API provider to request elevated permissions.
        </p>
      )}
    </div>
  )
}
```

### Anti-Patterns to Avoid
- **Auto-retry on auth failure:** Never automatically re-fetch after 401/403 — user must manually reconfigure and retry (ERR-03 requirement)
- **Generic error messages:** "Authentication failed" doesn't guide recovery, specify "You need to add credentials" (401) or "Insufficient permissions" (403)
- **Separate error and action:** Button should be inline within error message, not separated below (keeps user in context)
- **Modal prompts:** Don't use modal dialogs for auth errors — inline prompts reduce friction and maintain context

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Action buttons with variants | Custom styled buttons | shadcn/ui Button component | Built-in accessibility, focus states, loading states, size variants |
| 401/403 distinction logic | if/else chains | Structured guidance map | Maintainable, extensible for future status codes |
| Panel expansion on click | Direct state mutation | Callback props | Maintains single source of truth (parent controls state) |
| Error message styling | Custom Tailwind classes | Extend existing AuthErrorDisplay | Consistent with Phase 19 patterns, reduces duplication |

**Key insight:** The infrastructure already exists — AuthErrorDisplay, auth panel expansion, AuthError detection. This phase is enhancement, not greenfield. Use existing patterns and components.

## Common Pitfalls

### Pitfall 1: Auto-Retry Loops
**What goes wrong:** System automatically retries failed auth requests, creating infinite loops or rate limiting
**Why it happens:** Well-intentioned "helpful" behavior tries to auto-recover from errors
**How to avoid:** ERR-03 explicitly forbids auto-retry. User must manually click Fetch after reconfiguration. fetchAndInfer is only called on explicit user action (button click, example card click).
**Warning signs:** Multiple rapid 401 responses in network tab, auth status flipping between failed/untested

### Pitfall 2: Conflating 401 and 403
**What goes wrong:** Showing "check your credentials" message for 403 errors, or "insufficient permissions" for 401
**Why it happens:** Both are "access denied" but have different recovery paths
**How to avoid:** ERR-02 requires clear distinction. 401 = "add credentials" (client-side fix), 403 = "contact support" (server-side fix). Use error.status discriminant, not error.kind.
**Warning signs:** User tries to reconfigure credentials for 403 (won't help), user gives up on 401 without trying auth

### Pitfall 3: Hidden Action Buttons
**What goes wrong:** "Configure now?" action button not visible because error display is collapsed or outside viewport
**Why it happens:** Error display position below auth panel, or auth panel not auto-expanded
**How to avoid:** Auth panel already auto-expands on authError (URLInput lines 74-78). AuthErrorDisplay renders inside AuthPanel, so it's always visible when error exists. Verify scroll position brings error into view.
**Warning signs:** User reports seeing error text but not action button, error message truncated

### Pitfall 4: Action Button Without Focus Management
**What goes wrong:** User clicks "Configure Authentication" but focus doesn't move to credential form input
**Why it happens:** Panel expands but keyboard focus stays on button
**How to avoid:** After expanding panel, optionally focus first input in CredentialForm using ref. Not required for MVP but enhances keyboard navigation.
**Warning signs:** Keyboard users must tab many times to reach form after clicking action button

## Code Examples

Verified patterns for implementation:

### Enhance AuthErrorDisplay with Action Button
```typescript
// src/components/auth/AuthErrorDisplay.tsx
import { AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface AuthErrorDisplayProps {
  error: { status: 401 | 403; message: string } | null
  onConfigureClick?: () => void // New: callback to open auth panel
}

export function AuthErrorDisplay({ error, onConfigureClick }: AuthErrorDisplayProps) {
  if (!error) return null

  const is401 = error.status === 401

  return (
    <div
      className={`flex items-start gap-2 rounded-md border p-3 ${
        is401
          ? 'bg-red-50 border-red-200 text-red-700'
          : 'bg-orange-50 border-orange-200 text-orange-700'
      }`}
    >
      <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
      <div className="flex-1 space-y-2">
        <p className="text-sm">
          {is401
            ? 'This API requires authentication. You need to add credentials.'
            : 'Your credentials are valid but lack permission for this resource.'}
        </p>

        {is401 && onConfigureClick && (
          <Button
            variant="outline"
            size="sm"
            onClick={onConfigureClick}
            className="text-xs"
          >
            Configure Authentication
          </Button>
        )}

        {!is401 && (
          <p className="text-xs opacity-80">
            Contact your API provider to request elevated permissions for this endpoint.
          </p>
        )}
      </div>
    </div>
  )
}
```

### Pass Panel Expansion Callback from URLInput
```typescript
// src/components/URLInput.tsx (modification)
export function URLInput({ authError, detectedAuth }: URLInputProps = {}) {
  const [authPanelOpen, setAuthPanelOpen] = useState(false)

  // ... existing code ...

  return (
    <div className="w-full max-w-4xl">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* ... existing input and buttons ... */}

        {/* Auth Panel with error display inside */}
        <AuthPanel
          url={url}
          isOpen={authPanelOpen}
          onToggle={() => setAuthPanelOpen(!authPanelOpen)}
          authError={authError}
          detectedAuth={detectedAuth}
          onConfigureClick={() => setAuthPanelOpen(true)} // Pass callback
        />
      </form>

      {/* ... example cards ... */}
    </div>
  )
}
```

### Update AuthPanel to Accept and Pass Callback
```typescript
// src/components/auth/AuthPanel.tsx (modification)
interface AuthPanelProps {
  url: string
  isOpen: boolean
  onToggle: () => void
  authError?: { status: 401 | 403; message: string } | null
  detectedAuth?: ParsedSecurityScheme[]
  onConfigureClick?: () => void // New: pass through to AuthErrorDisplay
}

export function AuthPanel({
  url,
  isOpen,
  authError,
  detectedAuth,
  onConfigureClick
}: AuthPanelProps) {
  // ... existing code ...

  return (
    <div className="transition-all duration-200 ease-in-out">
      {isOpen && (
        <div className="space-y-4 pt-4 pb-2">
          {/* Show auth error with action button */}
          {authError && (
            <AuthErrorDisplay
              error={authError}
              onConfigureClick={onConfigureClick}
            />
          )}

          {/* ... rest of panel ... */}
        </div>
      )}
    </div>
  )
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Generic error pages | Inline contextual error messages | 2024-2025 | Reduced abandonment, users fix errors in-context |
| Passive error text | Actionable CTAs in error messages | 2025-2026 | Clear recovery path increases success rate |
| Auto-retry on auth failure | Manual retry after reconfiguration | 2025 standard | Prevents infinite loops, clearer user control |
| Color-only error distinction | Icons + color + clear messaging | WCAG 2.1+ | Accessibility for colorblind users |

**Deprecated/outdated:**
- Modal dialogs for auth errors: Inline prompts are now standard (per LogRocket UX research 2025-2026)
- Generic "401 Unauthorized" messages: Specific actionable guidance is best practice (per Permit.io 401 vs 403 guide)
- Auto-focus on error: Optional enhancement, not required (focus management complex, skip for MVP)

## Open Questions

Things that couldn't be fully resolved:

1. **Focus management after panel expansion**
   - What we know: Accessibility best practice is to move focus to first input after programmatic expansion
   - What's unclear: Whether React 19 + Headless UI handle this automatically, or if manual ref focus needed
   - Recommendation: Skip for Phase 21 MVP, add in follow-up if users report keyboard navigation issues

2. **Toast notification on successful auth configuration**
   - What we know: Sonner toast already used for error notifications (App.tsx line 68)
   - What's unclear: Whether showing "Authentication configured" toast adds value or is redundant (lock icon already turns green)
   - Recommendation: Skip toast, rely on visual lock icon state change as feedback

3. **403 error recovery guidance specificity**
   - What we know: 403 requires server-side permission change, not client-side
   - What's unclear: Whether to provide specific guidance like "Contact support at {email}" or generic message
   - Recommendation: Generic message for Phase 21 ("Contact your API provider"), could enhance later with OpenAPI contact info if available

## Sources

### Primary (HIGH confidence)
- shadcn/ui Button component documentation - https://ui.shadcn.com/docs/components/button (verified in codebase at src/components/ui/button.tsx)
- Existing codebase patterns: AuthErrorDisplay (src/components/auth/AuthErrorDisplay.tsx), URLInput auth panel expansion (src/components/URLInput.tsx lines 74-78), AuthError class (src/services/api/errors.ts lines 53-74)
- lucide-react icon set - https://lucide.dev (verified in package.json v0.563.0, Settings icon available)

### Secondary (MEDIUM confidence)
- [Login & Signup UX Guide 2025](https://www.authgear.com/post/login-signup-ux-guide) - Authentication best practices updated January 2026
- [Error Message UX Guidelines - LogRocket](https://blog.logrocket.com/ux-design/writing-clear-error-messages-ux-guidelines-examples/) - Inline error messaging patterns
- [401 vs 403 Error Differences - Permit.io](https://www.permit.io/blog/401-vs-403-error-whats-the-difference) - Clear distinction between authentication and authorization errors
- [React Inline Action Patterns - Material UI](https://mui.com/material-ui/react-alert/) - Alert component with action buttons
- [Atlassian Inline Message Component](https://atlassian.design/components/inline-message/) - Contextual messaging design patterns

### Tertiary (LOW confidence)
- Multi-factor authentication UX research (not directly applicable, focused on MFA flows not error recovery)
- Password reset UX patterns (tangential, different recovery path than API auth)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All components already in codebase (Button, icons, auth panel structure)
- Architecture: HIGH - Extending existing AuthErrorDisplay and auth panel patterns from Phase 19
- Pitfalls: HIGH - Auth error handling already implemented, verified no auto-retry exists in fetchAndInfer

**Research date:** 2026-02-10
**Valid until:** 2026-03-12 (30 days, stable domain with established patterns)
