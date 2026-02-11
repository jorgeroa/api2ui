import { describe, it, expect } from 'vitest'
import { mapSecuritySchemes } from '../security-mapper'
import type { OpenAPIV3, OpenAPIV2 } from 'openapi-types'

describe('mapSecuritySchemes', () => {
  describe('OpenAPI 3.x security schemes', () => {
    it('maps apiKey in header to apiKey auth type', () => {
      const schemes: Record<string, OpenAPIV3.SecuritySchemeObject> = {
        ApiKeyAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'X-API-Key',
          description: 'API key for authentication',
        },
      }

      const result = mapSecuritySchemes(schemes)

      expect(result).toHaveLength(1)
      expect(result[0]).toEqual({
        name: 'ApiKeyAuth',
        authType: 'apiKey',
        metadata: { headerName: 'X-API-Key' },
        description: 'API key for authentication',
      })
    })

    it('maps apiKey in query to queryParam auth type', () => {
      const schemes: Record<string, OpenAPIV3.SecuritySchemeObject> = {
        ApiKeyQuery: {
          type: 'apiKey',
          in: 'query',
          name: 'api_key',
        },
      }

      const result = mapSecuritySchemes(schemes)

      expect(result).toHaveLength(1)
      expect(result[0]).toEqual({
        name: 'ApiKeyQuery',
        authType: 'queryParam',
        metadata: { paramName: 'api_key' },
        description: 'ApiKeyQuery',
      })
    })

    it('maps apiKey in cookie to null (unsupported)', () => {
      const schemes: Record<string, OpenAPIV3.SecuritySchemeObject> = {
        CookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'session',
        },
      }

      const result = mapSecuritySchemes(schemes)

      expect(result).toHaveLength(1)
      expect(result[0]).toEqual({
        name: 'CookieAuth',
        authType: null,
        metadata: {},
        description: 'CookieAuth (unsupported: Cookie-based authentication is not supported)',
      })
    })

    it('maps http scheme bearer to bearer auth type', () => {
      const schemes: Record<string, OpenAPIV3.SecuritySchemeObject> = {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          description: 'JWT Bearer token',
        },
      }

      const result = mapSecuritySchemes(schemes)

      expect(result).toHaveLength(1)
      expect(result[0]).toEqual({
        name: 'BearerAuth',
        authType: 'bearer',
        metadata: {},
        description: 'JWT Bearer token',
      })
    })

    it('maps http scheme bearer with bearerFormat to bearer auth type (ignores bearerFormat)', () => {
      const schemes: Record<string, OpenAPIV3.SecuritySchemeObject> = {
        JWTAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      }

      const result = mapSecuritySchemes(schemes)

      expect(result).toHaveLength(1)
      expect(result[0]).toEqual({
        name: 'JWTAuth',
        authType: 'bearer',
        metadata: {},
        description: 'JWTAuth',
      })
    })

    it('maps http scheme basic to basic auth type', () => {
      const schemes: Record<string, OpenAPIV3.SecuritySchemeObject> = {
        BasicAuth: {
          type: 'http',
          scheme: 'basic',
        },
      }

      const result = mapSecuritySchemes(schemes)

      expect(result).toHaveLength(1)
      expect(result[0]).toEqual({
        name: 'BasicAuth',
        authType: 'basic',
        metadata: {},
        description: 'BasicAuth',
      })
    })

    it('maps oauth2 to null (unsupported)', () => {
      const schemes: Record<string, OpenAPIV3.SecuritySchemeObject> = {
        OAuth2: {
          type: 'oauth2',
          flows: {
            implicit: {
              authorizationUrl: 'https://example.com/oauth/authorize',
              scopes: {
                'read:pets': 'Read pets',
              },
            },
          },
        },
      }

      const result = mapSecuritySchemes(schemes)

      expect(result).toHaveLength(1)
      expect(result[0]).toEqual({
        name: 'OAuth2',
        authType: null,
        metadata: {},
        description: 'OAuth2 (unsupported: OAuth 2.0 requires browser-based authorization flow)',
      })
    })

    it('maps openIdConnect to null (unsupported)', () => {
      const schemes: Record<string, OpenAPIV3.SecuritySchemeObject> = {
        OpenID: {
          type: 'openIdConnect',
          openIdConnectUrl: 'https://example.com/.well-known/openid-configuration',
        },
      }

      const result = mapSecuritySchemes(schemes)

      expect(result).toHaveLength(1)
      expect(result[0]).toEqual({
        name: 'OpenID',
        authType: null,
        metadata: {},
        description: 'OpenID (unsupported: OpenID Connect requires browser-based authorization flow)',
      })
    })
  })

  describe('Swagger 2.0 security definitions', () => {
    it('maps apiKey in header to apiKey auth type', () => {
      const schemes: Record<string, OpenAPIV2.SecuritySchemeObject> = {
        ApiKeyAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'X-API-Key',
          description: 'API key header',
        },
      }

      const result = mapSecuritySchemes(schemes)

      expect(result).toHaveLength(1)
      expect(result[0]).toEqual({
        name: 'ApiKeyAuth',
        authType: 'apiKey',
        metadata: { headerName: 'X-API-Key' },
        description: 'API key header',
      })
    })

    it('maps apiKey in query to queryParam auth type', () => {
      const schemes: Record<string, OpenAPIV2.SecuritySchemeObject> = {
        ApiKeyQuery: {
          type: 'apiKey',
          in: 'query',
          name: 'api_key',
        },
      }

      const result = mapSecuritySchemes(schemes)

      expect(result).toHaveLength(1)
      expect(result[0]).toEqual({
        name: 'ApiKeyQuery',
        authType: 'queryParam',
        metadata: { paramName: 'api_key' },
        description: 'ApiKeyQuery',
      })
    })

    it('maps type basic to basic auth type (Swagger 2.0 style)', () => {
      const schemes: Record<string, OpenAPIV2.SecuritySchemeObject> = {
        BasicAuth: {
          type: 'basic',
          description: 'HTTP Basic Authentication',
        },
      }

      const result = mapSecuritySchemes(schemes)

      expect(result).toHaveLength(1)
      expect(result[0]).toEqual({
        name: 'BasicAuth',
        authType: 'basic',
        metadata: {},
        description: 'HTTP Basic Authentication',
      })
    })

    it('maps oauth2 to null (unsupported)', () => {
      const schemes: Record<string, OpenAPIV2.SecuritySchemeObject> = {
        OAuth2: {
          type: 'oauth2',
          flow: 'implicit',
          authorizationUrl: 'https://example.com/oauth/authorize',
          scopes: {
            'read:pets': 'Read pets',
          },
        },
      }

      const result = mapSecuritySchemes(schemes)

      expect(result).toHaveLength(1)
      expect(result[0]).toEqual({
        name: 'OAuth2',
        authType: null,
        metadata: {},
        description: 'OAuth2 (unsupported: OAuth 2.0 requires browser-based authorization flow)',
      })
    })
  })

  describe('edge cases', () => {
    it('handles empty schemes object', () => {
      const schemes: Record<string, OpenAPIV3.SecuritySchemeObject> = {}

      const result = mapSecuritySchemes(schemes)

      expect(result).toEqual([])
    })

    it('handles multiple schemes of different types', () => {
      const schemes: Record<string, OpenAPIV3.SecuritySchemeObject> = {
        ApiKey: {
          type: 'apiKey',
          in: 'header',
          name: 'X-API-Key',
        },
        Bearer: {
          type: 'http',
          scheme: 'bearer',
        },
        Basic: {
          type: 'http',
          scheme: 'basic',
        },
      }

      const result = mapSecuritySchemes(schemes)

      expect(result).toHaveLength(3)
      expect(result.map(s => s.name)).toEqual(['ApiKey', 'Bearer', 'Basic'])
      expect(result.map(s => s.authType)).toEqual(['apiKey', 'bearer', 'basic'])
    })

    it('generates descriptive label from scheme name when no description provided', () => {
      const schemes: Record<string, OpenAPIV3.SecuritySchemeObject> = {
        MyCustomApiKey: {
          type: 'apiKey',
          in: 'header',
          name: 'X-Custom',
        },
      }

      const result = mapSecuritySchemes(schemes)

      expect(result[0].description).toBe('MyCustomApiKey')
    })

    it('prefers provided description over generated label', () => {
      const schemes: Record<string, OpenAPIV3.SecuritySchemeObject> = {
        ApiKey: {
          type: 'apiKey',
          in: 'header',
          name: 'X-API-Key',
          description: 'Custom description',
        },
      }

      const result = mapSecuritySchemes(schemes)

      expect(result[0].description).toBe('Custom description')
    })
  })
})
