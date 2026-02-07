/**
 * Pattern registry for semantic field detection.
 * Aggregates all patterns and provides lookup functions.
 */

import type { SemanticPattern, SemanticCategory, CompositePattern } from '../types'

// Commerce patterns
import {
  pricePattern,
  currencyCodePattern,
  skuPattern,
  quantityPattern,
} from './commerce'

// Identity patterns
import {
  emailPattern,
  phonePattern,
  uuidPattern,
  namePattern,
  addressPattern,
  urlPattern,
} from './identity'

// Media patterns
import {
  imagePattern,
  videoPattern,
  thumbnailPattern,
  avatarPattern,
} from './media'

// Engagement patterns
import {
  ratingPattern,
  reviewsPattern,
  tagsPattern,
  statusPattern,
  titlePattern,
  descriptionPattern,
} from './engagement'

// Temporal patterns
import {
  datePattern,
  timestampPattern,
} from './temporal'

/**
 * All standard semantic patterns (excludes composite patterns).
 * Total: 21 patterns across 5 categories.
 */
const allPatterns: SemanticPattern[] = [
  // Commerce (4)
  pricePattern,
  currencyCodePattern,
  skuPattern,
  quantityPattern,
  // Identity (6)
  emailPattern,
  phonePattern,
  uuidPattern,
  namePattern,
  addressPattern,
  urlPattern,
  // Media (4)
  imagePattern,
  videoPattern,
  thumbnailPattern,
  avatarPattern,
  // Engagement (5, excluding reviewsPattern which is composite)
  ratingPattern,
  tagsPattern,
  statusPattern,
  titlePattern,
  descriptionPattern,
  // Temporal (2)
  datePattern,
  timestampPattern,
]

/**
 * Map for quick pattern lookup by category.
 */
const patternMap = new Map<SemanticCategory, SemanticPattern>(
  allPatterns.map(pattern => [pattern.category, pattern])
)

/**
 * Composite patterns (for array structure detection).
 */
const compositePatterns: CompositePattern[] = [
  reviewsPattern,
]

/**
 * Get all standard semantic patterns.
 * Use this for field-by-field detection.
 *
 * @returns Array of all 20 SemanticPattern definitions
 */
export function getAllPatterns(): SemanticPattern[] {
  return allPatterns
}

/**
 * Get a specific pattern by category.
 *
 * @param category - The semantic category to look up
 * @returns The pattern for that category, or undefined if not found
 */
export function getPattern(category: SemanticCategory): SemanticPattern | undefined {
  return patternMap.get(category)
}

/**
 * Get all composite patterns for array structure detection.
 * Use this for detecting patterns that require inspecting nested object fields.
 *
 * @returns Array of CompositePattern definitions
 */
export function getCompositePatterns(): CompositePattern[] {
  return compositePatterns
}

// Re-export individual patterns for direct access
export {
  // Commerce
  pricePattern,
  currencyCodePattern,
  skuPattern,
  quantityPattern,
  // Identity
  emailPattern,
  phonePattern,
  uuidPattern,
  namePattern,
  addressPattern,
  urlPattern,
  // Media
  imagePattern,
  videoPattern,
  thumbnailPattern,
  avatarPattern,
  // Engagement
  ratingPattern,
  reviewsPattern,
  tagsPattern,
  statusPattern,
  titlePattern,
  descriptionPattern,
  // Temporal
  datePattern,
  timestampPattern,
}
