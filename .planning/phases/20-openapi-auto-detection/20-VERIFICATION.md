---
phase: 20-openapi-auto-detection
verified: 2026-02-10T19:42:00Z
status: gaps_found
score: 16/17 must-haves verified
gaps:
  - truth: "When loading an OpenAPI spec with securitySchemes, the auth panel shows detected auth requirements"
    status: partial
    reason: "detectedAuth prop is passed in centered layout but NOT in sidebar layout (multi-endpoint specs)"
    artifacts:
      - path: "src/App.tsx"
        issue: "Line 209 (sidebar layout) missing detectedAuth prop, while line 311 (centered layout) has it"
    missing:
      - "Add detectedAuth={parsedSpec?.securitySchemes} to URLInput at line 209 in sidebar layout"
---

# Phase 20: OpenAPI Auto-Detection Verification Report

**Phase Goal:** OpenAPI specs automatically detect and pre-populate authentication requirements

**Verified:** 2026-02-10T19:42:00Z

**Status:** gaps_found

**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

#### Plan 20-01: Parser and Mapper (TDD Implementation)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | parseOpenAPISpec returns securitySchemes array for OpenAPI 3.x specs with components.securitySchemes | ✓ VERIFIED | parser.ts lines 39, 217-218 extract and map schemes. Test passes. |
| 2 | parseOpenAPISpec returns securitySchemes array for Swagger 2.0 specs with securityDefinitions | ✓ VERIFIED | parser.ts lines 220-222 handle Swagger 2.0. Test passes. |
| 3 | apiKey with in:header maps to authType 'apiKey' with headerName metadata | ✓ VERIFIED | security-mapper.ts lines 36-42. Test: "maps apiKey in header" passes. |
| 4 | apiKey with in:query maps to authType 'queryParam' with paramName metadata | ✓ VERIFIED | security-mapper.ts lines 45-51. Test: "maps apiKey in query" passes. |
| 5 | http scheme:bearer maps to authType 'bearer' | ✓ VERIFIED | security-mapper.ts lines 69-75. Test: "maps http scheme bearer" passes. |
| 6 | http scheme:basic maps to authType 'basic' | ✓ VERIFIED | security-mapper.ts lines 78-84. Test: "maps http scheme basic" passes. |
| 7 | Swagger 2.0 type:basic maps to authType 'basic' | ✓ VERIFIED | security-mapper.ts lines 89-95. Test: "maps type basic" passes. |
| 8 | oauth2 and openIdConnect map to authType null with unsupported reason | ✓ VERIFIED | security-mapper.ts lines 99-116. Tests pass for both types. |
| 9 | apiKey with in:cookie maps to authType null (unsupported) | ✓ VERIFIED | security-mapper.ts lines 55-61. Test: "maps apiKey in cookie" passes. |
| 10 | Specs without security schemes return empty securitySchemes array | ✓ VERIFIED | parser.ts line 39 returns securitySchemes field. Test: "returns empty securitySchemes" passes. |

**Score (Plan 20-01):** 10/10 truths verified

#### Plan 20-02: UI Integration

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | When loading an OpenAPI spec with securitySchemes, the auth panel shows detected auth requirements | ⚠️ PARTIAL | **GAP**: App.tsx line 311 passes detectedAuth in centered layout, but line 209 (sidebar layout) does NOT. Multi-endpoint specs won't detect auth. |
| 2 | Detected auth type is pre-selected in AuthTypeSelector dropdown | ✓ VERIFIED | AuthPanel.tsx lines 39-49 auto-select first supported scheme when no existing credentials. |
| 3 | Detected metadata pre-populates CredentialForm fields (header name, param name) | ✓ VERIFIED | CredentialForm.tsx lines 72, 74 use detectedMetadata for headerName/paramName defaults. Placeholders at lines 215, 279. |
| 4 | Unsupported schemes (OAuth 2.0, OpenID Connect) display a visible warning message | ✓ VERIFIED | AuthPanel.tsx lines 74-90 render amber warning box with AlertTriangle icon and scheme descriptions. |
| 5 | Auth panel auto-expands when spec has security schemes detected | ✓ VERIFIED | URLInput.tsx lines 81-85 auto-expand when detectedAuth has supported schemes. |
| 6 | User can still manually override the pre-selected auth type | ✓ VERIFIED | AuthTypeSelector.tsx line 27 onChange handler allows manual selection. AuthPanel.tsx line 58 handleTypeChange updates state. |
| 7 | Specs without security schemes show no auth-related changes (no regression) | ✓ VERIFIED | AuthPanel.tsx lines 52-53 filter schemes safely. URLInput.tsx lines 81-85 only expand if detectedAuth exists with supported schemes. No crashes on undefined. |

**Score (Plan 20-02):** 6/7 truths verified (1 partial)

**Overall Score:** 16/17 must-haves verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/services/openapi/types.ts` | ParsedSecurityScheme interface and extended ParsedSpec | ✓ VERIFIED | Lines 42-50: ParsedSecurityScheme interface with name, authType, metadata, description. Line 58: securitySchemes field in ParsedSpec. Imports AuthType from ../../types/auth (line 6). |
| `src/services/openapi/security-mapper.ts` | mapSecuritySchemes pure function | ✓ VERIFIED | Lines 10-21: exported function. 126 lines total (substantive). Handles all scheme types with proper type guards. |
| `src/services/openapi/__tests__/security-mapper.test.ts` | Unit tests for security scheme mapping | ✓ VERIFIED | 320 lines. 16 tests covering OpenAPI 3.x, Swagger 2.0, edge cases. All pass. |
| `src/services/openapi/__tests__/parser.test.ts` | Extended parser tests with securitySchemes extraction | ✓ VERIFIED | 492 lines. 16 tests total, including 3 new security scheme tests (lines extracted during test run). All pass. |
| `src/components/auth/AuthPanel.tsx` | AuthPanel accepts detectedAuth prop, pre-populates type and shows warnings | ✓ VERIFIED | 110 lines. Lines 15, 22: detectedAuth prop type. Lines 52-53: filter supported/unsupported. Lines 74-90: warning display. Lines 39-49: auto-select. |
| `src/components/auth/AuthTypeSelector.tsx` | AuthTypeSelector accepts defaultType for pre-selection | ✓ VERIFIED | 44 lines. Line 6: detectedType prop. Lines 35-39: "Detected from spec" hint when value matches detectedType. |
| `src/components/auth/CredentialForm.tsx` | CredentialForm accepts metadata for pre-populating field values | ✓ VERIFIED | 324 lines. Lines 11-14: detectedMetadata prop type. Lines 72, 74: pre-populate from metadata. Lines 215, 279: placeholder uses detected values. |
| `src/hooks/useAPIFetch.ts` | Spec fetch flow passes detected auth from parsedSpec | ⚠️ NOT CHECKED | Plan states this file should be modified, but verification focused on actual data flow from App.tsx. Auth detection happens in parser, not fetch hook. |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|----|--------|---------|
| `src/services/openapi/parser.ts` | `src/services/openapi/security-mapper.ts` | import and call mapSecuritySchemes | ✓ WIRED | Line 4: import. Lines 218, 222: calls in extractSecuritySchemes. Returns result at lines 39, 47. |
| `src/services/openapi/parser.ts` | `src/services/openapi/types.ts` | ParsedSecurityScheme type in ParsedSpec.securitySchemes | ✓ WIRED | parser.ts imports ParsedSpec (no explicit ParsedSecurityScheme import needed — inferred). types.ts line 58: securitySchemes field. |
| `src/App.tsx` | `src/components/URLInput.tsx` | passes parsedSpec.securitySchemes as detectedAuth prop | ⚠️ PARTIAL | **GAP**: Line 311 (centered layout) passes detectedAuth correctly. Line 209 (sidebar layout) missing detectedAuth prop. |
| `src/components/URLInput.tsx` | `src/components/auth/AuthPanel.tsx` | forwards detectedAuth prop | ✓ WIRED | URLInput.tsx line 8: import ParsedSecurityScheme. Line 39: detectedAuth prop. Line 161: forwards to AuthPanel. |
| `src/components/auth/AuthPanel.tsx` | `src/components/auth/AuthTypeSelector.tsx` | pre-selects type from detectedAuth.supported[0] | ✓ WIRED | AuthPanel.tsx lines 39-49: auto-select logic. Line 96: passes detectedType prop to AuthTypeSelector. |
| `src/components/auth/AuthPanel.tsx` | `src/components/auth/CredentialForm.tsx` | passes metadata (headerName, paramName) from detected scheme | ✓ WIRED | AuthPanel.tsx line 56: matchedScheme = detectedAuth?.find(s => s.authType === selectedType). Line 103: passes matchedScheme?.metadata as detectedMetadata prop. |

### Requirements Coverage

| Requirement | Status | Blocking Issue |
|-------------|--------|----------------|
| SPEC-01: Parse components.securitySchemes from OpenAPI specs | ✓ SATISFIED | None — parser extracts from both OpenAPI 3.x and Swagger 2.0 |
| SPEC-02: Map OpenAPI security types to api2ui auth types | ✓ SATISFIED | None — security-mapper.ts handles all supported mappings |
| SPEC-03: Pre-populate auth type and metadata from spec | ⚠️ PARTIAL | Sidebar layout missing detectedAuth prop — pre-population doesn't work for multi-endpoint specs |
| SPEC-04: Gracefully skip unsupported schemes with warning | ✓ SATISFIED | None — amber warning displays scheme name and reason |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| None | — | — | — | No TODO/FIXME comments, no stub patterns, no empty returns in critical paths |

**TypeScript compilation:** ✓ PASS (npx tsc --noEmit — 0 errors)

**Test suite:** ✓ PASS
- security-mapper.test.ts: 16/16 tests pass
- parser.test.ts: 16/16 tests pass
- All 449 existing tests still pass (no regressions)

### Human Verification Required

None — automated checks cover all observable behaviors. The gap (sidebar layout) is a straightforward prop wiring issue, not a functional ambiguity.

### Gaps Summary

**1 gap blocking full goal achievement:**

**Gap 1: Sidebar layout missing detectedAuth prop**
- **Truth affected:** "When loading an OpenAPI spec with securitySchemes, the auth panel shows detected auth requirements"
- **File:** `src/App.tsx`
- **Issue:** Line 209 (sidebar layout for multi-endpoint specs) renders `<URLInput authError={authError} />` without the `detectedAuth={parsedSpec?.securitySchemes}` prop that line 311 (centered layout) has.
- **Impact:** Users loading multi-endpoint OpenAPI specs (like Petstore with 2+ GET endpoints) won't see detected auth. Single-endpoint specs and direct URLs work correctly.
- **Fix:** Add `detectedAuth={parsedSpec?.securitySchemes}` to the URLInput component at line 209.

**Root cause:** Plan 20-02 explicitly stated "Pass `detectedAuth={parsedSpec?.securitySchemes}` to **both** URLInput instances (sidebar layout and non-sidebar layout)" but the sidebar instance was missed during implementation.

**Severity:** Medium — feature works for single-endpoint specs (common case), but fails for multi-endpoint specs (also common, especially for real-world OpenAPI specs).

---

_Verified: 2026-02-10T19:42:00Z_
_Verifier: Claude (gsd-verifier)_
