/** Extract a human-readable label from an item by checking common name fields */
export function getItemLabel(item: unknown, fallback = 'Item'): string {
  if (typeof item !== 'object' || item === null) return fallback

  const obj = item as Record<string, unknown>
  const nameFields = ['name', 'title', 'label', 'id']

  for (const field of nameFields) {
    const value = obj[field]
    if (typeof value === 'string' && value.length > 0) return value
    if (typeof value === 'number') return String(value)
  }

  return fallback
}
