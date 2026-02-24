import type { FieldType } from '../types/schema'

/** ISO 8601 date pattern */
const ISO_8601_PATTERN = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:?\d{2})?)?$/

/**
 * Detect the field type of a primitive value.
 * Arrays and objects should be handled by the schema inferrer.
 */
export function detectFieldType(value: unknown): FieldType {
  // Handle null and undefined
  if (value === null || value === undefined) {
    return 'null'
  }

  // Handle boolean
  if (typeof value === 'boolean') {
    return 'boolean'
  }

  // Handle number
  if (typeof value === 'number') {
    return 'number'
  }

  // Handle string (including date detection)
  if (typeof value === 'string') {
    // Check for ISO 8601 date format
    if (ISO_8601_PATTERN.test(value)) {
      // Validate with Date.parse to reject false positives
      const timestamp = Date.parse(value)
      if (!isNaN(timestamp)) {
        return 'date'
      }
    }
    return 'string'
  }

  // Arrays and objects fall through to 'unknown' as a safe default
  // (they should be handled by the schema inferrer, not here)
  return 'unknown'
}
