# Phase 17: Auth Store & Error Foundation - Research

**Researched:** 2026-02-09
**Domain:** Zustand state management, browser sessionStorage, TypeScript discriminated unions, HTTP authentication
**Confidence:** HIGH

## Summary

Phase 17 establishes the credential storage infrastructure and error type system for API authentication. The standard approach uses Zustand's persist middleware with sessionStorage for tab-scoped credential storage, TypeScript discriminated unions for type-safe credential modeling, and custom Error classes for auth-specific failures. The implementation requires zero new dependencies (Zustand already present) and follows existing codebase patterns.

**Key findings:**
- Zustand persist middleware supports sessionStorage via `createJSONStorage(() => sessionStorage)`
- Discriminated unions provide type-safe credential handling with automatic narrowing
- sessionStorage provides appropriate security boundary (tab-scoped, cleared on close)
- Custom Error classes extend existing error handling without breaking changes

**Primary recommendation:** Use Zustand persist middleware with sessionStorage, discriminated union types for credentials, and extend existing AppError pattern for AuthError.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| zustand | 5.0.11 | State management with persistence | Already in project, proven pattern |
| zustand/middleware | 5.0.11 | persist, createJSONStorage | Official Zustand persistence layer |
| TypeScript | ~5.9.3 | Type safety for discriminated unions | Project language, zero-cost abstraction |
| sessionStorage | Native | Browser storage API | Native, tab-scoped, auto-cleared |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| btoa() | Native | Base64 encoding for Basic Auth | Browser built-in, RFC 7617 standard |
| URL API | Native | Origin extraction for scoping | WHATWG standard, secure parsing |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| sessionStorage | localStorage | Persists across tabs/sessions (security risk for credentials) |
| sessionStorage | IndexedDB | Overkill for simple key-value storage |
| Zustand persist | Custom storage | Re-inventing serialization, hydration, reactivity |
| Discriminated unions | Class hierarchy | More verbose, no exhaustive checking |

**Installation:**
```bash
# No new dependencies required
# Zustand 5.0.11 already installed
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── store/
│   ├── authStore.ts              # New auth store with sessionStorage
│   ├── configStore.ts            # Existing pattern to follow
│   └── parameterStore.ts         # Existing pattern to follow
├── services/
│   └── api/
│       ├── errors.ts             # Extend with AuthError
│       └── fetcher.ts            # Future integration point (Phase 18)
└── types/
    ├── errors.ts                 # Extend ErrorKind union
    └── auth.ts                   # New credential type definitions
```

### Pattern 1: Zustand Persist with sessionStorage

**What:** Store credentials per API origin with automatic sessionStorage sync
**When to use:** All credential storage needs (the only storage pattern for Phase 17)

**Example:**
```typescript
// Source: Existing configStore.ts pattern + Zustand docs
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

interface AuthStore extends AuthState {
  // Actions
  setCredential: (origin: string, credential: Credential) => void
  clearCredential: (origin: string) => void
  clearAll: () => void
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // State
      credentials: {},

      // Actions
      setCredential: (origin, credential) =>
        set((state) => ({
          credentials: {
            ...state.credentials,
            [origin]: credential
          }
        })),

      clearCredential: (origin) =>
        set((state) => {
          const { [origin]: _, ...rest } = state.credentials
          return { credentials: rest }
        })
    }),
    {
      name: 'api2ui-auth',
      version: 1,
      storage: createJSONStorage(() => sessionStorage), // KEY: sessionStorage not localStorage
      partialize: (state) => ({
        credentials: state.credentials  // Only persist credentials, not derived state
      })
    }
  )
)
```

**Key details:**
- `partialize` selects which state to persist (credentials only, not auth status)
- `version: 1` enables future migrations if credential format changes
- sessionStorage cleared automatically on tab close (security boundary)
- Synchronous hydration (sessionStorage is sync, unlike AsyncStorage)

### Pattern 2: Discriminated Union for Credential Types

**What:** Type-safe credential modeling with automatic TypeScript narrowing
**When to use:** Modeling credentials where each auth type has distinct fields

**Example:**
```typescript
// Source: TypeScript discriminated unions pattern
type AuthType = 'bearer' | 'basic' | 'apiKey' | 'queryParam'

// Base credential properties
interface BaseCredential {
  type: AuthType      // Discriminant property
  label: string       // User-defined nickname
}

interface BearerCredential extends BaseCredential {
  type: 'bearer'
  token: string
}

interface BasicCredential extends BaseCredential {
  type: 'basic'
  username: string
  password: string
}

interface ApiKeyCredential extends BaseCredential {
  type: 'apiKey'
  headerName: string
  value: string
}

interface QueryParamCredential extends BaseCredential {
  type: 'queryParam'
  paramName: string
  value: string
}

// Discriminated union
type Credential =
  | BearerCredential
  | BasicCredential
  | ApiKeyCredential
  | QueryParamCredential

// TypeScript narrows type automatically
function formatCredential(cred: Credential): string {
  switch (cred.type) {
    case 'bearer':
      return `Bearer token: ${cred.token.slice(0, 4)}...` // TS knows .token exists
    case 'basic':
      return `${cred.username}:****` // TS knows .username, .password exist
    case 'apiKey':
      return `${cred.headerName}: ****` // TS knows .headerName, .value exist
    case 'queryParam':
      return `?${cred.paramName}=****` // TS knows .paramName, .value exist
  }
}
```

**Benefits:**
- Exhaustive checking: TypeScript errors if you don't handle all types
- Automatic narrowing: Inside each case, TS knows exact type
- Prevents invalid states: Can't have `type: 'bearer'` with `username` field

### Pattern 3: Origin-Based Scoping

**What:** Key credentials by API origin for security and UX
**When to use:** Any per-API storage (credentials, params, config overrides)

**Example:**
```typescript
// Source: Existing parameterStore.ts + MDN URL.origin docs
function getOrigin(url: string): string {
  try {
    return new URL(url).origin  // "https://api.example.com" (excludes path/query/hash)
  } catch {
    return url  // Fallback for invalid URLs
  }
}

// Usage in store
interface AuthState {
  // origin -> credential mapping
  credentials: Record<string, Credential>
}

// Store credentials per origin
setCredential: (url: string, credential: Credential) => {
  const origin = getOrigin(url)
  set((state) => ({
    credentials: {
      ...state.credentials,
      [origin]: credential
    }
  }))
}
```

**Why origin not full URL:**
- Origin excludes path: `/users` and `/posts` share credentials
- Origin includes port: `http://localhost:3000` ≠ `http://localhost:8080`
- Origin includes protocol: `http://` ≠ `https://` (different security contexts)
- WHATWG standard: Matches browser same-origin policy

### Pattern 4: Extending AppError for AuthError

**What:** Add AuthError type that integrates with existing error handling
**When to use:** 401/403 responses that require auth-specific context

**Example:**
```typescript
// Source: Existing services/api/errors.ts pattern
import type { AppError, ErrorKind } from '../../types/errors'

export class AuthError extends Error implements AppError {
  readonly kind: ErrorKind = 'auth'  // NEW: Extend ErrorKind union
  readonly suggestion: string
  readonly status: 401 | 403
  readonly authContext: string  // What auth was used (or "none configured")

  constructor(url: string, status: 401 | 403, authContext: string) {
    const authType = status === 401 ? 'Authentication' : 'Authorization'
    super(`${authType} failed for ${url} (${status})`)
    this.name = 'AuthError'
    this.status = status
    this.authContext = authContext

    this.suggestion = status === 401
      ? 'Check your credentials. 401 means authentication failed (bad token/password).'
      : 'Your credentials are valid but lack permissions. 403 means authorization denied.'

    // Required for instanceof checks to work correctly
    Object.setPrototypeOf(this, AuthError.prototype)
  }
}
```

**Integration points:**
- Extends existing `AppError` interface (no breaking changes)
- Adds `'auth'` to `ErrorKind` union type
- Existing error handlers still work (catch Error, check .kind)
- New handlers can specifically catch AuthError for 401/403 logic

### Pattern 5: Auth State Tracking Per API

**What:** Track authentication status per origin (untested, success, failed)
**When to use:** UI needs to show auth indicators, Phase 18 needs to know when to retry

**Example:**
```typescript
type AuthStatus = 'untested' | 'success' | 'failed'

interface AuthState {
  credentials: Record<string, Credential>
  authStatus: Record<string, AuthStatus>  // Separate from credentials
}

// Phase 18 will update status after fetch attempts
setAuthStatus: (origin: string, status: AuthStatus) =>
  set((state) => ({
    authStatus: {
      ...state.authStatus,
      [origin]: status
    }
  }))
```

**State transitions:**
- `untested` → credential added but never used in a request
- `success` → last request with this credential succeeded (200-299)
- `failed` → last request returned 401/403
- Cleared when credential changes (new credential = untested)

### Anti-Patterns to Avoid

- **Storing passwords in localStorage:** Use sessionStorage (cleared on tab close)
- **Storing derived state in persist:** Only persist credentials, derive status in getter
- **Full URL as key:** Use origin (path changes shouldn't change credentials)
- **Testing auth in store:** Store is pure storage, Phase 18 handles validation
- **Auto-retry on 401:** Show error, let user reconfigure (don't spam API)

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| State persistence | Custom localStorage wrapper | Zustand persist middleware | Handles hydration, serialization, merge, version migration |
| Origin extraction | String manipulation | `new URL(url).origin` | WHATWG standard, handles edge cases (ports, protocols, IDN) |
| Base64 encoding | Custom implementation | `btoa(str)` | Native browser API, RFC 4648 compliant |
| Type-safe unions | Class hierarchies | TypeScript discriminated unions | Zero runtime cost, exhaustive checking, automatic narrowing |
| Error subclassing | Plain objects | Custom Error classes | Stack traces, instanceof checks, standard JS pattern |

**Key insight:** Browser APIs and TypeScript built-ins solve 80% of auth storage. Custom solutions introduce bugs (URL parsing edge cases), complexity (serialization), and maintenance burden.

## Common Pitfalls

### Pitfall 1: sessionStorage Serialization Breaks with Non-JSON Types

**What goes wrong:** Storing Date objects, Map, Set, or functions in Zustand persist causes deserialization errors or data loss.

**Why it happens:** `createJSONStorage` uses `JSON.stringify`/`JSON.parse` which only supports primitives, arrays, plain objects.

**How to avoid:**
- Only store JSON-serializable types in credentials
- All credential fields are string primitives (token, username, password, headerName, etc.)
- No Date objects, no nested Maps, no functions

**Warning signs:**
- TypeError on hydration after refresh
- Credentials disappear after page reload
- Strange `[object Object]` strings in storage

### Pitfall 2: Origin Confusion (Subdomains vs Paths)

**What goes wrong:** Developer expects `api.example.com` and `www.example.com` to share credentials, or expects `/admin` and `/public` to have separate credentials.

**Why it happens:** Misunderstanding of origin definition (scheme + host + port, NO path, NO subdomain wildcard).

**How to avoid:**
- Document clearly: Subdomain = different origin = different credentials
- Document clearly: Path changes = same origin = same credentials
- If user wants subdomain sharing, that's a future feature (deferred)

**Warning signs:**
- User reports "credentials not working on different subdomain"
- User expects `/admin` to have separate credentials from `/users`

### Pitfall 3: Security Assumption Violations

**What goes wrong:** Storing credentials in localStorage (persists forever), including credentials in URL parameters (logged, cached), or assuming sessionStorage is encrypted.

**Why it happens:** Misunderstanding sessionStorage security properties.

**How to avoid:**
- sessionStorage is cleared on tab close BUT visible in DevTools
- sessionStorage is NOT encrypted (XSS can read it)
- NEVER log credential values (use masking: `token.slice(0,4) + '...'`)
- Accept the tradeoff: sessionStorage is developer-friendly but not vault-secure

**Warning signs:**
- Credentials persisting across days (wrong storage)
- Credentials in browser history or server logs (URL pollution)
- Security audit flags credential exposure (expected for sessionStorage)

### Pitfall 4: Attempting Validation in Store

**What goes wrong:** Adding "test connection" or "validate token" logic in the auth store.

**Why it happens:** Developer wants immediate feedback when user enters credentials.

**How to avoid:**
- Phase 17 scope: Pure storage (set/get/clear)
- Phase 18 scope: Validation happens in fetch layer
- Store tracks result (success/failed) but doesn't make requests
- Keep store synchronous, side-effect free

**Warning signs:**
- Async actions in auth store (beyond persist hydration)
- fetch() calls inside store actions
- "Loading" state for credential operations

### Pitfall 5: Credential Replace vs Merge Logic

**What goes wrong:** Adding a new Bearer token keeps the old Basic auth credentials, or user expects to have multiple Bearer tokens for same API.

**Why it happens:** Unclear replacement rules for same-type vs different-type credentials.

**How to avoid:**
- Decision from CONTEXT: Same type replaces (new Bearer replaces old Bearer)
- Different types can coexist (Bearer + API Key both stored)
- Store tracks "active" credential (one per API)
- Switching active doesn't delete others (silent store update)

**Warning signs:**
- Accumulating old credentials user can't find
- Confusion about which credential is actually used
- Requests sent with wrong credential type

## Code Examples

Verified patterns from official sources:

### Zustand Persist with sessionStorage
```typescript
// Source: Project configStore.ts + Zustand persist docs
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      credentials: {},
      authStatus: {},

      setCredential: (origin, credential) =>
        set((state) => ({
          credentials: { ...state.credentials, [origin]: credential }
        })),

      getCredential: (origin) => get().credentials[origin] ?? null,

      clearCredential: (origin) =>
        set((state) => {
          const { [origin]: _, ...rest } = state.credentials
          return { credentials: rest }
        }),

      clearAll: () => set({ credentials: {}, authStatus: {} })
    }),
    {
      name: 'api2ui-auth',
      version: 1,
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({ credentials: state.credentials })
    }
  )
)
```

### Origin Extraction
```typescript
// Source: MDN URL API docs
function getOrigin(url: string): string {
  try {
    return new URL(url).origin  // Returns "https://api.example.com:8080"
  } catch (error) {
    // Invalid URL, fallback to original (or throw)
    return url
  }
}

// Examples:
getOrigin('https://api.example.com/users?page=2')      // "https://api.example.com"
getOrigin('http://localhost:3000/api/data')             // "http://localhost:3000"
getOrigin('https://api.example.com:8080/v1/products')  // "https://api.example.com:8080"
```

### Basic Auth Header Construction
```typescript
// Source: MDN btoa() docs + RFC 7617
function createBasicAuthHeader(username: string, password: string): string {
  const credentials = `${username}:${password}`
  const encoded = btoa(credentials)  // Native browser base64 encoding
  return `Basic ${encoded}`
}

// Example:
createBasicAuthHeader('user', 'pass')  // "Basic dXNlcjpwYXNz"
```

### AuthError Class
```typescript
// Source: Project services/api/errors.ts pattern
export class AuthError extends Error implements AppError {
  readonly kind: ErrorKind = 'auth'
  readonly suggestion: string
  readonly status: 401 | 403
  readonly authContext: string

  constructor(url: string, status: 401 | 403, authContext: string) {
    super(`${status === 401 ? 'Authentication' : 'Authorization'} failed for ${url}`)
    this.name = 'AuthError'
    this.status = status
    this.authContext = authContext
    this.suggestion = status === 401
      ? 'Check your credentials. Authentication failed.'
      : 'Credentials valid but insufficient permissions.'
    Object.setPrototypeOf(this, AuthError.prototype)
  }
}
```

### Discriminated Union Pattern
```typescript
// Source: TypeScript Handbook + existing pattern usage
type Credential =
  | { type: 'bearer'; label: string; token: string }
  | { type: 'basic'; label: string; username: string; password: string }
  | { type: 'apiKey'; label: string; headerName: string; value: string }
  | { type: 'queryParam'; label: string; paramName: string; value: string }

function getAuthHeader(cred: Credential): string | null {
  switch (cred.type) {
    case 'bearer':
      return `Bearer ${cred.token}`
    case 'basic':
      return `Basic ${btoa(`${cred.username}:${cred.password}`)}`
    case 'apiKey':
      return null  // Custom header, not Authorization
    case 'queryParam':
      return null  // Query param, not header
  }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| localStorage for all state | sessionStorage for credentials | 2020+ | Tab-scoped security, auto-cleanup |
| Plain objects for credentials | Discriminated unions | TypeScript 2.0+ | Type safety, exhaustive checking |
| Manual JSON.stringify | Zustand persist middleware | Zustand 3.0+ | Automatic hydration, versioning |
| String enum for auth types | Literal union types | TypeScript 3.4+ | Better type narrowing |

**Deprecated/outdated:**
- **localStorage for credentials**: Persists forever, cross-tab leakage. Use sessionStorage.
- **Cookie-based credential storage**: Adds complexity (httpOnly, sameSite). Session-only needs don't require cookies.
- **Redux for simple key-value storage**: Overkill. Zustand is simpler, smaller, faster for this use case.

## Open Questions

Things that couldn't be fully resolved:

1. **Multi-credential support for same API**
   - What we know: User wants multiple credentials per API (prod token, staging token)
   - What's unclear: UI for selecting which one to use (dropdown? radio buttons?)
   - Recommendation: Phase 17 stores multiple, marks one "active". Phase 19 UI shows selector.

2. **Credential migration across sessions**
   - What we know: sessionStorage is tab-scoped, lost on close
   - What's unclear: Users might want import/export for sharing (Postman-style)
   - Recommendation: Deferred to future milestone per CONTEXT. Phase 17 is session-only.

3. **Sub-resource credentials**
   - What we know: Some APIs use different auth for `/public` vs `/admin`
   - What's unclear: Whether path-based scoping is needed
   - Recommendation: Start with origin-level (CONTEXT decision). Path-scoping is future enhancement if requested.

## Sources

### Primary (HIGH confidence)
- [Zustand Persist Middleware Docs](https://zustand.docs.pmnd.rs/middlewares/persist) - Official Zustand persist API
- [MDN URL.origin Property](https://developer.mozilla.org/en-US/docs/Web/API/URL/origin) - WHATWG URL standard
- [MDN btoa() Method](https://developer.mozilla.org/en-US/docs/Web/API/Window/btoa) - Base64 encoding API
- [TypeScript Discriminated Unions](https://www.typescriptlang.org/docs/handbook/unions-and-intersections.html) - Official TypeScript docs
- Project codebase patterns: `src/store/configStore.ts`, `src/store/parameterStore.ts`, `src/services/api/errors.ts`

### Secondary (MEDIUM confidence)
- [401 vs 403 HTTP Status Codes](https://www.permit.io/blog/401-vs-403-error-whats-the-difference) - Authentication vs authorization distinction
- [Securing Web Storage Best Practices](https://dev.to/rigalpatel001/securing-web-storage-localstorage-and-sessionstorage-best-practices-f00) - sessionStorage security guidance
- [TypeScript Custom Error Classes](https://javascript.info/custom-errors) - Error subclassing patterns

### Tertiary (LOW confidence)
- Web search results on credential storage (contradictory advice, needs official verification)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Zustand already installed, sessionStorage is native, patterns exist in codebase
- Architecture: HIGH - Following existing store patterns (configStore, parameterStore)
- Pitfalls: HIGH - Based on real browser behavior (sessionStorage limits, origin definition)
- Code examples: HIGH - Verified against project codebase and official docs

**Research date:** 2026-02-09
**Valid until:** 2026-03-09 (30 days - stable stack, unlikely to change)

**Key assumptions verified:**
- Zustand 5.0.11 supports sessionStorage (verified in docs)
- sessionStorage cleared on tab close (verified in MDN)
- URL.origin excludes path (verified in WHATWG spec)
- Discriminated unions provide exhaustive checking (verified in TypeScript handbook)
- Custom Error classes work with instanceof (verified in codebase usage)
