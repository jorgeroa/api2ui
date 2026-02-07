# Phase 11: Rich Input Components & UX Polish - Context

**Gathered:** 2026-02-07
**Status:** Ready for planning

<domain>
## Phase Boundary

Rich form input components with inline re-fetch, validation feedback, and applied filter chip UX. Includes date/datetime pickers, tag inputs for arrays, numeric sliders, inline validation, applied filter chips above results, and URL preview toggle.

</domain>

<decisions>
## Implementation Decisions

### Component Library
- Set up shadcn/ui as part of this phase
- Add components: Calendar, Popover, Input, Button, Badge (for chips), Slider
- One-time init + path alias setup required

### Date/Time Pickers
- Use react-day-picker (via shadcn Calendar component)
- Time picker appears only when schema/data indicates datetime (not just date)
- Date-only fields show calendar without time selector

### Tag/Chip Input (Array Parameters)
- Both Enter key and comma add new tag
- Brief error flash when attempting to add duplicate
- Tag limit only enforced if API schema specifies maxItems
- Delete (X) button always visible on each chip

### Numeric Sliders
- Slider appears only when min/max are explicitly known from OpenAPI schema or type inference
- No guessing common ranges — explicit bounds required
- Current value shown as label above slider track

### Applied Filter Chips
- Sticky bar that persists while scrolling results
- Format: "key: value" (e.g., "status: active")
- "Clear all" button appears at end of chip row
- Removing a chip triggers immediate re-fetch
- Bar hidden entirely when no filters are applied

### Re-fetch Behavior
- Hybrid approach: text inputs need Apply button, selects/toggles/chip removals auto-fetch
- Loading state: replace results with skeleton loaders
- On error: keep previous results visible, show error toast
- No cancel button for in-flight fetches

### URL Preview
- Toggle to show/hide (hidden by default)
- When enabled, shows constructed URL below form
- Copy button for one-click URL copy
- Long URLs truncated with ellipsis, full URL on copy
- Toggle state persists in localStorage

### Claude's Discretion
- Exact shadcn component styling and customization
- Skeleton loader structure and animation
- Toast notification implementation
- Debounce timing for hybrid auto-fetch
- Error toast duration and styling

</decisions>

<specifics>
## Specific Ideas

- Shadcn/ui for consistent component library going forward
- Hybrid fetch approach balances user control (text inputs) with quick actions (toggles, chip removal)
- Sticky chip bar keeps filter context visible while browsing results

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 11-rich-input-components*
*Context gathered: 2026-02-07*
