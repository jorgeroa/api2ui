# Phase 6: Discoverable Component Switching & Per-Element Config - Research

**Researched:** 2026-02-03
**Domain:** React UI interactions, contextual configuration, accessibility
**Confidence:** HIGH

## Summary

Phase 6 adds view-mode component switching via hover badges and right-click field configuration popovers. The implementation requires four key technical capabilities: (1) Headless UI Popover/Menu components for accessible UI overlays, (2) hover and right-click event handling with proper mobile long-press support, (3) carousel-style cycling with auto-confirm debouncing, and (4) cross-navigation via programmatic scroll and bidirectional linking.

The codebase already has the foundational infrastructure: Headless UI 2.2.9 for dialogs/menus, Zustand 5 for state with localStorage persistence, and Tailwind 4 for styling. The existing ComponentPicker modal uses Headless UI Dialog with visual previews, and configStore provides all needed mutation methods (setFieldComponentType, toggleFieldVisibility, setFieldLabel). No new libraries are required.

**Primary recommendation:** Use Headless UI Popover for field configuration overlays, native browser events (contextmenu, onMouseEnter) for triggering, useEffect + setTimeout for debounced auto-confirm, and Element.scrollIntoView() for cross-navigation. Avoid custom context menu libraries or tooltip frameworks - the existing stack handles all requirements.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @headlessui/react | 2.2.9 | Popover, Menu components | Already in project, provides accessible overlays with anchor positioning, keyboard nav, focus management |
| zustand | 5.0.11 | State management | Already in project with localStorage persist, provides staged state capability via partialize |
| React 19.2 | 19.2.0 | Event handling, hooks | Latest stable, provides useEffect, useRef for timers and event handling |
| Tailwind CSS | 4.1.18 | Hover states, positioning | Already in project, provides hover: variants and absolute positioning utilities |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| N/A | - | No additional libraries needed | Existing stack covers all requirements |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Headless UI Popover | Custom div + Portal | Custom requires reimplementing accessibility, keyboard nav, focus trap - not worth it |
| Native contextmenu event | react-contexify, rctx-contextmenu | Libraries add dependencies for functionality native events provide; avoid unless needing complex nested menus |
| Browser scrollIntoView | react-scroll library | Library adds 5KB for features native API provides; only consider if smooth scroll polyfill needed |
| Inline debounce logic | lodash.debounce | lodash.debounce requires proper memoization in React; inline useEffect + setTimeout simpler for single use case |

**Installation:**
```bash
# No new packages needed - all requirements met by existing dependencies
```

## Architecture Patterns

### Recommended Project Structure
```
src/components/
├── config/
│   ├── ComponentPicker.tsx      # Existing - enhance for carousel mode
│   ├── FieldConfigPopover.tsx   # NEW - right-click popover for per-field config
│   ├── ViewModeBadge.tsx        # NEW - hover badge for component switching
│   └── OnboardingTooltip.tsx    # NEW - one-time discovery hint
└── DynamicRenderer.tsx          # Modify - add ViewModeBadge in view mode
```

### Pattern 1: Hover Badge with Conditional Visibility
**What:** Badge appears on hover over renderer area, positioned absolutely in top-right corner
**When to use:** Component-level switching (table/cards/list), not field-level
**Example:**
```tsx
// Source: Current DynamicRenderer.tsx + Tailwind positioning patterns
function DynamicRenderer({ data, schema, path }) {
  const [showBadge, setShowBadge] = useState(false)
  const availableTypes = getAvailableTypes(schema)
  const currentType = override || getDefaultTypeName(schema)

  // User decision: Badge shows in ALL view modes, dimmed when no alternatives
  const hasAlternatives = availableTypes.length > 1

  return (
    <div
      className="relative"
      onMouseEnter={() => setShowBadge(true)}
      onMouseLeave={() => setShowBadge(false)}
    >
      {showBadge && (
        <button
          className={`absolute top-0 right-0 z-10 bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-bl transition-opacity
            ${hasAlternatives ? 'hover:bg-blue-200 cursor-pointer' : 'opacity-50 cursor-not-allowed'}`}
          disabled={!hasAlternatives}
          onClick={() => setShowPicker(true)}
        >
          {currentType} ▾
        </button>
      )}
      <Component data={data} schema={schema} path={path} />
    </div>
  )
}
```

### Pattern 2: Carousel Cycling with Auto-Confirm Debounce
**What:** Click badge cycles through alternatives, auto-confirms after 2 second delay
**When to use:** Component switching where user wants quick preview before committing
**Example:**
```tsx
// Source: React debounce patterns + useEffect timer management
function ViewModeBadge({ availableTypes, currentType, onSelect }) {
  const [tempSelection, setTempSelection] = useState(currentType)
  const timerRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    // User decision: ~2 second delay for auto-confirm
    if (tempSelection !== currentType) {
      timerRef.current = setTimeout(() => {
        onSelect(tempSelection)
      }, 2000)
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [tempSelection, currentType, onSelect])

  const handleCycle = () => {
    const currentIndex = availableTypes.indexOf(tempSelection)
    const nextIndex = (currentIndex + 1) % availableTypes.length
    setTempSelection(availableTypes[nextIndex])
  }

  return (
    <button onClick={handleCycle}>
      {tempSelection} ▾
    </button>
  )
}
```

### Pattern 3: Right-Click Popover with Staged Changes
**What:** Right-click field opens Headless UI Popover with config controls, Apply button commits
**When to use:** Per-field configuration in view mode
**Example:**
```tsx
// Source: Headless UI Popover docs + native contextmenu event
import { Popover, PopoverButton, PopoverPanel } from '@headlessui/react'

function FieldWithConfig({ fieldPath, fieldValue, children }) {
  const [anchorPoint, setAnchorPoint] = useState<{x: number, y: number} | null>(null)
  const [stagedConfig, setStagedConfig] = useState({
    visible: true,
    label: '',
    componentType: 'text'
  })
  const { setFieldConfig } = useConfigStore()

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    setAnchorPoint({ x: e.clientX, y: e.clientY })
  }

  const handleApply = () => {
    setFieldConfig(fieldPath, stagedConfig)
    setAnchorPoint(null)
  }

  return (
    <div onContextMenu={handleContextMenu}>
      {children}

      {anchorPoint && (
        <Popover>
          <PopoverPanel
            static
            className="fixed bg-white rounded-lg shadow-xl p-4 z-50 w-64"
            style={{ top: anchorPoint.y, left: anchorPoint.x }}
          >
            <label>
              <input
                type="checkbox"
                checked={stagedConfig.visible}
                onChange={(e) => setStagedConfig(prev => ({ ...prev, visible: e.target.checked }))}
              />
              Visible
            </label>

            <input
              value={stagedConfig.label}
              onChange={(e) => setStagedConfig(prev => ({ ...prev, label: e.target.value }))}
              placeholder="Custom label"
            />

            <select
              value={stagedConfig.componentType}
              onChange={(e) => setStagedConfig(prev => ({ ...prev, componentType: e.target.value }))}
            >
              <option value="text">Text</option>
              <option value="link">Link</option>
              <option value="image">Image</option>
            </select>

            {/* User decision: Changes staged, not immediate */}
            <button onClick={handleApply}>Apply</button>
            <button onClick={() => setAnchorPoint(null)}>Cancel</button>

            {/* User decision: Cross-navigation to ConfigPanel */}
            <a href="#" onClick={openConfigPanel}>More settings...</a>
          </PopoverPanel>
        </Popover>
      )}
    </div>
  )
}
```

### Pattern 4: Cross-Navigation with Scroll-to-Element
**What:** Link from popover opens ConfigPanel scrolled to specific field; ConfigPanel links back to popover
**When to use:** Bidirectional navigation between contextual and bulk config
**Example:**
```tsx
// Source: Browser scrollIntoView API + React refs
function ConfigPanel() {
  const fieldRefs = useRef<Record<string, HTMLElement | null>>({})

  const scrollToField = (fieldPath: string) => {
    const element = fieldRefs.current[fieldPath]
    element?.scrollIntoView({
      behavior: 'smooth',
      block: 'center'
    })
    // Highlight briefly
    element?.classList.add('ring-2', 'ring-blue-500')
    setTimeout(() => {
      element?.classList.remove('ring-2', 'ring-blue-500')
    }, 2000)
  }

  return (
    <div>
      {fields.map(field => (
        <div
          key={field.path}
          ref={el => fieldRefs.current[field.path] = el}
        >
          {field.name}
          {/* User decision: ConfigPanel links to per-element config */}
          <button onClick={() => openFieldPopover(field.path)}>
            Configure in context
          </button>
        </div>
      ))}
    </div>
  )
}
```

### Pattern 5: One-Time Onboarding Tooltip
**What:** Simple tooltip appears once after data loads, dismissed permanently via localStorage
**When to use:** Discovery hint for right-click functionality
**Example:**
```tsx
// Source: localStorage persistence + Headless UI Popover
function OnboardingTooltip({ targetRef }) {
  const [dismissed, setDismissed] = useState(() => {
    return localStorage.getItem('api2ui-onboarding-dismissed') === 'true'
  })

  const handleDismiss = () => {
    localStorage.setItem('api2ui-onboarding-dismissed', 'true')
    setDismissed(true)
  }

  if (dismissed) return null

  // User decision: Single focused message, no multi-step tour
  return (
    <Popover>
      <PopoverPanel
        anchor="bottom"
        className="bg-blue-600 text-white p-3 rounded-lg shadow-lg"
      >
        <p>Right-click any field to customize it</p>
        <button onClick={handleDismiss}>Got it</button>
      </PopoverPanel>
    </Popover>
  )
}
```

### Pattern 6: Mobile Long-Press Detection
**What:** Long-press on mobile devices triggers same action as right-click on desktop
**When to use:** Cross-platform field configuration
**Example:**
```tsx
// Source: React touch events + timer pattern
function useLongPress(callback: () => void, ms = 800) {
  const timerRef = useRef<NodeJS.Timeout>()

  const start = (e: React.TouchEvent) => {
    timerRef.current = setTimeout(() => {
      callback()
    }, ms)
  }

  const cancel = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }
  }

  return {
    onTouchStart: start,
    onTouchEnd: cancel,
    onTouchMove: cancel // Cancel if user starts scrolling
  }
}

// Usage
function FieldWithConfig({ children }) {
  const handleOpen = () => setPopoverOpen(true)
  const longPressProps = useLongPress(handleOpen)

  return (
    <div
      onContextMenu={handleOpen}
      {...longPressProps}
    >
      {children}
    </div>
  )
}
```

### Anti-Patterns to Avoid
- **Immediate apply for popover changes:** User decision specifies staged changes with Apply button. Don't auto-save on every input change - creates confusion about commit state.
- **Badge in Configure mode only:** User decision specifies badge shows in ALL modes (view and configure), just dimmed when no alternatives. Don't hide it completely.
- **Custom focus trap implementation:** Headless UI provides this. Don't reimplement focus management.
- **preventDefault() on all contextmenu events:** Only prevent default when showing custom menu. Allow browser menu on non-configurable elements.
- **Carousel with immediate commit:** User decision specifies ~2 second auto-confirm delay. Don't commit on every click - let user cycle through options.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Popover positioning | Custom absolute positioning calculations | Headless UI Popover with anchor prop | Handles viewport edges, scrolling, resize, portal rendering automatically |
| Focus trap in modal | Manual focus event listeners | Headless UI modal components (Dialog, Popover) with focus prop | Handles Tab cycling, Shift+Tab, initial focus, return focus, edge cases |
| Keyboard navigation | Custom keydown handlers | Headless UI Menu/Popover built-in keyboard support | Arrow keys, Enter, Space, Escape, Home, End, A-Z jump all handled |
| Debounce utility | Custom setTimeout logic in multiple places | Inline useEffect pattern for single use case | Simpler than lodash.debounce memoization, cleaner than library dependency |
| Scroll to element | Custom scroll calculations | Browser Element.scrollIntoView() | Handles smooth scroll, alignment options, respects reduced motion preferences |
| Long-press detection | Third-party gesture library | Custom useLongPress hook with setTimeout | Simple 15-line implementation, no dependency, handles touch events correctly |

**Key insight:** UI component accessibility is complex - focus management, keyboard navigation, ARIA attributes, screen reader announcements. Headless UI solves these comprehensively. Custom implementations miss edge cases (viewport boundaries, scroll containers, disabled states, nested focus traps, mobile considerations). Always prefer the battle-tested library for overlay components.

## Common Pitfalls

### Pitfall 1: Badge Z-Index Conflicts
**What goes wrong:** Badge renders behind table headers, card images, or other positioned elements
**Why it happens:** CSS stacking context issues - absolute positioned elements don't automatically stack on top
**How to avoid:** Use z-10 or higher on badge, ensure parent has relative positioning, avoid z-index on sibling content elements
**Warning signs:** Badge visible on some renderers but not others; badge appears behind images or headers

### Pitfall 2: Memory Leaks from Unreleased Timers
**What goes wrong:** setTimeout timers continue running after component unmounts, causing state updates on unmounted components
**Why it happens:** useEffect cleanup not implemented, or timer references lost before cleanup runs
**How to avoid:** Always return cleanup function from useEffect that calls clearTimeout; use useRef to store timer ID; clear timer on every state change that should cancel
**Warning signs:** React warning about setState on unmounted component; carousel auto-confirm triggers after user navigates away

### Pitfall 3: Right-Click Prevention Too Broad
**What goes wrong:** Users can't access browser context menu anywhere in the app, even on text they want to copy
**Why it happens:** e.preventDefault() called on document-level contextmenu listener or on parent containers
**How to avoid:** Only preventDefault on specific elements with custom menus; use event.target checks; allow default behavior on text selections
**Warning signs:** Users report inability to use "Inspect Element", "Save Image", or "Copy" from browser menu

### Pitfall 4: Popover Position Outside Viewport
**What goes wrong:** Right-click near screen edge shows popover partially or completely off-screen
**Why it happens:** Fixed positioning uses exact click coordinates without viewport boundary checks
**How to avoid:** Use Headless UI anchor positioning OR manually calculate with window.innerWidth/Height checks and flip positioning
**Warning signs:** Popover not visible when right-clicking near right edge or bottom of viewport

### Pitfall 5: Focus Lost on Popover Close
**What goes wrong:** After closing popover, focus doesn't return to field, or jumps to unexpected element
**Why it happens:** Manual focus management doesn't restore previous activeElement; or no focusable element to return to
**How to avoid:** Store previous activeElement in ref before opening popover, restore on close; or use Headless UI focus management
**Warning signs:** Keyboard users must Tab multiple times to return to working area; screen readers announce unexpected elements

### Pitfall 6: Staged Changes Out of Sync
**What goes wrong:** User opens popover, makes changes, closes without Apply, reopens - sees stale staged values
**Why it happens:** Staged state not reset on popover close/cancel, or not initialized from current config on open
**How to avoid:** Initialize staged state from configStore on popover open; reset staged state on cancel/close; synchronize on external config changes
**Warning signs:** Popover shows previous user's changes from different field; Apply does nothing because staged = current

### Pitfall 7: Carousel Cycles to Invalid State
**What goes wrong:** Carousel shows component type that's not actually available (e.g., "cards" for non-array data)
**Why it happens:** availableTypes calculation doesn't match ComponentPicker logic, or temp state not validated
**How to avoid:** Derive availableTypes from same source for both badge and picker; validate tempSelection against availableTypes before rendering
**Warning signs:** Badge shows type name that doesn't exist; clicking badge causes error; preview shows wrong component

### Pitfall 8: Mobile Long-Press Triggers Scroll
**What goes wrong:** User long-presses to open config, but page scrolls instead
**Why it happens:** touchmove not canceled, or long-press duration too short (conflicts with scroll intent)
**How to avoid:** Call preventDefault on touchmove if timer active; use 800ms+ threshold; cancel timer if touchmove distance exceeds threshold
**Warning signs:** Config popover never opens on mobile; or opens but page also scrolls; or opens unintentionally during scroll

## Code Examples

Verified patterns from official sources:

### Headless UI Popover with Anchor Positioning
```tsx
// Source: https://headlessui.com/react/popover
import { Popover, PopoverButton, PopoverPanel } from '@headlessui/react'

function FieldConfigPopover() {
  return (
    <Popover>
      {/* Anchor positioning positions panel relative to button */}
      <PopoverPanel anchor="bottom start" className="bg-white shadow-xl rounded-lg p-4">
        {/* Config controls here */}
      </PopoverPanel>
    </Popover>
  )
}

// Control spacing with CSS variables
<PopoverPanel
  anchor="bottom start"
  className="[--anchor-gap:8px] [--anchor-padding:16px]"
>
```

### Headless UI Menu for Dropdown
```tsx
// Source: https://headlessui.com/react/menu
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react'

function ComponentTypeMenu() {
  return (
    <Menu>
      <MenuButton>Table ▾</MenuButton>
      <MenuItems anchor="bottom" className="bg-white shadow-lg rounded">
        <MenuItem>
          <button onClick={() => setType('table')}>Table</button>
        </MenuItem>
        <MenuItem>
          <button onClick={() => setType('card-list')}>Cards</button>
        </MenuItem>
      </MenuItems>
    </Menu>
  )
}

// Keyboard navigation built-in: Arrow keys, Enter, Space, Escape
// Data attributes for styling: data-active, data-focus, data-disabled
```

### Native Context Menu Event
```tsx
// Source: MDN Web Docs - contextmenu event
function FieldWithContextMenu({ children }) {
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault() // Prevent browser menu

    // Get click position
    const x = e.clientX
    const y = e.clientY

    // Show custom menu at position
    showMenu({ x, y })
  }

  return (
    <div onContextMenu={handleContextMenu}>
      {children}
    </div>
  )
}
```

### Debounced Auto-Confirm
```tsx
// Source: React useEffect patterns + community best practices
function DebouncedCarousel({ value, onChange, delay = 2000 }) {
  const [tempValue, setTempValue] = useState(value)
  const timerRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    // Clear previous timer
    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }

    // Set new timer if value changed
    if (tempValue !== value) {
      timerRef.current = setTimeout(() => {
        onChange(tempValue)
      }, delay)
    }

    // Cleanup on unmount
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [tempValue, value, onChange, delay])

  return { tempValue, setTempValue }
}
```

### Scroll to Element with Highlight
```tsx
// Source: Browser scrollIntoView API
function scrollToField(fieldPath: string) {
  const element = document.querySelector(`[data-field-path="${fieldPath}"]`)

  if (element) {
    // Smooth scroll to element
    element.scrollIntoView({
      behavior: 'smooth',
      block: 'center'    // Vertical alignment
    })

    // Temporary highlight
    element.classList.add('ring-2', 'ring-blue-500')
    setTimeout(() => {
      element.classList.remove('ring-2', 'ring-blue-500')
    }, 2000)
  }
}
```

### Accessible Focus Management
```tsx
// Source: W3C ARIA Authoring Practices Guide
function AccessiblePopover({ isOpen, onClose, children }) {
  const previousFocusRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (isOpen) {
      // Store previous focus
      previousFocusRef.current = document.activeElement as HTMLElement
    } else if (previousFocusRef.current) {
      // Restore focus on close
      previousFocusRef.current.focus()
    }
  }, [isOpen])

  return (
    <Popover>
      <PopoverPanel
        focus  // Headless UI handles focus trap
        onClose={onClose}
        aria-modal="true"
        role="dialog"
        aria-labelledby="popover-title"
      >
        <h2 id="popover-title">Field Configuration</h2>
        {children}
      </PopoverPanel>
    </Popover>
  )
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Tooltip libraries (react-tooltip) | Headless UI Popover + custom content | v2.0 (2023) | Popover with anchor positioning replaces tooltip libraries - more flexible, accessible, consistent with dialog/menu patterns |
| Custom context menu libraries | Native contextmenu event + Headless UI Menu | 2024+ | Browser context menu event now widely supported; libraries only needed for complex nested menus |
| lodash.debounce everywhere | Inline useEffect + setTimeout for single use | React Hooks era | Simpler for single-use debouncing, avoids memoization complexity |
| Separate tooltip component libraries | Built-in popover HTML attribute | Chrome 114+ (2023) | Native popover attribute available but lacks positioning control - Headless UI still preferred |
| Manual ARIA attributes | Headless UI automatic ARIA | v0.0+ (2021) | Components handle aria-modal, aria-labelledby, aria-expanded automatically |

**Deprecated/outdated:**
- react-tooltip: Replaced by Headless UI Popover with custom content - better accessibility, positioning control
- react-contexify, react-contextmenu: Unmaintained; native contextmenu event + Headless UI Menu simpler
- react-onboarding-tour complex libraries: User decision specifies single tooltip, not multi-step tour - simple localStorage + Popover sufficient

## Open Questions

Things that couldn't be fully resolved:

1. **Carousel auto-confirm exact duration**
   - What we know: User decided ~2 seconds; research shows 300-500ms typical for debounce
   - What's unclear: Whether 2000ms feels too slow in practice, or if shorter (1000ms) better
   - Recommendation: Start with 2000ms as specified, add to verification UAT to gather feedback

2. **Badge hover delay before showing**
   - What we know: User wants subtle hover badge that appears "when needed"
   - What's unclear: Whether badge should appear immediately on hover or after brief delay (e.g., 200ms)
   - Recommendation: Implement immediate show (no delay) - hover out hides it, so no harm in immediate appearance

3. **Popover mobile viewport handling**
   - What we know: Right-click works on desktop; long-press on mobile
   - What's unclear: Whether popover should be full-width on small screens or maintain fixed width
   - Recommendation: Use responsive width - fixed w-64 on desktop, w-full with padding on mobile (sm: breakpoint)

4. **Cross-navigation ConfigPanel scroll container**
   - What we know: ConfigPanel is Dialog with overflow-y-auto content area
   - What's unclear: Whether scrollIntoView works correctly within Dialog scroll container vs document scroll
   - Recommendation: Test with real implementation; may need scrollIntoView on scroll container element instead of window

5. **Onboarding tooltip trigger timing**
   - What we know: Show "after first data loads"
   - What's unclear: Show immediately when data appears, or wait few seconds to not overwhelm?
   - Recommendation: Show after 3-second delay from data load - gives user time to see rendered data first

## Sources

### Primary (HIGH confidence)
- Headless UI v2 Popover documentation - https://headlessui.com/react/popover
- Headless UI v2 Menu documentation - https://headlessui.com/react/menu
- W3C ARIA Dialog Modal Pattern - https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/
- W3C ARIA Menu Pattern - https://www.w3.org/WAI/ARIA/apg/patterns/menubar/
- MDN ARIA menu role - https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Roles/menu_role
- Zustand persist middleware docs - https://zustand.docs.pmnd.rs/integrations/persisting-store-data
- Current codebase analysis - DynamicRenderer.tsx, ComponentPicker.tsx, FieldControls.tsx, ConfigPanel.tsx, PrimitiveRenderer.tsx, configStore.ts

### Secondary (MEDIUM confidence)
- Tailwind CSS positioning utilities - https://tailwindcss.com/docs/top-right-bottom-left
- Material Tailwind badge examples - https://www.material-tailwind.com/docs/html/badge
- React debounce patterns - https://www.developerway.com/posts/debouncing-in-react
- Browser scrollIntoView API - https://spacejelly.dev/posts/how-to-scroll-to-an-element-in-react
- Context menu implementation guide - https://blog.logrocket.com/creating-react-context-menu/
- Long-press detection - https://usehooks.com/uselongpress

### Tertiary (LOW confidence)
- OnboardJS library patterns - https://onboardjs.com/blog/react-onboarding-onboardjs-getting-started (provides localStorage persistence patterns but library not needed for single tooltip)
- React carousel libraries comparison - https://www.carmatec.com/blog/10-best-react-carousel-component-libraries/ (context for carousel patterns, but not using library for this use case)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries already in project, verified versions, official documentation reviewed
- Architecture: HIGH - Patterns derived from official docs + existing codebase structure, clear implementation path
- Pitfalls: HIGH - Based on common React/accessibility issues + specific concerns from user decisions (staged changes, carousel, right-click)

**Research date:** 2026-02-03
**Valid until:** 90 days (2026-05-03) - Stack is stable (React 19, Headless UI 2, Zustand 5), patterns are established, minimal churn expected
