# Phase 9: URL Parsing & Type Inference Foundation - Context

**Gathered:** 2026-02-05
**Status:** Ready for planning

<domain>
## Phase Boundary

Parse raw URL query strings into smart, editable form fields with type inference, parameter grouping, and persistence. Users paste a URL and see parameters as appropriate input types. Array parameters work in bracket and repeated key formats. Related parameters auto-group into collapsible sections. Values persist per endpoint.

</domain>

<decisions>
## Implementation Decisions

### Type Inference Presentation
- Subtle icon next to input (calendar for dates, @ for emails, link icon for URLs, etc.)
- Dropdown on type icon to change input type when inference is wrong
- Never show confidence levels — just apply the inferred type
- Plain text input as fallback when type can't be inferred

### Parameter Grouping UX
- All groups collapsed by default
- Accordion panels with chevron indicators for visual treatment
- Single level grouping only (no nested accordions)
- Ungrouped parameters show at top, grouped sections follow

### Persistence Behavior
- Persist on input change (autosave behavior)
- Per-field clear (X button) plus "Reset all" option
- Silent persistence — no "Saved" indicators
- Last write wins for multi-tab scenarios

### Edge Cases & Errors
- Inline error message when URL can't be parsed
- Auto-fix encoding issues but show warning about corrections
- Show all duplicate non-array values with warning about ambiguity
- Empty parameters display as empty input fields (not hidden)

### Claude's Discretion
- Exact threshold values for type inference confidence
- Debounce timing for autosave persistence
- Specific icon choices for each detected type
- Accordion animation timing and easing

</decisions>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches for the implementation details.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 09-url-parsing-type-inference*
*Context gathered: 2026-02-05*
