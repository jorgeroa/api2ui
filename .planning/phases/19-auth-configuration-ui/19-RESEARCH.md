# Phase 19: Auth Configuration UI - Research

**Researched:** 2026-02-09
**Domain:** React UI components for authentication configuration (collapsible panels, forms, state indicators)
**Confidence:** HIGH

## Summary

This phase builds the user-facing auth configuration UI: a collapsible panel below the URL input with auth type selector, credential forms, visual lock icon states, and inline error display. The codebase already uses Headless UI Disclosure for collapsible patterns (ParameterForm, TagGroup) and follows shadcn/ui conventions for form inputs and buttons. Auth state comes from the existing authStore (Phase 17) and errors come from fetchWithAuth (Phase 18).

**Key architectural fit:**
- Headless UI Disclosure is already installed and used — consistent with existing patterns
- shadcn/ui Input and Button components provide form building blocks
- Lucide React icons (already in use) include Lock, LockOpen, AlertCircle, Eye, EyeOff for all needed iconography
- Auto-save on change matches existing preference for immediate updates (no save buttons in ConfigPanel)
- Native password input masking + optional visibility toggle follows 2026 UX best practices

**Primary recommendation:** Use Headless UI Disclosure for the collapsible auth panel with controlled state (expand on 401/403, collapse after save), shadcn/ui form components for inputs, and Lucide React icons for the lock states and password visibility toggle. Implement auto-save with immediate authStore updates on field change, no debouncing needed (credentials don't trigger API calls until manual re-fetch).

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @headlessui/react | 2.2.9 | Disclosure (collapsible panel) | Already used in codebase for ParameterForm and TagGroup, battle-tested accessibility |
| lucide-react | 0.563.0 | Icons (Lock, LockOpen, AlertCircle, Eye, EyeOff) | Already used throughout codebase, comprehensive icon set |
| zustand | 5.0.11 | Auth state management | Already used for authStore (Phase 17), reactive state updates |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| shadcn/ui components | — | Input, Button, Select (if needed) | Form building blocks, already in codebase at src/components/ui/ |
| clsx / tailwind-merge | 2.1.1 / 3.4.0 | Conditional styling | Already used via @/lib/utils cn() helper |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Headless UI Disclosure | Radix UI Collapsible | Radix is equally good but Headless UI already in use — consistency wins |
| Native select | Radix Select via shadcn/ui | Native select is simpler for 5 options, Radix adds complexity without benefit here |
| Custom tooltip | Radix Tooltip | Native title attribute sufficient for simple lock icon tooltips, Radix overkill |

**Installation:**
```bash
# All dependencies already installed
# shadcn/ui Select component (if chosen over native):
npx shadcn@latest add select
```

## Architecture Patterns

### Recommended Component Structure
```
src/
├── components/
│   ├── auth/
│   │   ├── AuthPanel.tsx           # Main collapsible auth section
│   │   ├── AuthTypeSelector.tsx    # Dropdown for auth type selection
│   │   ├── CredentialForm.tsx      # Dynamic form based on auth type
│   │   ├── LockIcon.tsx            # Stateful lock icon with tooltip
│   │   └── AuthErrorDisplay.tsx    # Inline error messages (401/403)
│   └── URLInput.tsx                # Modified to include LockIcon button
```

### Pattern 1: Collapsible Panel with Controlled State
**What:** Disclosure component with explicit `open` state prop, controlled externally based on user interaction and error conditions
**When to use:** Auth panel that must auto-expand on 401/403 but allow manual toggle
**Example:**
```typescript
// Source: https://headlessui.com/react/disclosure
import { Disclosure, DisclosureButton, DisclosurePanel } from '@headlessui/react'
import { useState } from 'react'

function AuthPanel({ authError }: { authError?: Error }) {
  const [open, setOpen] = useState(false)

  // Auto-expand on auth errors
  useEffect(() => {
    if (authError?.kind === 'auth') {
      setOpen(true)
    }
  }, [authError])

  return (
    <Disclosure as="div" open={open} onChange={setOpen}>
      <DisclosureButton className="flex items-center gap-2">
        <LockIcon />
        Configure Authentication
      </DisclosureButton>
      <DisclosurePanel className="mt-2 space-y-4">
        {/* Credential forms */}
      </DisclosurePanel>
    </Disclosure>
  )
}
```

### Pattern 2: Dynamic Form Fields Based on Discriminated Union
**What:** Render different form inputs based on auth type selection, driven by TypeScript discriminated union
**When to use:** Auth type selector changes which credential fields appear
**Example:**
```typescript
// Based on existing auth types (src/types/auth.ts)
type AuthType = 'bearer' | 'basic' | 'apiKey' | 'queryParam'

function CredentialForm({ type }: { type: AuthType }) {
  switch (type) {
    case 'bearer':
      return <Input name="token" type="password" placeholder="Bearer token" />
    case 'basic':
      return (
        <>
          <Input name="username" placeholder="Username" />
          <Input name="password" type="password" placeholder="Password" />
        </>
      )
    case 'apiKey':
      return (
        <>
          <Input name="headerName" placeholder="Header name (e.g., X-API-Key)" />
          <Input name="value" type="password" placeholder="API key value" />
        </>
      )
    case 'queryParam':
      return (
        <>
          <Input name="paramName" placeholder="Parameter name (e.g., api_key)" />
          <Input name="value" type="password" placeholder="Parameter value" />
        </>
      )
  }
}
```

### Pattern 3: Auto-Save on Change (No Save Button)
**What:** Update Zustand store immediately on input change, triggering reactivity
**When to use:** Auth credential forms where changes don't trigger side effects (no auto-refetch)
**Example:**
```typescript
// Pattern from existing ConfigPanel — no save button, immediate updates
import { useAuthStore } from '@/store/authStore'

function CredentialForm({ type }: { type: AuthType }) {
  const { setCredential } = useAuthStore()
  const { url } = useAppStore()

  const handleChange = (field: string, value: string) => {
    // Auto-save to store immediately
    setCredential(url, {
      type,
      label: `${type} credentials`, // Or user-provided label
      [field]: value,
    })
  }

  return (
    <Input
      onChange={(e) => handleChange('token', e.target.value)}
      // No form submission, no save button
    />
  )
}
```

### Pattern 4: Password Visibility Toggle
**What:** Password input with eye icon button to toggle between `type="password"` and `type="text"`
**When to use:** All credential value inputs (tokens, passwords, API keys)
**Example:**
```typescript
// Source: https://dev.to/annaqharder/hideshow-password-in-react-513a
import { Eye, EyeOff } from 'lucide-react'

function PasswordInput({ value, onChange }: PasswordInputProps) {
  const [visible, setVisible] = useState(false)

  return (
    <div className="relative">
      <Input
        type={visible ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        className="pr-10" // Space for icon button
      />
      <button
        type="button"
        onClick={() => setVisible(!visible)}
        className="absolute right-2 top-1/2 -translate-y-1/2"
      >
        {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  )
}
```

### Pattern 5: Stateful Lock Icon with Tooltip
**What:** Lock icon changes color/variant based on auth status, tooltip shows context
**When to use:** Visual indicator for auth state (no auth / active / failed)
**Example:**
```typescript
// Uses native title attribute for simplicity (accessibility sufficient for icon buttons)
import { Lock, LockOpen, AlertCircle } from 'lucide-react'

function LockIcon() {
  const { getActiveCredential, getAuthStatus } = useAuthStore()
  const { url } = useAppStore()

  const credential = getActiveCredential(url)
  const status = getAuthStatus(url)

  const state = !credential
    ? 'none'
    : status === 'failed'
    ? 'failed'
    : 'active'

  const config = {
    none: { Icon: Lock, color: 'text-gray-400', tooltip: 'No authentication configured' },
    active: { Icon: Lock, color: 'text-green-600', tooltip: `${credential.type} active` },
    failed: { Icon: AlertCircle, color: 'text-red-600', tooltip: 'Authentication failed' },
  }

  const { Icon, color, tooltip } = config[state]

  return (
    <button onClick={togglePanel} title={tooltip} className={color}>
      <Icon className="size-5" />
    </button>
  )
}
```

### Anti-Patterns to Avoid
- **Debounced auto-save:** Credentials don't trigger API calls, so debouncing adds latency for no benefit. Save immediately.
- **Confirm password field:** Not needed for API credentials (not account creation). User can toggle visibility to verify.
- **Custom tooltip library:** Native `title` attribute is sufficient for simple icon tooltips. Radix Tooltip adds 3kB+ for minimal gain.
- **Auto-retry after save:** User must manually re-fetch. Auto-retry can confuse if they're still editing credentials.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Collapsible panels | Custom expand/collapse state + CSS transitions | Headless UI Disclosure | Handles focus management, ARIA, keyboard nav (Space/Enter), data attributes for animations |
| Password visibility toggle | Manual show/hide state + conditional type prop | Well-established pattern (see code examples) | Browser autofill, password managers, screen readers all expect standard input[type=password] |
| Lock icon states | Custom SVG icons or icon font | Lucide React Lock/LockOpen/AlertCircle | Tree-shakeable, consistent with codebase, accessible sizing |
| Form validation | Manual regex checks, custom error state | Native HTML5 validation + controlled inputs | Browser-native UX (shake on invalid), accessibility hooks built-in |

**Key insight:** React state management + native HTML form controls provide better UX than custom implementations. Password managers, autofill, and screen readers expect standard patterns.

## Common Pitfalls

### Pitfall 1: Losing Input Focus on State Change
**What goes wrong:** Auto-save triggers re-render, input loses focus mid-typing
**Why it happens:** Parent re-renders controlled input, React re-mounts DOM node
**How to avoid:** Use stable keys, avoid conditional rendering of inputs during typing
**Warning signs:** Cursor jumps to start of input, focus lost after first keystroke
**Solution:**
```typescript
// BAD: Conditional rendering loses focus
{type === 'bearer' && <Input key={type} />}

// GOOD: Stable mounting, only show/hide with CSS or always render
<Input
  className={type === 'bearer' ? 'block' : 'hidden'}
  // key prop stable across re-renders
/>
```

### Pitfall 2: Password Input Clearing on Type Toggle
**What goes wrong:** Toggling visibility clears the input value
**Why it happens:** Changing `type` attribute causes browsers to clear for security
**How to avoid:** Store value in state, keep `value` prop controlled
**Warning signs:** Password disappears when clicking eye icon
**Solution:**
```typescript
// Controlled input keeps value across type changes
const [value, setValue] = useState('')
<Input
  type={visible ? 'text' : 'password'}
  value={value}  // Preserve value
  onChange={e => setValue(e.target.value)}
/>
```

### Pitfall 3: Tooltip Not Showing on Mobile
**What goes wrong:** Native `title` attribute tooltips don't appear on touch devices
**Why it happens:** No hover state on mobile, title is mouse-only
**How to avoid:** Accept limitation (lock icon state is visual already), or use aria-label for screen readers
**Warning signs:** Works on desktop, silent on mobile
**Solution:**
```typescript
// title for desktop tooltip, aria-label for accessibility
<button title="Bearer Token active" aria-label="Bearer Token active">
  <Lock />
</button>
// Mobile users see icon color/variant, desktop users get tooltip on hover
```

### Pitfall 4: Panel Auto-Collapse on Error Clearing Component
**What goes wrong:** Error clears (e.g., user corrects credentials), panel immediately collapses mid-interaction
**Why it happens:** useEffect watching error state triggers `setOpen(false)` when error becomes null
**How to avoid:** Only auto-expand on error, never auto-collapse (user manually closes)
**Warning signs:** Panel flickers closed as user fixes issue
**Solution:**
```typescript
// BAD: Bi-directional auto-control
useEffect(() => {
  setOpen(!!authError)  // Collapses when error clears
}, [authError])

// GOOD: Only auto-expand, manual close
useEffect(() => {
  if (authError?.kind === 'auth') {
    setOpen(true)  // Expand on error
    // Never setOpen(false) — user controls closing
  }
}, [authError])
```

## Code Examples

Verified patterns from official sources:

### Headless UI Disclosure with Controlled State
```typescript
// Source: https://headlessui.com/react/disclosure
import { Disclosure, DisclosureButton, DisclosurePanel } from '@headlessui/react'

function ControlledDisclosure() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <Disclosure as="div" open={isOpen} onChange={setIsOpen}>
      <DisclosureButton>Toggle panel</DisclosureButton>
      <DisclosurePanel>
        Panel content with controlled visibility
      </DisclosurePanel>
    </Disclosure>
  )
}
```

### Auth Type Selector (Native Select)
```typescript
// Simple native select sufficient for 5 options
function AuthTypeSelector({ value, onChange }: SelectorProps) {
  return (
    <select
      value={value || ''}
      onChange={(e) => onChange(e.target.value as AuthType | null)}
      className="..." // shadcn/ui Input styles
    >
      <option value="">None</option>
      <option value="bearer">Bearer Token</option>
      <option value="basic">Basic Auth</option>
      <option value="apiKey">API Key (Header)</option>
      <option value="queryParam">Query Parameter</option>
    </select>
  )
}
```

### Inline Error Display (401 vs 403)
```typescript
// Follows ErrorDisplay.tsx pattern, but inline within auth panel
function AuthErrorDisplay({ error }: { error: Error & AppError }) {
  if (error.kind !== 'auth') return null

  const is401 = error.message.includes('401') || error.message.includes('Unauthorized')

  return (
    <div className="bg-purple-50 border border-purple-300 rounded-lg p-3 text-sm">
      <div className="flex items-start gap-2">
        <AlertCircle className="size-4 text-purple-700 shrink-0 mt-0.5" />
        <div className="text-purple-800">
          <p className="font-semibold">
            {is401 ? 'Authentication Required' : 'Insufficient Permissions'}
          </p>
          <p className="mt-1">
            {is401
              ? 'Configure credentials above to access this API.'
              : 'Check your credentials — you may not have permission to access this resource.'}
          </p>
        </div>
      </div>
    </div>
  )
}
```

### Auto-Collapse After Save
```typescript
// Collapse panel after credential save completes
function AuthPanel() {
  const [open, setOpen] = useState(false)
  const { setCredential } = useAuthStore()

  const handleSave = (credential: Credential) => {
    setCredential(url, credential)
    setOpen(false)  // Auto-collapse on save
  }

  return (
    <Disclosure open={open} onChange={setOpen}>
      {/* ... */}
    </Disclosure>
  )
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Custom collapsible logic | Headless UI / Radix primitives | ~2021 | Accessibility by default, keyboard nav, ARIA patterns built-in |
| Hide password by default only | Password + visibility toggle | ~2019 | Better UX for long/complex passwords, password manager compatibility |
| Custom dropdown menus | Native select for simple cases | Ongoing | Native select fast, accessible, works with form autofill. Custom for complex cases only |
| Save buttons on forms | Auto-save on change | ~2020 | Reduced friction, matches user expectation from modern apps (Google Docs, Notion) |

**Deprecated/outdated:**
- `<input type="password" autocomplete="off">` — autocomplete="off" is now ignored by browsers for password fields (security feature)
- Radix Select for 5-option dropdowns — overkill when native select is sufficient and faster

## Open Questions

None identified. All patterns have clear precedent in existing codebase or official documentation.

## Sources

### Primary (HIGH confidence)
- Headless UI Disclosure docs: https://headlessui.com/react/disclosure
- Radix UI Collapsible docs: https://www.radix-ui.com/primitives/docs/components/collapsible
- Existing codebase patterns:
  - src/components/forms/ParameterForm.tsx (Disclosure usage)
  - src/components/navigation/TagGroup.tsx (Disclosure defaultOpen pattern)
  - src/store/authStore.ts (auth state management API)
  - src/types/auth.ts (Credential discriminated union)
  - src/components/ui/input.tsx (shadcn/ui Input component)
  - src/components/ui/button.tsx (shadcn/ui Button component)

### Secondary (MEDIUM confidence)
- [Disclosure – React Aria](https://react-spectrum.adobe.com/react-aria/Disclosure.html) — Accessibility patterns
- [shadcn/ui Select](https://ui.shadcn.com/docs/components/radix/select) — Select component if needed over native
- [Password Field Design Guidelines (Medium)](https://medium.com/uxdworld/password-field-design-guidelines-7bd86cfa1733) — UX best practices
- [Hide/Show Password in React (DEV)](https://dev.to/annaqharder/hideshow-password-in-react-513a) — Toggle pattern
- [API Error Codes Cheat Sheet (2026)](https://apistatuscheck.com/blog/api-error-codes-cheat-sheet) — 401 vs 403 messaging
- [React Debounce patterns (DEV)](https://www.developerway.com/posts/debouncing-in-react) — Auto-save consideration (not needed here)

### Tertiary (LOW confidence)
- General WebSearch results on collapsible patterns, auth UX — verified against official docs before inclusion

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — All libraries already in codebase, versions confirmed
- Architecture: HIGH — Patterns directly match existing code (ParameterForm, TagGroup, ConfigPanel)
- Pitfalls: HIGH — Common React controlled input issues well-documented, solutions verified

**Research date:** 2026-02-09
**Valid until:** 30 days (stack stable, no fast-moving dependencies)
