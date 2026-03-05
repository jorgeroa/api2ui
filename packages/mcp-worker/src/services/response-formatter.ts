/**
 * Smart response truncation for MCP tool outputs.
 * Copied from packages/mcp-server/src/response-formatter.ts.
 */

const TOP_ARRAY_LIMIT = 25
const NESTED_ARRAY_LIMIT = 10
const MAX_RESPONSE_BYTES = 50 * 1024

interface TruncationMeta {
  truncated: boolean
  totalItems?: number
  shownItems?: number
}

export function formatResponse(data: unknown, fullResponse?: boolean): string {
  if (fullResponse) {
    return JSON.stringify(data, null, 2)
  }

  const truncated = truncateData(data)
  const json = JSON.stringify(truncated.data, null, 2)

  if (json.length > MAX_RESPONSE_BYTES) {
    const cut = json.slice(0, MAX_RESPONSE_BYTES)
    const lastNewline = cut.lastIndexOf('\n')
    const clean = lastNewline > 0 ? cut.slice(0, lastNewline) : cut
    const sizeStr = json.length > 1024 ? `${(json.length / 1024).toFixed(1)}KB` : `${json.length}B`
    return `${clean}\n\n... [truncated — full response is ${sizeStr}. Set full_response=true to see all data]`
  }

  if (truncated.meta.truncated) {
    const parts: string[] = []
    if (truncated.meta.totalItems !== undefined && truncated.meta.shownItems !== undefined) {
      parts.push(`showing ${truncated.meta.shownItems} of ${truncated.meta.totalItems} items`)
    }
    return `${json}\n\n... [${parts.join(', ')}. Set full_response=true to see all data]`
  }

  return json
}

function truncateData(data: unknown): { data: unknown; meta: TruncationMeta } {
  const meta: TruncationMeta = { truncated: false }

  if (Array.isArray(data)) {
    if (data.length > TOP_ARRAY_LIMIT) {
      meta.truncated = true
      meta.totalItems = data.length
      meta.shownItems = TOP_ARRAY_LIMIT
      const truncatedItems = data.slice(0, TOP_ARRAY_LIMIT).map(item => truncateNested(item))
      return { data: truncatedItems, meta }
    }
    const processed = data.map(item => truncateNested(item))
    return { data: processed, meta }
  }

  if (data !== null && typeof data === 'object') {
    const result = truncateNestedObject(data as Record<string, unknown>)
    return { data: result, meta }
  }

  return { data, meta }
}

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

function truncateNestedObject(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(obj)) {
    result[key] = truncateNested(value)
  }
  return result
}
