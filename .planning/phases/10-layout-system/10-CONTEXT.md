# Phase 10: Layout System & Parameter Grouping - Context

**Gathered:** 2026-02-05
**Status:** Ready for planning

<domain>
## Phase Boundary

User-selectable layout presets (sidebar, top bar, split view, drawer) with responsive behavior. Layout choice persists per endpoint. On mobile (<768px), defaults to collapsible drawer. Parameter groups from Phase 9 adapt to each layout mode.

</domain>

<decisions>
## Implementation Decisions

### Layout Switcher UI
- Lives in top toolbar alongside existing controls
- Icon-only toggle group (compact, no labels)
- Hide drawer option on desktop (3 icons on desktop, drawer only shown on mobile)
- Tooltips on hover showing layout name ("Sidebar", "Top Bar", "Split View")

### Sidebar Mode
- Positioned on left side
- Fixed width (not resizable)
- Parameters on left, results on right

### Top Bar Mode
- Parameters arranged in responsive grid (2-3 columns depending on width)
- Grid adapts to parameter count and viewport

### Split View Mode
- 30/70 ratio (parameters get 30%, results get 70%)
- Vertical split

### Mobile Drawer
- Slides up from bottom
- Handle + swipe to open/close (visible drag handle, pull up to open)
- Adaptive height (starts at ~50%, can be swiped up to full height)
- 768px breakpoint triggers mobile mode

### Transitions & State
- Smooth slide/resize animations between layouts
- Fast transitions (150-200ms)
- Preserve scroll position when switching layouts
- Preserve unsaved form values across layout switches

### Claude's Discretion
- Exact sidebar width (px/rem value)
- Grid column breakpoints for top bar mode
- Handle design and sizing for mobile drawer
- Animation easing curves
- How parameter groups collapse/expand in each layout

</decisions>

<specifics>
## Specific Ideas

- Drawer should feel native to mobile — like iOS/Android bottom sheets
- Icon toggle group similar to Figma's view mode switcher (compact, clear icons)
- User mentioned wanting grid by default for top bar to handle varying parameter counts

</specifics>

<deferred>
## Deferred Ideas

- User-customizable top bar arrangement (horizontal vs grid) — future enhancement
- Resizable sidebar width — future enhancement
- User-adjustable split ratio — future enhancement

</deferred>

---

*Phase: 10-layout-system*
*Context gathered: 2026-02-05*
