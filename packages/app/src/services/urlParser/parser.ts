/**
 * URL Query String Parser
 * Parses URL query strings into ParsedUrlParameter[] format with array detection,
 * group extraction, and warning collection.
 */

import type { UrlParseResult, ParsedUrlParameter } from './types'

/** Regex to detect bracket array notation: key[] */
const BRACKET_ARRAY_REGEX = /^(.+)\[\]$/

/** Regex to detect group notation: prefix[key] (where key is not empty) */
const GROUP_PREFIX_REGEX = /^([a-zA-Z_][a-zA-Z0-9_]*)\[([^\]]+)\]$/

/**
 * Parse URL query parameters into a structured format.
 *
 * Handles:
 * - Simple key=value pairs
 * - Bracket array notation (tag[]=a&tag[]=b)
 * - Repeated key arrays (tag=a&tag=b)
 * - Grouped parameters (filter[name]=foo)
 * - URL encoding/decoding
 *
 * @param url - Full URL or just query string (with or without leading ?)
 * @returns Parsed result with parameters, groups, and warnings
 */
export function parseUrlParameters(url: string): UrlParseResult {
  const warnings: string[] = []
  const groups: Map<string, string[]> = new Map()

  // Extract query string from input
  const queryString = extractQueryString(url, warnings)
  if (!queryString) {
    return { parameters: [], groups, warnings }
  }

  // Validate query string can be parsed
  try {
    void new URLSearchParams(queryString)
  } catch {
    warnings.push('Failed to parse query string')
    return { parameters: [], groups, warnings }
  }

  // Collect raw entries preserving original keys
  const rawEntries = collectRawEntries(queryString, warnings)

  // Group entries by normalized key (handling bracket notation)
  const keyGroups = groupByNormalizedKey(rawEntries, warnings)

  // Build parameters
  const parameters: ParsedUrlParameter[] = []

  for (const [normalizedKey, entries] of keyGroups) {
    const param = buildParameter(normalizedKey, entries, warnings)
    parameters.push(param)

    // Track groups
    if (param.group) {
      const groupParams = groups.get(param.group) ?? []
      groupParams.push(param.name)
      groups.set(param.group, groupParams)
    }
  }

  return { parameters, groups, warnings }
}

/**
 * Extract query string from URL or raw query string input.
 */
function extractQueryString(input: string, warnings: string[]): string {
  if (!input) {
    return ''
  }

  // Handle query string with leading ? (check this BEFORE ://, since query
  // values might contain URLs like ?redirect=https://example.com)
  if (input.startsWith('?')) {
    return input.slice(1)
  }

  // Handle full URL
  if (input.includes('://')) {
    try {
      const url = new URL(input)
      return url.search.slice(1) // Remove leading ?
    } catch {
      warnings.push('Invalid URL format')
      return ''
    }
  }

  // Assume raw query string
  return input
}

interface RawEntry {
  rawKey: string    // Original URL-encoded key
  rawValue: string  // Original URL-encoded value
  key: string       // Decoded key for display/matching
  value: string     // Decoded value
}

/**
 * Collect raw entries from query string, preserving original keys.
 * Also checks for malformed encoding.
 */
function collectRawEntries(queryString: string, warnings: string[]): RawEntry[] {
  const entries: RawEntry[] = []

  if (!queryString) {
    return entries
  }

  const pairs = queryString.split('&')

  for (const pair of pairs) {
    if (!pair) continue

    const eqIndex = pair.indexOf('=')
    let rawKey: string
    let rawValue: string

    if (eqIndex === -1) {
      rawKey = pair
      rawValue = ''
    } else {
      rawKey = pair.slice(0, eqIndex)
      rawValue = pair.slice(eqIndex + 1)
    }

    // Decode key and value
    const key = safeDecodeURIComponent(rawKey, warnings)
    const value = safeDecodeURIComponent(rawValue.replace(/\+/g, ' '), warnings)

    entries.push({ rawKey, rawValue, key, value })
  }

  return entries
}

/**
 * Safely decode URI component, tracking warnings for malformed encoding.
 */
function safeDecodeURIComponent(str: string, warnings: string[]): string {
  try {
    return decodeURIComponent(str)
  } catch {
    // Malformed encoding - try to decode what we can
    warnings.push(`Malformed URL encoding in: ${str}`)
    // Return original with + replaced by space
    return str.replace(/\+/g, ' ')
  }
}

interface KeyEntry {
  rawKey: string        // Original URL-encoded key
  rawValue: string      // Original URL-encoded value
  originalKey: string   // Decoded key
  value: string         // Decoded value
  isBracketArray: boolean
}

/**
 * Group entries by normalized key, detecting bracket array notation.
 */
function groupByNormalizedKey(
  entries: RawEntry[],
  warnings: string[]
): Map<string, KeyEntry[]> {
  const groups = new Map<string, KeyEntry[]>()

  for (const { rawKey, rawValue, key, value } of entries) {
    const bracketMatch = key.match(BRACKET_ARRAY_REGEX)
    const normalizedKey = bracketMatch ? bracketMatch[1]! : key
    const isBracketArray = !!bracketMatch

    const group = groups.get(normalizedKey) ?? []
    group.push({ rawKey, rawValue, originalKey: key, value, isBracketArray })
    groups.set(normalizedKey, group)
  }

  // Check for mixed bracket/non-bracket usage
  for (const [key, keyEntries] of groups) {
    const hasBracket = keyEntries.some(e => e.isBracketArray)
    const hasNonBracket = keyEntries.some(e => !e.isBracketArray)

    if (hasBracket && hasNonBracket) {
      warnings.push(`Mixed bracket/non-bracket notation for "${key}"`)
    }
  }

  return groups
}

/**
 * Build a ParsedUrlParameter from grouped entries.
 */
function buildParameter(
  normalizedKey: string,
  entries: KeyEntry[],
  warnings: string[]
): ParsedUrlParameter {
  const isArray = entries.length > 1 || entries.some(e => e.isBracketArray)

  // Warn about duplicates without bracket notation
  if (entries.length > 1 && entries.every(e => !e.isBracketArray)) {
    warnings.push(`Duplicate key "${normalizedKey}" without array notation - treating as array`)
  }

  // Check for group notation (only for non-array bracket params)
  const firstEntry = entries[0]!
  const groupMatch = firstEntry.originalKey.match(GROUP_PREFIX_REGEX)

  // If it's a group param (like filter[name]), keep the full name
  // If it's an array param (like tag[]), use the normalized name
  const paramName = groupMatch ? firstEntry.originalKey : normalizedKey
  const group = groupMatch ? groupMatch[1]! : undefined

  const values = entries.map(e => e.value)
  const singleValue = isArray ? undefined : values[0]

  return {
    name: paramName,
    originalKey: firstEntry.originalKey,
    rawKey: firstEntry.rawKey,
    rawValue: firstEntry.rawValue,
    in: 'query',
    required: false,
    description: '',
    isArray,
    values: isArray ? values : undefined,
    group,
    schema: {
      type: isArray ? 'array' : 'string',
      default: singleValue ?? values[0]
    }
  }
}

/**
 * Reconstruct query string preserving original URL encoding.
 * Uses rawKey and rawValue from parsed params to preserve exact original encoding.
 * Only re-encodes values that have actually changed from their original decoded form.
 */
export function reconstructQueryString(
  values: Record<string, string>,
  originalParams: ParsedUrlParameter[]
): string {
  const parts: string[] = []

  // Map from param name to { rawKey, rawValue, originalValue (decoded) }
  const paramMap = new Map(
    originalParams.map(p => [p.name, {
      rawKey: p.rawKey,
      rawValue: p.rawValue,
      originalValue: p.schema.default as string | undefined
    }])
  )

  for (const [name, value] of Object.entries(values)) {
    if (!value) continue // Skip empty values

    const original = paramMap.get(name)
    if (!original) {
      // New param - encode both key and value
      parts.push(`${encodeURIComponent(name)}=${encodeURIComponent(value)}`)
      continue
    }

    // Use rawKey which preserves original URL encoding
    const key = original.rawKey

    // If value unchanged from original, use rawValue to preserve exact encoding
    // Otherwise, encode the new value
    const encodedValue = value === original.originalValue
      ? original.rawValue
      : encodeURIComponent(value)

    parts.push(`${key}=${encodedValue}`)
  }

  return parts.join('&')
}
