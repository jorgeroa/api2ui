/**
 * Core types for semantic field detection.
 * Defines the type system and pattern structures for multi-signal semantic analysis.
 */

/**
 * Semantic category representing the detected meaning of a field.
 * Categories cover commerce, media, engagement, identity, and temporal domains.
 */
export type SemanticCategory =
  // Commerce
  | 'price'
  | 'currency_code'
  | 'sku'
  | 'quantity'
  // Engagement
  | 'rating'
  | 'reviews'
  | 'tags'
  | 'status'
  // Media
  | 'image'
  | 'video'
  | 'thumbnail'
  | 'avatar'
  // Identity
  | 'email'
  | 'phone'
  | 'uuid'
  | 'name'
  | 'address'
  | 'url'
  // Temporal
  | 'date'
  | 'timestamp'
  // Content
  | 'description'
  | 'title'

/**
 * Confidence level based on pattern match strength.
 * - high: >= 0.75 (apply smart default)
 * - medium: >= 0.50 (consider but don't auto-apply)
 * - low: > 0 (weak signal)
 * - none: 0 (no match)
 */
export type ConfidenceLevel = 'high' | 'medium' | 'low' | 'none'

/**
 * Represents a single signal that contributed to the confidence score.
 */
export interface SignalMatch {
  /** Signal identifier (e.g., 'namePattern:price', 'typeConstraint', 'valueValidator:isCurrency') */
  name: string
  /** Whether this signal matched */
  matched: boolean
  /** Maximum possible weight for this signal (0.0-1.0) */
  weight: number
  /** Actual score contributed (weight if matched, 0 if not) */
  contribution: number
}

/**
 * Result of semantic detection for a single field against a pattern.
 */
export interface ConfidenceResult {
  /** The semantic category being evaluated */
  category: SemanticCategory
  /** Overall confidence score (0.0-1.0) */
  confidence: number
  /** Discretized confidence level */
  level: ConfidenceLevel
  /** Individual signals that contributed to the score */
  signals: SignalMatch[]
}

/**
 * Pattern for matching field names.
 * Supports multiple languages for internationalized field detection.
 */
export interface NamePattern {
  /** Regular expression to match against field name */
  regex: RegExp
  /** Weight contribution when matched (0.0-1.0) */
  weight: number
  /** Languages this pattern applies to (e.g., ['en', 'es', 'fr', 'de']) */
  languages: string[]
}

/**
 * Constraint on the field's type for pattern matching.
 */
export interface TypeConstraint {
  /** Allowed type names (e.g., 'string', 'number', 'array', 'object') */
  allowed: string[]
  /** Weight contribution when type matches (0.0-1.0) */
  weight: number
}

/**
 * Validator function for checking sample values.
 */
export interface ValueValidator {
  /** Human-readable name for debugging (e.g., 'isCurrencyFormat', 'isValidRating') */
  name: string
  /** Validation function that checks a single value */
  validator: (value: unknown) => boolean
  /** Weight contribution when any sample value matches (0.0-1.0) */
  weight: number
}

/**
 * Hint from OpenAPI/Swagger format field.
 */
export interface FormatHint {
  /** OpenAPI format string (e.g., 'uri', 'email', 'date-time', 'uuid') */
  format: string
  /** Weight contribution when format matches (0.0-1.0) */
  weight: number
}

/**
 * Default threshold values for confidence levels.
 * User decision: 75% threshold for HIGH (more aggressive than roadmap's 90%).
 */
export const DEFAULT_THRESHOLDS = {
  high: 0.75,
  medium: 0.50,
} as const

/**
 * Complete pattern definition for detecting a semantic category.
 * Uses multi-signal approach: name patterns, type constraints, value validation, and format hints.
 */
export interface SemanticPattern {
  /** The semantic category this pattern detects */
  category: SemanticCategory
  /** Name patterns to match against field name (best match wins, not sum) */
  namePatterns: NamePattern[]
  /** Type constraint for the field */
  typeConstraint: TypeConstraint
  /** Value validators to run against sample values */
  valueValidators: ValueValidator[]
  /** OpenAPI format hints */
  formatHints: FormatHint[]
  /** Thresholds for confidence level classification */
  thresholds: {
    /** Minimum score for HIGH confidence (default: 0.75 per user decision) */
    high: number
    /** Minimum score for MEDIUM confidence (default: 0.50) */
    medium: number
  }
}

/**
 * Extended pattern for composite types (e.g., array of review objects).
 * Detects patterns based on the structure of nested objects within arrays.
 */
export interface CompositePattern extends SemanticPattern {
  /** Required fields within array items (for composite detection) */
  requiredFields: Array<{
    /** Pattern to match field name */
    nameRegex: RegExp
    /** Expected type of the field */
    type: string
  }>
  /** Minimum number of required fields that must match (default: 1) */
  minItems: number
}

/**
 * Type guard to check if a pattern is a composite pattern.
 */
export function isCompositePattern(pattern: SemanticPattern): pattern is CompositePattern {
  return 'requiredFields' in pattern && Array.isArray((pattern as CompositePattern).requiredFields)
}
