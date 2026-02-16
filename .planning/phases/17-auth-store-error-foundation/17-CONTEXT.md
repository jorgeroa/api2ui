# Phase 17: Auth Store & Error Foundation - Context

**Gathered:** 2026-02-09
**Status:** Ready for planning

<domain>
## Phase Boundary

Credential storage infrastructure (Zustand store + sessionStorage) and error type system for authentication failures. No UI, no fetch changes — just the data layer and types that Phases 18-21 build on.

</domain>

<decisions>
## Implementation Decisions

### Credential modeling
- Discriminated union for auth types — each type has its own typed interface (Bearer has `token`, Basic has `username`+`password`, etc.)
- Each credential includes a user-defined label/nickname (e.g., "Production API key")
- Multiple credentials per API supported, with one marked as active
- Same-type credentials replace each other (adding a new Bearer replaces existing Bearer for that API)
- Different types can coexist for the same API (e.g., API Key + Bearer, one active)

### Storage scoping
- Origin-exact scoping (`new URL(url).origin`) — subdomains are separate APIs
- Origin-level credential sharing — changing URL path keeps same credentials
- All session credentials retained across API switches — navigating back finds creds still there
- Unbounded storage — no artificial limits, sessionStorage 5MB is the natural cap

### Error type design
- AuthError carries HTTP status code AND response body text
- AuthError includes auth context: what auth type was used (or that none was configured)
- AuthError extends/subclasses existing error handling — existing error handlers still catch it
- Three distinct error states: no auth configured, auth attempted but rejected (401), auth valid but insufficient permissions (403)

### Store API surface
- Pure storage — no validation or test-connection logic (that's Phase 18)
- Tracks auth state per API: untested / success / failed (updated by fetch layer)
- clearForApi(origin) + clearAll() — both targeted and nuclear clearing
- getConfiguredOrigins() — list all APIs with stored credentials
- getActiveCredential(origin) — convenience getter for Phase 18 fetch integration
- Switching active credential is a silent store update — no auto re-fetch
- Standard Zustand reactivity for change notifications — no custom events
- Session-only storage — no import/export for v0.4

### Claude's Discretion
- Exact TypeScript type definitions and naming
- sessionStorage serialization format
- Internal store structure and selector patterns
- How auth state transitions are managed

</decisions>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches

</specifics>

<deferred>
## Deferred Ideas

- Credential import/export (cross-session sharing) — future milestone
- Domain-level credential sharing (*.example.com) — future enhancement if users request it

</deferred>

---

*Phase: 17-auth-store-error-foundation*
*Context gathered: 2026-02-09*
