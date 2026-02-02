# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-01)

**Core value:** Any API becomes instantly usable through a visual interface — paste a URL, see your data rendered as a real UI.
**Current focus:** Phase 3 - Configuration System

## Current Position

Phase: 3 of 4 (Configuration System)
Plan: 4 of 5 in current phase
Status: In progress
Last activity: 2026-02-02 — Completed 03-04-PLAN.md (Component Overrides)

Progress: [████████░░] 80%

## Performance Metrics

**Velocity:**
- Total plans completed: 10
- Average duration: 4.2 min
- Total execution time: 0.70 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 1 | 3 | 24 min | 8 min |
| 2 | 3 | 9.5 min | 3.2 min |
| 3 | 4 | 12 min | 3 min |

**Recent Trend:**
- Last 5 plans: 02-03 (3min), 03-01 (3.5min), 03-02 (2.5min), 03-03 (3min), 03-04 (3min)
- Trend: Phase 3 maintaining excellent velocity, consistent 3-min average

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

**From 02-03 (OpenAPI Parameter Forms):**
- Schema-to-input mapping: enum→select, boolean→checkbox, number→number, date→date, email→email, uri→url, default→text
- Spec URL heuristic: ends with /openapi.json, /swagger.json, /api-docs, or contains 'swagger'/'openapi'
- Parameter values stored as Record<string, string> keyed by parameter name
- Filter parameters: show only query and path (hide header and cookie)
- Required params prominent, optional params in collapsible Disclosure
- Clear parameter values when switching operations

**From 03-01 (Config Store + Theme CSS):**
- Zustand persist middleware for localStorage persistence
- Deep merge strategy for hydration to preserve nested objects
- CSS custom properties pattern: `--color-*`, `--spacing-*`, `--font-*`, `--border-*`
- Endpoint-specific overrides stored separately, merged at application time
- Theme presets: light, dark, compact, spacious

**From 03-02 (Configure Toggle + Panel + Theme Applier):**
- Floating gear button in bottom-right (z-40) for Configure/View mode toggle
- Panel slides from right (384px width) using Headless UI Dialog
- Blue top bar + content ring for configure mode visual feedback
- ThemeApplier syncs CSS variables via useEffect (invisible component)
- Endpoint key strategy: prefer operationId, fallback to method-path

**From 03-03 (Field Visibility + Labels):**
- Field path notation: $[].fieldName for array items, $.fieldName for object fields
- Configure mode shows all fields (dim hidden ones), View mode filters out hidden fields
- contentEditable for inline label editing with suppressContentEditableWarning
- FieldControls wrapper pattern: renders children only in View mode, adds overlay in Configure mode
- Stable sort for field ordering preserves original order for fields with same/no order value

**From 03-04 (Component Overrides):**
- URL detection: /^https?:\/\//i regex for link/image render modes
- Date detection: ISO 8601 pattern OR field name contains date keywords (date, created, updated, timestamp, time, at)
- Component preview scaling: transform: scale(0.25) with origin-top-left for array component previews
- Render modes stored in componentType field (unified override system)
- Override resolution: DynamicRenderer reads fieldConfigs[path].componentType and passes to getComponent(schema, override)
- Component type badge shown in Configure mode (absolute positioned, top-right, blue background)

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

## Phase 2 Verification

**Result:** PASSED (15/15 must-haves)
**Report:** .planning/phases/02-advanced-rendering-openapi/02-VERIFICATION.md

Human verification recommended:
- OpenAPI spec URL end-to-end flow with live spec
- Modal interactions (Esc, outside click)
- Parameter form rendering with diverse input types
- Deep nesting behavior with complex data

## Session Continuity

Last session: 2026-02-02 (Phase 3 execution)
Stopped at: Completed 03-04-PLAN.md
Resume file: None

---
*Last updated: 2026-02-02*
