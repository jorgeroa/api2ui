import type { UnifiedSchema, TypeSignature, FieldDefinition, Confidence } from '../../types/schema'
import { detectFieldType } from './typeDetection'

const MAX_DEPTH = 10
const MAX_ARRAY_SAMPLES = 100
const MAX_SAMPLE_VALUES = 5

/**
 * Infer schema from JSON data.
 * Analyzes the structure and types to produce a UnifiedSchema.
 */
export function inferSchema(data: unknown, url: string): UnifiedSchema {
  const rootType = inferType(data, 0)

  return {
    rootType,
    sampleCount: 1,
    url,
    inferredAt: Date.now()
  }
}

/**
 * Recursively infer the type signature of a value.
 */
function inferType(value: unknown, depth: number): TypeSignature {
  // Prevent infinite recursion
  if (depth > MAX_DEPTH) {
    return { kind: 'primitive', type: 'unknown' }
  }

  // Handle arrays
  if (Array.isArray(value)) {
    if (value.length === 0) {
      return {
        kind: 'array',
        items: { kind: 'primitive', type: 'unknown' }
      }
    }

    // Sample first N items
    const samples = value.slice(0, MAX_ARRAY_SAMPLES)

    // Check if all items are objects
    const allObjects = samples.every(item =>
      item !== null && typeof item === 'object' && !Array.isArray(item)
    )

    if (allObjects) {
      // Merge fields across all object items
      const items = inferObjectArrayType(samples as Record<string, unknown>[], depth)
      return { kind: 'array', items }
    } else {
      // For primitive arrays, infer from first item
      const itemType = inferType(samples[0], depth + 1)
      return { kind: 'array', items: itemType }
    }
  }

  // Handle objects
  if (value !== null && typeof value === 'object') {
    const obj = value as Record<string, unknown>
    const fields = new Map<string, FieldDefinition>()

    for (const [key, val] of Object.entries(obj)) {
      const fieldType = inferType(val, depth + 1)
      fields.set(key, {
        name: key,
        type: fieldType,
        optional: false,
        nullable: val === null,
        confidence: 'high',
        sampleValues: [val]
      })
    }

    return { kind: 'object', fields }
  }

  // Handle primitives
  const fieldType = detectFieldType(value)
  return { kind: 'primitive', type: fieldType }
}

/**
 * Infer object type from an array of objects by merging field definitions.
 */
function inferObjectArrayType(items: Record<string, unknown>[], depth: number): TypeSignature {
  const fieldMap = new Map<string, {
    types: TypeSignature[]
    nullCount: number
    presentCount: number
    samples: unknown[]
  }>()

  // Collect data about each field across all items
  for (const item of items) {
    const seenFields = new Set<string>()

    for (const [key, value] of Object.entries(item)) {
      seenFields.add(key)

      if (!fieldMap.has(key)) {
        fieldMap.set(key, {
          types: [],
          nullCount: 0,
          presentCount: 0,
          samples: []
        })
      }

      const fieldData = fieldMap.get(key)!
      fieldData.presentCount++

      if (value === null) {
        fieldData.nullCount++
      }

      const fieldType = inferType(value, depth + 1)
      fieldData.types.push(fieldType)

      if (fieldData.samples.length < MAX_SAMPLE_VALUES) {
        fieldData.samples.push(value)
      }
    }

    // Mark absent fields
    for (const key of fieldMap.keys()) {
      if (!seenFields.has(key)) {
        // Field was not present in this item
        // presentCount stays the same
      }
    }
  }

  // Build field definitions
  const fields = new Map<string, FieldDefinition>()
  const totalItems = items.length

  for (const [key, fieldData] of fieldMap.entries()) {
    // Determine if optional (not present in all items)
    const optional = fieldData.presentCount < totalItems

    // Determine if nullable (null in any item)
    const nullable = fieldData.nullCount > 0

    // Calculate confidence based on presence
    const presenceRatio = fieldData.presentCount / totalItems
    let confidence: Confidence
    if (presenceRatio === 1.0) {
      confidence = 'high'
    } else if (presenceRatio >= 0.5) {
      confidence = 'medium'
    } else {
      confidence = 'low'
    }

    // Use the type from the first non-null occurrence
    // In a real implementation, we'd merge types intelligently
    const type = fieldData.types[0] || { kind: 'primitive' as const, type: 'unknown' as const }

    fields.set(key, {
      name: key,
      type,
      optional,
      nullable,
      confidence,
      sampleValues: fieldData.samples
    })
  }

  return { kind: 'object', fields }
}
