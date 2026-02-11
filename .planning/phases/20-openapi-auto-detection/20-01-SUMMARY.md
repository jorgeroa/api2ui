---
phase: 20-openapi-auto-detection
plan: 01
subsystem: openapi-parser
tags: [openapi, authentication, security-schemes, tdd]

requires:
  - 19-02-auth-panel-integration

provides:
  - Security scheme extraction from OpenAPI 3.x specs
  - Security scheme extraction from Swagger 2.0 specs
  - Mapping of OpenAPI security types to api2ui auth types
  - ParsedSecurityScheme interface and type system

affects:
  - 20-02-openapi-ui-integration

tech-stack:
  added: []
  patterns:
    - Pure mapping functions for security scheme conversion
    - TDD with RED-GREEN-REFACTOR cycle
    - Type-safe discrimination between OpenAPI versions

key-files:
  created:
    - src/services/openapi/security-mapper.ts
    - src/services/openapi/__tests__/security-mapper.test.ts
  modified:
    - src/services/openapi/types.ts
    - src/services/openapi/parser.ts
    - src/services/openapi/__tests__/parser.test.ts

decisions:
  - name: "Map unsupported schemes to null with reason"
    rationale: "OAuth2, OpenID Connect, and cookie-based auth require browser flows or are insecure. Return null with descriptive reason instead of throwing errors."
    alternatives: ["Throw error", "Skip unsupported schemes"]
    impact: "UI can show helpful messages for unsupported auth types"

  - name: "Ignore bearerFormat field"
    rationale: "bearerFormat is informational only (e.g., 'JWT'). All bearer tokens are handled the same way in api2ui."
    alternatives: ["Parse and validate bearerFormat", "Store as metadata"]
    impact: "Simpler implementation, no functional difference"

  - name: "Generate description from scheme name if missing"
    rationale: "Fallback to scheme name ensures every security scheme has a human-readable label for UI display."
    alternatives: ["Leave description empty", "Use hardcoded defaults"]
    impact: "Better UX when specs lack descriptions"

metrics:
  duration: "2 min"
  files-changed: 5
  tests-added: 19
  completed: "2026-02-10"
---

# Phase 20 Plan 01: Security Scheme Extraction Summary

**One-liner:** TDD implementation of OpenAPI security scheme parser with mapping to api2ui auth types (apiKey header/query, bearer, basic).

## What Was Built

Extended the OpenAPI parser to extract and map security schemes from specs to api2ui authentication types.

**New types:**
- `ParsedSecurityScheme` interface with name, authType, metadata, and description
- Extended `ParsedSpec` with `securitySchemes: ParsedSecurityScheme[]`

**New function:**
- `mapSecuritySchemes()` - Pure function that converts OpenAPI security scheme objects to api2ui auth types

**Supported mappings:**
- OpenAPI 3.x `apiKey` with `in: header` → `authType: 'apiKey'` (metadata: headerName)
- OpenAPI 3.x `apiKey` with `in: query` → `authType: 'queryParam'` (metadata: paramName)
- OpenAPI 3.x `http` with `scheme: bearer` → `authType: 'bearer'`
- OpenAPI 3.x `http` with `scheme: basic` → `authType: 'basic'`
- Swagger 2.0 `type: basic` → `authType: 'basic'` (no scheme field in Swagger 2.0)
- Unsupported: oauth2, openIdConnect, apiKey with in:cookie → `authType: null` with reason

**Parser integration:**
- `extractSecuritySchemes()` helper reads from `components.securitySchemes` (OpenAPI 3.x) or `securityDefinitions` (Swagger 2.0)
- Calls `mapSecuritySchemes()` and returns result
- Empty array if no security schemes present

## TDD Execution

Followed RED-GREEN-REFACTOR cycle:

1. **RED** - Created 16 failing tests in security-mapper.test.ts covering all scheme types
2. **GREEN** - Implemented types, mapper, and parser integration to pass all tests
3. **REFACTOR** - (none needed - implementation was clean on first pass)

**Test coverage:**
- 16 security-mapper tests (OpenAPI 3.x, Swagger 2.0, edge cases)
- 3 new parser integration tests (extraction from both spec versions)
- All 449 existing tests still pass (no regressions)

## Verification Results

✅ `npx vitest run src/services/openapi/__tests__/security-mapper.test.ts` - 16/16 passed
✅ `npx vitest run src/services/openapi/__tests__/parser.test.ts` - 16/16 passed
✅ `npx vitest run` - 449/449 passed
✅ `npx tsc --noEmit` - No TypeScript errors

## Deviations from Plan

None - plan executed exactly as written.

## Next Phase Readiness

**Blockers:** None

**Concerns:** None

**Recommendations:**
- Next plan (20-02) should consume `ParsedSpec.securitySchemes` to pre-populate auth panel
- UI should display unsupported schemes with their reason strings
- Consider adding support for multiple active schemes (some APIs allow fallback auth methods)

## Commits

| Task | Commit | Message |
|------|--------|---------|
| RED phase | af50553 | test(20-01): add failing tests for security scheme mapping |
| GREEN phase (types + mapper) | eb8fe25 | feat(20-01): implement security scheme mapping |
| GREEN phase (parser integration) | 36acd54 | feat(20-01): integrate security scheme extraction into parser |

**Files changed:**
- `src/services/openapi/types.ts` - Added ParsedSecurityScheme interface, extended ParsedSpec
- `src/services/openapi/security-mapper.ts` - Pure mapping function
- `src/services/openapi/parser.ts` - Integration with extractSecuritySchemes helper
- `src/services/openapi/__tests__/security-mapper.test.ts` - Comprehensive test coverage
- `src/services/openapi/__tests__/parser.test.ts` - Extended with security scheme tests

**Total changes:** 5 files, 254 insertions, 19 new tests
