/** Exact primary field names (highest priority) */
const PRIMARY_EXACT = ['name', 'title', 'label']

/** Suffixes for compound name fields (second priority) */
const NAME_SUFFIXES = ['_name', '_title', '_label', '-name', '-title', '-label', 'Name', 'Title']

/** Extract a human-readable label from an item by checking common name fields */
export function getItemLabel(item: unknown, fallback = 'Item'): string {
  return findLabel(item, 1) || fallback
}

/** Search for a label up to maxDepth levels deep */
function findLabel(item: unknown, maxDepth: number): string {
  if (typeof item !== 'object' || item === null || Array.isArray(item)) return ''

  const obj = item as Record<string, unknown>
  const keys = Object.keys(obj)

  // Tier 1: exact match (name, title, label)
  for (const field of PRIMARY_EXACT) {
    const value = obj[field]
    if (typeof value === 'string' && value.length > 0) return value
    if (typeof value === 'number') return String(value)
  }

  // Tier 2: compound name fields (provider_name, lastName, etc.)
  for (const key of keys) {
    if (NAME_SUFFIXES.some(suffix => key.endsWith(suffix))) {
      const value = obj[key]
      if (typeof value === 'string' && value.length > 0) return value
    }
  }

  // Tier 3: any key containing "name" (case-insensitive)
  for (const key of keys) {
    if (/name/i.test(key)) {
      const value = obj[key]
      if (typeof value === 'string' && value.length > 0) return value
    }
  }

  // Tier 4: id as last resort (only at top level)
  if (maxDepth > 0) {
    const id = obj['id']
    if (typeof id === 'string' && id.length > 0) return id
    if (typeof id === 'number') return String(id)
  }

  // Tier 5: search one level deep in nested objects
  if (maxDepth > 0) {
    for (const key of keys) {
      const nested = obj[key]
      if (typeof nested === 'object' && nested !== null && !Array.isArray(nested)) {
        const nestedLabel = findLabel(nested, maxDepth - 1)
        if (nestedLabel) return nestedLabel
      }
    }
  }

  return ''
}
