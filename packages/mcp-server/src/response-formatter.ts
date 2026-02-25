/**
 * Smart response truncation for MCP tool outputs.
 * Prevents huge API responses from exceeding Claude's context window.
 */

/** Max items to keep in a top-level array */
const TOP_ARRAY_LIMIT = 25

/** Max items to keep in nested arrays */
const NESTED_ARRAY_LIMIT = 10

/** Max serialized JSON size in bytes before byte-aware truncation */
const MAX_RESPONSE_BYTES = 50 * 1024

interface TruncationMeta {
  truncated: boolean
  totalItems?: number
  shownItems?: number
  fullSizeBytes?: number
}

/**
 * Format an API response with smart truncation.
 * Returns the JSON string (already serialized) with truncation applied.
 *
 * If fullResponse is true, returns the full JSON with no truncation.
 */
export function formatResponse(data: unknown, fullResponse?: boolean): string {
  if (fullResponse) {
    return JSON.stringify(data, null, 2)
  }

  const truncated = truncateData(data)
  const json = JSON.stringify(truncated.data, null, 2)

  // If serialized output still exceeds byte limit, do byte-aware truncation
  if (json.length > MAX_RESPONSE_BYTES) {
    const cut = json.slice(0, MAX_RESPONSE_BYTES)
    // Find last complete line to avoid cutting mid-value
    const lastNewline = cut.lastIndexOf('\n')
    const clean = lastNewline > 0 ? cut.slice(0, lastNewline) : cut
    const sizeStr = json.length > 1024 ? `${(json.length / 1024).toFixed(1)}KB` : `${json.length}B`
    return `${clean}\n\n... [truncated — full response is ${sizeStr}. Use --full-response or set full_response=true to see all data]`
  }

  // Add metadata suffix if truncation happened
  if (truncated.meta.truncated) {
    const parts: string[] = []
    if (truncated.meta.totalItems !== undefined && truncated.meta.shownItems !== undefined) {
      parts.push(`showing ${truncated.meta.shownItems} of ${truncated.meta.totalItems} items`)
    }
    return `${json}\n\n... [${parts.join(', ')}. Use --full-response or set full_response=true to see all data]`
  }

  return json
}

/**
 * Truncate data by limiting array sizes.
 */
function truncateData(data: unknown): { data: unknown; meta: TruncationMeta } {
  const meta: TruncationMeta = { truncated: false }

  if (Array.isArray(data)) {
    // Top-level array: limit to TOP_ARRAY_LIMIT
    if (data.length > TOP_ARRAY_LIMIT) {
      meta.truncated = true
      meta.totalItems = data.length
      meta.shownItems = TOP_ARRAY_LIMIT
      const truncatedItems = data.slice(0, TOP_ARRAY_LIMIT).map(item => truncateNested(item))
      return { data: truncatedItems, meta }
    }
    // Array within limit — still check nested arrays
    const processed = data.map(item => truncateNested(item))
    return { data: processed, meta }
  }

  if (data !== null && typeof data === 'object') {
    // Object — check for nested arrays in values
    const result = truncateNestedObject(data as Record<string, unknown>)
    return { data: result, meta }
  }

  return { data, meta }
}

/**
 * Truncate nested arrays within an item to NESTED_ARRAY_LIMIT.
 */
function truncateNested(item: unknown): unknown {
  if (Array.isArray(item)) {
    if (item.length > NESTED_ARRAY_LIMIT) {
      return [
        ...item.slice(0, NESTED_ARRAY_LIMIT),
        `... and ${item.length - NESTED_ARRAY_LIMIT} more items`,
      ]
    }
    return item.map(v => truncateNested(v))
  }

  if (item !== null && typeof item === 'object') {
    return truncateNestedObject(item as Record<string, unknown>)
  }

  return item
}

/**
 * Process object values, truncating any nested arrays.
 */
function truncateNestedObject(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(obj)) {
    result[key] = truncateNested(value)
  }
  return result
}
