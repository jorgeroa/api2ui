# Domain Pitfalls: Adding API Authentication to Client-Side Web App

**Domain:** Client-side API exploration tool (api2ui)
**Researched:** 2026-02-09
**Context:** Adding authentication to existing public-API-only app

## Critical Pitfalls

Mistakes that cause rewrites, security breaches, or major issues.

### Pitfall 1: Storing Credentials in localStorage (XSS Exposure)

**What goes wrong:** Storing API keys, bearer tokens, or basic auth credentials in localStorage makes them accessible to any JavaScript code, including XSS attacks. A single XSS vulnerability anywhere in the application or third-party dependencies can compromise all stored credentials.

**Why it happens:** localStorage is convenient and persistent, but it has no protection against XSS. Developers assume "my app doesn't have XSS" without considering third-party scripts, CDN compromises, or future vulnerabilities.

**Consequences:**
- Complete credential compromise from a single XSS exploit
- Credentials persist on disk permanently, accessible to other applications
- No HttpOnly protection - JavaScript can always read the values
- User credentials stolen and reused across sessions

**Prevention:**
1. **Use sessionStorage for secrets** - Auto-clears on tab/browser close, reducing exposure window
2. **Use localStorage only for non-sensitive config shape** - Auth method choice, header names, etc. (NOT the actual keys/tokens)
3. **Never log credential values** - Even in development/debug mode
4. **Implement CSP headers** - Control which scripts can execute
5. **Sanitize all user input** - Especially when rendering API responses in the UI

**Detection warning signs:**
- Code like `localStorage.setItem('apiKey', userInput)`
- Credential values visible in localStorage via DevTools
- Auth headers built from `localStorage.getItem()` calls
- No CSP headers in development/production builds

**Phase assignment:** Phase 1 (Storage Architecture) - Get this right from the start

**Confidence:** HIGH - Multiple authoritative sources confirm this is the #1 client-side auth pitfall

**Sources:**
- [LocalStorage XSS vulnerabilities](https://snyk.io/blog/is-localstorage-safe-to-use/)
- [Best practices for storing access tokens](https://curity.medium.com/best-practices-for-storing-access-tokens-in-the-browser-6b3d515d9814)
- [React XSS prevention guide](https://www.stackhawk.com/blog/react-xss-guide-examples-and-prevention/)

---

### Pitfall 2: CORS Preflight Failure with Authorization Header

**What goes wrong:** Adding `Authorization` header to existing `fetchAPI()` breaks requests that previously worked. Browser sends OPTIONS preflight request, but the API server either:
- Doesn't handle OPTIONS at all (405 Method Not Allowed)
- Doesn't include `Authorization` in `Access-Control-Allow-Headers` response
- Drops CORS headers on error responses (401/403)
- Uses wildcard `Access-Control-Allow-Origin: *` with credentials

**Why it happens:**
- Current api2ui uses `credentials: 'omit'` and only `Accept: application/json` header
- Adding `Authorization` triggers "non-simple request" requiring preflight
- Public APIs often don't need OPTIONS support, so this is untested
- CORS middleware configuration is notoriously complex

**Consequences:**
- Auth headers never reach API server (request blocked at preflight)
- Confusing error messages ("CORS error" instead of "auth failed")
- Works in Postman/curl but fails in browser
- Users think their credentials are invalid when CORS is the issue

**Prevention:**
1. **Test with APIs that require OPTIONS handling** - Don't assume all APIs support it
2. **Provide clear error messages** - Distinguish "CORS preflight failed" from "auth invalid"
3. **Document CORS requirements** - Warn users that authenticated APIs need proper CORS setup
4. **Consider CORS proxy option** - For development/testing when API can't be fixed
5. **Detect preflight failures** - Catch OPTIONS failures before showing generic "auth failed" message

**Detection warning signs:**
- Network tab shows OPTIONS request with 4xx/5xx status
- `Access-Control-Allow-Headers` missing `Authorization` in response
- Error message says "CORS" but user thinks credentials are wrong
- Works with `mode: 'no-cors'` (opaque) but not `mode: 'cors'`

**Phase assignment:** Phase 2 (Auth Injection) - Handle during fetch integration

**Confidence:** HIGH - Well-documented CORS/auth interaction issue

**Sources:**
- [CORS preflight common mistakes](https://dev.to/thesanjeevsharma/cors-preflight-requests-and-common-cross-origin-issues-129n)
- [NGINX CORS configuration guide](https://www.getpagespeed.com/server-setup/nginx/nginx-cors/amp)
- [MDN CORS errors documentation](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS/Errors)

---

### Pitfall 3: Breaking Public API Flow (Regression)

**What goes wrong:** Existing public APIs stop working after adding authentication features:
- Auth UI blocks access even when API doesn't require auth
- `credentials: 'omit'` changed to `'include'`, causing CORS rejections
- Empty/null auth values sent in headers, causing API rejections
- Parameter values lost when switching between authenticated/public APIs

**Why it happens:**
- Focus on "making auth work" rather than "preserving existing behavior"
- Not testing regression against original public API use cases
- Assuming auth is "additive" when it often changes request behavior
- State management doesn't handle auth-optional scenarios

**Consequences:**
- v0.0-v0.3 users report "nothing works anymore"
- Public API examples break on landing page
- Users forced to configure auth even for public APIs
- Loss of core value prop (paste URL, instant render)

**Prevention:**
1. **Default to no auth** - Auth must be opt-in, not opt-out
2. **Test all public API examples** - JSONPlaceholder, DummyJSON, etc. must still work
3. **Separate auth state from global state** - Don't pollute fetch logic with auth if not needed
4. **Preserve parameter state** - Switching APIs shouldn't lose query param values
5. **Visual regression testing** - Playwright tests for public API flows

**Detection warning signs:**
- Public API requests include auth headers with empty values
- JSONPlaceholder example on landing page throws errors
- `credentials: 'include'` is now default instead of opt-in
- Auth UI appears even when spec has no security schemes

**Phase assignment:** Phase 3 (Integration Testing) - Explicit regression validation phase

**Confidence:** MEDIUM - Inferred from migration patterns, not directly cited

**Sources:**
- [Application migration pitfalls](https://www.tierpoint.com/blog/9-steps-to-avoid-cloud-migration-pitfalls-with-legacy-apps/)

---

### Pitfall 4: Credential Leakage in Console Logs

**What goes wrong:** Sensitive credentials appear in browser console logs:
- Fetch requests logged with full headers (`Authorization: Bearer sk-abc123...`)
- Error messages include credential values ("Invalid API key: sk-abc123")
- Debug logging shows raw OpenAPI security scheme values
- Redux DevTools / Zustand DevTools expose secrets in state snapshots

**Why it happens:**
- Developers add console.log during debugging and forget to remove
- Error handling includes full request context for debugging
- State management tools show everything by default
- Network logging libraries log headers automatically

**Consequences:**
- Credentials exposed in screen recordings/screenshots
- Secrets committed to bug reports
- Production console logs contain API keys
- Screen-sharing sessions leak credentials

**Prevention:**
1. **Redact credentials in all logs** - Replace with `[REDACTED]` or show only last 4 chars
2. **Never log Authorization header** - Strip before logging request details
3. **Configure Zustand persist to exclude secrets** - Only persist config shape, not values
4. **Add .env to .gitignore** - Even for example values
5. **Use structured logging** - Separate sensitive fields, redact at log time

**Detection warning signs:**
- Console shows `Authorization: Bearer ...` with full token
- Error messages include credential values
- Zustand DevTools shows sessionStorage secrets
- Network tab logs not filtered in production build

**Phase assignment:** Phase 1 (Storage Architecture) and Phase 2 (Auth Injection) - Implement redaction from start

**Confidence:** HIGH - Common security mistake in web apps

**Sources:**
- [API security best practices 2026](https://www.aikido.dev/blog/api-security-best-practices)
- [API key safety best practices](https://help.openai.com/en/articles/5112595-best-practices-for-api-key-safety)

---

### Pitfall 5: OpenAPI Security Scheme Parsing Errors

**What goes wrong:**
- Malformed OpenAPI spec crashes the parser
- Security schemes present but no `security` requirement at operation level
- Multiple security schemes but no UI to choose between them
- OAuth flows defined but only API key/bearer actually supported
- Scope information missing or incorrect in spec

**Why it happens:**
- OpenAPI security is complex (scheme definition + operation application)
- Specs often have security schemes defined but not applied
- Generators produce incomplete security metadata
- Spec authors don't understand scheme vs requirement difference

**Consequences:**
- App detects auth but can't determine which method to use
- User configures wrong auth type (basic instead of bearer)
- OAuth detected but unsupported, user confused why it doesn't work
- Missing scopes cause 403 errors with valid credentials

**Prevention:**
1. **Validate security schemes before using** - Check for required fields (type, scheme, name, in)
2. **Fall back gracefully on invalid schemes** - Show warning, don't crash
3. **Check operation-level security** - Scheme exists ≠ scheme required
4. **Limit to supported types in Phase 1** - API key, bearer, basic, query param only
5. **Show "unsupported auth" message for OAuth/OpenID** - Don't silently ignore

**Detection warning signs:**
- Parser throws on specs with OAuth flows
- Security schemes array exists but no auth UI shown
- Operation works without auth despite security scheme present
- User can't tell which of 3 security schemes to use

**Phase assignment:** Phase 4 (OpenAPI Detection) - Handle when parsing specs

**Confidence:** MEDIUM - Based on OpenAPI complexity patterns, not direct citations

**Sources:**
- [OpenAPI security schemes documentation](https://learn.openapis.org/specification/security.html)
- [OpenAPI security warnings](https://learning.postman.com/docs/api-governance/api-definition/openapi3)

---

## Moderate Pitfalls

Mistakes that cause delays, poor UX, or technical debt.

### Pitfall 6: Confusing Auth Error Messages

**What goes wrong:** User receives unhelpful error messages:
- "401 Unauthorized" shown with no hint about what to do
- CORS preflight failure displayed as "Network error"
- Invalid API key returns "403 Forbidden" with no explanation
- Auth config UI doesn't explain which field goes where

**Why it happens:**
- Direct HTTP status shown to user instead of interpreted
- CORS detection heuristic doesn't distinguish auth-related CORS
- API error responses not parsed for helpful messages
- UI assumes user knows difference between bearer/basic/API key

**Consequences:**
- Users don't know whether credentials are wrong or auth type is wrong
- Support requests: "It says unauthorized, what do I do?"
- Users paste credentials into wrong field
- Abandonment because error is too cryptic

**Prevention:**
1. **Detect 401/403 and prompt for auth** - "This API requires authentication. Configure credentials?"
2. **Parse API error messages** - Show `error.message` from response body if present
3. **Distinguish CORS from auth** - "CORS preflight blocked. API may not support browser requests with auth."
4. **Provide inline help** - "Bearer token: Usually starts with 'Bearer' or 'sk-'"
5. **Show examples** - Placeholder text demonstrates format

**Detection warning signs:**
- User sees raw "401 Unauthorized" with no context
- Help requests asking "where do I put my API key?"
- Users configuring bearer tokens as API keys
- No retry prompt after 401 response

**Phase assignment:** Phase 5 (Error Handling & UX) - Dedicated UX polish phase

**Confidence:** MEDIUM - UX anti-pattern, not security critical

---

### Pitfall 7: Per-Endpoint Auth Instead of Per-API

**What goes wrong:** Auth scope is too granular, requiring separate credentials for each endpoint from the same API.

**Why it happens:**
- Following OpenAPI operation-level security too literally
- Not recognizing that endpoints share credentials by base URL
- Over-engineering for edge cases

**Consequences:**
- User must re-enter same credentials for every endpoint
- Poor UX for multi-endpoint APIs (RESTful services)
- Credential storage bloat in sessionStorage

**Prevention:**
1. **Scope credentials by base URL** - `https://api.example.com` shares auth across all paths
2. **Use operation security as detection** - Not as separate credential storage
3. **Allow override if needed** - Edge case support without making it default
4. **Document assumption** - Explain per-API credential model to users

**Detection warning signs:**
- SessionStorage has 10+ entries for same API domain
- User asked for credentials on every endpoint switch
- Credentials don't persist when switching endpoints

**Phase assignment:** Phase 1 (Storage Architecture) - Design decision, implement early

**Confidence:** MEDIUM - Based on project requirements, not external research

---

### Pitfall 8: Session Credential Loss on Refresh

**What goes wrong:** User configures credentials, refreshes page, all credentials gone.

**Why it happens:**
- sessionStorage clears on page reload (by design)
- No warning about temporary storage
- User expects browser to "remember" credentials

**Consequences:**
- User frustration: "Why do I keep losing my API key?"
- Repeated credential entry
- Users misunderstand security model

**Prevention:**
1. **Show visual indicator** - "Session credentials (lost on refresh)"
2. **Provide localStorage option** - Explicit opt-in to "Remember credentials (less secure)"
3. **Warn on page unload** - "You have unsaved credentials. They will be lost on refresh."
4. **Document behavior** - Help text explains sessionStorage vs localStorage tradeoff

**Detection warning signs:**
- Support requests: "My API key keeps disappearing"
- Users don't understand why auth fails after refresh
- No indicator that credentials are temporary

**Phase assignment:** Phase 5 (Error Handling & UX) - User education and warnings

**Confidence:** LOW - Hypothetical UX issue based on sessionStorage behavior

**Sources:**
- [SessionStorage vs localStorage behavior](https://stytch.com/blog/localstorage-vs-sessionstorage-vs-cookies/)

---

### Pitfall 9: Query Parameter Auth Logged in URLs

**What goes wrong:** API keys passed as query parameters (`?api_key=sk-abc123`) appear in:
- Browser history
- Server logs
- Referrer headers
- Analytics tools

**Why it happens:**
- Query param auth is legitimate pattern for some APIs
- URLs are logged everywhere by default
- Developer doesn't consider logging implications

**Consequences:**
- Credentials exposed in browser history
- API server logs contain secrets
- Analytics platforms collect API keys
- Sharing URL shares credential

**Prevention:**
1. **Warn users** - "Query parameter auth is less secure than header-based auth"
2. **Prefer header auth** - Recommend header when both are available
3. **Don't persist query param credentials** - Don't save to localStorage
4. **Strip from displayed URLs** - Show `?api_key=***` in UI

**Detection warning signs:**
- Browser history shows full API key in URL
- Users share URLs with embedded credentials
- No warning about query param security

**Phase assignment:** Phase 5 (Error Handling & UX) - Add warnings and redaction

**Confidence:** HIGH - Well-documented security issue

**Sources:**
- [API key security schemes](https://www.speakeasy.com/openapi/security/security-schemes/security-api-key)
- [API key management best practices](https://infisical.com/blog/api-key-management)

---

## Minor Pitfalls

Mistakes that cause annoyance but are fixable.

### Pitfall 10: Hardcoded Auth Header Names

**What goes wrong:** Code assumes `Authorization` header, but some APIs use:
- `X-API-Key`
- `X-Auth-Token`
- `ApiKey`
- Custom header names

**Why it happens:**
- Most APIs use standard `Authorization` header
- Developers don't test with non-standard APIs

**Consequences:**
- APIs with custom header names don't work
- No way to configure custom header name in UI
- User can't authenticate even with valid credentials

**Prevention:**
1. **Make header name configurable** - UI field for custom header name
2. **Detect from OpenAPI spec** - `in: header, name: X-API-Key`
3. **Provide common presets** - Dropdown with standard options
4. **Default to `Authorization`** - Most common case

**Detection warning signs:**
- API requires `X-API-Key` but app sends `Authorization`
- No UI field to customize header name
- OpenAPI spec says `name: X-API-Key` but ignored

**Phase assignment:** Phase 2 (Auth Injection) - Support during implementation

**Confidence:** MEDIUM - Common API variation

---

### Pitfall 11: Basic Auth Not Base64 Encoded

**What goes wrong:** Basic auth requires `Authorization: Basic <base64(username:password)>` but code sends:
- `Authorization: username:password` (not base64)
- `Authorization: Basic username:password` (not encoded)
- `Authorization: base64(username):base64(password)` (encoded separately)

**Why it happens:**
- Developers forget encoding step
- Assume browser handles it automatically
- Misunderstand Basic auth spec

**Consequences:**
- Valid credentials rejected
- 401 errors despite correct username/password
- Confusion about why Postman works but app doesn't

**Prevention:**
1. **Use btoa() for base64 encoding** - `btoa(username + ':' + password)`
2. **Add "Basic " prefix** - `Authorization: Basic ${encoded}`
3. **Test with real basic auth API** - Validate implementation
4. **Show example in UI** - "Result will be: Basic dXNlcjpwYXNz"

**Detection warning signs:**
- Basic auth always returns 401
- Authorization header missing "Basic " prefix
- Credentials not base64 encoded

**Phase assignment:** Phase 2 (Auth Injection) - Implement correctly from start

**Confidence:** HIGH - Common implementation mistake

**Sources:**
- [OpenAPI basic authentication](https://swagger.io/docs/specification/v3_0/authentication/)

---

### Pitfall 12: Bearer Token "Bearer " Prefix Confusion

**What goes wrong:**
- User includes "Bearer " in token input, code adds it again: `Authorization: Bearer Bearer sk-abc123`
- User doesn't include "Bearer ", code doesn't add it: `Authorization: sk-abc123`
- Inconsistent behavior across different UIs

**Why it happens:**
- Spec says "Bearer " prefix required, but users don't know this
- UI doesn't clarify whether to include prefix
- Code doesn't normalize input

**Consequences:**
- Valid tokens rejected
- User doesn't know whether to type "Bearer" or not
- Works sometimes, fails other times

**Prevention:**
1. **Strip "Bearer " from user input** - Normalize before storage
2. **Always add "Bearer " prefix** - Code handles formatting
3. **Placeholder text shows format** - "sk-abc123 (prefix added automatically)"
4. **Label clarifies** - "Token (without 'Bearer' prefix)"

**Detection warning signs:**
- User input includes "Bearer " causing double prefix
- Token works in Postman but not in app
- No clear guidance on whether to include prefix

**Phase assignment:** Phase 2 (Auth Injection) - Input normalization

**Confidence:** MEDIUM - Common UX issue

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Storage Architecture | Using localStorage for secrets | Use sessionStorage for credentials, localStorage only for config shape |
| Auth Injection | Not checking if auth is needed | Default to no-auth for public APIs, only inject when configured |
| Integration Testing | Breaking existing public API flows | Test JSONPlaceholder, DummyJSON examples as regression suite |
| OpenAPI Detection | Crashing on OAuth schemes | Gracefully skip unsupported schemes, show warning |
| Error Handling & UX | Generic "401 Unauthorized" message | Detect 401/403 and prompt for auth configuration |
| 401/403 Fallback Prompt | Always prompting even for auth'd requests | Track configured APIs, only prompt on first 401 per API |

---

## Sources

### Security & Storage
- [Top 10 API Security Best Practices & Standards for 2026](https://www.aikido.dev/blog/api-security-best-practices)
- [Is LocalStorage safe to use?](https://snyk.io/blog/is-localstorage-safe-to-use/)
- [Best Practices for Storing Access Tokens in the Browser](https://curity.medium.com/best-practices-for-storing-access-tokens-in-the-browser-6b3d515d9814)
- [Just Stop Using LocalStorage For Secrets](https://medium.com/@stanislavbabenko/just-stop-using-localstorage-for-secrets-honestly-ea9ef9af9022)
- [React XSS Guide: Understanding and Prevention](https://www.stackhawk.com/blog/react-xss-guide-examples-and-prevention/)
- [How to Prevent XSS Attacks in React Applications](https://oneuptime.com/blog/post/2026-01-15-prevent-xss-attacks-react/view)

### CORS & Preflight
- [CORS, Preflight Requests, and Common Cross-Origin Issues](https://dev.to/thesanjeevsharma/cors-preflight-requests-and-common-cross-origin-issues-129n)
- [NGINX CORS Configuration: The Complete Guide (2026)](https://www.getpagespeed.com/server-setup/nginx/nginx-cors/amp)
- [MDN Cross-Origin Resource Sharing (CORS)](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS)
- [MDN CORS errors](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS/Errors)

### OpenAPI Security
- [Describing API Security - OpenAPI Documentation](https://learn.openapis.org/specification/security.html)
- [Authentication | Swagger Docs](https://swagger.io/docs/specification/v3_0/authentication/)
- [Security Schemes in OpenAPI | Speakeasy](https://www.speakeasy.com/openapi/security/security-schemes)
- [OpenAPI Security: Five types & best practices](https://liblab.com/blog/a-big-look-at-security-in-openapi)
- [OpenAPI 3 security warnings | Postman](https://learning.postman.com/docs/api-governance/api-definition/openapi3)

### API Key Management
- [API Key Security Best Practices for 2026](https://dev.to/alixd/api-key-security-best-practices-for-2026-1n5d)
- [API Key Management | Definition and Best Practices](https://infisical.com/blog/api-key-management)
- [Best Practices for API Key Safety | OpenAI](https://help.openai.com/en/articles/5112595-best-practices-for-api-key-safety)
- [The API Key security scheme in OpenAPI](https://www.speakeasy.com/openapi/security/security-schemes/security-api-key)

### Storage Comparison
- [Managing user sessions: localStorage vs sessionStorage vs cookies](https://stytch.com/blog/localstorage-vs-sessionstorage-vs-cookies/)
- [Secure Browser Storage: The Facts](https://auth0.com/blog/secure-browser-storage-the-facts/)
- [Securing Web Storage: LocalStorage and SessionStorage Best Practices](https://dev.to/rigalpatel001/securing-web-storage-localstorage-and-sessionstorage-best-practices-f00)

### Error Handling
- [Best Practices for API Error Handling | Postman Blog](https://blog.postman.com/best-practices-for-api-error-handling/)

### Migration
- [Legacy Application Migration: 9 Steps To Avoid Pitfalls](https://www.tierpoint.com/blog/9-steps-to-avoid-cloud-migration-pitfalls-with-legacy-apps/)
