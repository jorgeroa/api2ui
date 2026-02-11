/**
 * TypeScript types for parsed OpenAPI/Swagger specifications.
 * These types represent the cleaned, typed data structure that the UI layer consumes.
 */

import type { AuthType } from '../../types/auth'

export interface ParsedParameter {
  name: string
  in: 'query' | 'path' | 'header' | 'cookie'
  required: boolean
  description: string
  schema: {
    type: string          // 'string' | 'integer' | 'number' | 'boolean' | 'array'
    format?: string       // 'date', 'date-time', 'email', 'uri', 'password', etc.
    enum?: unknown[]      // For select inputs
    default?: unknown     // Default value
    example?: unknown     // Example value from spec
    minimum?: number
    maximum?: number
    maxLength?: number
  }
  // Type inferred from value (for URL-parsed params)
  inferredType?: 'string' | 'number' | 'boolean' | 'date' | 'email' | 'url' | 'coordinates' | 'zip'
  // Array of values for array params (from URL parsing)
  values?: string[]
  // Whether this is an array parameter
  isArray?: boolean
}

export interface ParsedOperation {
  path: string            // e.g., '/users', '/users/{userId}'
  method: string          // 'GET' (v1 only extracts GET)
  operationId?: string
  summary?: string
  description?: string
  parameters: ParsedParameter[]
  responseSchema: unknown // The dereferenced response schema (JSON Schema)
  tags: string[]
}

export interface ParsedSecurityScheme {
  name: string
  authType: AuthType | null
  metadata: {
    headerName?: string
    paramName?: string
  }
  description: string
}

export interface ParsedSpec {
  title: string
  version: string
  specVersion: string    // '2.0', '3.0.x', '3.1.x'
  baseUrl: string        // Server URL or host+basePath
  operations: ParsedOperation[]
  securitySchemes: ParsedSecurityScheme[]
}
