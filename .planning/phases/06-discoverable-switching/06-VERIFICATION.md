---
phase: 06-discoverable-switching
verified: 2026-02-03T04:30:00Z
status: gaps_found
score: 3/4 must-haves verified
gaps:
  - truth: "ComponentPicker shows live previews and is accessible from the view-mode badge"
    status: partial
    reason: "ComponentPicker exists with live previews but is unreachable — setShowPicker(true) is never called anywhere in the codebase"
    artifacts:
      - path: "src/components/config/ComponentPicker.tsx"
        issue: "Component is substantive (249 lines, live previews) but orphaned — no code path opens it"
      - path: "src/components/DynamicRenderer.tsx"
        issue: "showPicker state and ComponentPicker render exist but setShowPicker(true) is never invoked"
      - path: "src/components/config/ComponentOverridePanel.tsx"
        issue: "Contains commented-out TODO for Change button that would open ComponentPicker (line 43-48)"
    missing:
      - "A trigger to call setShowPicker(true) — e.g. long-press or double-click on ViewModeBadge, or a button in the popover"
      - "Alternatively, wire the ComponentOverridePanel Change button to open ComponentPicker"
---

# Phase 6: Discoverable Component Switching & Per-Element Config Verification Report

**Phase Goal:** Users can discover and switch component types without entering Configure mode, and configure individual elements in context
**Verified:** 2026-02-03T04:30:00Z
**Status:** gaps_found
**Re-verification:** No -- initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | A subtle badge/chip on each renderer allows switching component type in View mode | VERIFIED | ViewModeBadge.tsx (80 lines) with carousel cycling and 2s auto-confirm, integrated in DynamicRenderer via hover-reveal at depth===0, calls setFieldComponentType on confirm |
| 2 | ComponentPicker shows live previews and is accessible from the view-mode badge | FAILED | ComponentPicker.tsx exists with live ArrayComponentPreview and PrimitiveRenderModePreview (249 lines), but setShowPicker(true) is never called — no user path can open it |
| 3 | Clicking/right-clicking a field/element opens a contextual config popover (visibility, label, component type) | VERIFIED | FieldConfigPopover.tsx (205 lines) with staged state, Apply/Cancel, viewport boundary detection; integrated in all 4 renderers via onContextMenu + inline touch long-press |
| 4 | ConfigPanel provides cross-navigation links to per-element config | VERIFIED | ConfigPanel listens for api2ui:open-config-panel, scrollToField with highlight ring; FieldListPanel has data-field-path and gear button; all 4 renderers listen for api2ui:configure-field; bidirectional navigation works |

**Score:** 3/4 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/components/config/ViewModeBadge.tsx` | Pill badge with carousel cycling | VERIFIED | 80 lines, no stubs, exported, imported by DynamicRenderer, has auto-confirm timer with cleanup |
| `src/components/DynamicRenderer.tsx` | Integrates ViewModeBadge + OnboardingTooltip | VERIFIED | 114 lines, hover-reveal badge at depth===0, renders OnboardingTooltip, calls setFieldComponentType |
| `src/components/config/FieldConfigPopover.tsx` | Contextual field config with visibility/label/component type | VERIFIED | 205 lines, staged state pattern, Apply/Cancel, viewport flip, "More settings..." dispatches event |
| `src/hooks/useLongPress.ts` | Mobile long-press detection hook | VERIFIED (ORPHANED) | 51 lines, substantive hook, but renderers use inline touch timer pattern instead (decision D-06-02-01); hook is not imported by any renderer |
| `src/components/config/OnboardingTooltip.tsx` | One-time tooltip for right-click discovery | VERIFIED | 57 lines, localStorage persistence, 3s delay, "Got it" dismiss button |
| `src/components/config/ConfigPanel.tsx` | Cross-navigation with scroll-to-field | VERIFIED | 170 lines, api2ui:open-config-panel listener, scrollToField, handleConfigureField dispatches api2ui:configure-field |
| `src/components/config/FieldListPanel.tsx` | Field rows with data-field-path + gear button | VERIFIED | 117 lines, data-field-path attributes, gear icon per row, onConfigureField prop |
| `src/components/config/ComponentPicker.tsx` | Live preview picker for component alternatives | ORPHANED | 249 lines, substantive with ArrayComponentPreview + PrimitiveRenderModePreview, but unreachable — no trigger opens it |
| `src/components/renderers/TableRenderer.tsx` | Right-click + long-press + cross-nav listener | VERIFIED | Has onContextMenu, inline touch timer, api2ui:configure-field listener, renders FieldConfigPopover |
| `src/components/renderers/CardListRenderer.tsx` | Right-click + long-press + cross-nav listener | VERIFIED | Has onContextMenu, inline touch timer, api2ui:configure-field listener, renders FieldConfigPopover |
| `src/components/renderers/DetailRenderer.tsx` | Right-click + long-press + cross-nav listener | VERIFIED | Has onContextMenu, inline touch timer, api2ui:configure-field listener, renders FieldConfigPopover |
| `src/components/renderers/ListRenderer.tsx` | Right-click + long-press + cross-nav listener | VERIFIED | Has onContextMenu, inline touch timer, api2ui:configure-field listener, renders FieldConfigPopover |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| ViewModeBadge | configStore | onSelect -> setFieldComponentType | WIRED | Badge click cycles type, auto-confirm timer calls onSelect, DynamicRenderer passes setFieldComponentType |
| DynamicRenderer | ViewModeBadge | hover state + conditional render | WIRED | mouseEnter/Leave toggles showBadge at depth===0 |
| DynamicRenderer | ComponentPicker | showPicker state | NOT_WIRED | showPicker is declared but setShowPicker(true) never called — dead code path |
| FieldConfigPopover | configStore | handleApply commits staged state | WIRED | toggleFieldVisibility, setFieldLabel, setFieldComponentType called on Apply |
| FieldConfigPopover | ConfigPanel | api2ui:open-config-panel event | WIRED | "More settings..." button dispatches event, ConfigPanel listens and scrolls |
| ConfigPanel | renderers | api2ui:configure-field event | WIRED | handleConfigureField dispatches, all 4 renderers listen and open popover |
| Renderers | FieldConfigPopover | onContextMenu + popoverState | WIRED | All 4 renderers set popoverState on right-click/long-press, conditionally render popover |
| OnboardingTooltip | localStorage | STORAGE_KEY | WIRED | Reads/writes localStorage for one-time dismissal |
| DynamicRenderer | OnboardingTooltip | depth===0 + data check | WIRED | Rendered at bottom when depth===0 and data is non-null |

### Requirements Coverage

| Requirement | Status | Blocking Issue |
|-------------|--------|----------------|
| DSC-01: View-mode badge/chip allows switching without Configure mode | SATISFIED | None — ViewModeBadge carousel works in View mode |
| DSC-02: ComponentPicker with live previews accessible from badge | BLOCKED | ComponentPicker exists but is unreachable (setShowPicker(true) never called) |
| DSC-03: Per-element config popover for contextual field configuration | SATISFIED | FieldConfigPopover with visibility, label, component type; right-click + long-press on all renderers |
| DSC-04: ConfigPanel links to per-element config for cross-navigation | SATISFIED | Bidirectional cross-navigation via custom DOM events |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `src/components/config/ComponentOverridePanel.tsx` | 43-48 | TODO comment with commented-out Change button | Warning | Indicates incomplete ComponentPicker integration |
| `src/components/DynamicRenderer.tsx` | 46, 91-103 | Dead code: showPicker state + ComponentPicker render never triggered | Warning | ComponentPicker is unreachable — wasted bundle size |
| `src/hooks/useLongPress.ts` | all | Orphaned module: exported but not imported anywhere | Info | Renderers use inline touch timer instead (valid decision D-06-02-01) |

### Human Verification Required

### 1. ViewModeBadge carousel cycling UX
**Test:** Hover over a table/card/list renderer and click the badge pill. Verify it cycles through available types (e.g., Table -> Card List -> List -> JSON) with 2s auto-confirm.
**Expected:** Badge appears on hover, clicking cycles types with pulse animation, type auto-confirms after 2 seconds, renderer switches.
**Why human:** Visual animation timing and hover behavior cannot be verified programmatically.

### 2. FieldConfigPopover right-click activation
**Test:** Right-click on any field in table cells, card fields, detail fields, or list items.
**Expected:** Contextual popover appears at cursor position with visibility toggle, custom label input, component type selector (when applicable), Apply/Cancel buttons, and "More settings..." link.
**Why human:** Right-click behavior and viewport boundary flipping require browser interaction.

### 3. Cross-navigation flow
**Test:** (a) Right-click a field, click "More settings..." -- ConfigPanel should open and scroll to that field with blue highlight. (b) In ConfigPanel, click the gear icon next to a field -- popover should open on the renderer at that field.
**Expected:** Smooth bidirectional navigation between ConfigPanel and renderer context menus.
**Why human:** Custom DOM event coordination and scroll-to-field behavior require runtime testing.

### 4. OnboardingTooltip one-time display
**Test:** Clear localStorage, load app with data. Wait 3 seconds.
**Expected:** Blue tooltip appears at bottom center: "Right-click any field to customize it" with "Got it" button. Clicking "Got it" dismisses permanently (survives reload).
**Why human:** Timer-delayed display and localStorage persistence require browser testing.

### 5. Mobile long-press activation
**Test:** On touch device (or emulator), long-press (800ms) on a field in any renderer.
**Expected:** FieldConfigPopover appears at touch position.
**Why human:** Touch events require physical device or emulator testing.

### Gaps Summary

One gap blocks full phase goal achievement:

**ComponentPicker is unreachable.** The `ComponentPicker` component exists at `src/components/config/ComponentPicker.tsx` with 249 lines of substantive implementation including live previews for both array components (scaled-down actual renderers) and primitive render modes. However, it cannot be opened by any user action. In `DynamicRenderer.tsx`, the `showPicker` state is declared and `ComponentPicker` is conditionally rendered, but `setShowPicker(true)` is never called anywhere in the codebase. The `ComponentOverridePanel.tsx` contains a commented-out TODO for a "Change" button that would open it (lines 43-48). The ViewModeBadge provides carousel-based switching which partially fulfills the switching need, but the success criterion specifically requires "ComponentPicker shows live previews and is accessible from the view-mode badge" -- the live preview picker is disconnected.

A minimal fix would be to add a trigger -- for example, a long-press or double-click on the ViewModeBadge could open the ComponentPicker, or a dedicated button in the FieldConfigPopover could open it.

The `useLongPress` hook at `src/hooks/useLongPress.ts` is orphaned (not imported anywhere) since renderers use inline touch timers. This is a noted deviation (D-06-02-01) and is not a blocker, but the unused module adds dead code.

---

_Verified: 2026-02-03T04:30:00Z_
_Verifier: Claude (gsd-verifier)_
