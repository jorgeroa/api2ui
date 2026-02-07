# Phase 12: Core Semantic Detection - Context

**Gathered:** 2026-02-07
**Status:** Ready for planning

<domain>
## Phase Boundary

Build the semantic field analysis engine — a pattern library and classifier that detects common field types (price, rating, status, tags, reviews, images, etc.) and assigns confidence scores. This infrastructure feeds Phases 13-16 for smart component selection.

</domain>

<decisions>
## Implementation Decisions

### Pattern Priorities
- All semantic categories at equal priority: media, commerce, engagement, identity
- Include synonym matching for field names ('cost', 'amount', 'fee' match as price patterns)
- Detect composite patterns (array of objects with rating+comment recognized as 'reviews' pattern)
- Target 20-25 patterns with HIGH confidence requirements (balanced breadth/depth)

### Confidence Behavior
- Lower confidence threshold to 75% (more aggressive detection than roadmap's 90%)
- When ambiguous, pick most likely option (not "pick nothing")
- No visual indicator for auto-detected components — apply silently
- Existing component switcher sufficient for overrides when detection is wrong

### Domain Focus
- Work equally well for public REST APIs and internal/custom APIs
- High weight to OpenAPI/Swagger hints when present — trust format/description fields
- Include common industry patterns: currency codes, country codes, UUIDs
- Support common languages for pattern detection: English + Spanish, French, German equivalents

### Validation Approach
- Test with mix of: synthetic data (edge cases), public APIs (variety), user-provided examples
- Public API targets: mix of domains (weather, news, social, commerce)
- Edge cases priority: both ambiguous names ('value', 'data') AND type mismatches (price as "$19.99")
- Include explicit negative test cases — prevent false positives by testing things that should NOT match

### Claude's Discretion
- Specific pattern implementation order within the 20-25 target
- Exact synonym lists per pattern
- Multi-signal weighting algorithm
- Caching strategy for analysis results

</decisions>

<specifics>
## Specific Ideas

- User wants aggressive detection over conservative — 75% threshold vs 90%
- Silent application — no "auto-detected" badges or indicators
- Composite pattern detection is important (array of reviews, not just individual fields)
- i18n for common languages (not English-only field name matching)

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 12-core-semantic-detection*
*Context gathered: 2026-02-07*
