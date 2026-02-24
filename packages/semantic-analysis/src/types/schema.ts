/** Primitive field types detected from JSON values */
export const FieldType = {
  String: 'string',
  Number: 'number',
  Boolean: 'boolean',
  Null: 'null',
  Date: 'date',
  Unknown: 'unknown',
} as const
export type FieldType = typeof FieldType[keyof typeof FieldType]

/** Type signature for a field -- can be primitive, object, or array */
export type TypeSignature =
  | { kind: 'primitive'; type: FieldType }
  | { kind: 'array'; items: TypeSignature }
  | { kind: 'object'; fields: Map<string, FieldDefinition> }

/** Confidence level based on multi-sample consistency */
export const Confidence = {
  High: 'high',
  Medium: 'medium',
  Low: 'low',
} as const
export type Confidence = typeof Confidence[keyof typeof Confidence]

/**
 * Semantic detection metadata for a field.
 * Stores the result of semantic pattern matching.
 */
export interface SemanticMetadata {
  /** Detected semantic category (null if no confident match) */
  detectedCategory: string | null
  /** Confidence score (0.0-1.0) */
  confidence: number
  /** Discretized confidence level */
  level: 'high' | 'medium' | 'low' | 'none'
  /** How the semantic was applied */
  appliedAt: 'user' | 'smart-default' | 'type-based'
  /** Alternative category matches with their confidence scores */
  alternatives: Array<{ category: string; confidence: number }>
}

/** A single field in the inferred schema */
export interface FieldDefinition {
  name: string
  type: TypeSignature
  optional: boolean
  nullable: boolean
  confidence: Confidence
  sampleValues: unknown[]
  /** Semantic detection result (optional, populated by semantic analyzer) */
  semantics?: SemanticMetadata
}

/** The complete inferred schema for an API response */
export interface UnifiedSchema {
  rootType: TypeSignature
  sampleCount: number
  url: string
  inferredAt: number  // timestamp
}
