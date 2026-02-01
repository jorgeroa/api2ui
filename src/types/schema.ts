/** Primitive field types detected from JSON values */
export type FieldType = 'string' | 'number' | 'boolean' | 'null' | 'date' | 'unknown'

/** Type signature for a field -- can be primitive, object, or array */
export type TypeSignature =
  | { kind: 'primitive'; type: FieldType }
  | { kind: 'array'; items: TypeSignature }
  | { kind: 'object'; fields: Map<string, FieldDefinition> }

/** Confidence level based on multi-sample consistency */
export type Confidence = 'high' | 'medium' | 'low'

/** A single field in the inferred schema */
export interface FieldDefinition {
  name: string
  type: TypeSignature
  optional: boolean
  nullable: boolean
  confidence: Confidence
  sampleValues: unknown[]
}

/** The complete inferred schema for an API response */
export interface UnifiedSchema {
  rootType: TypeSignature
  sampleCount: number
  url: string
  inferredAt: number  // timestamp
}
