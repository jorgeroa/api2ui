# Phase 14: Smart Component Selection - Context

**Gathered:** 2026-02-08
**Status:** Ready for planning

<domain>
## Phase Boundary

Arrays and objects render with context-appropriate components based on semantic analysis from Phases 12-13. Smart defaults select cards, tables, galleries, timelines, or key-value views based on detected semantics and content richness. Users can always override via component switcher.

</domain>

<decisions>
## Implementation Decisions

### Card vs Table Selection
- Content richness trumps field count — field count is a signal, not the deciding factor
- Long text fields trigger cards only if they're primary/secondary tier (not tertiary)
- Trust card decision even for large datasets (15+ items) — pagination handles it
- Card selection is about content type, not about showing all fields
- Cards display primary + secondary tier fields only; tertiary fields hidden from card view

### Image Array Handling
- Default to fixed-column grid layout (responsive column count based on image count and screen width)
- Click/tap navigates to detail view (alternatives: lightbox overlay, expand in place — user configurable)
- When images mixed with other fields: show thumbnail strip at bottom of card
- Other display options (hero image, count badge) available as user configuration

### Timeline Detection
- Trigger: Event-like semantics required (date + title/description + optional status)
- Chronological ordering alone doesn't trigger timeline
- Layout: Vertical left-aligned (dates on left, content on right, vertical line connecting)
- Date display: Absolute dates by default (relative as user option)
- Large timelines (20+): Group by month/year with collapsible sections

### Review/Comment Cards
- Star ratings: Visual star icons (★★★☆☆) as default
- Alternative rating displays (numeric, color badge) available as user options
- Text truncation: Full text up to ~150 chars, truncate longer with "Read more" expand
- Author info: Always show if present (name + avatar)
- Comment threads: Collapse replies by default, show "N replies" that expands

### Claude's Discretion
- Exact grid column counts for responsive breakpoints
- Timeline grouping thresholds (when month/year grouping kicks in)
- Specific star icon styling
- Card layout internal spacing and typography
- Thumbnail strip sizing and overflow behavior

</decisions>

<specifics>
## Specific Ideas

- "Card selection is more based on the kind of information to show" — cards aren't about showing all fields, they're about content-appropriate presentation
- User always has ability to switch between table/card/list/etc via component switcher
- Follow UI/UX best practices for image interaction patterns

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 14-smart-component-selection*
*Context gathered: 2026-02-08*
