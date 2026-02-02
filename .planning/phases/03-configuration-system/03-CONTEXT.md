# Phase 3: Configuration System - Context

**Gathered:** 2026-02-02
**Status:** Ready for planning

<domain>
## Phase Boundary

Enable developers to customize how API data renders — component types, field visibility, labels, and styling — with configurations persisting in local storage across sessions. Toggle between Configure mode (settings panel + inline editing) and View mode (clean output). No new rendering capabilities; this phase adds control over existing rendering.

</domain>

<decisions>
## Implementation Decisions

### Configure mode UX
- Floating button (gear/wrench icon) in a corner to toggle between Configure and View mode
- Combined approach: inline overlays for quick edits (hide/show, label rename) + slide-out side panel for deeper settings (component type, styling)
- Side panel overlays content (does not push/shrink content)
- Badge count on floating button showing number of hidden fields

### Component overrides
- Visual preview picker for selecting alternative component types — thumbnail previews of each option before switching
- Array components: Table (default), Cards, List, and Raw JSON
- Individual fields get type-appropriate render overrides (e.g., URL field: link / plain text / image preview; date field: relative / absolute)
- When overriding, prompt user: "Apply to just this field, or all similar fields?" — user decides per override

### Field management
- Hide/show: eye icon inline on each field + checkbox list in side panel for bulk management
- Label editing: click-to-edit inline in Configure mode + panel view showing all label mappings (original name → custom label)
- Drag-and-drop reordering of fields/columns in Configure mode
- Badge count on configure button for hidden field awareness (without opening panel)

### Style customization
- Theme presets as starting point (e.g., light, dark, compact, spacious), then granular tweaks on top
- Granular properties: colors, font family, font sizes, padding, margins, border radius, row height — no raw CSS editor
- Color picking: curated palette of swatches as default + "Custom..." option opening native color picker
- Scope: global default style + per-endpoint overrides when wanted

### Claude's Discretion
- Visual treatment for Configure mode distinction (how it looks different from View mode)
- Exact theme preset designs and curated color palette selection
- Drag-and-drop library choice and implementation approach
- Side panel layout and section organization
- Preview thumbnail design for component type picker

</decisions>

<specifics>
## Specific Ideas

- The "both combined" pattern is consistent: inline controls for quick actions, side panel for full overview — applies to hide/show, labels, and component overrides
- Visual preview picker for component alternatives suggests the user values seeing before committing
- "Ask each time" for override scope means the system should not assume — explicit user choice per action

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 03-configuration-system*
*Context gathered: 2026-02-02*
