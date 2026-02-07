# Project State: api2ui

## Project Reference

**Core Value:** Any API becomes instantly usable through a visual interface — paste a URL, see your data rendered as a real UI.

**Current Milestone:** v1.3 Smart Default Selection — Make the rendering engine smarter about picking default components through semantic field analysis.

**Current Focus:** Phase 12 Plan 02 complete, pattern library and detection engine ready

## Current Position

**Milestone:** v1.3 Smart Default Selection
**Phase:** 12 - Core Semantic Detection
**Plan:** 02 of 3 complete
**Status:** In progress
**Last activity:** 2026-02-07 - Completed 12-02-PLAN.md

**Progress:**
```
v1.3 Progress: [====                ] 20% (2/10 plans estimated)

Phase 12: [In Progress] Core Semantic Detection (2/3 plans)
Phase 13: [Pending] Field Importance & Grouping Analysis
Phase 14: [Pending] Smart Component Selection
Phase 15: [Pending] Smart Grouping & Visual Hierarchy
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
- Plans completed: 2 (12-01, 12-02)
- Average duration: 3 min

**Historical Velocity:**
- Total plans completed: 44 (13 v1.0 + 10 v1.1 + 19 v1.2 + 2 v1.3)
- Average duration: 3.0 min
- Total execution time: ~136 min

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

**Before Phase 12 Planning:**
- [x] Review existing imageDetection.ts and primitiveDetection.ts patterns
- [ ] Audit v1.2 localStorage schema for config migration planning
- [ ] Establish baseline performance metrics from v1.2

**Research Flags:**
- Phase 13: Needs user testing for grouping thresholds and field importance weights
- Phase 13: Needs migration testing with actual v1.2 configs
- Phase 15: Needs user testing for accordion vs tabs, section organization

### Blockers/Concerns

**None currently.** Phase 12-02 complete, ready for 12-03 (integration).

### Quick Tasks Completed

| # | Description | Date | Commit | Directory |
|---|-------------|------|--------|-----------|
| 001 | Fix CORS error on second fetch (bracket encoding) | 2026-02-06 | b238e76 | [001-fix-cors-error-second-fetch](./quick/001-fix-cors-error-second-fetch/) |
| 002 | Add api URL parameter for auto-load and sync | 2026-02-07 | d4d73ce | [002-add-api-url-parameter-for-auto-load-and](./quick/002-add-api-url-parameter-for-auto-load-and/) |
| 003 | Improve configure mode attribute editing UX | 2026-02-07 | 1962f9f | [003-improve-configure-mode-attribute-editing](./quick/003-improve-configure-mode-attribute-editing/) |

## Session Continuity

**Last Session (2026-02-07):**
- Completed Plan 12-02: Pattern library and detection engine
- Created 22 semantic patterns across 5 categories (Commerce, Identity, Media, Engagement, Temporal)
- Implemented detectSemantics and detectCompositeSemantics functions
- Public API exported from src/services/semantic/index.ts

**This Session:**
- Executed 12-02-PLAN.md
- 2 tasks completed, 2 commits
- Duration: 4 min

**Next Steps:**
1. Execute `/gsd:execute-phase 12` to continue with Plan 03
2. Plan 03: Integration with schema enhancement and DynamicRenderer
3. Then Phase 13: Field Importance & Grouping Analysis

**Quick Start Commands:**
```bash
# Continue Phase 12
/gsd:execute-phase 12

# Check current plan status
cat .planning/phases/12-core-semantic-detection/12-02-SUMMARY.md

# Test detection engine
npx tsx -e "import { detectSemantics } from './src/services/semantic'; console.log(detectSemantics('test.price', 'price', 'number', [19.99]))"
```

---
*State updated: 2026-02-07 after 12-02-PLAN.md completion*
*Next: Continue Phase 12 with Plan 03*
