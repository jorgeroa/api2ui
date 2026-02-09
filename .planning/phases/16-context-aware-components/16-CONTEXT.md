# Phase 16: Context-Aware Components - Context

**Gathered:** 2026-02-09
**Status:** Ready for planning

<domain>
## Phase Boundary

Specialized rendering for individual field values based on semantic type detection. Status fields render as badges, tags as chips, ratings as stars, prices with currency formatting, and dates with locale-aware display. These enhance how already-detected semantic types are *displayed* — the detection itself is complete (Phase 12).

</domain>

<decisions>
## Implementation Decisions

### Status badge design
- Semantic color mapping: green for positive (active, success, published, verified), red for negative (error, failed, deleted, banned), yellow for in-progress (pending, processing, review), gray for neutral/unknown
- Pill badge shape with colored background (like GitHub labels)
- Boolean fields (is_active, enabled, verified) also get badge treatment: true → green check badge, false → gray/red X badge
- Unknown/low-confidence statuses fall back to gray neutral badge (never plain text)

### Rating & price display
- Star ratings show filled/empty stars with numeric value beside them (e.g., ★★★★☆ (4.2))
- Half-star precision supported (3.5 → 3 full + 1 half + 1 empty)
- Currency detection: look for sibling currency fields (currency_code, currency) in the same object, fall back to $ if none found
- Price formatting uses Intl.NumberFormat with navigator.language (locale-aware: 1.234,50 in Germany, 1,234.50 in US)

### Date formatting behavior
- No relative dates ("2 days ago") — absolute format only for now
- Future consideration: user configuration for relative vs absolute (out of scope for this phase)
- Show time component when present in the data (if the ISO string includes time, display it)
- Always show year — "Feb 7, 2026" not "Feb 7"
- Use Intl.DateTimeFormat with navigator.language for locale-aware formatting (DD/MM/YYYY in UK, etc.)

### Tag chips appearance
- Monochrome/neutral style — all chips use same muted background (no color coding)
- Render as chips both inline (within detail view fields) and standalone (primitive array rendering)
- Truncate with "+N more" expand link when many tags — clicking reveals all
- Copy on click: clicking a chip copies its value to clipboard

### Claude's Discretion
- Exact color hex values for status badge semantic colors (green/red/yellow/gray shades)
- Star icon implementation (SVG vs unicode vs icon library)
- Number of chips shown before truncation cutoff
- Copy-to-clipboard feedback mechanism (toast, tooltip, etc.)
- How to detect time presence in date strings (ISO parsing strategy)

</decisions>

<specifics>
## Specific Ideas

- Status badges should feel like GitHub labels — pill-shaped with colored backgrounds
- Boolean badge treatment makes scanning tables much faster than raw true/false
- Currency detection should look at sibling fields in the same object for currency_code/currency hints
- Chip copy-on-click is a utility feature — useful for copying IDs, codes, and tag values quickly

</specifics>

<deferred>
## Deferred Ideas

- Relative date formatting ("2 days ago") with user-configurable toggle — future configuration phase
- Barcode/QR code rendering for detected barcode values (noted in Phase 14.1-fix)
- Meta/split view improvements for objects with 4 fields (noted in Phase 14.1-fix)

</deferred>

---

*Phase: 16-context-aware-components*
*Context gathered: 2026-02-09*
