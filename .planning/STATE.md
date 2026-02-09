# Project State: api2ui

## Project Reference

**Core Value:** Any API becomes instantly usable through a visual interface — paste a URL, see your data rendered as a real UI.

**Current Milestone:** v1.3 Smart Default Selection — Make the rendering engine smarter about picking default components through semantic field analysis.

**Current Focus:** Phase 14.1 complete and verified, ready for Phase 15 planning

## Current Position

**Milestone:** v1.3 Smart Default Selection
**Phase:** 15 - Smart Grouping & Visual Hierarchy
**Plan:** 1 of 2 complete
**Status:** In progress
**Last activity:** 2026-02-08 - Completed 15-01-PLAN.md

**Progress:**
```
v1.3 Progress: [=================   ] 91% (10/11 plans estimated)

Phase 12: [Complete] Core Semantic Detection (3/3 plans)
Phase 13: [Complete] Field Importance & Grouping Analysis (2/2 plans)
Phase 14: [Complete] Smart Component Selection (3/3 plans)
Phase 14.1: [Complete] Smart Object & Primitive Selection (2/2 plans)
Phase 15: [In Progress] Smart Grouping & Visual Hierarchy (1/2 plans)
Phase 16: [Pending] Context-Aware Components
```

## Performance Metrics

**v1.2 Completion:**
- Phases completed: 3 (Phases 9-11)
- Plans executed: 19 total
- Average plan duration: ~3.5 min
- Shipped: 2026-02-07

**v1.3 Targets:**
- Phases planned: 5 (Phases 12-16)
- Requirements: 28 total across 6 categories
- Depth: Quick (aggressive compression)
- Coverage: 100% (28/28 requirements mapped)

**v1.3 Progress:**
- Plans completed: 10 (12-01, 12-02, 12-03, 13-01, 13-02, 14-01, 14-02, 14.1-01, 14.1-02, 15-01)
- Average duration: 3.8 min

**Historical Velocity:**
- Total plans completed: 52 (13 v1.0 + 10 v1.1 + 19 v1.2 + 10 v1.3)
- Average duration: 3.3 min
- Total execution time: ~159 min

## Milestone History

- v1.2 Smart Parameters & Layout System — Shipped 2026-02-07 (3 phases, 19 plans, 27/27 requirements)
  - Archive: .planning/milestones/v1.2-ROADMAP.md
  - Requirements: .planning/milestones/v1.2-REQUIREMENTS.md
- v1.1 UX Polish — Shipped 2026-02-05 (4 phases, 10 plans, 18/18 requirements)
  - Archive: .planning/milestones/v1.1-ROADMAP.md
  - Requirements: .planning/milestones/v1.1-REQUIREMENTS.md
- v1.0 MVP — Shipped 2026-02-02 (4 phases, 13 plans, 20/20 requirements)
  - Archive: .planning/milestones/v1.0-ROADMAP.md
  - Requirements: .planning/milestones/v1.0-REQUIREMENTS.md

## Accumulated Context

### Roadmap Evolution

- Phase 14.1 inserted after Phase 14: Smart Object & Primitive Selection (URGENT) — Phase 14 only implemented smart selection for arrays of objects. Objects always default to "detail" and primitive arrays always default to "primitive-list" regardless of semantic content. Discovered during Phase 14 UAT when user profiles rendered as flat detail views instead of hero/profile layout.

### Architecture Decisions

**v1.3 Smart Defaults Approach:**
- Zero-dependency heuristic pattern matching (extending imageDetection.ts and primitiveDetection.ts)
- Data transformation pipeline: API Response → Schema Inference → Field Analysis → Enriched Schema → DynamicRenderer
- Analysis metadata cached in appStore (runs once per API response, <100ms overhead target)
- Override precedence: User override (configStore) > Smart default (metadata) > Type-based default
- Feature flag for gradual rollout and kill switch
- **Updated:** Confidence threshold lowered to 75% per user decision (was 90% in roadmap)

**Phase Structure Rationale:**
- Phase 12: Build analysis layer independently (testable in isolation, addresses false positive risk early)
- Phase 13: Add importance scoring and grouping analysis (still pre-integration)
- Phase 14: Integrate smart selection with DynamicRenderer (first user-visible change, conservative rollout)
- Phase 15: Add smart grouping UI (highest UX risk, build escape hatches first)
- Phase 16: Polish with context-aware components (optional enhancements)

**Critical Risks Identified:**
1. False positive component selection (SEVERITY: CRITICAL) - Prevention: multi-signal detection, >=75% confidence threshold
2. Breaking v1.2 configurations (SEVERITY: CRITICAL) - Prevention: config versioning, explicit beats implicit
3. Auto-grouping creates worse UX (SEVERITY: CRITICAL) - Prevention: conservative thresholds, "show all" escape hatch
4. Performance degradation (SEVERITY: MODERATE) - Prevention: cache analysis, <100ms budget
5. Override conflicts (SEVERITY: MODERATE) - Prevention: three-tier state model, sticky overrides

### Key Decisions from v1.3

| Decision | Rationale | Phase |
|----------|-----------|-------|
| HIGH confidence at 0.75 | User chose aggressive detection over conservative 0.90 | 12-01 |
| Name patterns best-match-wins | Avoid inflating scores from multilingual synonyms | 12-01 |
| SemanticMetadata inline in schema.ts | Avoid circular dependency with semantic/types.ts | 12-01 |
| Cache key uses first 3 values | Balance cache hits vs detection accuracy | 12-01 |
| 22 patterns (21 standard + 1 composite) | Added temporal patterns to complete SemanticCategory coverage | 12-02 |
| detectSemantics returns max 3 alternatives | Avoid noise while providing fallback options | 12-02 |
| getBestMatch only returns high confidence | Smart defaults only apply at >=0.75 threshold | 12-02 |
| reviewsPattern uses CompositePattern | requiredFields for rating+comment structure detection | 12-02 |
| UUIDv4 format required for high confidence | Arbitrary UUID-like strings don't pass validation | 12-03 |
| Word boundary patterns are strict | product_price doesn't match price pattern (intentional) | 12-03 |
| Importance weights: 40/25/20/15 | namePattern > visualRichness > dataPresence > position | 13-01 |
| Primary indicator pattern contains-match | Match product_title not just word boundaries (underscore is word char) | 13-01 |
| Tier thresholds: 80%/50% | >=80% primary, 50-79% secondary, <50% tertiary | 13-01 |
| Metadata fields forced tertiary | id, _prefix, foreign keys, timestamps de-emphasized always | 13-01 |
| Position uses logarithmic decay | Early fields slightly favored without over-weighting | 13-01 |
| Hybrid grouping: prefix first, semantic second | Avoids conflict where contact_* fields would be both prefix AND semantic grouped | 13-02 |
| Orphan prevention skips grouping | 1-2 ungrouped fields triggers no grouping (better UX than lonely orphans) | 13-02 |
| Group labels strip common suffixes | billing_info_ → "Billing" (info/details/data/config suffixes removed) | 13-02 |
| Priority order: review > gallery > timeline > card-vs-table | Specific patterns checked before general heuristics | 14-01 |
| Confidence threshold 0.75 for smart defaults | Only high-confidence selections trigger smart component choice | 14-01 |
| Content richness trumps field count | Rich content (description/reviews/image/title) favors cards even with higher field count | 14-01 |
| Visible field count excludes tertiary | Only primary + secondary tiers counted for card vs table decision | 14-01 |
| Timeline requires event semantics | Date + title/description needed, not just chronological data | 14-01 |
| Three-tier precedence: override > smart > fallback | User override always wins, smart defaults require 0.75 confidence | 14-02 |
| CardListRenderer tier filtering | Primary + secondary fields shown in cards, tertiary hidden | 14-02 |
| Analysis cache stored per path | ComponentSelection + SemanticMetadata + ImportanceScore cached by path | 14-02 |
| Hero image uses all fields | Image detection unaffected by tier filtering | 14-02 |
| Profile pattern requires name + 2+ contacts | Single contact too ambiguous, 2+ ensures high confidence hero selection | 14.1-01 |
| Complex pattern threshold at 3+ nested | 2 nested structures normal, 3+ indicates intentional complexity for tabs | 14.1-01 |
| Split pattern requires exactly 1 primary content | Multiple primary content fields suggest different layout (cards/tabs) | 14.1-01 |
| Chips pattern uses data-driven value analysis | Semantic tags/status (0.9), value length heuristics (0.8) fallback | 14.1-01 |
| Object field semantics use $.fieldName path | Consistent with JSON path conventions ($[].fieldName for array items) | 14.1-01 |
| Root path $ included in object analysis | Single-object APIs (e.g., /users/1) ARE the meaningful entity, not wrappers | 14.1-fix |
| Profile contact detection uses field-name fallback | Semantic detection may not reach high confidence for phone extensions or URLs without http | 14.1-fix |
| Primitive arrays analyzed at parent path | Array semantics detected on array itself ($.tags) not items | 14.1-02 |
| Object sample values from single instance | Object data is plain object, not array like array-of-objects | 14.1-02 |
| Drill-down paths normalized for cache lookup | `$[0].tags` → `$[].tags` so indexed paths match generic analysis cache | 14.1-fix |
| Image grid pattern for primitive URL arrays | 50%+ image URLs → grid at 0.85; checked before chips (URLs are long strings) | 14.1-fix |
| Meta/barcode improvements deferred to Phase 16 | Split needs 5+ fields (Meta has 4), barcode rendering is context-aware polish | 14.1-fix |
| Grouping results cached in analysis pipeline | analyzeFields() grouping now persisted alongside semantics/importance/selection | 15-01 |
| Three-tier visual hierarchy for fields | Primary (large/bold), secondary (normal), tertiary (small/muted) styling | 15-01 |
| FieldRow handles primitives only | Nested/image fields continue using existing DetailRenderer logic | 15-01 |

### Key Decisions from v1.2

| Decision | Rationale | Phase |
|----------|-----------|-------|
| 5-digit integers as string | Too ambiguous - could be ID, ZIP, code | 09-02 |
| ZIP/coordinates require name hints | Prevent false positives without clear intent | 09-02 |
| Check ZIP before number | Prevent 5-digit ZIP misdetection as number | 09-02 |
| All parameter groups collapsed by default | Reduces visual clutter, users expand what they need | 09-04 |
| Strip common suffixes from group names | filter/params/options/config/settings removed for cleaner labels | 09-04 |
| Default layout is 'topbar' | Most user-friendly default per research findings | 10-01 |
| Mobile breakpoint at 767px max-width | Matches Tailwind md: breakpoint (768px min-width) for consistency | 10-01 |
| shadcn/ui new-york style | Cleaner, more modern aesthetic | 11-01 |
| Enum/boolean inputs trigger auto-fetch | Quick inputs with constrained values auto-fetch with debounce | 11-06 |
| Text inputs require Apply button | Manual inputs need explicit submission to prevent API spam | 11-06 |
| 300ms debounce for quick inputs | Balances responsiveness with API call throttling | 11-06 |
| Filter removal triggers immediate re-fetch | clearValue + handleParameterSubmit pattern for instant feedback | 11-07 |

### Active TODOs

**Before Phase 13 Planning:**
- [ ] Audit v1.2 localStorage schema for config migration planning
- [ ] Establish baseline performance metrics from v1.2

**Research Flags:**
- Phase 13: Needs user testing for grouping thresholds and field importance weights
- Phase 13: Needs migration testing with actual v1.2 configs
- Phase 15: Needs user testing for accordion vs tabs, section organization

### Blockers/Concerns

**Active concerns for Phase 14:**
1. **Tier threshold validation needed:** 80%/50% thresholds not tested with real API responses yet. May need adjustment based on user testing in Phase 14.
2. **Visual richness mapping incomplete:** Only 9 of 22 semantic categories mapped to richness scores. Consider completing in Phase 14 if needed.
3. **Position weight tuning:** 15% weight may need adjustment based on real-world API response quality.
4. **Grouping threshold validation:** 8+ fields threshold and 3+ fields per group not validated with real data yet.

### Quick Tasks Completed

| # | Description | Date | Commit | Directory |
|---|-------------|------|--------|-----------|
| 001 | Fix CORS error on second fetch (bracket encoding) | 2026-02-06 | b238e76 | [001-fix-cors-error-second-fetch](./quick/001-fix-cors-error-second-fetch/) |
| 002 | Add api URL parameter for auto-load and sync | 2026-02-07 | d4d73ce | [002-add-api-url-parameter-for-auto-load-and](./quick/002-add-api-url-parameter-for-auto-load-and/) |
| 003 | Improve configure mode attribute editing UX | 2026-02-07 | 1962f9f | [003-improve-configure-mode-attribute-editing](./quick/003-improve-configure-mode-attribute-editing/) |

## Session Continuity

**Last Session (2026-02-08):**
- Completed Phase 15 Plan 01: Cache grouping & shared FieldRow
- Added grouping to analysis cache (was computed but discarded)
- Created FieldRow component with three-tier visual hierarchy
- All tests pass (415), build succeeds

**This Session:**
- Phase 15 Plan 01 execution: 2 tasks, 2 commits (fdf3d4c, 8ab2885)
- Duration: 3 minutes
- Zero deviations - straightforward wiring change

**Phase 15 Plan 01 Complete:**
- ✅ Grouping data cached alongside semantics/importance/selection
- ✅ FieldRow component with tier-based styling (primary/secondary/tertiary)
- ✅ getFieldStyles helper for Plan 02 consumption

**Smart Selection System Status:**
- ✅ Semantic detection (22 patterns covering all categories)
- ✅ Field importance scoring (4 signals: name, richness, presence, position)
- ✅ Grouping analysis (hybrid prefix + semantic with orphan prevention)
- ✅ Component selection heuristics (9 patterns: review, gallery, timeline, card-vs-table, profile, complex, split, chips, image-grid)
- ✅ Analysis pipeline integration (useSchemaAnalysis populates cache for all schema kinds)
- ✅ Three-tier precedence rendering (override > smart > fallback)
- ✅ Drill-down path normalization (indexed → generic for cache lookup)
- ✅ **NEW: Grouping results cached in analysis pipeline**
- ✅ **NEW: Three-tier visual hierarchy foundation (FieldRow component)**

**Ready for Phase 15 Plan 02:**
- Grouped accordion rendering with cached grouping data
- FieldRow component ready for field rendering within groups
- Visual hierarchy styling available via getFieldStyles

**Quick Start Commands:**
```bash
# Run all analysis tests
npm test src/services/analysis

# Test analyzeFields API manually
npx tsx -e "import { analyzeFields } from './src/services/analysis'; import type { FieldInfo } from './src/services/analysis/types'; const fields: FieldInfo[] = [{ path: 'billing_address', name: 'billing_address', semanticCategory: 'address', sampleValues: ['123 Main St'], position: 0, totalFields: 10 }, { path: 'billing_city', name: 'billing_city', semanticCategory: null, sampleValues: ['NYC'], position: 1, totalFields: 10 }, { path: 'billing_zip', name: 'billing_zip', semanticCategory: null, sampleValues: ['10001'], position: 2, totalFields: 10 }]; const result = analyzeFields(fields); console.log(JSON.stringify({ groups: result.grouping.groups.length, ungrouped: result.grouping.ungrouped.length }, null, 2))"

# Check importance scoring
npx tsx -e "import { calculateImportance } from './src/services/analysis'; import type { FieldInfo } from './src/services/analysis/types'; const field: FieldInfo = { path: 'product.title', name: 'title', semanticCategory: 'title', sampleValues: ['Product A'], position: 0, totalFields: 10 }; console.log(calculateImportance(field))"

# Check grouping detection
npx tsx -e "import { analyzeGrouping } from './src/services/analysis'; import type { FieldInfo } from './src/services/analysis/types'; const fields: FieldInfo[] = Array(8).fill(null).map((_, i) => ({ path: \`billing_field\${i}\`, name: \`billing_field\${i}\`, semanticCategory: null, sampleValues: ['val'], position: i, totalFields: 8 })); console.log(analyzeGrouping(fields))"
```

---
*State updated: 2026-02-08 after Phase 15 Plan 01 completion*
*Next: /gsd:execute-phase 15 02 (grouped accordion rendering)*
