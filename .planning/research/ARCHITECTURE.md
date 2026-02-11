# Architecture Patterns: API Authentication Integration

**Domain:** Adding authentication to existing api2ui app
**Researched:** 2026-02-09
**Confidence:** HIGH

## Executive Summary

API authentication in React applications requires careful integration across the fetch pipeline, state management, UI layer, and error handling. For api2ui, authentication should be injected at the fetch layer via a wrapper around the existing `fetchAPI` function, with credentials managed in a dedicated Zustand store using sessionStorage for security. OpenAPI security scheme parsing feeds into UI generation, while 401/403 detection triggers re-authentication flows through existing error handling infrastructure.

**Key architectural decisions:**
- Fetch wrapper pattern for header/param injection (not interceptors, since native fetch doesn't support them)
- Dedicated `authStore` separate from `appStore` for credential lifecycle management
- sessionStorage + Zustand persist for session-scoped credential storage
- Extend existing error types to handle 401/403 with re-auth prompting
- Auth UI lives in Settings Panel as a dedicated "Authentication" section
- OpenAPI security schemes parsed during spec loading, feeding into auth config UI

## Recommended Architecture

### Data Flow: Authentication-Aware Fetch Pipeline

```
┌─────────────────────────────────────────────────────────────────┐
│ User Action (Fetch API / Submit Parameters)                     │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│ useAPIFetch Hook                                                 │
│ - fetchAndInfer(url)                                            │
│ - fetchOperation(baseUrl, operation, params)                    │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│ NEW: fetchWithAuth(url, options?)                               │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ 1. Get credentials from authStore.getCredentials(apiUrl)    │ │
│ │ 2. Inject auth headers/params based on auth type           │ │
│ │ 3. Call original fetchAPI(url, enhancedOptions)            │ │
│ │ 4. If 401/403: throw AuthError with retry metadata         │ │
│ └─────────────────────────────────────────────────────────────┘ │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│ services/api/fetcher.ts: fetchAPI(url, options)                 │
│ - Existing CORS/network/API error detection                     │
│ - Now receives auth-enhanced options from wrapper               │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│ Error Handling (services/api/errors.ts)                         │
│ - NEW: AuthError (401 Unauthorized, 403 Forbidden)             │
│ - Includes re-auth suggestion and retry capability             │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│ App.tsx / ErrorDisplay.tsx                                      │
│ - Detect AuthError → show re-auth prompt                       │
│ - "Update credentials" button → open auth settings             │
└─────────────────────────────────────────────────────────────────┘
```

### Component Boundaries

| Component | Responsibility | Communicates With |
|-----------|---------------|-------------------|
| `fetchWithAuth` (NEW) | Auth injection wrapper around `fetchAPI`. Reads credentials from store, injects headers/params, handles 401/403. | `authStore`, `fetchAPI`, error types |
| `authStore` (NEW) | Manages per-API credentials, session lifecycle, validation. Persists to sessionStorage. | `fetchWithAuth`, `AuthPanel` UI, OpenAPI parser |
| `AuthError` (NEW) | Error type for 401/403 responses with re-auth metadata. | `fetchWithAuth`, `ErrorDisplay` |
| `AuthPanel` (NEW) | UI for configuring auth per API. Form with auth type selector and credential inputs. | `authStore`, `ConfigPanel` (parent) |
| `parseSecuritySchemes` (NEW) | Extracts security schemes from OpenAPI spec. Returns auth type + metadata. | OpenAPI parser, `authStore`, `AuthPanel` |
| `useAPIFetch` (MODIFIED) | Replace `fetchAPI` calls with `fetchWithAuth`. Pass API base URL for credential lookup. | `fetchWithAuth`, existing stores |
| `ErrorDisplay` (MODIFIED) | Detect `AuthError` and show re-auth UI instead of generic error. | Error types, `authStore` |
| `ConfigPanel` (MODIFIED) | Add "Authentication" section alongside Fields/Components/Style. | `AuthPanel` |

### Integration Points with Existing Components

#### 1. Fetch Pipeline Integration (`src/services/api/`)

**Current state:**
- `fetchAPI(url: string)` in `fetcher.ts` is the single entry point for all API calls
- Returns raw data or throws typed errors (CORSError, NetworkError, APIError, ParseError)
- Called by `useAPIFetch` hook for both direct URLs and OpenAPI operations

**Integration approach:**
- Create `fetchWithAuth(url: string, options?: AuthOptions)` wrapper
- `fetchWithAuth` reads credentials from `authStore.getCredentials(url)`
- Injects auth based on type:
  - **API Key (header)**: Add to `headers` object
  - **Bearer Token**: Add `Authorization: Bearer ${token}` header
  - **Basic Auth**: Add `Authorization: Basic ${base64(user:pass)}` header
  - **Query Parameter**: Append to URL query string
- Call `fetchAPI(url, options)` with enhanced options
- Catch APIError, check for 401/403 status codes, re-throw as AuthError

**Modified files:**
- `src/services/api/fetcher.ts` — Add optional `options` parameter to `fetchAPI`, extend to accept custom headers
- NEW `src/services/api/auth.ts` — Contains `fetchWithAuth` wrapper and credential injection logic

#### 2. State Management Integration (`src/store/`)

**Current state:**
- `appStore`: Runtime state (url, loading, error, data, schema, parsedSpec)
- `configStore`: User preferences (fieldConfigs, theme, styleOverrides) — persisted to localStorage
- `parameterStore`: Parameter values per endpoint

**Integration approach:**
- Create NEW `authStore` separate from `appStore` to avoid polluting runtime state
- Use Zustand persist middleware with **sessionStorage** (not localStorage for security)
- Store structure:
  ```typescript
  interface AuthStore {
    // Per-API credentials: baseUrl -> AuthConfig
    credentials: Record<string, AuthConfig>

    // Actions
    setCredentials(baseUrl: string, config: AuthConfig): void
    clearCredentials(baseUrl: string): void
    getCredentials(baseUrl: string): AuthConfig | null
    hasCredentials(baseUrl: string): boolean
  }

  interface AuthConfig {
    type: 'apiKey' | 'bearer' | 'basic' | 'query'
    // API Key
    headerName?: string
    apiKey?: string
    // Bearer Token
    token?: string
    // Basic Auth
    username?: string
    password?: string
    // Query Parameter
    paramName?: string
    paramValue?: string
  }
  ```

**Why separate authStore:**
- Different lifecycle (credentials persist across sessions, runtime state doesn't)
- Different storage (sessionStorage for security vs localStorage for preferences)
- Clearer separation of concerns (auth is security-critical, appStore is transient)

**Modified files:**
- NEW `src/store/authStore.ts` — Credential management with sessionStorage persistence

#### 3. OpenAPI Integration (`src/services/openapi/`)

**Current state:**
- `parseOpenAPISpec` extracts operations, parameters, responseSchema from spec
- Results stored in `appStore.parsedSpec`
- Spec includes security schemes but they're not currently parsed

**Integration approach:**
- Add security scheme parsing to `parseOpenAPISpec`:
  ```typescript
  interface ParsedSpec {
    // Existing fields...
    securitySchemes?: Record<string, SecurityScheme>
    globalSecurity?: string[] // Global security requirements
  }

  interface SecurityScheme {
    type: 'apiKey' | 'http' | 'oauth2' | 'openIdConnect'
    // apiKey
    name?: string          // Header/query/cookie name
    in?: 'header' | 'query' | 'cookie'
    // http
    scheme?: string        // 'basic' | 'bearer'
    bearerFormat?: string  // 'JWT', etc.
    // oauth2 (future)
    flows?: unknown
    // openIdConnect (future)
    openIdConnectUrl?: string
  }
  ```
- Parse `components.securitySchemes` during spec loading
- Parse `security` field at root and operation levels
- Feed into `AuthPanel` to pre-populate auth type and suggest header/param names

**Modified files:**
- `src/services/openapi/parser.ts` — Add `extractSecuritySchemes` function
- `src/services/openapi/types.ts` — Add SecurityScheme types
- `src/store/appStore.ts` — Add securitySchemes to ParsedSpec interface

#### 4. UI Integration (`src/components/`)

**Current state:**
- `ConfigPanel`: Right-side panel with Fields/Components/Style sections
- `URLInput`: Landing page URL entry point
- `ErrorDisplay`: Shows typed errors with retry buttons

**Integration approach:**

##### ConfigPanel Enhancement
Add "Authentication" section to `ConfigPanel` alongside existing sections:
```tsx
<section>
  <h3>Authentication</h3>
  <AuthPanel />
</section>
```

Position: Between "Components" and "Style" sections (logical flow: data → components → auth → style)

##### AuthPanel Component (NEW)
```
┌─────────────────────────────────────────────────────┐
│ Authentication                                       │
├─────────────────────────────────────────────────────┤
│ API: https://api.example.com                        │
│                                                      │
│ Auth Type: [API Key ▼]                             │
│                                                      │
│ [If apiKey selected:]                               │
│   Header Name: [X-API-Key        ]                 │
│   API Key:     [•••••••••••••••  ] [Show]          │
│                                                      │
│ [If bearer selected:]                               │
│   Token:       [•••••••••••••••  ] [Show]          │
│                                                      │
│ [If basic selected:]                                │
│   Username:    [                 ]                  │
│   Password:    [•••••••••••••••  ] [Show]          │
│                                                      │
│ [If query selected:]                                │
│   Parameter:   [api_key          ]                 │
│   Value:       [•••••••••••••••  ] [Show]          │
│                                                      │
│ [Save] [Clear]                                      │
│                                                      │
│ OpenAPI detected: bearer (JWT)                      │
│ [Use OpenAPI Config]                                │
└─────────────────────────────────────────────────────┘
```

Features:
- Detect current API from `appStore.url` or `appStore.parsedSpec.baseUrl`
- If OpenAPI spec has security schemes, show detected type + "Use OpenAPI Config" button
- Manual override always available
- Password masking with show/hide toggle
- Save → `authStore.setCredentials(baseUrl, config)`
- Clear → `authStore.clearCredentials(baseUrl)`

##### ErrorDisplay Enhancement
Detect `AuthError` type and show special UI:
```
┌─────────────────────────────────────────────────────┐
│ ⚠ Authentication Required                           │
├─────────────────────────────────────────────────────┤
│ The API returned 401 Unauthorized.                  │
│                                                      │
│ This API requires authentication. Configure         │
│ credentials in settings to access this endpoint.    │
│                                                      │
│ [Open Auth Settings] [Retry]                        │
└─────────────────────────────────────────────────────┘
```

"Open Auth Settings" → Opens ConfigPanel + scrolls to Authentication section (similar to existing field config scrolling)

**New files:**
- `src/components/config/AuthPanel.tsx` — Auth configuration UI
- `src/components/config/AuthTypeSelector.tsx` — Dropdown for auth type selection
- `src/components/config/CredentialInput.tsx` — Masked input with show/hide toggle

**Modified files:**
- `src/components/config/ConfigPanel.tsx` — Add Authentication section
- `src/components/error/ErrorDisplay.tsx` — Add AuthError detection and special rendering

#### 5. Error Handling Integration (`src/services/api/errors.ts`)

**Current state:**
- Typed errors: CORSError, NetworkError, APIError, ParseError
- APIError has status code but no special handling for auth errors

**Integration approach:**
- Add new `AuthError` type for 401/403 responses:
  ```typescript
  export class AuthError extends Error implements AppError {
    readonly kind: ErrorKind = 'auth'
    readonly suggestion: string
    readonly status: 401 | 403
    readonly url: string

    constructor(url: string, status: 401 | 403) {
      super(`Authentication ${status === 401 ? 'required' : 'failed'} for ${url}`)
      this.name = 'AuthError'
      this.status = status
      this.url = url
      this.suggestion = status === 401
        ? 'This API requires authentication. Configure credentials in settings.'
        : 'Your credentials were rejected. Check your API key/token and try again.'
    }
  }
  ```
- `fetchWithAuth` catches APIError, checks status, re-throws as AuthError for 401/403
- All other status codes remain as APIError

**Modified files:**
- `src/services/api/errors.ts` — Add AuthError class
- `src/types/errors.ts` — Add 'auth' to ErrorKind union

## Authentication Injection Patterns

### Pattern 1: Fetch Wrapper (RECOMMENDED)

**Why fetch wrapper over interceptors:**
- Native `fetch` API doesn't support interceptors (unlike Axios)
- Interceptor pattern requires rewriting fetch globally or using third-party libraries
- Wrapper pattern is explicit, testable, and doesn't pollute global scope

**Implementation:**
```typescript
// src/services/api/auth.ts
import { fetchAPI } from './fetcher'
import { useAuthStore } from '../../store/authStore'
import { AuthError, APIError } from './errors'

export async function fetchWithAuth(url: string): Promise<unknown> {
  const authStore = useAuthStore.getState()

  // Extract base URL for credential lookup
  const baseUrl = extractBaseUrl(url)
  const credentials = authStore.getCredentials(baseUrl)

  // If no credentials configured, proceed without auth
  if (!credentials) {
    return fetchAPI(url)
  }

  // Inject auth based on type
  let authUrl = url
  const headers: Record<string, string> = {
    'Accept': 'application/json',
  }

  switch (credentials.type) {
    case 'apiKey':
      if (credentials.headerName && credentials.apiKey) {
        headers[credentials.headerName] = credentials.apiKey
      }
      break

    case 'bearer':
      if (credentials.token) {
        headers['Authorization'] = `Bearer ${credentials.token}`
      }
      break

    case 'basic':
      if (credentials.username && credentials.password) {
        const encoded = btoa(`${credentials.username}:${credentials.password}`)
        headers['Authorization'] = `Basic ${encoded}`
      }
      break

    case 'query':
      if (credentials.paramName && credentials.paramValue) {
        const separator = url.includes('?') ? '&' : '?'
        authUrl = `${url}${separator}${credentials.paramName}=${encodeURIComponent(credentials.paramValue)}`
      }
      break
  }

  try {
    // Call original fetch with auth-enhanced options
    return await fetchAPI(authUrl, { headers })
  } catch (error) {
    // Detect 401/403 and re-throw as AuthError
    if (error instanceof APIError && (error.status === 401 || error.status === 403)) {
      throw new AuthError(url, error.status)
    }
    throw error
  }
}

function extractBaseUrl(url: string): string {
  try {
    const parsed = new URL(url)
    return `${parsed.protocol}//${parsed.host}`
  } catch {
    return url.split('?')[0] // Fallback for relative URLs
  }
}
```

**Modification to fetchAPI signature:**
```typescript
// src/services/api/fetcher.ts
export async function fetchAPI(
  url: string,
  options?: { headers?: Record<string, string> }
): Promise<unknown> {
  let response: Response

  try {
    response = await fetch(url, {
      mode: 'cors',
      credentials: 'omit',
      headers: {
        'Accept': 'application/json',
        ...options?.headers, // Merge custom headers
      },
    })
  } catch (error) {
    // Existing error handling...
  }

  // Existing response handling...
}
```

**Integration into useAPIFetch:**
```typescript
// src/hooks/useAPIFetch.ts
import { fetchWithAuth } from '../services/api/auth'

export function useAPIFetch() {
  // ...existing code...

  const fetchAndInfer = async (url: string) => {
    try {
      clearFieldConfigs()

      if (isSpecUrl(url)) {
        await fetchSpec(url)
        return
      }

      clearSpec()
      startFetch()

      // CHANGED: Use fetchWithAuth instead of fetchAPI
      const data = await fetchWithAuth(url)

      const schema = inferSchema(data, url)
      fetchSuccess(data, schema)
    } catch (error) {
      // Existing error handling...
    }
  }

  const fetchOperation = async (
    baseUrl: string,
    operation: ParsedOperation,
    params: Record<string, string>
  ) => {
    try {
      startFetch()

      // Build URL with path/query params (existing logic)
      let fullUrl = baseUrl + operation.path
      // ...existing URL building...

      // CHANGED: Use fetchWithAuth instead of fetchAPI
      const data = await fetchWithAuth(fullUrl)

      const schema = inferSchema(data, fullUrl)
      fetchSuccess(data, schema)
    } catch (error) {
      // Existing error handling...
    }
  }

  return { fetchAndInfer, fetchSpec, fetchOperation }
}
```

### Pattern 2: OpenAPI Security Scheme Parsing

**Implementation:**
```typescript
// src/services/openapi/parser.ts
function extractSecuritySchemes(
  api: OpenAPIV3.Document | OpenAPIV2.Document
): Record<string, SecurityScheme> | undefined {
  if (!('components' in api) || !api.components?.securitySchemes) {
    return undefined
  }

  const schemes: Record<string, SecurityScheme> = {}

  for (const [name, schemeObj] of Object.entries(api.components.securitySchemes)) {
    const scheme = schemeObj as OpenAPIV3.SecuritySchemeObject

    if (scheme.type === 'apiKey') {
      schemes[name] = {
        type: 'apiKey',
        name: scheme.name,
        in: scheme.in as 'header' | 'query' | 'cookie',
      }
    } else if (scheme.type === 'http') {
      schemes[name] = {
        type: 'http',
        scheme: scheme.scheme, // 'basic' | 'bearer'
        bearerFormat: scheme.bearerFormat,
      }
    }
    // oauth2 and openIdConnect for future phases
  }

  return schemes
}

// Add to parseOpenAPISpec return value
return {
  title,
  version,
  specVersion,
  baseUrl,
  operations,
  securitySchemes: extractSecuritySchemes(api),
  globalSecurity: api.security?.map(req => Object.keys(req)[0]).filter(Boolean),
}
```

## Credential Storage Strategy

### sessionStorage vs localStorage: Security Analysis

Based on research findings, **sessionStorage is strongly preferred for authentication credentials** for api2ui:

| Aspect | sessionStorage | localStorage |
|--------|---------------|--------------|
| **Persistence** | Cleared on tab/browser close | Persists indefinitely |
| **XSS Protection** | None (both vulnerable) | None (both vulnerable) |
| **Attack Surface** | Expires with session | Accessible to other apps on file system |
| **Best for** | Session-scoped auth | User preferences, non-sensitive data |

**Why sessionStorage for api2ui:**
1. **Session lifecycle matches use case**: Users configure auth per session when exploring APIs
2. **Reduced risk**: Credentials auto-expire when browser closes
3. **No cross-session leakage**: Each browser session is isolated
4. **Industry standard**: Auth tokens stored in sessionStorage or in-memory per current best practices

**Security note:** Both sessionStorage and localStorage are vulnerable to XSS. To mitigate:
- Content Security Policy (CSP) headers (deployment concern, not runtime)
- Input sanitization (already handled by React's escaping)
- No `dangerouslySetInnerHTML` usage (already avoided in codebase)

**Implementation:**
```typescript
// src/store/authStore.ts
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

interface AuthStore {
  credentials: Record<string, AuthConfig>
  setCredentials: (baseUrl: string, config: AuthConfig) => void
  clearCredentials: (baseUrl: string) => void
  getCredentials: (baseUrl: string) => AuthConfig | null
  hasCredentials: (baseUrl: string) => boolean
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      credentials: {},

      setCredentials: (baseUrl, config) =>
        set((state) => ({
          credentials: { ...state.credentials, [baseUrl]: config },
        })),

      clearCredentials: (baseUrl) =>
        set((state) => {
          const { [baseUrl]: _, ...rest } = state.credentials
          return { credentials: rest }
        }),

      getCredentials: (baseUrl) => {
        const state = get()
        return state.credentials[baseUrl] ?? null
      },

      hasCredentials: (baseUrl) => {
        const state = get()
        return baseUrl in state.credentials
      },
    }),
    {
      name: 'api2ui-auth',
      storage: createJSONStorage(() => sessionStorage), // SESSION STORAGE
      version: 1,
    }
  )
)
```

### Alternative: In-Memory Only (More Secure, Worse UX)

For maximum security, credentials could be stored only in-memory (lost on page refresh). This is the most secure approach but creates poor UX for api2ui's exploratory use case:

```typescript
// No persist middleware, just plain zustand
export const useAuthStore = create<AuthStore>()((set, get) => ({
  credentials: {},
  // ...same actions...
}))
```

**Tradeoff:**
- **More secure**: Credentials never touch disk/storage
- **Worse UX**: Users must re-enter credentials on every page refresh
- **Not recommended for api2ui**: Exploration workflow involves frequent refreshes/navigation

## 401/403 Detection and Re-Authentication Flow

### Error Detection Strategy

**Implementation in fetchWithAuth:**
```typescript
try {
  return await fetchAPI(authUrl, { headers })
} catch (error) {
  if (error instanceof APIError) {
    // Detect authentication errors
    if (error.status === 401 || error.status === 403) {
      throw new AuthError(url, error.status)
    }
  }
  // Re-throw all other errors unchanged
  throw error
}
```

### Re-Authentication UI Flow

```
┌──────────────────────────────────────────────────────────┐
│ 1. User fetches API → 401 response                      │
└────────────────┬─────────────────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────────────────┐
│ 2. fetchWithAuth throws AuthError                        │
└────────────────┬─────────────────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────────────────┐
│ 3. App.tsx catches, stores in appStore.error            │
└────────────────┬─────────────────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────────────────┐
│ 4. ErrorDisplay detects error.kind === 'auth'           │
│    Renders special auth error UI                        │
└────────────────┬─────────────────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────────────────┐
│ 5. User clicks "Open Auth Settings"                     │
│    → configStore.togglePanel()                          │
│    → Scroll to Authentication section                   │
└────────────────┬─────────────────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────────────────┐
│ 6. User configures credentials                          │
│    → authStore.setCredentials(baseUrl, config)          │
└────────────────┬─────────────────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────────────────┐
│ 7. User clicks "Retry"                                  │
│    → Calls fetchWithAuth again (now with credentials)   │
└──────────────────────────────────────────────────────────┘
```

### ErrorDisplay Enhancement

```typescript
// src/components/error/ErrorDisplay.tsx
import { useConfigStore } from '../../store/configStore'
import type { AuthError } from '../../services/api/errors'

export function ErrorDisplay({
  error,
  onRetry
}: {
  error: Error
  onRetry?: () => void
}) {
  const { togglePanel } = useConfigStore()

  // Detect auth error
  const isAuthError = 'kind' in error && error.kind === 'auth'

  const handleOpenAuthSettings = () => {
    togglePanel() // Open panel

    // Scroll to auth section after panel opens
    setTimeout(() => {
      const authSection = document.querySelector('[data-section="authentication"]')
      authSection?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 150)
  }

  if (isAuthError) {
    const authError = error as AuthError
    return (
      <div className="border border-yellow-300 bg-yellow-50 rounded-lg p-6">
        <div className="flex items-start gap-3">
          <svg className="w-6 h-6 text-yellow-600 flex-shrink-0" /* ... warning icon ... */ />
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-yellow-900 mb-2">
              Authentication {authError.status === 401 ? 'Required' : 'Failed'}
            </h3>
            <p className="text-yellow-800 mb-4">{authError.suggestion}</p>
            <div className="flex gap-2">
              <button
                onClick={handleOpenAuthSettings}
                className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
              >
                Open Auth Settings
              </button>
              {onRetry && (
                <button
                  onClick={onRetry}
                  className="px-4 py-2 bg-white border border-yellow-600 text-yellow-700 rounded-lg hover:bg-yellow-50"
                >
                  Retry
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Existing error rendering for other error types...
}
```

## Build Order and Dependencies

Recommended implementation order based on existing architecture dependencies:

### Phase 1: Foundation (No Dependencies)
1. **Error types** (`src/services/api/errors.ts`)
   - Add `AuthError` class
   - Extend `ErrorKind` type
   - **Why first:** No dependencies, required by all other components

2. **Auth store** (`src/store/authStore.ts`)
   - Zustand store with sessionStorage persistence
   - Credential CRUD operations
   - **Why second:** No dependencies, required by fetch wrapper and UI

### Phase 2: Fetch Integration (Depends on Phase 1)
3. **Fetch wrapper** (`src/services/api/auth.ts`)
   - `fetchWithAuth` function
   - Credential injection logic
   - 401/403 → AuthError transformation
   - **Why third:** Requires AuthError and authStore, required by hooks

4. **Modify fetchAPI** (`src/services/api/fetcher.ts`)
   - Add optional headers parameter
   - **Why fourth:** Required by fetchWithAuth

5. **Modify useAPIFetch** (`src/hooks/useAPIFetch.ts`)
   - Replace `fetchAPI` calls with `fetchWithAuth`
   - **Why fifth:** Requires fetchWithAuth, completes fetch pipeline

### Phase 3: OpenAPI Integration (Depends on Phase 1, 2)
6. **Security scheme types** (`src/services/openapi/types.ts`)
   - Add SecurityScheme interface
   - Extend ParsedSpec interface
   - **Why sixth:** No dependencies, required by parser

7. **Security scheme parser** (`src/services/openapi/parser.ts`)
   - Extract security schemes from spec
   - **Why seventh:** Requires types, feeds into UI

### Phase 4: UI Layer (Depends on Phase 1, 2, 3)
8. **AuthPanel component** (`src/components/config/AuthPanel.tsx`)
   - Auth type selector
   - Credential inputs
   - OpenAPI scheme detection
   - **Why eighth:** Requires authStore and OpenAPI types

9. **Modify ConfigPanel** (`src/components/config/ConfigPanel.tsx`)
   - Add Authentication section
   - **Why ninth:** Requires AuthPanel component

10. **Modify ErrorDisplay** (`src/components/error/ErrorDisplay.tsx`)
    - Detect AuthError
    - Render re-auth UI
    - **Why tenth:** Requires AuthError type and ConfigPanel integration

### Dependency Graph

```
Phase 1 (Foundation)
  ├─ AuthError
  └─ authStore
      │
Phase 2 (Fetch)
  ├─ fetchWithAuth ───depends on──→ AuthError, authStore
  ├─ fetchAPI (modified)
  └─ useAPIFetch (modified) ───depends on──→ fetchWithAuth
      │
Phase 3 (OpenAPI)
  ├─ SecurityScheme types
  └─ parseSecuritySchemes ───depends on──→ SecurityScheme types
      │
Phase 4 (UI)
  ├─ AuthPanel ───depends on──→ authStore, SecurityScheme types
  ├─ ConfigPanel (modified) ───depends on──→ AuthPanel
  └─ ErrorDisplay (modified) ───depends on──→ AuthError, ConfigPanel
```

## Anti-Patterns to Avoid

### Anti-Pattern 1: Storing Credentials in localStorage

**What goes wrong:** Credentials persist indefinitely, accessible to other processes on user's machine, greater XSS attack surface.

**Why it happens:** localStorage is the default for Zustand persist examples, developers reach for it without considering security.

**Instead:** Use sessionStorage for session-scoped credentials, or in-memory for maximum security.

### Anti-Pattern 2: Global Fetch Interceptor Rewrite

**What goes wrong:** Rewriting `window.fetch` globally affects all third-party libraries, causes hard-to-debug issues, pollutes global scope.

**Why it happens:** Copying Axios interceptor patterns without understanding fetch API limitations.

**Instead:** Use explicit fetch wrapper (`fetchWithAuth`) that wraps the specific `fetchAPI` function.

### Anti-Pattern 3: Auth Logic in UI Components

**What goes wrong:** Credential injection scattered across components, hard to test, inconsistent behavior.

**Why it happens:** Quick fix mentality, adding headers directly in `URLInput` or `ParameterForm`.

**Instead:** Centralize auth logic in `fetchWithAuth` service layer, components remain auth-agnostic.

### Anti-Pattern 4: Single Global Auth Config

**What goes wrong:** User can only configure auth for one API at a time, switching APIs requires reconfiguring.

**Why it happens:** Simplest data structure, single `AuthConfig` object instead of per-API map.

**Instead:** Per-API credential storage keyed by base URL (`Record<string, AuthConfig>`).

### Anti-Pattern 5: Treating 401 and 403 Identically

**What goes wrong:** 403 means authenticated but unauthorized (wrong user), re-entering same credentials won't help.

**Why it happens:** Both are "auth errors," developers handle them the same way.

**Instead:**
- **401**: Show "Authentication Required" → prompt for credentials
- **403**: Show "Access Forbidden" → suggest checking account permissions or switching accounts

### Anti-Pattern 6: Ignoring OpenAPI Security Schemes

**What goes wrong:** User must manually configure auth even though spec defines it, poor UX.

**Why it happens:** Treating OpenAPI as just endpoint metadata, not leveraging security scheme definitions.

**Instead:** Parse security schemes, pre-populate auth UI with detected type and metadata, offer "Use OpenAPI Config" shortcut.

## Security Considerations

### XSS Mitigation

Both sessionStorage and localStorage are vulnerable to XSS attacks. Mitigation strategies:

1. **React's built-in escaping**: Already prevents XSS in rendered content
2. **No `dangerouslySetInnerHTML`**: Audit codebase to ensure no usage
3. **CSP headers**: Add Content-Security-Policy in deployment (nginx/CDN config)
4. **Input sanitization**: Validate credential inputs (no script tags, etc.)

### Credential Masking

**Implementation:**
```typescript
// src/components/config/CredentialInput.tsx
export function CredentialInput({
  value,
  onChange,
  placeholder
}: {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}) {
  const [visible, setVisible] = useState(false)

  return (
    <div className="relative">
      <input
        type={visible ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="pr-10 /* ...styles... */"
      />
      <button
        type="button"
        onClick={() => setVisible(!visible)}
        className="absolute right-2 top-1/2 -translate-y-1/2"
      >
        {visible ? <EyeOffIcon /> : <EyeIcon />}
      </button>
    </div>
  )
}
```

### HTTPS Requirement

**Warning in UI:**
```typescript
// In AuthPanel, show warning for http:// URLs
{baseUrl.startsWith('http://') && (
  <div className="text-sm text-yellow-700 bg-yellow-50 p-2 rounded">
    ⚠️ Warning: Sending credentials over HTTP is insecure. Use HTTPS APIs in production.
  </div>
)}
```

## Testing Strategy

### Unit Tests

1. **fetchWithAuth tests:**
   - Injects API key header correctly
   - Injects bearer token correctly
   - Injects basic auth correctly
   - Appends query parameter correctly
   - Throws AuthError on 401
   - Throws AuthError on 403
   - Passes through other errors unchanged

2. **authStore tests:**
   - Stores credentials per base URL
   - Retrieves credentials by base URL
   - Clears credentials
   - Persists to sessionStorage
   - Handles missing credentials gracefully

3. **parseSecuritySchemes tests:**
   - Parses apiKey scheme
   - Parses http bearer scheme
   - Parses http basic scheme
   - Returns undefined for spec without security

### Integration Tests

1. **Fetch pipeline:**
   - URL input → fetchWithAuth → renders data (with auth)
   - 401 response → AuthError → ErrorDisplay → re-auth flow

2. **OpenAPI flow:**
   - Parse spec with security schemes → AuthPanel shows detected type → user saves → fetch succeeds

### Manual Testing Checklist

- [ ] Configure API key auth, verify header sent
- [ ] Configure bearer token auth, verify header sent
- [ ] Configure basic auth, verify header sent
- [ ] Configure query param auth, verify param appended
- [ ] Fetch API without auth → 401 → configure auth → retry → success
- [ ] Switch between APIs, verify credentials isolated per base URL
- [ ] Close browser tab, reopen, verify credentials cleared (sessionStorage)
- [ ] OpenAPI spec with security scheme → verify pre-populated in UI

## Confidence Assessment

| Area | Confidence | Reason |
|------|------------|--------|
| Fetch wrapper pattern | HIGH | Industry standard for native fetch, verified in search results and existing codebase structure |
| sessionStorage strategy | HIGH | Security research strongly favors sessionStorage over localStorage for credentials |
| Zustand store architecture | HIGH | Consistent with existing configStore/parameterStore patterns in codebase |
| OpenAPI security parsing | MEDIUM | OpenAPI spec structure well-documented, but integration with existing parser needs validation |
| Error handling integration | HIGH | Existing error infrastructure (typed errors, ErrorDisplay) maps cleanly to auth errors |
| UI placement | MEDIUM | ConfigPanel is logical location, but user testing would validate discoverability |

## Open Questions

1. **OAuth2 flows**: Current design supports API key/bearer/basic. OAuth2 requires redirect flow—defer to future phase?
2. **Multi-auth APIs**: Some APIs support multiple auth types simultaneously. Current design assumes one auth config per API—is this sufficient?
3. **Credential validation**: Should UI validate credentials before saving (e.g., test request)? Or save immediately and let first fetch validate?
4. **Per-operation auth**: OpenAPI allows security requirements per operation. Current design applies auth globally per base URL—is operation-level granularity needed?
5. **Credential export/import**: Should users be able to export/import auth configs (e.g., for sharing with team)? Security implications?

## References

### Authentication Patterns
- [React + Fetch - Set Authorization Header for API Requests](https://jasonwatmore.com/post/2021/09/17/react-fetch-set-authorization-header-for-api-requests-if-user-logged-in)
- [Intercepting JavaScript Fetch API requests and responses](https://blog.logrocket.com/intercepting-javascript-fetch-api-requests-responses/)
- [Redux Toolkit fetchBaseQuery - Authentication](https://redux-toolkit.js.org/rtk-query/api/fetchBaseQuery)
- [Replace axios with a simple custom fetch wrapper](https://kentcdodds.com/blog/replace-axios-with-a-simple-custom-fetch-wrapper)

### State Management
- [Managing User Sessions with Zustand in React](https://medium.com/@jkc5186/managing-user-sessions-with-zustand-in-react-5bf30f6bc536)
- [Authentication store with zustand](https://doichevkostia.dev/blog/authentication-store-with-zustand/)
- [Authentication in React and Next.js Apps with Zustand](https://blog.stackademic.com/zustand-for-authentication-in-react-apps-156b6294129c)

### OpenAPI Security
- [Describing API Security - OpenAPI Documentation](https://learn.openapis.org/specification/security.html)
- [Security Schemes in OpenAPI](https://www.speakeasy.com/openapi/security/security-schemes)
- [Authentication - Swagger Docs](https://swagger.io/docs/specification/v3_0/authentication/)

### Error Handling
- [React + Fetch - Logout on 401 Unauthorized or 403 Forbidden](https://jasonwatmore.com/post/2021/09/27/react-fetch-logout-on-401-unauthorized-or-403-forbidden-http-response)
- [Handle 401 errors in a cleaner way with Axios interceptors](https://dev.to/idboussadel/handle-401-errors-in-a-cleaner-way-with-axios-interceptors-5hkk)

### Security
- [Managing user sessions: localStorage vs sessionStorage vs cookies](https://stytch.com/blog/localstorage-vs-sessionstorage-vs-cookies/)
- [Best Practices for Storing Access Tokens in the Browser](https://curity.medium.com/best-practices-for-storing-access-tokens-in-the-browser-6b3d515d9814)
- [Local Storage vs Cookies: Securely Store Session Tokens](https://www.pivotpointsecurity.com/local-storage-versus-cookies-which-to-use-to-securely-store-session-tokens/)
- [How to Store Session Tokens in a Browser](https://blog.ropnop.com/storing-tokens-in-browser/)
