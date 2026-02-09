/**
 * Smart component selection service.
 * Public API for context-aware component type selection based on semantic analysis.
 *
 * Priority order:
 * 1. User override (from configStore) - always wins
 * 2. High-confidence semantic patterns (>= 0.75)
 * 3. Type-based defaults (current v1.2 behavior)
 */

import type { TypeSignature } from '@/types/schema'
import type { ComponentSelection, SelectionContext } from './types'
import {
  checkReviewPattern,
  checkImageGalleryPattern,
  checkTimelinePattern,
  selectCardOrTable,
  checkProfilePattern,
  checkComplexObjectPattern,
  checkSplitPattern,
  checkChipsPattern,
  checkImageGridPattern,
} from './heuristics'

/**
 * Select the most appropriate component type for rendering data.
 *
 * Applies heuristics in priority order:
 * 1. Review pattern (rating + comment)
 * 2. Image gallery pattern (image-heavy arrays)
 * 3. Timeline pattern (date + title/description)
 * 4. Card vs table heuristic (content richness + field count)
 *
 * Only returns smart default when confidence >= 0.75.
 * Falls back to type-based defaults for non-array schemas or low-confidence matches.
 *
 * @param schema - Type signature of the data
 * @param context - Semantic metadata and importance scores
 * @returns Component selection with confidence score
 */
export function selectComponent(
  schema: TypeSignature,
  context: SelectionContext
): ComponentSelection {
  // Only apply smart selection for arrays of objects
  if (schema.kind !== 'array' || schema.items.kind !== 'object') {
    return {
      componentType: getDefaultTypeName(schema),
      confidence: 0,
      reason: 'not-applicable',
    }
  }

  // Try heuristics in priority order
  const heuristics = [
    checkReviewPattern,
    checkImageGalleryPattern,
    checkTimelinePattern,
    selectCardOrTable,
  ]

  for (const heuristic of heuristics) {
    const result = heuristic(schema, context)
    if (result && result.confidence >= 0.75) {
      return result
    }
  }

  // Fallback to type-based default
  return {
    componentType: 'table',
    confidence: 0,
    reason: 'fallback-to-default',
  }
}

/**
 * Select the most appropriate component type for rendering an object.
 *
 * Applies object heuristics in priority order:
 * 1. Profile pattern (name + 2+ contact fields) → hero
 * 2. Complex nested pattern (3+ nested structures) → tabs
 * 3. Split pattern (1 primary content + 3+ metadata) → split
 *
 * Only returns smart default when confidence >= 0.75.
 * Falls back to 'detail' for non-object schemas or low-confidence matches.
 *
 * @param schema - Type signature of the object data
 * @param context - Semantic metadata and importance scores
 * @returns Component selection with confidence score
 */
export function selectObjectComponent(
  schema: TypeSignature,
  context: SelectionContext
): ComponentSelection {
  // Only apply for object schemas
  if (schema.kind !== 'object') {
    return {
      componentType: 'detail',
      confidence: 0,
      reason: 'fallback-to-default',
    }
  }

  // Try heuristics in priority order
  const heuristics = [
    checkProfilePattern,
    checkComplexObjectPattern,
    checkSplitPattern,
  ]

  for (const heuristic of heuristics) {
    const result = heuristic(schema, context)
    if (result && result.confidence >= 0.75) {
      return result
    }
  }

  // Fallback to detail
  return {
    componentType: 'detail',
    confidence: 0,
    reason: 'fallback-to-default',
  }
}

/**
 * Select the most appropriate component type for rendering a primitive array.
 *
 * Applies primitive array heuristics:
 * 1. Chips pattern (tags/status semantic or short enum-like values) → chips
 *
 * Only returns smart default when confidence >= 0.75.
 * Falls back to 'primitive-list' for non-primitive-array schemas, no data, or low-confidence matches.
 *
 * @param schema - Type signature of the array data
 * @param data - The actual array data (needed for value analysis)
 * @param context - Semantic metadata and importance scores
 * @returns Component selection with confidence score
 */
export function selectPrimitiveArrayComponent(
  schema: TypeSignature,
  data: unknown,
  context: SelectionContext
): ComponentSelection {
  // Only apply for primitive arrays
  if (schema.kind !== 'array' || schema.items.kind !== 'primitive') {
    return {
      componentType: 'primitive-list',
      confidence: 0,
      reason: 'fallback-to-default',
    }
  }

  // Check for no data or empty array
  if (!Array.isArray(data) || data.length === 0) {
    return {
      componentType: 'primitive-list',
      confidence: 0,
      reason: 'no-data',
    }
  }

  // Try image grid pattern (check before chips — image URLs are long strings)
  const gridResult = checkImageGridPattern(data, schema)
  if (gridResult && gridResult.confidence >= 0.75) {
    return gridResult
  }

  // Try chips pattern
  const result = checkChipsPattern(data, schema, context)
  if (result && result.confidence >= 0.75) {
    return result
  }

  // Fallback to primitive-list
  return {
    componentType: 'primitive-list',
    confidence: 0,
    reason: 'fallback-to-default',
  }
}

/**
 * Get default component type name based on schema structure.
 * This is the v1.2 type-based fallback behavior.
 *
 * @param schema - Type signature
 * @returns Component type name
 */
export function getDefaultTypeName(schema: TypeSignature): string {
  if (schema.kind === 'array' && schema.items.kind === 'object') return 'table'
  if (schema.kind === 'array' && schema.items.kind === 'primitive')
    return 'primitive-list'
  if (schema.kind === 'object') return 'detail'
  if (schema.kind === 'primitive') return 'primitive'
  return 'json'
}

// Re-export types for convenience
export type { ComponentSelection, SelectionContext } from './types'
