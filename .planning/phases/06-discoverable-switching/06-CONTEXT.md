# Phase 6: Discoverable Component Switching & Per-Element Config - Context

**Gathered:** 2026-02-02
**Status:** Ready for planning

<domain>
## Phase Boundary

Users can discover and switch component types without entering Configure mode, and configure individual elements in context. View mode gains inline component switching via hover badges and right-click field configuration popovers. Configure mode remains for bulk operations (field reordering, viewing all overrides). ConfigPanel gains cross-navigation links to per-element config.

</domain>

<decisions>
## Implementation Decisions

### Badge/chip design
- Subtle pill appears on hover over the renderer area — stays hidden until needed
- Positioned consistently in top-right corner across all renderer types (table, cards, list, detail)
- Shows current component type name + dropdown indicator (e.g., "Table ▾", "Cards ▾")
- Appears on ALL renderers including those with no alternatives — dimmed/disabled when no switch options exist

### Inline component switching
- Clicking the badge cycles through alternatives in-place (carousel pattern) — the actual renderer swaps live
- Badge label updates in real-time as user cycles ("Table ▾" → "Cards ▾" → "List ▾")
- Auto-confirms after ~2 second delay when user stops cycling
- Field-level component switching (e.g., URL text/link/image) uses a small popover dropdown instead of carousel — fields have fewer options and smaller visual space

### Contextual config popover
- Triggered by right-click (desktop) / long-press (mobile) on any field/element
- Contains full field config: visibility toggle, custom label input, component type selector
- Changes are staged — requires Apply button to commit (not live/immediate)
- Bidirectional cross-navigation: popover has "More settings..." link → opens ConfigPanel scrolled to that field; ConfigPanel field rows have link → opens popover for that field in context

### Discovery & onboarding
- One-time tooltip appears after first data loads: "Right-click any field to customize it"
- Single focused message — no multi-step tour or overlay
- Dismissed permanently after user acknowledges
- Configure mode toggle (gear button) remains as-is — View mode adds quick-access shortcuts, does not replace Configure mode

### Claude's Discretion
- Tooltip styling and positioning
- Animation/transition effects during carousel cycling
- Exact popover layout and sizing
- How the "dimmed" badge state looks for non-switchable renderers
- Right-click context menu integration (custom menu vs browser default replacement)

</decisions>

<specifics>
## Specific Ideas

- Badge carousel should feel snappy — the renderer swaps in place so user sees real data in each layout
- Popover triggered by right-click keeps the left-click interaction free for existing behaviors (detail drill-down, link clicking)
- The Apply button in the popover gives users confidence to experiment without accidentally changing things

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 06-discoverable-switching*
*Context gathered: 2026-02-02*
