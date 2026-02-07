/**
 * Confidence scoring algorithm for semantic field detection.
 * Calculates weighted scores based on multi-signal pattern matching.
 */

import type {
  SemanticPattern,
  ConfidenceResult,
  ConfidenceLevel,
  SignalMatch,
} from './types'

/**
 * Calculate confidence score for a field against a semantic pattern.
 * Uses multi-signal approach: name patterns, type constraints, value validators, and format hints.
 *
 * Algorithm:
 * 1. For name patterns: take best match weight (not sum of all matches)
 * 2. For type constraint: add weight if field type is allowed
 * 3. For value validators: add weight if any sample value matches
 * 4. For format hints: add weight if OpenAPI format matches
 * 5. Calculate confidence = totalScore / maxPossibleScore
 * 6. Determine level: >= 0.75 = high, >= 0.50 = medium, > 0 = low, 0 = none
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

  // 1. Name pattern matching - take best match only (not sum)
  if (pattern.namePatterns.length > 0) {
    let bestNameMatch = 0
    let bestNameWeight = 0
    let matchedPatternName = ''

    for (const namePattern of pattern.namePatterns) {
      if (namePattern.weight > bestNameWeight) {
        bestNameWeight = namePattern.weight
      }
      if (namePattern.regex.test(fieldName)) {
        if (namePattern.weight > bestNameMatch) {
          bestNameMatch = namePattern.weight
          matchedPatternName = namePattern.regex.source
        }
      }
    }

    // Max possible is the highest weight among all name patterns
    const nameMaxWeight = Math.max(...pattern.namePatterns.map(p => p.weight))
    maxPossibleScore += nameMaxWeight

    signals.push({
      name: matchedPatternName ? `namePattern:${matchedPatternName}` : 'namePattern',
      matched: bestNameMatch > 0,
      weight: nameMaxWeight,
      contribution: bestNameMatch,
    })
    totalScore += bestNameMatch
  }

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
  } else {
    // Still count format hints toward max if they exist (but won't match)
    for (const hint of pattern.formatHints) {
      maxPossibleScore += hint.weight
      signals.push({
        name: `formatHint:${hint.format}`,
        matched: false,
        weight: hint.weight,
        contribution: 0,
      })
    }
  }

  // Calculate final confidence (avoid division by zero)
  const confidence = maxPossibleScore > 0 ? totalScore / maxPossibleScore : 0

  // Determine confidence level based on thresholds
  // User decision: >= 0.75 = high (apply smart default)
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
