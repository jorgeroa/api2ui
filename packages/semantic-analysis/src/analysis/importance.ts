/**
 * Field importance scoring algorithm.
 * Calculates multi-signal importance scores for field prioritization.
 */

import type { SemanticCategory } from '../semantic/types'
import type { FieldInfo, ImportanceScore, ImportanceTier, ImportanceSignalMatch } from './types'
import { IMPORTANCE_CONFIG } from './config'

/**
 * Calculate importance score for a field using multi-signal weighted scoring.
 *
 * Algorithm:
 * 1. Name pattern signal (40%): Check against primary indicators
 * 2. Visual richness signal (25%): Score based on semantic category richness
 * 3. Data presence signal (20%): Count non-null/empty values in samples
 * 4. Position signal (15%): Logarithmic decay based on field position
 * 5. Determine tier: >= 80% primary, 50-79% secondary, <50% tertiary
 * 6. Metadata override: Force tertiary if field matches metadata patterns
 *
 * @param field - Field information to score
 * @param config - Optional configuration (defaults to IMPORTANCE_CONFIG)
 * @returns ImportanceScore with tier, score, and signal breakdown
 */
export function calculateImportance(
  field: FieldInfo,
  config = IMPORTANCE_CONFIG
): ImportanceScore {
  const signals: ImportanceSignalMatch[] = []
  let totalScore = 0

  // 1. Name pattern signal (40%)
  const nameScore = scoreNamePattern(field.name, config.primaryIndicators)
  signals.push({
    name: 'namePattern',
    matched: nameScore > 0,
    weight: config.weights.namePattern,
    contribution: nameScore * config.weights.namePattern,
  })
  totalScore += nameScore * config.weights.namePattern

  // 2. Visual richness signal (25%)
  const visualScore = scoreVisualRichness(field.semanticCategory)
  signals.push({
    name: 'visualRichness',
    matched: visualScore > 0,
    weight: config.weights.visualRichness,
    contribution: visualScore * config.weights.visualRichness,
  })
  totalScore += visualScore * config.weights.visualRichness

  // 3. Data presence signal (20%)
  const presenceScore = scoreDataPresence(field.sampleValues)
  signals.push({
    name: 'dataPresence',
    matched: presenceScore > 0,
    weight: config.weights.dataPresence,
    contribution: presenceScore * config.weights.dataPresence,
  })
  totalScore += presenceScore * config.weights.dataPresence

  // 4. Position signal (15%)
  const positionScore = scorePosition(field.position, field.totalFields)
  signals.push({
    name: 'position',
    matched: positionScore > 0,
    weight: config.weights.position,
    contribution: positionScore * config.weights.position,
  })
  totalScore += positionScore * config.weights.position

  // 5. Determine tier based on thresholds
  let tier: ImportanceTier
  if (totalScore >= config.tierThresholds.primary) {
    tier = 'primary'
  } else if (totalScore >= config.tierThresholds.secondary) {
    tier = 'secondary'
  } else {
    tier = 'tertiary'
  }

  // 6. Metadata override (CRITICAL): Force metadata fields to tertiary
  if (isMetadataField(field.name, config.metadataPatterns)) {
    tier = 'tertiary'
  }

  return {
    tier,
    score: totalScore,
    signals,
  }
}

/**
 * Score name pattern matching against primary indicators.
 * Returns 1.0 if any indicator matches, 0.0 otherwise.
 *
 * @param fieldName - Field name to check
 * @param indicators - Array of regex patterns for primary indicators
 * @returns 1.0 if matched, 0.0 otherwise
 */
function scoreNamePattern(fieldName: string, indicators: readonly RegExp[]): number {
  for (const pattern of indicators) {
    if (pattern.test(fieldName)) {
      return 1.0
    }
  }
  return 0.0
}

/**
 * Score visual richness based on semantic category.
 * User decision: Visual fields (image, video, avatar) are more important.
 *
 * Returns:
 * - 1.0: High richness (image, video, thumbnail, avatar)
 * - 0.6: Medium richness (title, name, description)
 * - 0.2: Low richness (uuid, timestamp, date)
 * - 0.4: Default for unknown categories
 *
 * @param category - Detected semantic category (may be null)
 * @returns Score 0.0-1.0
 */
function scoreVisualRichness(category: SemanticCategory | null): number {
  if (!category) return 0.4

  // High visual richness: media fields
  if (['image', 'video', 'thumbnail', 'avatar'].includes(category)) {
    return 1.0
  }

  // Medium visual richness: text content fields
  if (['title', 'name', 'description'].includes(category)) {
    return 0.6
  }

  // Low visual richness: metadata and technical fields
  if (['uuid', 'timestamp', 'date'].includes(category)) {
    return 0.2
  }

  // Default: moderate richness
  return 0.4
}

/**
 * Score data presence based on sample values.
 * Fields with more non-null values are considered more important.
 *
 * @param sampleValues - Array of sample values
 * @returns Score 0.0-1.0 (ratio of non-null values)
 */
function scoreDataPresence(sampleValues: unknown[]): number {
  if (sampleValues.length === 0) return 0.0

  const nonNullCount = sampleValues.filter(v =>
    v !== null && v !== undefined && v !== ''
  ).length

  return nonNullCount / sampleValues.length
}

/**
 * Score position with logarithmic decay.
 * Earlier fields are slightly favored, but not heavily weighted.
 *
 * Uses logarithmic decay formula:
 * score = max(0.2, 1.0 - log10(normalizedPosition * 10 + 1) * 0.5)
 *
 * This produces:
 * - Position 0-2: ~1.0
 * - Position 5: ~0.7-0.8
 * - Position 10+: ~0.4-0.5
 * - Minimum: 0.2
 *
 * @param position - Zero-based position in field list
 * @param totalFields - Total number of fields
 * @returns Score 0.2-1.0
 */
function scorePosition(position: number, totalFields: number): number {
  if (totalFields <= 1) return 1.0

  const normalizedPosition = position / totalFields
  return Math.max(0.2, 1.0 - Math.log10(normalizedPosition * 10 + 1) * 0.5)
}

/**
 * Check if field matches metadata patterns.
 * User decision: Metadata fields are forced to tertiary tier.
 *
 * @param fieldName - Field name to check
 * @param patterns - Array of regex patterns for metadata detection
 * @returns True if field is metadata
 */
export function isMetadataField(
  fieldName: string,
  patterns: readonly RegExp[]
): boolean {
  return patterns.some(pattern => pattern.test(fieldName))
}
