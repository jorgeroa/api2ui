/**
 * OpenAPI/Swagger spec parsing — delegates to api-invoke.
 */

import { parseOpenAPISpec as bridgeParse } from 'api-invoke'
import type { ParsedAPI } from 'api-invoke'

/**
 * Parse an OpenAPI/Swagger spec URL or object.
 *
 * @param specUrlOrObject - URL string or spec object
 * @returns Parsed API with operations, parameters, and metadata
 */
export async function parseOpenAPISpec(
  specUrlOrObject: string | object,
): Promise<ParsedAPI> {
  return bridgeParse(specUrlOrObject, {
    specUrl: typeof specUrlOrObject === 'string' ? specUrlOrObject : undefined,
  })
}
