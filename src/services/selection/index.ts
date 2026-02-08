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
