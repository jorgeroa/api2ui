# Phase 13: Field Importance & Grouping Analysis - Context

**Gathered:** 2026-02-07
**Status:** Ready for planning

<domain>
## Phase Boundary

Build an analysis layer that scores field importance and detects logical groupings. This informs how fields are displayed (primary/secondary/tertiary) and organized (sections/clusters). The analysis runs once per API response and feeds into the rendering layer.

</domain>

<decisions>
## Implementation Decisions

### Importance Scoring
- Use proposed weights: name pattern (40%), visual richness (25%), data presence (20%), position (15%)
- **Make weights configurable** for future tuning without code changes
- Threshold-based primary designation: any field above threshold is primary (no fixed limit)
- Tier thresholds: >=80% = primary, 50-79% = secondary, <50% = tertiary
- Metadata fields (IDs, _prefixed, internal timestamps) forced to tertiary regardless of other signals
- **All scoring rules in config** for easy adjustment

### Grouping Triggers
- Minimum 8+ fields before grouping analysis runs
- Minimum 3+ fields to form a group (avoid tiny groups)
- Both prefix matching (billing_*) AND semantic clustering (email + phone + address → "Contact")
- Skip grouping entirely if it would leave 1-2 orphan fields

### Group Naming
- Title case formatting, no prefix shown (billing_* → "Billing")
- Derive labels from semantics with generic fallback ("Related Fields" when no clear name)
- Strip common suffixes: Info, Details, Data, Config, Settings, Options
- Inline editing for group names (click header to rename)

### De-emphasis Display
- Tertiary fields in collapsed "More Fields" section
- Show count hint: "More Fields (5)"
- Persist expanded/collapsed state per-API
- Users can promote any de-emphasized field via override

### Claude's Discretion
- Exact config file format and location
- Semantic clustering algorithm details
- Performance optimizations for caching
- Specific suffix list to strip

</decisions>

<specifics>
## Specific Ideas

- User emphasized wanting all decisions (weights, thresholds, rules) in an easy-to-change config
- Inline editing for group names was preferred over configure mode editing
- "More Fields" preferred over "Technical Details" for tertiary section name

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 13-field-importance-grouping-analysis*
*Context gathered: 2026-02-07*
