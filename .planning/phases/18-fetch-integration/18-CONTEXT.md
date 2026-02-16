# Phase 18: Fetch Integration - Context

**Gathered:** 2026-02-09
**Status:** Ready for planning

<domain>
## Phase Boundary

Wrap the existing fetch layer with `fetchWithAuth` so credentials from the auth store are injected into requests automatically. Detect 401/403 responses and throw AuthError. Public APIs without credentials must behave identically to v0.3. No UI changes in this phase (UI is Phase 19, error UX is Phase 21).

</domain>

<decisions>
## Implementation Decisions

### Wrapper transparency
- Drop-in replacement: `fetchWithAuth` replaces the existing fetch call path — zero component changes needed
- Auth injection is invisible to the user at the fetch layer
- Subtle indicator: a small lock icon or badge near the URL bar shows auth is active (UI detail for Phase 19, but the wrapper should expose auth state for it)
- Credential values must be masked in any logging or debug output (e.g., `Authorization: Bearer ***`)

### Auth failure behavior
- Keep credentials on 401: do NOT auto-clear credentials from the store when a request fails — user manually decides to update or clear
- Show API error body: parse and display the response body alongside the AuthError — many APIs return helpful error JSON on 401/403
- Distinguish error states: two different error states — "needs auth" (no credentials configured, got 401/403) vs "auth failed" (credentials configured but rejected). Enables different prompts in Phase 21
- Normal errors stay normal: non-auth HTTP errors (500, 404, etc.) are handled exactly like today, even when auth is configured — no auth context added

### Query parameter handling
- Check and replace: use `URL.searchParams.set()` to handle query param auth — replaces existing param if present, adds if new
- Auto-encode: URL-encode param values automatically — user enters the raw value
- Validate header names: for API Key auth (custom header), validate that the header name is a valid HTTP header (alphanumeric + hyphens) and reject invalid names with a clear error

### Basic Auth encoding
- Auto-encode: user provides username + password separately, fetchWithAuth handles `btoa(username:password)` at request time — matches how Postman/Insomnia/curl work

### Public API regression safety
- Pure passthrough: when no credentials exist for the origin, fetchWithAuth calls fetch with zero modifications — identical code path to current behavior
- Always detect 401/403: even on public APIs with no credentials configured, 401/403 responses become AuthErrors — enables Phase 21's "This API requires authentication. Configure now?" prompt
- No auto-retry: after configuring credentials on a failed request, user must manually trigger the request again
- No special CORS handling: CORS errors with auth headers present are treated the same as any other CORS error

### Claude's Discretion
- Internal architecture of fetchWithAuth (middleware pattern, wrapper function, etc.)
- How to expose auth-active state for the subtle indicator
- Error message wording for AuthError
- Test strategy and approach

</decisions>

<specifics>
## Specific Ideas

- The wrapper should be a true drop-in: wherever the current fetch call happens, replace it with fetchWithAuth — single integration point
- "Needs auth" vs "auth failed" distinction is important for Phase 21's UX — make these clearly different in the AuthError type
- Use `new URL(url).origin` for credential lookup (already established in Phase 17's auth store)

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 18-fetch-integration*
*Context gathered: 2026-02-09*
