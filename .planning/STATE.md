# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-01)

**Core value:** Any API becomes instantly usable through a visual interface — paste a URL, see your data rendered as a real UI.
**Current focus:** Phase 2 - Advanced Rendering & OpenAPI

## Current Position

Phase: 2 of 4 (Advanced Rendering & OpenAPI)
Plan: 2 of TBD in current phase
Status: In progress
Last activity: 2026-02-01 — Completed 02-02-PLAN.md (OpenAPI spec parser)

Progress: [███░░░░░░░] 30%

## Performance Metrics

**Velocity:**
- Total plans completed: 5
- Average duration: 6 min
- Total execution time: 0.5 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 1 | 3 | 24 min | 8 min |
| 2 | 2 | 6.5 min | 3.25 min |

**Recent Trend:**
- Last 5 plans: 01-02 (4min), 01-03 (15min), 02-01 (3min), 02-02 (3.5min)
- Trend: Phase 2 maintaining fast velocity with TDD and focused tasks

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

**From 01-01 (Project Scaffold):**
- Use Tailwind CSS 4 with Vite plugin (CSS-first, no PostCSS config)
- TypeScript strict mode with noUncheckedIndexedAccess for array safety
- Map<string, FieldDefinition> for schema fields (better ergonomics than Record)
- unknown type for untyped API data (never any)
- CORS detection heuristic using no-cors mode fallback
- Error classes extend Error AND implement AppError interface

**From 01-02 (Schema Inference):**
- Confidence scoring threshold: >=50% presence = medium, 100% = high, <50% = low
- ISO 8601 validation: regex pattern + Date.parse() to reject false positives
- Type merging: use first non-null type when fields have mixed types
- Path notation: $ for root, $.field for top-level, $.field.nested for nested

**From 01-03 (UI Components):**
- CSS-based scrolling instead of react-window (2.x API incompatible)
- CompactValue for non-primitive table cells (inline summary)
- PrimitiveListRenderer for array-of-primitives (separate component)
- Consistent [0 items] format for empty arrays across renderers
- Component registry pattern: array of {match, component} entries

**From 02-01 (Master-detail Navigation):**
- Use Headless UI for accessible Dialog and Disclosure components
- Reset depth to 0 in DetailModal for full depth budget in detail view
- Default Disclosure open at depth=0, closed at deeper levels
- Smart title extraction checks name, title, label, id fields in order

**From 02-02 (OpenAPI Spec Parser):**
- Use @apidevtools/swagger-parser for spec dereference ($ref resolution)
- Extract only GET operations in v1 (read-only API explorer)
- Merge path-level and operation-level parameters with operation precedence
- Default path parameters to required=true regardless of spec declaration
- Extract base URL from servers[0] (3.x) or scheme+host+basePath (2.0)
- TDD pattern: RED (failing tests) → GREEN (implementation) → REFACTOR (cleanup)

### Pending Todos

None yet.

### Blockers/Concerns

**Resolved in Phase 1:**
- CORS strategy: Heuristic detection using no-cors mode fallback
- Library versions: React 19.2, Vite 7.2, Tailwind 4.1, TypeScript 5.9 installed and verified
- Type inference: Multi-sample analysis with confidence scoring
- react-window 2.x: Breaking API, used CSS scrolling alternative

**Research-flagged items for Phase 2:**
- Virtualization library choice needs validation for performance
- ~~OpenAPI spec parsing library selection~~ (RESOLVED: @apidevtools/swagger-parser chosen and implemented)

## Phase 1 Verification

**Result:** PASSED (9/9 must-haves)
**Report:** .planning/phases/01-foundation-core-rendering/01-VERIFICATION.md

Non-blocking items noted:
- react-window installed but unused (CSS scrolling used instead)
- SkeletonDetail.tsx is orphaned (exists but never imported)

## Session Continuity

Last session: 2026-02-01 (Phase 2 execution)
Stopped at: Completed 02-02-PLAN.md (OpenAPI spec parser)
Resume file: None

---
*Last updated: 2026-02-01*
