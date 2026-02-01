import type { FieldType } from '../../types/schema'

/**
 * Detect the field type of a primitive value.
 * Arrays and objects should be handled by the schema inferrer.
 */
export function detectFieldType(value: unknown): FieldType {
  // Stub implementation - will fail tests
  return 'unknown'
}
