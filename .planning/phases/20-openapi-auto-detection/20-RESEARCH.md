# Phase 20: OpenAPI Auto-Detection - Research

**Researched:** 2026-02-10
**Domain:** OpenAPI/Swagger security scheme parsing
**Confidence:** HIGH

## Summary

OpenAPI 3.x and Swagger 2.0 both provide structured ways to declare authentication requirements in specifications. OpenAPI 3.x uses `components.securitySchemes` (introduced in 3.0) while Swagger 2.0 uses `securityDefinitions` (replaced in 3.0). The project already uses `@apidevtools/swagger-parser@12.1.0` with `openapi-types@12.1.3` for parsing specs, so extending the existing `parseOpenAPISpec()` function is the standard approach.

The key technical challenge is mapping OpenAPI's four security scheme types (`apiKey`, `http`, `oauth2`, `openIdConnect`) to api2ui's four auth types (`apiKey`, `queryParam`, `bearer`, `basic`). Direct mapping exists for bearer and basic (via `http` type with scheme discriminator), while apiKey requires checking the `in` field to distinguish header-based (→ `apiKey`) from query-based (→ `queryParam`) authentication.

OAuth 2.0 and OpenID Connect have no direct mapping and should display user-visible warnings rather than crash or silently fail.

**Primary recommendation:** Extend `parseOpenAPISpec()` to extract security schemes, create a pure mapping function to convert OpenAPI security objects to api2ui auth type suggestions, and pass this metadata to AuthPanel as optional pre-population data.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| openapi-types | 12.1.3 | TypeScript definitions for OpenAPI 3.x and Swagger 2.0 | Official type definitions, already installed as devDependency |
| @apidevtools/swagger-parser | 12.1.0 | Parse and dereference OpenAPI/Swagger specs | Industry-standard parser, handles $ref resolution and version differences, already in use |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| N/A | N/A | No additional libraries needed | Existing stack is sufficient |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| openapi-types | Manual type definitions | openapi-types provides battle-tested, version-aware types from the spec maintainers |
| @apidevtools/swagger-parser | openapi-typescript | swagger-parser does runtime parsing, openapi-typescript is for compile-time type generation |

**Installation:**
No new packages required — extend existing infrastructure.

## Architecture Patterns

### Recommended Project Structure
```
src/
├── services/openapi/
│   ├── parser.ts              # Main parsing logic (extend this)
│   ├── types.ts               # ParsedSpec interface (extend this)
│   └── security-mapper.ts     # NEW: Map OpenAPI schemes to api2ui types
├── components/auth/
│   └── AuthPanel.tsx          # Extend props to accept detected schemes
└── hooks/
    └── useAPIFetch.ts         # Pass detected schemes to AuthPanel
```

### Pattern 1: Security Scheme Extraction
**What:** Extract security schemes during spec parsing, separate from operation parsing
**When to use:** During `parseOpenAPISpec()` execution, after dereferencing but before returning
**Example:**
```typescript
// Source: OpenAPI 3.0 spec structure + existing parser.ts pattern
function extractSecuritySchemes(
  api: OpenAPIV3.Document | OpenAPIV2.Document,
  isOpenAPI3: boolean
): Record<string, OpenAPIV3.SecuritySchemeObject | OpenAPIV2.SecuritySchemeObject> {
  if (isOpenAPI3) {
    const doc = api as OpenAPIV3.Document
    return doc.components?.securitySchemes ?? {}
  } else {
    const doc = api as OpenAPIV2.Document
    return doc.securityDefinitions ?? {}
  }
}
```

### Pattern 2: Discriminated Union Type Guards
**What:** Use TypeScript type guards to safely narrow security scheme types
**When to use:** When mapping OpenAPI security schemes to api2ui auth types
**Example:**
```typescript
// Source: openapi-types discriminated unions
function isApiKeyScheme(
  scheme: OpenAPIV3.SecuritySchemeObject
): scheme is OpenAPIV3.ApiKeySecurityScheme {
  return scheme.type === 'apiKey'
}

function isHttpScheme(
  scheme: OpenAPIV3.SecuritySchemeObject
): scheme is OpenAPIV3.HttpSecurityScheme {
  return scheme.type === 'http'
}
```

### Pattern 3: Mapping with Unsupported Fallback
**What:** Map supported schemes to auth types, collect unsupported schemes separately
**When to use:** Converting OpenAPI security schemes to ui2api auth configuration
**Example:**
```typescript
// Source: Requirement SPEC-04 + pattern from existing codebase
interface DetectedAuth {
  supported: Array<{
    type: AuthType
    metadata: Record<string, string>
    label: string
  }>
  unsupported: Array<{
    type: string
    reason: string
  }>
}

function mapSecuritySchemes(
  schemes: Record<string, SecuritySchemeObject>
): DetectedAuth {
  const supported = []
  const unsupported = []

  for (const [name, scheme] of Object.entries(schemes)) {
    if (scheme.type === 'apiKey' && scheme.in === 'header') {
      supported.push({
        type: 'apiKey',
        metadata: { headerName: scheme.name },
        label: name
      })
    } else if (scheme.type === 'oauth2') {
      unsupported.push({
        type: 'oauth2',
        reason: 'OAuth 2.0 requires manual configuration'
      })
    }
    // ... more cases
  }

  return { supported, unsupported }
}
```

### Anti-Patterns to Avoid
- **Parsing security at component mount:** Parse during spec fetch, not in React components
- **Mutating ParsedSpec after return:** Extract security schemes during parsing, return immutable object
- **Ignoring version differences:** OpenAPI 3.x uses `components.securitySchemes`, Swagger 2.0 uses `securityDefinitions` at root level
- **Silent OAuth/OIDC failures:** Always show warnings for unsupported schemes

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| OpenAPI type definitions | Custom interfaces | openapi-types package | Handles all version differences (2.0, 3.0.x, 3.1.x), discriminated unions, optional fields |
| Spec dereferencing | Manual $ref resolution | swagger-parser.dereference() | Handles circular refs, external files, maintains object reference equality |
| Security scheme type narrowing | String comparison | TypeScript type guards | Type-safe discrimination, IDE autocomplete, compile-time checks |

**Key insight:** OpenAPI specifications have subtle version differences (e.g., `securityDefinitions` → `components.securitySchemes`, `http.scheme` values, OAuth flow names). The `openapi-types` package encodes all these differences as TypeScript types, preventing runtime errors from version mismatches.

## Common Pitfalls

### Pitfall 1: Global vs Per-Operation Security
**What goes wrong:** Parsing global `security` field and assuming it applies to all operations
**Why it happens:** OpenAPI allows per-operation security to override global security
**How to avoid:** For Phase 20 scope, only extract `securitySchemes` definitions, not `security` requirements. Per-operation security is explicitly out of scope per user decisions.
**Warning signs:** Tests with specs that have operation-level security overrides (empty array `security: []` removes auth)

### Pitfall 2: Cookie Authentication Not Mapped
**What goes wrong:** `apiKey` with `in: cookie` gets mapped to api2ui auth types
**Why it happens:** api2ui's `queryParam` and `apiKey` types only handle query params and headers
**How to avoid:** Explicitly check `scheme.in === 'cookie'` and add to unsupported list
**Warning signs:** Spec with cookie-based session auth fails silently

### Pitfall 3: Bearer Format Assumption
**What goes wrong:** Assuming bearer tokens are always JWTs
**Why it happens:** Most modern APIs use JWT for bearer tokens
**How to avoid:** OpenAPI 3.x includes optional `bearerFormat` hint (e.g., "JWT"), but it's documentation-only. Map all `http.scheme: bearer` to api2ui's `bearer` type regardless of format.
**Warning signs:** API expects opaque bearer tokens, not JWTs

### Pitfall 4: Multiple Security Schemes of Same Type
**What goes wrong:** Spec defines multiple API key schemes (e.g., `X-API-Key` and `X-Client-Id`), planner tries to pre-populate both
**Why it happens:** api2ui stores one credential per auth type, not multiple
**How to avoid:** For Phase 20, detect and list all schemes but only pre-populate the first of each type. Document limitation.
**Warning signs:** Spec with `X-API-Key` and `X-Admin-Key` both type `apiKey`

### Pitfall 5: Swagger Parser Dereferencing Security Schemes
**What goes wrong:** Assumption that `dereference()` removes `components.securitySchemes`
**Why it happens:** Confusion about what dereferencing means
**How to avoid:** Per swagger-parser docs, `dereference()` resolves all `$ref` pointers. Security schemes are referenced by name (not `$ref`), so they remain in `components.securitySchemes` after dereferencing.
**Warning signs:** Empty security schemes object after parsing

### Pitfall 6: Swagger 2.0 HTTP Auth Naming
**What goes wrong:** Looking for `type: http` in Swagger 2.0 specs
**Why it happens:** OpenAPI 3.0 renamed `basic` to `http` with `scheme: basic`
**How to avoid:** In Swagger 2.0, basic auth uses `type: basic` directly (no `scheme` field). Check version before parsing.
**Warning signs:** Swagger 2.0 spec with basic auth not detected

## Code Examples

Verified patterns from official sources:

### OpenAPI 3.x Security Scheme Structure
```yaml
# Source: https://swagger.io/docs/specification/v3_0/authentication/
components:
  securitySchemes:
    # API Key in header
    ApiKeyAuth:
      type: apiKey
      in: header
      name: X-API-Key

    # API Key in query
    ApiKeyQuery:
      type: apiKey
      in: query
      name: api_key

    # Bearer token
    BearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT  # Optional hint

    # Basic auth
    BasicAuth:
      type: http
      scheme: basic

    # OAuth 2.0 (unsupported in api2ui)
    OAuth2:
      type: oauth2
      flows:
        authorizationCode:
          authorizationUrl: https://example.com/oauth/authorize
          tokenUrl: https://example.com/oauth/token
          scopes:
            read: Read access
            write: Write access

    # OpenID Connect (unsupported in api2ui)
    OpenIDConnect:
      type: openIdConnect
      openIdConnectUrl: https://example.com/.well-known/openid-configuration
```

### Swagger 2.0 Security Definitions Structure
```yaml
# Source: https://swagger.io/specification/v2/
securityDefinitions:
  # API Key (header or query, not cookie)
  api_key:
    type: apiKey
    name: api_key
    in: header

  # Basic auth (no 'scheme' field in 2.0)
  basic_auth:
    type: basic

  # OAuth 2.0 (unsupported in api2ui)
  oauth2:
    type: oauth2
    authorizationUrl: https://example.com/oauth/authorize
    flow: implicit
    scopes:
      read: Read access
```

### TypeScript Type Narrowing Pattern
```typescript
// Source: openapi-types discriminated unions + TypeScript handbook
import type { OpenAPIV3, OpenAPIV2 } from 'openapi-types'

type SecurityScheme = OpenAPIV3.SecuritySchemeObject | OpenAPIV2.SecuritySchemeObject

function mapToAuthType(scheme: SecurityScheme): AuthType | null {
  // OpenAPI 3.x apiKey
  if ('type' in scheme && scheme.type === 'apiKey') {
    if (scheme.in === 'header') return 'apiKey'
    if (scheme.in === 'query') return 'queryParam'
    // scheme.in === 'cookie' -> return null (unsupported)
    return null
  }

  // OpenAPI 3.x http
  if ('type' in scheme && scheme.type === 'http') {
    if (scheme.scheme === 'bearer') return 'bearer'
    if (scheme.scheme === 'basic') return 'basic'
    return null
  }

  // Swagger 2.0 basic
  if ('type' in scheme && scheme.type === 'basic') {
    return 'basic'
  }

  // oauth2, openIdConnect -> null (unsupported)
  return null
}
```

### Extending ParsedSpec Interface
```typescript
// Source: Existing src/services/openapi/types.ts pattern
export interface ParsedSecurityScheme {
  /** Original scheme name from spec */
  name: string
  /** Mapped api2ui auth type (null if unsupported) */
  authType: AuthType | null
  /** Metadata for pre-population */
  metadata: {
    headerName?: string    // For apiKey type
    paramName?: string     // For queryParam type
  }
  /** Human-readable label */
  description?: string
}

export interface ParsedSpec {
  title: string
  version: string
  specVersion: string
  baseUrl: string
  operations: ParsedOperation[]
  securitySchemes: ParsedSecurityScheme[]  // NEW: Detected auth schemes
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Swagger 2.0 `type: basic` | OpenAPI 3.x `type: http, scheme: basic` | OpenAPI 3.0 (2017) | Must check spec version before parsing security schemes |
| `securityDefinitions` at root | `components.securitySchemes` | OpenAPI 3.0 (2017) | Path to security schemes differs by version |
| OAuth 2.0 flow names (`accessCode`, `application`) | OAuth 2.0 flows (`authorizationCode`, `clientCredentials`) | OpenAPI 3.0 (2017) | Field names changed, not just moved |
| No OpenID Connect support | `type: openIdConnect` | OpenAPI 3.0 (2017) | New security type, no Swagger 2.0 equivalent |

**Deprecated/outdated:**
- **Swagger 2.0 `type: basic`:** Replaced by `type: http, scheme: basic` in OpenAPI 3.x
- **Root-level `securityDefinitions`:** Moved to `components.securitySchemes` in OpenAPI 3.x
- **Cookie auth in `apiKey`:** Supported in OpenAPI 3.x (`in: cookie`) but not Swagger 2.0 (only `query` or `header`)

## Open Questions

Things that couldn't be fully resolved:

1. **Multiple schemes of same type**
   - What we know: api2ui stores one credential per auth type
   - What's unclear: How to handle specs with multiple API keys (e.g., `X-API-Key` and `X-Admin-Key`)
   - Recommendation: Detect all, pre-populate first of each type, document limitation in warning

2. **Scheme selection priority**
   - What we know: Specs can define multiple security schemes globally
   - What's unclear: Which scheme to pre-select when spec has both bearer and API key?
   - Recommendation: Pre-populate all detected schemes in parallel (user can switch types). No auto-selection.

3. **Security requirement scopes**
   - What we know: OAuth 2.0 and OpenID Connect use scopes in `security` requirement objects
   - What's unclear: Whether to parse global `security` field for scope hints (out of scope per user decision)
   - Recommendation: Phase 20 only parses scheme definitions. Scopes ignored (OAuth/OIDC unsupported anyway).

## Sources

### Primary (HIGH confidence)
- [OpenAPI 3.0.3 Specification](https://spec.openapis.org/oas/v3.0.3) - Security Scheme Object structure
- [Swagger 2.0 Specification](https://swagger.io/specification/v2/) - Security Definitions Object structure
- [Swagger Authentication Documentation](https://swagger.io/docs/specification/v3_0/authentication/) - All four security scheme types with examples
- [OpenAPI Security Guide](https://learn.openapis.org/specification/security.html) - Global vs per-operation security, requirement objects
- openapi-types@12.1.3 - TypeScript type definitions (installed locally)
- @apidevtools/swagger-parser@12.1.0 - Dereferencing behavior (installed locally)

### Secondary (MEDIUM confidence)
- [Speakeasy Security Schemes Guide](https://www.speakeasy.com/openapi/security/security-schemes) - Security scheme types and patterns (verified against official spec)
- [Swagger Cookie Authentication](https://swagger.io/docs/specification/v3_0/authentication/cookie-authentication/) - Cookie auth details and CSRF warnings
- [Medium: OpenAPI 3.0 vs Swagger 2.0](https://medium.com/@tgtshanika/open-api-3-0-vs-swagger-2-0-94a80f121022) - Security definition differences (verified against official spec)
- [Stoplight: OpenAPI Version Differences](https://blog.stoplight.io/difference-between-open-v2-v3-v31) - Version comparison (verified against official spec)

### Tertiary (LOW confidence)
- None — all findings verified with official documentation or installed packages

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Uses existing installed packages (openapi-types, swagger-parser), no new dependencies
- Architecture: HIGH - Extends existing parser.ts pattern, verified with official OpenAPI spec structure
- Pitfalls: HIGH - Based on official spec differences (2.0 vs 3.x) and user-provided scope constraints

**Research date:** 2026-02-10
**Valid until:** 2026-03-10 (30 days — OpenAPI spec is stable, core libraries mature)
