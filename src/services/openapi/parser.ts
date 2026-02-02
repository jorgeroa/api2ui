import type { ParsedSpec } from './types'

/**
 * Parse an OpenAPI/Swagger spec URL or object and extract GET operations.
 *
 * @param specUrlOrObject - URL string or spec object
 * @returns Parsed spec with operations, parameters, and metadata
 */
export async function parseOpenAPISpec(
  specUrlOrObject: string | object
): Promise<ParsedSpec> {
  // Stub implementation - tests will fail
  throw new Error('Not implemented')
}
