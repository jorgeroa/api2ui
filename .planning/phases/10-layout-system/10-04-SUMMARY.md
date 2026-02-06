---
phase: 10-layout-system
plan: 04
subsystem: ui-layout
tags: [react, radix-ui, layout-switcher, responsive, accessibility]

requires:
  - 10-01  # layoutStore, useMediaQuery
  - 10-02  # SidebarLayout, TopBarLayout
  - 10-03  # SplitLayout, DrawerLayout

provides:
  - LayoutSwitcher component for desktop layout selection
  - LayoutContainer orchestrator integrating all layouts
  - Complete layout switching system

affects:
  - 10-05  # Parameter grouping integration will use LayoutContainer

tech-stack:
  added:
    - "@radix-ui/react-toggle-group": "Accessible toggle group component"
  patterns:
    - "Radix UI primitives for accessible toggle buttons"
    - "Orchestrator pattern for layout selection"
    - "Responsive layout switching with viewport detection"

key-files:
  created:
    - src/components/layout/LayoutSwitcher.tsx
    - src/components/layout/LayoutContainer.tsx
  modified:
    - package.json

decisions:
  - decision: "Use native title attribute for tooltips"
    rationale: "Avoids adding Radix Tooltip dependency for simple hover tooltips"
    scope: "LayoutSwitcher UI"
  - decision: "Prevent deselection in LayoutSwitcher"
    rationale: "Always maintain an active layout selection"
    scope: "Toggle group behavior"
  - decision: "Inline SVG icons for layout modes"
    rationale: "Consistent with Phase 9 decision to avoid icon library dependency"
    scope: "LayoutSwitcher icons"
  - decision: "FAB for drawer trigger on mobile"
    rationale: "Fixed bottom-right button provides persistent access to parameters"
    scope: "Mobile UX"
  - decision: "z-50 for FAB"
    rationale: "Ensures button stays above results content on mobile"
    scope: "Mobile drawer trigger"

metrics:
  duration: "2 min"
  completed: 2026-02-06
  tasks: 3
  commits: 3
---

# Phase 10 Plan 04: Layout Switcher & Container Summary

**One-liner:** Icon toggle group for layout selection with orchestrator that routes to correct layout component based on viewport and user preference.

## What Was Built

### 1. LayoutSwitcher Component
Icon-only toggle group for desktop layout selection:
- **Three layout modes:** sidebar, topbar, split
- **Inline SVG icons:** Visual representation of each layout (left panel, top bar, vertical split)
- **Native tooltips:** title attribute for hover tooltips (simple, zero-dependency)
- **Radix Toggle Group:** Accessible with roving tabindex, ARIA attributes, data-state for styling
- **Styling:** Border container, hover states, active state (blue-100 bg), focus rings
- **Prevents deselection:** Always maintains an active layout choice

### 2. LayoutContainer Orchestrator
Main layout component that ties everything together:
- **Per-endpoint layout preference:** Uses layoutStore.getLayout(endpoint)
- **Viewport detection:** useMediaQuery for 767px mobile breakpoint
- **Desktop rendering:** Conditionally renders SidebarLayout, TopBarLayout, or SplitLayout
- **Mobile rendering:** Always renders DrawerLayout with FAB trigger
- **Layout switcher integration:** Shows LayoutSwitcher on desktop only
- **FAB trigger:** Fixed bottom-right button with filter icon for opening drawer on mobile
- **Form state preservation:** ReactNode props naturally maintain mounted state during layout switches

### 3. Integration Points
- Imports all four layout components (Sidebar, TopBar, Split, Drawer)
- Imports useLayoutStore for preference management
- Imports useMediaQuery for responsive behavior
- Imports LayoutSwitcher for desktop UI control

## Task Breakdown

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Install Radix Toggle Group | caea39f | package.json, package-lock.json |
| 2 | Create LayoutSwitcher Component | 731497f | LayoutSwitcher.tsx |
| 3 | Create LayoutContainer Component | e6f1de9 | LayoutContainer.tsx |

## Deviations from Plan

None - plan executed exactly as written.

## Next Phase Readiness

**Ready for Plan 10-05:** Parameter grouping integration
- LayoutContainer ready to receive grouped parameter components
- Layout switching infrastructure complete
- All responsive breakpoints established

**Integration path:**
1. Plan 10-05 will create parameter grouping components
2. Those components will be passed to LayoutContainer as the `parameters` prop
3. LayoutContainer will handle layout selection and responsive behavior
4. No changes to LayoutContainer needed

## Known Limitations

1. **No tooltip component:** Using native title attribute (basic functionality, browser-dependent styling)
2. **Fixed FAB position:** Bottom-right is hardcoded (could be configurable in future)
3. **No layout animation:** Switching layouts is instant (could add transitions in future)

## Testing Notes

**Manual verification needed:**
1. Desktop: Toggle between sidebar/topbar/split layouts
2. Mobile: FAB button opens drawer
3. Verify layout preference persists per endpoint
4. Verify form state preserved during layout switches
5. Keyboard navigation in LayoutSwitcher (Tab, Arrow keys)

**TypeScript:** All types compile successfully.

## Technical Decisions Explained

### Why Radix Toggle Group?
- **Accessibility:** ARIA attributes, roving tabindex, keyboard navigation built-in
- **State management:** data-state attribute for CSS styling (simpler than custom state)
- **Single-select mode:** Ensures one layout always selected
- **Zero CSS required:** Works with utility classes

### Why prevent deselection?
Without a selection, LayoutContainer wouldn't know which layout to render. Forcing a selection eliminates edge case.

### Why native title instead of Radix Tooltip?
- Adds 2+ KB for simple hover tooltips
- title attribute provides 90% of needed functionality
- Can upgrade later if rich tooltips needed (positioning, arrow, custom styling)

### Why inline SVG icons?
Consistent with Phase 9 decision. Avoids icon library dependency. Icons are simple geometric shapes (3 total).

## Code Quality

- **TypeScript:** Full type coverage, no any types
- **Accessibility:** ARIA labels, keyboard navigation, focus management
- **Responsive:** Mobile-first with viewport detection
- **Performance:** No unnecessary re-renders (zustand, conditional rendering)

---

*Completed: 2026-02-06 in 2 minutes*
