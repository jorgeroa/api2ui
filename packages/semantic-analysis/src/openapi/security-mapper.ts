import type { OpenAPIV3, OpenAPIV2 } from 'openapi-types'
import type { ParsedSecurityScheme } from './types'

/**
 * Map OpenAPI/Swagger security schemes to api2aux auth types.
 *
 * @param schemes - Record of security scheme name to scheme object
 * @returns Array of parsed security schemes with mapped auth types
 */
export function mapSecuritySchemes(
  schemes: Record<string, OpenAPIV3.SecuritySchemeObject | OpenAPIV2.SecuritySchemeObject>
): ParsedSecurityScheme[] {
  const results: ParsedSecurityScheme[] = []

  for (const [name, scheme] of Object.entries(schemes)) {
    const parsed = mapSingleScheme(name, scheme)
    results.push(parsed)
  }

  return results
}

/**
 * Map a single security scheme to ParsedSecurityScheme
 */
function mapSingleScheme(
  name: string,
  scheme: OpenAPIV3.SecuritySchemeObject | OpenAPIV2.SecuritySchemeObject
): ParsedSecurityScheme {
  const baseDescription = scheme.description || name

  // Handle apiKey type (both OpenAPI 3.x and Swagger 2.0)
  if (scheme.type === 'apiKey') {
    const apiKeyScheme = scheme as OpenAPIV3.ApiKeySecurityScheme | OpenAPIV2.SecuritySchemeApiKey

    if (apiKeyScheme.in === 'header') {
      return {
        name,
        authType: 'apiKey',
        metadata: { headerName: apiKeyScheme.name },
        description: baseDescription,
      }
    }

    if (apiKeyScheme.in === 'query') {
      return {
        name,
        authType: 'queryParam',
        metadata: { paramName: apiKeyScheme.name },
        description: baseDescription,
      }
    }

    // Cookie-based auth is unsupported
    if (apiKeyScheme.in === 'cookie') {
      return {
        name,
        authType: null,
        metadata: {},
        description: `${baseDescription} (unsupported: Cookie-based authentication is not supported)`,
      }
    }
  }

  // Handle http type (OpenAPI 3.x only)
  if (scheme.type === 'http') {
    const httpScheme = scheme as OpenAPIV3.HttpSecurityScheme

    if (httpScheme.scheme === 'bearer') {
      return {
        name,
        authType: 'bearer',
        metadata: {},
        description: baseDescription,
      }
    }

    if (httpScheme.scheme === 'basic') {
      return {
        name,
        authType: 'basic',
        metadata: {},
        description: baseDescription,
      }
    }
  }

  // Handle basic type (Swagger 2.0 only)
  if (scheme.type === 'basic') {
    return {
      name,
      authType: 'basic',
      metadata: {},
      description: baseDescription,
    }
  }

  // Handle oauth2 (unsupported)
  if (scheme.type === 'oauth2') {
    return {
      name,
      authType: null,
      metadata: {},
      description: `${baseDescription} (unsupported: OAuth 2.0 requires browser-based authorization flow)`,
    }
  }

  // Handle openIdConnect (unsupported)
  if (scheme.type === 'openIdConnect') {
    return {
      name,
      authType: null,
      metadata: {},
      description: `${baseDescription} (unsupported: OpenID Connect requires browser-based authorization flow)`,
    }
  }

  // Fallback for unknown schemes
  return {
    name,
    authType: null,
    metadata: {},
    description: `${baseDescription} (unsupported: Unknown security scheme type)`,
  }
}
