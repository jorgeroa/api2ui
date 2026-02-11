# Phase 19: Auth Configuration UI - Context

**Gathered:** 2026-02-09
**Status:** Ready for planning

<domain>
## Phase Boundary

Users can configure, view, and clear authentication credentials through a dedicated UI panel. Covers the auth type selector, credential forms, visual state indicators, and auth error display. OpenAPI auto-detection and smart error prompting are separate phases (20, 21).

</domain>

<decisions>
## Implementation Decisions

### Panel location & trigger
- Lock icon button placed near the URL input area
- Clicking the lock opens a collapsible auth section directly below the URL bar, pushing content down
- Section is always collapsed by default, regardless of credential state
- After saving credentials, the section auto-collapses
- Lock icon changes appearance based on auth state (visual feedback — see indicators below)

### Form interaction flow
- Auth type selected via dropdown/select menu
- Dropdown options: None | API Key | Bearer Token | Basic Auth | Query Parameter
- Selecting "None" clears credentials (no separate clear button needed)
- Form fields adapt to selected type (token field, username/password, header name + value, param name + value)
- Credentials auto-save on change (no explicit save button)
- No auto-refetch after credential change — user must manually re-fetch
- Credential values masked (password input type)

### Auth state indicators
- Three visual states on the lock icon: No auth (gray/default), Active (green/filled, closed lock), Failed (red, lock with error)
- Icon only, no text label — clean and minimal
- Tooltip on hover shows active auth type (e.g., "Bearer Token active")
- Tooltip on failed state shows error context

### Error & guidance display
- Auth errors display inline within the auth panel (not in the general error area)
- On 401/403, auth panel auto-expands to show the error
- Distinct messages for 401 vs 403:
  - 401: "Authentication required — configure credentials above"
  - 403: "Insufficient permissions — check your credentials"
- First-time UX: If no credentials configured and 401 occurs, panel opens with guidance message and dropdown ready for user to pick an auth type

### Claude's Discretion
- Exact form field layout and spacing
- Animation/transition for collapsible section
- Specific lock icon variant (Lucide, Heroicons, etc.)
- Input field placeholder text
- How tooltip appears (native title vs custom tooltip)

</decisions>

<specifics>
## Specific Ideas

- Lock icon near URL input mirrors the browser's own "secure connection" lock — familiar mental model
- Auto-collapse after save keeps the UI clean — icon state gives persistent feedback
- "None" as first dropdown option makes clearing auth intuitive (select None → credentials gone)

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 19-auth-configuration-ui*
*Context gathered: 2026-02-09*
