/**
 * Semantic field detection service.
 * Public API for detecting semantic categories of API response fields.
 *
 * @example
 * ```ts
 * import { detectSemantics, getBestMatch } from '@/services/semantic'
 *
 * const results = detectSemantics('product.price', 'price', 'number', [19.99])
 * const best = getBestMatch(results)
 *
 * if (best) {
 *   console.log(`Detected: ${best.category} with ${best.confidence} confidence`)
 * }
 * ```
 */

// Main detection functions
export {
  detectSemantics,
  detectCompositeSemantics,
  getBestMatch,
  clearSemanticCache,
} from './detector'

// Pattern registry (for debugging/inspection)
export {
  getAllPatterns,
  getCompositePatterns,
  getPattern,
} from './patterns'

// Core types
export type {
  SemanticCategory,
  ConfidenceLevel,
  ConfidenceResult,
  SignalMatch,
  SemanticPattern,
  CompositePattern,
  NamePattern,
  TypeConstraint,
  ValueValidator,
  FormatHint,
} from './types'

// Type guard
export { isCompositePattern } from './types'

// Default thresholds (for reference)
export { DEFAULT_THRESHOLDS } from './types'

// Schema metadata type (from schema.ts to avoid circular deps)
// Re-export for convenience
export type { SemanticMetadata } from '@/types/schema'
