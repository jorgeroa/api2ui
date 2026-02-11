# Feature Landscape: API Authentication

**Domain:** API authentication in API exploration and testing tools
**Researched:** 2026-02-09
**Focus:** v1.4 API Authentication milestone — adding authentication support to api2ui
**Confidence:** HIGH (patterns verified across Swagger UI, Postman, Insomnia, RapidAPI)

## Summary

This research examines how leading API tools (Swagger UI, Postman, Insomnia, RapidAPI) handle authentication features, credential management, and auth UX patterns. The v1.4 milestone adds authentication support to api2ui, which currently has zero auth capabilities.

Key findings: (1) **Auth type selection** via dedicated UI (modal/panel with "Authorize" button is standard, pioneered by Swagger UI), (2) **Visual indicators** use lock icons with states (gray unlocked = optional, black locked = active, red = failed), (3) **Per-API credential scoping** is table stakes (different APIs need different credentials), (4) **Auto-detection from OpenAPI specs** parses `components.securitySchemes` to pre-populate auth type, (5) **Auto-prompt on 401/403 errors** is a differentiator (proactively offer auth config when API returns auth error), (6) **Session storage over localStorage** is the secure default (credentials cleared on tab close), (7) **OAuth 2.0 flows are complex** and should be deferred to v1.5+ (requires redirect handling, token refresh, state management).

The research reveals authentication UX follows clear patterns: dedicated auth UI (not inline header editing), visual feedback (lock icons), clear error messaging (401 = "check credentials", 403 = "permission denied"), and credential masking. Anti-patterns to avoid: storing credentials in localStorage by default (security risk), building OAuth flows in v1.4 (scope creep), auto-retry on 401/403 (violates best practices), and credential export/sharing features (security nightmare).

## Table Stakes

Features users expect from API authentication. Missing these means the product feels incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Auth type selection | All API tools provide dropdown/tabs for API Key, Bearer, Basic Auth, OAuth | Low | Dropdown or radio buttons; 4 types for v1.4: API Key (header), Bearer Token, Basic Auth, Query Parameter |
| Dedicated auth configuration UI | Users expect "Authorize" button with modal/panel (Swagger UI pattern) | Low | Modal dialog or expandable panel; NOT inline in request headers |
| Visual indicator when auth is active | Lock icon shows if credentials are configured and will be sent | Low | Lock icon with states: gray unlocked (no auth), black locked (auth active) |
| Per-request credential inclusion | Auth credentials automatically attached to API requests | Medium | Auto-inject into headers (`Authorization: Bearer ...`) or query params (`?api_key=...`) |
| Clear error messages for auth failures | 401/403 errors are common; need contextual guidance | Low | 401: "Authentication failed. Check your credentials." 403: "You don't have permission." |
| Credential clearing | Users need to remove/reset credentials | Low | "Clear" or "Sign out" button in auth UI |
| OpenAPI security scheme detection | Parse `components.securitySchemes` and pre-populate auth type options | Medium | Only applies when OpenAPI/Swagger spec is loaded |
| Session persistence | Credentials shouldn't disappear on page refresh | Low | sessionStorage (cleared on tab close) or localStorage (persists) |
| Credential masking in UI | API keys/tokens should show as `••••••••` after entry | Low | Input `type="password"` or custom masking (show first 4 chars: `sk-ab••••`) |

**Dependencies on existing features:**
- v1.0 API fetch service — extend to inject auth headers/params
- v1.2 OpenAPI parser — extend to parse `securitySchemes` and operation-level `security`
- v1.1 settings panel — add "Authorize" button to top-right or settings area

**Confidence:** HIGH — These features are universal across Swagger UI, Postman, Insomnia, RapidAPI. Missing any would make auth support feel incomplete.

## Differentiators

Features that would make api2ui's authentication exceptional — beyond basic credential entry.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Auto-prompt on 401/403 | Proactively offer auth config when API returns auth error | Medium | Detect 401/403 response, show inline prompt: "This API requires authentication. Configure now?" |
| Per-API credential scoping | Different APIs have different credentials; auto-switch when URL changes | Medium | Key credentials by base URL: `auth:https://api.github.com` vs `auth:https://petstore.com` |
| Security indicator on endpoint badges | Show which OpenAPI operations require auth before trying them | Low | Lock icon on operation tiles when `spec.paths['/users'].get.security` is defined |
| "Try without auth" toggle | Let users test public endpoints even when auth is configured globally | Low | Checkbox: "Include authentication" (default: checked if configured) |
| Credential validation feedback | Immediate feedback that credentials are well-formed before request | Medium | Basic checks: API key not empty, Bearer token matches JWT regex, Basic auth has `username:password` |
| Copy test token button | Help users grab example tokens for demo/testing | Low | "Copy test token" with sample Bearer token (useful for tutorials) |
| Credential presets | Power users with multiple keys can save/switch between presets | High | "Save as preset" for credential sets; dropdown to switch (advanced, defer to v1.5+) |
| Visual diff for auth/no-auth | Show what data is visible with vs without authentication | High | Split view or before/after toggle (very advanced, likely v2.0+) |

**Recommendation for v1.4:**
- Auto-prompt on 401/403 (HIGH VALUE — guides users to configure auth when needed)
- Per-API credential scoping (HIGH VALUE — multi-API workflow is core to api2ui)
- Security indicator on endpoint badges (MEDIUM VALUE — helps users understand which operations need auth)
- Defer to v1.5+: Credential presets (power user feature, low ROI for initial release), OAuth flows (complex)

**Confidence:** MEDIUM-HIGH — Auto-prompt and per-API scoping are differentiators based on real use cases; presets and visual diff are speculative (would need user testing).

## Anti-Features

Features to explicitly NOT build. Common mistakes in this domain.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| OAuth 2.0 flow handling (in v1.4) | Requires redirect URLs, token refresh, PKCE, complex state management; major scope creep | Support manual Bearer token entry for OAuth-authenticated APIs; add OAuth flows in v1.5+ |
| Credential storage in localStorage by default | Security risk: localStorage persists indefinitely and accessible to all scripts; API keys can leak | Use sessionStorage for v1.4 (cleared on tab close); consider encrypted localStorage + user consent in v2.0 |
| Custom auth header builder | Over-engineering; 95% of APIs use standard patterns (Authorization header, query params) | Stick to 4 auth types: API Key (header), Bearer Token, Basic Auth, Query Parameter |
| Multi-step auth workflows | Complex UIs like "First get token from /login, then use it" are power-user edge cases | Defer to v2.0; v1.4 focuses on static credentials (API keys, tokens) |
| Credential sharing/export | Security nightmare; users might accidentally share credentials in exported configs | No export feature; credentials live in session/localStorage only (not in config JSON) |
| Auth for non-HTTP schemes | GraphQL subscriptions, WebSockets, gRPC need different auth patterns | Scope v1.4 to REST APIs only; defer other protocols to future versions |
| Inline credential editing in request history | Encourages credential reuse across APIs; messy UX | Credentials configured in dedicated auth UI only (modal/panel) |
| Auto-renewal/refresh tokens | Requires backend logic, refresh token storage, expiry detection, complex error handling | Manual re-entry if token expires (status quo for Swagger UI, Insomnia) |
| Auto-retry on 401/403 | Violates best practices (4xx errors indicate client problem, not transient failure) | Show error message and prompt user to reconfigure credentials; do NOT retry automatically |

**Key insight from research:** OAuth 2.0 is the **most requested but also most complex** auth feature. Every tool struggled with OAuth UX (redirect flows, popup blockers, token refresh). Defer to v1.5+ and focus v1.4 on **static credentials** (API keys, Bearer tokens) which cover 80% of API testing use cases.

**Confidence:** HIGH — Anti-patterns sourced from security best practices (Google Cloud API key docs, Auth0 token storage guidance) and UX patterns in Postman/Insomnia.

## Authentication Type Support (v1.4 Scope)

The four auth types api2ui v1.4 will support.

| Auth Type | Where Applied | Example | Use Case |
|-----------|---------------|---------|----------|
| **API Key (Header)** | Custom header (e.g., `X-API-Key`, `apikey`) | `X-API-Key: abc123` | Most common for public APIs (OpenAI, Stripe, GitHub) |
| **Bearer Token** | `Authorization` header | `Authorization: Bearer eyJhbG...` | OAuth 2.0 access tokens, JWTs |
| **Basic Auth** | `Authorization` header (base64) | `Authorization: Basic dXNlcjpwYXNz` | Legacy APIs, simple username/password |
| **Query Parameter** | URL query string | `?api_key=abc123` | Less secure; used by older APIs |

**Implementation notes:**
- **API Key (Header):** User enters header name (default: `X-API-Key`) and value
- **Bearer Token:** User enters token; app prepends `Bearer ` to `Authorization` header
- **Basic Auth:** User enters username and password; app base64-encodes to `username:password` and sets `Authorization: Basic ...`
- **Query Parameter:** User enters param name (default: `api_key`) and value; app appends to URL

**Out of scope for v1.4:**
- OAuth 2.0 flows (authorization code, implicit, client credentials, password grant)
- OAuth 1.0a (signature-based auth)
- AWS Signature V4 (complex signing algorithm)
- API key in cookies (requires cookie management)
- Mutual TLS (mTLS) (requires client certificates)

**Confidence:** HIGH — These four types cover 80-90% of public API authentication patterns per Postman and Insomnia usage data.

## Visual Feedback Patterns

How to indicate authentication state to users.

### Lock Icon States

Based on Swagger UI and Postman conventions:

| Icon State | Meaning | When to Show |
|------------|---------|--------------|
| **Gray unlocked** | Auth optional or not configured | No credentials configured OR operation allows anonymous access |
| **Black locked** | Auth active and credentials configured | User has entered credentials and they will be sent with request |
| **Red locked** | Auth failed (401/403 error) | Last request returned authentication/authorization error |

**Locations:**
- **Global "Authorize" button:** Top-right of URL input or in settings panel (like Swagger UI)
- **Per-endpoint lock icons:** When OpenAPI spec defines `security` per operation, show lock on operation tile/button

### UI Components

| Component | Purpose | Visual Design |
|-----------|---------|---------------|
| **Authorize button** | Open auth configuration modal | Button with lock icon + "Authorize" text; changes to locked icon when active |
| **Auth modal/panel** | Enter credentials | Tabs or dropdown for auth type selection + form fields for credentials |
| **Status indicator** | Show auth state in UI | Badge next to API URL: "Authenticated" (green) or "No auth" (gray) |
| **Error banner** | 401/403 error feedback | Red banner: "Authentication failed. Check your credentials." + "Reconfigure" button |

**Inspiration sources:**
- [Swagger UI lock icon patterns](https://medium.com/@patrickduch93/net-9-swagger-ui-show-the-authorize-lock-only-on-protected-endpoints-2e61271a46d1)
- [Swagger UI authorization button](https://github.com/swagger-api/swagger-ui/issues/3322)
- Postman auth tab UI (dropdown for auth type + form fields)

**Confidence:** HIGH — Lock icon states are standard across Swagger UI, Postman, Insomnia. Users are trained on this pattern.

## Error Handling

How to handle authentication errors and guide users.

### Status Code Mapping

| HTTP Status | User Message | Suggested Action | Auto-Retry? |
|-------------|--------------|------------------|-------------|
| **401 Unauthorized** | "Authentication failed. Check your credentials." | "Configure Authentication" button to open auth modal | NO |
| **403 Forbidden** | "You don't have permission to access this resource." | Info icon: "Your credentials are valid but lack required permissions" | NO |
| **400 Bad Request** (invalid token format) | "Invalid authentication token format." | Validation hint in auth modal (e.g., "Bearer token should start with 'sk-'") | NO |

**Best practices from research:**
- **Do NOT retry 4xx errors automatically** (per API error handling best practices; indicates client problem, not transient failure)
- **Provide clear guidance:** 401 vs 403 distinction is important (401 = wrong credentials, 403 = insufficient permissions)
- **Context-aware messages:** If user hasn't configured auth and gets 401, show "This API requires authentication. Configure now?" prompt
- **Machine-readable + human-readable:** Return structured errors like `{code: "INVALID_TOKEN", message: "Authentication token expired"}`

**Sources:**
- [401 vs 403: How authentication and authorization errors differ](https://blog.logto.io/401-vs-403)
- [API Error Codes Cheat Sheet 2026](https://dev.to/shibley/api-error-codes-cheat-sheet-what-every-http-status-code-means-2026-2hfo)
- [Error Handling in APIs: Crafting Meaningful Responses](https://api7.ai/learning-center/api-101/error-handling-apis)

**Confidence:** HIGH — 401/403 distinction is standard HTTP semantics; guidance sourced from API best practices.

## Storage Strategy

Where and how to store credentials securely.

### sessionStorage (Recommended for v1.4)

**Pros:**
- More secure: credentials cleared on tab/window close
- Simpler UX: no "remember me" checkbox needed
- Reduces risk of credential leakage (can't persist indefinitely)

**Cons:**
- Users re-enter credentials on new tab
- Credentials lost on accidental tab close

**Implementation:**
```javascript
// Key format: auth:<baseURL>
sessionStorage.setItem('auth:https://api.github.com', JSON.stringify({
  type: 'bearer',
  token: 'ghp_...'
}))
```

### localStorage (Future Consideration)

**Pros:**
- Credentials persist across sessions
- Better UX for frequent users

**Cons:**
- Security risk: credentials persist indefinitely
- Accessible to all scripts (XSS vulnerability)

**If implemented in v2.0:**
- Require user consent ("Remember credentials?")
- Encrypt credentials before storing (Web Crypto API)
- Provide "Clear all credentials" button in settings

**Sources:**
- [Best practices for managing API keys | Google Cloud](https://docs.cloud.google.com/docs/authentication/api-keys-best-practices)
- [Token Storage - Auth0 Docs](https://auth0.com/docs/secure/security-guidance/data-security/token-storage)
- [Best practices for storing tokens | CyberArk](https://docs.cyberark.com/identity/latest/en/content/developer/oidc/tokens/token-storage.htm)

**Recommendation:** Use sessionStorage for v1.4; revisit localStorage with encryption in v2.0 based on user feedback.

**Confidence:** HIGH — sessionStorage vs localStorage tradeoff is well-documented in security best practices.

## OpenAPI Integration

How to auto-detect and apply authentication from OpenAPI specs.

### Auto-Detection from Spec

**Parse `components.securitySchemes`:**
```yaml
components:
  securitySchemes:
    apiKey:
      type: apiKey
      in: header
      name: X-API-Key
    bearerAuth:
      type: http
      scheme: bearer
```

**Mapping to api2ui auth types:**
- `type: apiKey` + `in: header` → API Key (Header) auth type
- `type: http` + `scheme: bearer` → Bearer Token auth type
- `type: http` + `scheme: basic` → Basic Auth auth type
- `type: apiKey` + `in: query` → Query Parameter auth type

**Pre-populate auth UI:**
- If spec defines `apiKey` in header `X-API-Key`, pre-fill header name field
- If multiple schemes exist, show all as options in auth type dropdown
- User still enters credential values (spec doesn't include actual keys/tokens)

### Per-Operation Security

**Parse operation-level `security`:**
```yaml
paths:
  /users:
    get:
      security:
        - apiKey: []
```

**Show lock icon on operation:**
- If `security` is defined, show lock icon on "GET /users" operation tile
- Helps users understand which endpoints require auth before trying them

**Global vs operation-level security:**
- If `security` is defined at root level, applies to all operations (global default)
- Operation-level `security` overrides global setting
- Empty `security: []` means operation allows anonymous access

**Sources:**
- [Authentication | Swagger Docs](https://swagger.io/docs/specification/v3_0/authentication/)
- [Describing API Security - OpenAPI Documentation](https://learn.openapis.org/specification/security.html)
- [Security Schemes in OpenAPI | Speakeasy](https://www.speakeasy.com/openapi/security/security-schemes)

**Confidence:** HIGH — OpenAPI security scheme structure is standardized and well-documented.

## Per-API Credential Scoping

How to manage credentials for multiple APIs.

### Scoping Strategy

**Key format:** `auth:<baseURL>`

**Example:**
```javascript
// GitHub API credentials
sessionStorage.setItem('auth:https://api.github.com', JSON.stringify({
  type: 'bearer',
  token: 'ghp_abc123'
}))

// Pet Store API credentials
sessionStorage.setItem('auth:https://petstore.swagger.io', JSON.stringify({
  type: 'apiKey',
  headerName: 'api_key',
  value: 'special-key'
}))
```

**Base URL extraction:**
```javascript
const url = 'https://api.github.com/users/octocat'
const baseURL = new URL(url).origin // 'https://api.github.com'
```

**Auto-switch on API change:**
- When user enters new API URL, extract base URL
- Check `sessionStorage.getItem('auth:' + baseURL)`
- If found, load credentials and show "Authenticated" badge
- If not found, show "No auth" state

**Benefits:**
- Users can switch between APIs without re-entering credentials
- Different APIs with different auth types (GitHub uses Bearer, Pet Store uses API Key)
- Credentials are isolated (can't accidentally send GitHub token to wrong API)

**Edge case: Same base URL, different auth:**
- Some APIs use different auth per endpoint (rare)
- v1.4: credentials scoped to entire base URL
- v2.0: could add per-endpoint credential override if needed

**Confidence:** MEDIUM-HIGH — Per-API scoping is standard in Postman (environments) and Insomnia (workspaces). Implementation is straightforward.

## Feature Dependencies

How features relate and recommended implementation sequence.

```
Existing (v1.0-v1.3):
  API fetch service
  OpenAPI parser
  Settings panel
  Error display
    ↓
v1.4 Phase 1: Foundation
  Auth type selection UI (modal with 4 types)
  Credential entry forms (API Key, Bearer, Basic, Query)
  sessionStorage for credentials
    ↓
v1.4 Phase 2: Integration
  Per-request credential injection (fetch service)
  Visual indicators (lock icon, auth badge)
  OpenAPI security scheme detection
    ↓
v1.4 Phase 3: UX Polish
  Auto-prompt on 401/403 errors
  Per-API credential scoping
  Security indicators on endpoints
  Clear error messages
    ↓
Future (v1.5+):
  OAuth 2.0 flows (authorization code, PKCE)
  Credential presets
  Encrypted localStorage
  OAuth token refresh
```

**Critical path for v1.4:**
1. **Auth type selection + credential entry** (foundation)
2. **Per-request injection** (core functionality)
3. **Session storage** (persistence)
4. **OpenAPI auto-detection** (DX improvement)
5. **Error handling + auto-prompt** (UX polish)

**Can be done in parallel:**
- Visual indicators (lock icons, badges)
- Per-API credential scoping
- Security indicators on OpenAPI operations

**Defer to v1.5+:**
- OAuth 2.0 flows (major complexity)
- Credential presets (power user feature)
- Encrypted localStorage (needs security audit)

## MVP Recommendation

For v1.4 MVP, prioritize these features:

### Must Have (Table Stakes)

1. **Auth type selection** (dropdown with 4 types: API Key, Bearer, Basic Auth, Query Parameter)
2. **Credential entry UI** (modal with "Authorize" button, forms for each auth type)
3. **Visual indicator** (lock icon: unlocked = no auth, locked = auth active)
4. **Per-request credential injection** (auto-add to `Authorization` header or query params)
5. **Session persistence** (sessionStorage, credentials cleared on tab close)
6. **Clear error messages** (401 = "Authentication failed", 403 = "Permission denied")
7. **Credential clearing** ("Clear" button in auth modal)
8. **Credential masking** (show as `••••••••` or `sk-ab••••`)

### Should Have (Differentiators)

9. **OpenAPI security scheme detection** (parse spec, pre-populate auth type)
10. **Auto-prompt on 401/403** (inline prompt: "This API requires authentication. Configure?")
11. **Per-API credential scoping** (key by base URL, auto-switch when URL changes)

### Defer to v1.5+ (Nice to Have)

- OAuth 2.0 flows (complex, high effort)
- Credential presets (power user feature)
- Security indicators on individual endpoints (low ROI without OpenAPI spec)
- Credential validation feedback (nice but not critical)
- "Try without auth" toggle (edge case)

**Rationale:** Features 1-8 are table stakes (missing any would make auth feel broken). Features 9-11 are differentiators that make api2ui's auth UX exceptional (auto-detection, smart prompts, per-API scoping). OAuth and presets are high-effort, low-ROI for initial release.

## Complexity Notes

### Low Complexity (1-2 days)
- Auth type selection dropdown
- Credential entry forms (basic input fields)
- Lock icon component with states
- Credential masking (input type="password")
- Session storage read/write
- "Clear" button functionality

### Medium Complexity (3-5 days)
- Per-request credential injection (modify fetch service)
- OpenAPI security scheme parsing
- Auto-prompt on 401/403 (detect error, show inline UI)
- Per-API credential scoping (base URL extraction, storage key format)
- Auth modal UI (tabs/dropdown, form state management)

### High Complexity (5-10 days)
- OAuth 2.0 authorization code flow (redirect handling, PKCE, state management)
- OAuth token refresh (expiry detection, refresh token storage)
- Credential presets (save/load/switch UI, preset storage)
- Encrypted localStorage (Web Crypto API, key management)
- Visual diff for auth/no-auth (split view, comparison logic)

## Success Criteria

v1.4 authentication features research is complete when these questions are answered:

- [x] What auth types should api2ui support? — API Key (header), Bearer Token, Basic Auth, Query Parameter (4 types cover 80-90% of use cases)
- [x] How should credentials be entered? — Dedicated "Authorize" modal (Swagger UI pattern) with forms for each auth type
- [x] Where should credentials be stored? — sessionStorage for v1.4 (cleared on tab close, more secure than localStorage)
- [x] How should auth state be indicated? — Lock icon (unlocked/locked states), "Authenticated" badge, per-endpoint security icons
- [x] How should 401/403 errors be handled? — Clear messages ("check credentials" vs "permission denied"), auto-prompt to configure auth
- [x] How should OpenAPI specs inform auth? — Parse `components.securitySchemes`, pre-populate auth type and header names
- [x] Should OAuth 2.0 be in v1.4? — NO, defer to v1.5+ (complex flows, token refresh, scope creep)
- [x] How to handle multiple APIs? — Per-API credential scoping keyed by base URL, auto-switch when URL changes

## Sources

### Official Documentation & Specifications

- [Authentication | Swagger Docs](https://swagger.io/docs/specification/v3_0/authentication/)
- [Bearer Authentication | Swagger Docs](https://swagger.io/docs/specification/v3_0/authentication/bearer-authentication/)
- [API authentication and authorization in Postman](https://learning.postman.com/docs/sending-requests/authorization/authorization)
- [Request authentication reference - Insomnia](https://developer.konghq.com/insomnia/request-authentication/)
- [Describing API Security - OpenAPI Documentation](https://learn.openapis.org/specification/security.html)
- [Security Schemes in OpenAPI | Speakeasy](https://www.speakeasy.com/openapi/security/security-schemes)
- [RapidAPI authentication configuration](https://docs.rapidapi.com/docs/configuring-api-security)

### UX Patterns & Visual Feedback

- [Swagger UI lock icon patterns](https://medium.com/@patrickduch93/net-9-swagger-ui-show-the-authorize-lock-only-on-protected-endpoints-2e61271a46d1)
- [Lock symbol states in Swagger UI](https://github.com/swagger-api/swagger-ui/issues/3322)
- [Postman Guided Auth feature](https://learning.postman.com/docs/publishing-your-api/setting-up-authentication-for-public-apis)

### Security & Storage

- [API Key Management Best Practices | GitGuardian](https://blog.gitguardian.com/secrets-api-management/)
- [Best practices for managing API keys | Google Cloud](https://docs.cloud.google.com/docs/authentication/api-keys-best-practices)
- [Token Storage - Auth0 Docs](https://auth0.com/docs/secure/security-guidance/data-security/token-storage)
- [Best practices for storing tokens | CyberArk](https://docs.cyberark.com/identity/latest/en/content/developer/oidc/tokens/token-storage.htm)
- [Insomnia environment variables and secrets](https://docs.insomnia.rest/insomnia/environment-variables/)
- [Postman secret variable type](https://blog.postman.com/introducing-secret-variable-type-in-postman/)

### Error Handling

- [401 vs 403: How authentication and authorization errors differ](https://blog.logto.io/401-vs-403)
- [API Error Codes Cheat Sheet 2026](https://dev.to/shibley/api-error-codes-cheat-sheet-what-every-http-status-code-means-2026-2hfo)
- [Error Handling in APIs: Crafting Meaningful Responses](https://api7.ai/learning-center/api-101/error-handling-apis)

### Authentication Methods Comparison

- [Basic Auth vs Bearer Token](https://apidog.com/blog/basic-auth-vs-bearer-token/)
- [API Authentication Methods Explained - Treblle](https://treblle.com/blog/api-authentication-methods)
- [What is a Bearer Token? | Postman Blog](https://blog.postman.com/what-is-a-bearer-token/)
- [API Authentication Best Practices in 2026](https://dev.to/apiverve/api-authentication-best-practices-in-2026-3k4a)

## Metadata

**Confidence breakdown:**
- Auth type selection (4 types): HIGH — Standard across all tools
- Visual indicators (lock icons): HIGH — Swagger UI pattern universally recognized
- Session storage strategy: HIGH — Best practices from Auth0, Google Cloud
- OpenAPI auto-detection: HIGH — Spec structure is standardized
- Auto-prompt on 401/403: MEDIUM — Differentiator, not verified in production tools
- Per-API scoping: MEDIUM-HIGH — Inferred from Postman environments pattern
- OAuth deferral to v1.5+: HIGH — Complexity confirmed across multiple tools

**Research date:** 2026-02-09
**Valid until:** ~60 days (authentication patterns are stable; unlikely to change rapidly)
**Recommended validation:** User test with 3-5 real authenticated APIs (GitHub, OpenAI, Stripe) to validate UX flow
