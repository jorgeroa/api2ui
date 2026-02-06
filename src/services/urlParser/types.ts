/**
 * Types for URL parameter parsing.
 * Extends ParsedParameter from OpenAPI with URL-specific fields.
 */

import type { ParsedParameter } from '../openapi/types'

/**
 * A parsed URL parameter, extending OpenAPI's ParsedParameter.
 * For URL parsing, we always use 'query' location and mark required as false
 * since we can't know requiredness from URL alone.
 */
export interface ParsedUrlParameter extends Omit<ParsedParameter, 'in' | 'required'> {
  in: 'query'
  required: false
  /** Original key from URL (before normalization, e.g., "tag[]") */
  originalKey: string
  /** True if parameter appeared multiple times or used bracket notation */
  isArray: boolean
  /** All values for array parameters */
  values?: string[]
  /** Group name extracted from bracket prefix (e.g., "ddcFilter" from "ddcFilter[name]") */
  group?: string
}

/**
 * Result of parsing URL parameters.
 */
export interface UrlParseResult {
  /** Parsed parameters */
  parameters: ParsedUrlParameter[]
  /** Map of group names to parameter names in that group */
  groups: Map<string, string[]>
  /** Warnings encountered during parsing (encoding fixes, ambiguities, etc.) */
  warnings: string[]
}
