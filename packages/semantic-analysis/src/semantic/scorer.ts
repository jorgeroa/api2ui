/**
 * Confidence scoring algorithm for semantic field detection.
 * Calculates weighted scores based on multi-signal pattern matching.
 *
 * Signals and weights:
 *   - Name matching (embedding or regex): 0.40
 *   - Type constraint: 0.20
 *   - Value validators: 0.25-0.30
 *   - Format hints: 0.10-0.15 (only counted when OpenAPI hints are present)
 */

import type {
  SemanticPattern,
  ConfidenceResult,
  ConfidenceLevel,
  SignalMatch,
} from './types'
import { getActiveStrategy } from './strategies'

/** Weight allocated to the name matching signal. */
const NAME_MATCH_WEIGHT = 0.40

/**
 * Calculate confidence score for a field against a semantic pattern.
 * Uses multi-signal approach: name matching, type constraints, value validators, and format hints.
 *
 * The name matching signal uses the currently active strategy (embedding by
 * default, regex as fallback). The strategy returns a 0.0-1.0 score which
 * is then weighted by NAME_MATCH_WEIGHT (0.40).
 *
 * @param fieldName - The name of the field being evaluated
 * @param fieldType - The inferred type of the field (e.g., 'string', 'number', 'array')
 * @param sampleValues - Sample values from the field (for value validation)
 * @param openapiHints - Optional OpenAPI hints (format, description)
 * @param pattern - The semantic pattern to match against
 * @returns ConfidenceResult with score, level, and signal breakdown
 */
export function calculateConfidence(
  fieldName: string,
  fieldType: string,
  sampleValues: unknown[],
  openapiHints: { format?: string; description?: string } | undefined,
  pattern: SemanticPattern
): ConfidenceResult {
  const signals: SignalMatch[] = []
  let totalScore = 0
  let maxPossibleScore = 0

  // 1. Name matching via active strategy
  const strategy = getActiveStrategy()
  const nameScore = strategy.matchName(fieldName, pattern.category, pattern)
  const nameContribution = nameScore * NAME_MATCH_WEIGHT
  maxPossibleScore += NAME_MATCH_WEIGHT

  signals.push({
    name: `nameMatch:${strategy.name}`,
    matched: nameScore > 0,
    weight: NAME_MATCH_WEIGHT,
    contribution: nameContribution,
  })
  totalScore += nameContribution

  // 2. Type constraint matching
  if (pattern.typeConstraint.weight > 0) {
    const typeMatched = pattern.typeConstraint.allowed.includes(fieldType)
    maxPossibleScore += pattern.typeConstraint.weight

    signals.push({
      name: 'typeConstraint',
      matched: typeMatched,
      weight: pattern.typeConstraint.weight,
      contribution: typeMatched ? pattern.typeConstraint.weight : 0,
    })

    if (typeMatched) {
      totalScore += pattern.typeConstraint.weight
    }
  }

  // 3. Value validators - add weight if ANY sample value matches
  for (const validator of pattern.valueValidators) {
    maxPossibleScore += validator.weight

    const anyMatch = sampleValues.some(value => {
      try {
        return validator.validator(value)
      } catch {
        return false
      }
    })

    signals.push({
      name: `valueValidator:${validator.name}`,
      matched: anyMatch,
      weight: validator.weight,
      contribution: anyMatch ? validator.weight : 0,
    })

    if (anyMatch) {
      totalScore += validator.weight
    }
  }

  // 4. Format hint matching
  // FIX: Only include format hints in maxPossibleScore when OpenAPI hints are
  // actually present. Previously this always counted, deflating scores by
  // 10-18% for non-OpenAPI APIs.
  if (openapiHints?.format && pattern.formatHints.length > 0) {
    for (const hint of pattern.formatHints) {
      maxPossibleScore += hint.weight

      const formatMatched = openapiHints.format === hint.format

      signals.push({
        name: `formatHint:${hint.format}`,
        matched: formatMatched,
        weight: hint.weight,
        contribution: formatMatched ? hint.weight : 0,
      })

      if (formatMatched) {
        totalScore += hint.weight
      }
    }
  }
  // When no OpenAPI hints are present, format hints are excluded entirely
  // from both numerator and denominator — no score deflation.

  // Calculate final confidence (avoid division by zero)
  const confidence = maxPossibleScore > 0 ? totalScore / maxPossibleScore : 0

  // Determine confidence level based on thresholds
  const level = determineConfidenceLevel(confidence, pattern.thresholds)

  return {
    category: pattern.category,
    confidence,
    level,
    signals,
  }
}

/**
 * Determine confidence level from score and thresholds.
 * - high: >= threshold.high (default 0.75)
 * - medium: >= threshold.medium (default 0.50)
 * - low: > 0
 * - none: 0
 */
function determineConfidenceLevel(
  confidence: number,
  thresholds: { high: number; medium: number }
): ConfidenceLevel {
  if (confidence >= thresholds.high) {
    return 'high'
  }
  if (confidence >= thresholds.medium) {
    return 'medium'
  }
  if (confidence > 0) {
    return 'low'
  }
  return 'none'
}
