/**
 * Types for smart component selection based on semantic analysis.
 */

import type { SemanticMetadata } from '@/types/schema'
import type { ImportanceScore } from '@/services/analysis/types'

/**
 * Result of component selection with confidence scoring.
 */
export interface ComponentSelection {
  /** Component type name (e.g., 'table', 'card-list', 'gallery', 'timeline') */
  componentType: string
  /** Confidence score (0.0 - 1.0). Only >= 0.75 triggers smart defaults. */
  confidence: number
  /** Reason for selection (e.g., 'review-pattern-detected', 'image-heavy-content') */
  reason: string
}

/**
 * Context data for component selection heuristics.
 * Contains semantic analysis and importance scoring results.
 */
export interface SelectionContext {
  /** Field path → semantic metadata mapping */
  semantics: Map<string, SemanticMetadata>
  /** Field path → importance score mapping */
  importance: Map<string, ImportanceScore>
}
