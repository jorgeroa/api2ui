# Research Synthesis: API Authentication for api2ui v1.4

**Milestone:** v1.4 API Authentication
**Researched:** 2026-02-09
**Confidence:** HIGH across all areas

---

## Executive Summary

Adding API authentication to api2ui requires a pure native stack approach: no new dependencies needed. Native Fetch API handles all four authentication types (API Key, Bearer Token, Basic Auth, Query Parameter) via headers and URL manipulation, while Zustand's existing persist middleware with sessionStorage provides secure credential storage. The architecture should inject auth at the fetch layer via a wrapper function, detect 401/403 errors, and prompt users to configure credentials. OpenAPI specs provide auto-detection of security schemes via `components.securitySchemes`. The biggest risk is breaking existing public-API functionality—authentication must be strictly opt-in per API, with zero impact on unauthenticated flows.

**Key research findings converge on:** (1) **Zero bundle cost** — use only native browser APIs, (2) **Per-API credential scoping** — store by base URL, not globally, (3) **sessionStorage not localStorage** — security best practice for session-scoped credentials, (4) **Explicit 401/403 detection** — don't auto-retry, prompt user instead, (5) **OpenAPI auto-detection** — parse security schemes to pre-populate auth UI.

---

## Key Findings

### From STACK.md: Technology Decisions

**Recommendation: Zero new dependencies**

| Need | Solution | Rationale |
|------|----------|-----------|
| HTTP auth headers | Native Fetch API | Headers parameter supports Bearer, API Key, Basic auth |
| Base64 encoding | Built-in btoa/atob | Universal browser support, no lib needed |
| Credential storage | Zustand persist + sessionStorage | Already installed; sessionStorage clears on tab close |
| Config storage | Zustand persist + localStorage | Non-secret metadata only (auth type, header names) |
| OpenAPI parsing | @apidevtools/swagger-parser (existing) | Already reads `components.securitySchemes` |

**What NOT to add:**
- ❌ Axios, ky, wretch (Fetch API handles all patterns)
- ❌ crypto-js (Web Crypto API built-in if needed)
- ❌ Passport.js, authjs (server-side libraries)
- ❌ JWT libraries (not creating/validating tokens, only passing them)

**Bundle impact:** 0 bytes (all native APIs)

**Confidence:** HIGH — Fetch API authentication patterns verified across 5+ sources, Zustand v5.0.11 persist middleware confirmed available.

---

### From FEATURES.md: Feature Landscape

**Table Stakes (required for v1.4):**
1. Auth type selection (4 types: API Key header, Bearer Token, Basic Auth, Query Parameter)
2. Dedicated auth configuration UI (modal/panel, not inline headers)
3. Visual indicator (lock icon: gray = no auth, black = active, red = failed)
4. Per-request credential injection (auto-attach to headers/params)
5. Clear error messages (401: "check credentials" vs 403: "permission denied")
6. Credential clearing ("Clear" button)
7. OpenAPI security scheme detection
8. Session persistence (sessionStorage, cleared on tab close)
9. Credential masking (show as `••••••`)

**Differentiators for v1.4 (high value, achievable):**
1. **Auto-prompt on 401/403** — Proactively offer auth config when API returns error
2. **Per-API credential scoping** — Key by base URL, auto-switch when URL changes
3. **Security indicators on endpoints** — Lock icon on operations with `security` requirement

**Defer to v1.5+:**
- OAuth 2.0 flows (complex: redirect, token refresh, PKCE)
- Credential presets (power user feature)
- Encrypted localStorage (security audit needed)

**Anti-patterns to avoid:**
- ❌ OAuth 2.0 in v1.4 (scope creep)
- ❌ localStorage for secrets (security risk)
- ❌ Custom header builder UI (95% of APIs use standard patterns)
- ❌ Auto-retry on 401/403 (violates HTTP semantics)
- ❌ Credential sharing/export (security nightmare)

**Confidence:** HIGH — Patterns verified across Swagger UI, Postman, Insomnia, RapidAPI.

---

### From ARCHITECTURE.md: Integration Strategy

**Recommended architecture:** Fetch wrapper pattern with dedicated auth store and sessionStorage persistence.

**Key architectural decisions:**
1. **Fetch wrapper** not interceptors — Native fetch doesn't support interceptors; wrapper is explicit and testable
2. **Separate `authStore`** from `appStore` — Different lifecycle, different storage (sessionStorage vs in-memory)
3. **Base URL-keyed credentials** — Extract domain from URL, store per base URL for multi-API workflows
4. **Typed error handling** — Extend error types with `AuthError` for 401/403, enable special UI rendering

**Integration points:**
- **Fetch layer:** `fetchWithAuth(url)` wrapper around existing `fetchAPI()`
- **State:** New `src/store/authStore.ts` with Zustand persist + sessionStorage
- **OpenAPI:** Extend parser to extract `components.securitySchemes` and operation-level `security`
- **UI:** New "Authentication" section in ConfigPanel (between Components and Style)
- **Error handling:** Detect `AuthError` in ErrorDisplay, show re-auth prompt instead of generic error

**Component responsibilities:**
- `fetchWithAuth`: Reads credentials from store, injects headers/params, throws AuthError on 401/403
- `authStore`: Per-API credential CRUD, sessionStorage persistence
- `AuthPanel`: UI for auth type selection, credential input with masking, OpenAPI detection
- `parseSecuritySchemes`: Extract security schemes from parsed spec
- `ErrorDisplay`: Detect AuthError, show "Open Auth Settings" + "Retry" buttons

**Build order:** (1) Error types → (2) Auth store → (3) Fetch wrapper → (4) Modify fetchAPI → (5) Modify useAPIFetch → (6) OpenAPI types → (7) Parser → (8) UI components → (9) Modify ConfigPanel → (10) Modify ErrorDisplay

**Confidence:** HIGH — Architecture patterns consistent with existing codebase structure (Zustand stores, error handling, ConfigPanel layout).

---

### From PITFALLS.md: Critical Risks

**Critical pitfalls (must prevent):**

1. **localStorage for secrets (XSS exposure)**
   - Risk: Single XSS exploit compromises all credentials
   - Mitigation: Use sessionStorage (cleared on tab close), localStorage only for config shape
   - Phase: 1 (Storage Architecture)

2. **CORS preflight failure with Authorization header**
   - Risk: Auth headers never reach server, confusing "CORS error" vs "auth failed"
   - Mitigation: Test with APIs that require OPTIONS handling, provide clear error messages
   - Phase: 2 (Auth Injection)

3. **Breaking public API flow (regression)**
   - Risk: v1.0-v1.3 users report "nothing works anymore"
   - Mitigation: Default to no-auth, test all public API examples (JSONPlaceholder, DummyJSON)
   - Phase: 3 (Integration Testing) — explicit regression validation

4. **Credential leakage in console logs**
   - Risk: Secrets visible in DevTools, screenshots, bug reports
   - Mitigation: Never log Authorization header, redact credentials in Zustand DevTools
   - Phase: 1-2 (implement redaction from start)

5. **OpenAPI security scheme parsing errors**
   - Risk: Crashes on malformed specs, fails silently on OAuth flows
   - Mitigation: Validate schemes before using, gracefully skip unsupported types, show warnings
   - Phase: 4 (OpenAPI Detection)

**Moderate pitfalls:**
- Generic error messages ("401 Unauthorized" with no guidance) → Need context-aware messages
- Per-endpoint auth instead of per-API → Credential explosion, poor UX → Scope by base URL
- Session credential loss on refresh → No warning about temporary storage → Add visual indicator
- Query param auth logged in URLs → Credentials in browser history/logs → Warn users, prefer headers

**Minor pitfalls (implementation details):**
- Hardcoded auth header names (some APIs use X-API-Key, X-Auth-Token) → Make configurable
- Basic auth not base64 encoded → Use btoa() correctly, show preview
- Bearer token "Bearer " prefix confusion → Strip/normalize user input, always add in code

**Confidence:** HIGH for critical pitfalls (authoritative security sources), MEDIUM for moderate pitfalls (inferred from patterns).

---

## Implications for Roadmap

### Recommended Phase Structure

**Phase 1: Storage & Error Foundation (3-4 days)**
- Create `AuthError` typed error class (401/403 detection)
- Create `authStore` with Zustand persist + sessionStorage
- Implement credential validation and redaction (prevent leakage)
- Implement per-API credential scoping by base URL
- Deliverable: Credential storage infrastructure ready for fetch integration

**Phase 2: Auth Injection & Fetch Pipeline (3-5 days)**
- Create `fetchWithAuth` wrapper around existing `fetchAPI`
- Implement credential injection for all 4 auth types (API Key, Bearer, Basic, Query)
- Modify `fetchAPI` to accept optional headers parameter
- Modify `useAPIFetch` to use `fetchWithAuth` instead of `fetchAPI`
- Handle 401/403 → throw AuthError for error handling
- Deliverable: Authenticated requests working end-to-end (no UI yet)

**Phase 3: UI Foundation (3-4 days)**
- Create `AuthPanel` component with auth type selector
- Create credential input forms for all 4 auth types
- Implement credential masking (show/hide toggle)
- Integrate AuthPanel into ConfigPanel
- Modify `ErrorDisplay` to detect and render AuthError
- Deliverable: Auth UI usable, manual auth configuration works

**Phase 4: OpenAPI Auto-Detection (2-3 days)**
- Extend OpenAPI parser to extract security schemes from `components.securitySchemes`
- Add security scheme types to `ParsedSpec` interface
- Implement `parseSecuritySchemes` function with support for apiKey, http:bearer, http:basic
- Pre-populate AuthPanel with detected auth type and metadata
- Gracefully skip unsupported schemes (OAuth, OpenID) with warning message
- Deliverable: OpenAPI specs auto-configure auth type and header names

**Phase 5: UX Polish & Error Handling (2-3 days)**
- Implement auto-prompt on 401/403 with inline UI offer ("Configure now?")
- Add clear, context-aware error messages (401 vs 403 distinction)
- Add HTTPS warning for http:// URLs
- Implement session storage lifecycle indicator ("Credentials lost on refresh")
- Add "Try without auth" toggle for testing public endpoints
- Deliverable: v1.4 ready for release with excellent error guidance

**Phase 6: Testing & Regression Validation (2-3 days)**
- Unit tests: fetchWithAuth, authStore, parseSecuritySchemes
- Integration tests: Full auth flow (config → request → success)
- Regression tests: Verify public APIs still work (JSONPlaceholder, DummyJSON, etc.)
- Manual UAT: GitHub, Stripe, OpenWeatherMap, basic auth APIs
- Browser testing: sessionStorage behavior, credential masking, error UI
- Deliverable: v1.4 alpha ready for beta testing

---

## Confidence Assessment

| Area | Confidence | Basis | Gaps |
|------|-----------|-------|------|
| **Stack** | HIGH | Fetch API patterns verified across 5+ sources; Zustand persist confirmed available | None identified |
| **Features** | HIGH | Patterns from Swagger UI, Postman, Insomnia, RapidAPI all converge | OAuth 2.0 (deferred) and credential presets unverified |
| **Architecture** | HIGH | Fetch wrapper pattern matches existing code structure; error handling infrastructure exists | UI component discovery/discoverability needs user testing |
| **Pitfalls** | HIGH (critical), MEDIUM (moderate/minor) | Critical pitfalls from authoritative security sources; moderate/minor inferred from best practices | Minor pitfalls based on common mistakes, not site-specific issues |
| **Integration Risk** | MEDIUM | CORS preflight interaction not directly tested; regression scope (breaking public APIs) inferred | Needs explicit testing against live APIs with CORS requirements |

**Overall confidence: HIGH** — All four research areas converge on consistent architecture and implementation path. Technology stack is proven (native APIs), feature landscape is clear (standard patterns from established tools), architecture is straightforward (fetch wrapper + Zustand store), and pitfalls are well-documented in security literature.

**Gaps requiring validation:**
1. CORS interaction with Authorization header on live APIs (needs Phase 2 testing)
2. UI discoverability of "Authentication" section in ConfigPanel (needs Phase 3 user testing)
3. Regression test coverage (needs explicit test suite in Phase 6)
4. OAuth 2.0 feature requests (monitor user feedback for v1.5+ priority)

---

## Research-to-Roadmap Mapping

| Phase | Research Findings | Research Flags |
|-------|------------------|-----------------|
| Phase 1 (Storage Foundation) | sessionStorage choice (STACK), error types (ARCH), critical pitfalls 1,4 (PITFALLS) | Standard pattern, no research needed |
| Phase 2 (Auth Injection) | Fetch wrapper pattern (ARCH), 4 auth types (FEATURES), pitfalls 2,11,12 (PITFALLS) | **NEEDS TESTING:** CORS preflight interaction |
| Phase 3 (UI Foundation) | ConfigPanel integration (ARCH), visual indicators (FEATURES), pitfall 6 (PITFALLS) | **NEEDS USER TESTING:** Discoverability of auth UI |
| Phase 4 (OpenAPI Detection) | Security scheme parsing (ARCH/STACK), auto-detection (FEATURES), pitfall 5 (PITFALLS) | Standard OpenAPI pattern, no research needed |
| Phase 5 (UX Polish) | Auto-prompt on 401/403 (FEATURES), error messages (PITFALLS), per-API scoping (FEATURES) | Differentiator feature, validate via UAT |
| Phase 6 (Testing) | Regression risk (pitfall 3), manual UAT against live APIs (FEATURES) | **NEEDS EXTENSIVE TESTING:** Public API regression suite |

---

## Next Steps for Requirements Definition

1. **Validate CORS assumptions** — Confirm that common authenticated APIs support Authorization header preflight (test with GitHub, Stripe in Phase 2)
2. **Plan regression test suite** — Document which public APIs must continue working (JSONPlaceholder, DummyJSON, OpenWeatherMap)
3. **Sketch UI mockups** — Validate auth panel placement and credential input UX before Phase 3 implementation
4. **Determine localStorage future** — Research user feedback to decide if "remember credentials" option is needed for v1.5+
5. **Plan OAuth 2.0 deferral strategy** — Decide how to gracefully handle OAuth specs in v1.4 (show unsupported message vs silently ignore)

---

## Research Files

- **STACK.md** — Technology choices (zero dependencies, native Fetch/Zustand)
- **FEATURES.md** — Feature landscape (8 table stakes, 3 differentiators, 7 anti-patterns)
- **ARCHITECTURE.md** — Integration strategy (fetch wrapper, auth store, 10-step build order)
- **PITFALLS.md** — Domain risks (5 critical, 4 moderate, 3 minor; prevention strategies)

**Research confidence:** HIGH across all four areas. Architecture is clear, technology is proven, features are standard, pitfalls are documented.
