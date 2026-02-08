/**
 * Core types for field importance scoring and grouping analysis.
 * Defines the type system for multi-signal importance analysis and semantic grouping.
 */

import type { SemanticCategory } from '../semantic/types'

/**
 * Importance tier representing the visual prominence of a field.
 * - primary: Main content fields (>=80% score) - displayed prominently
 * - secondary: Supporting fields (50-79% score) - displayed normally
 * - tertiary: Metadata/utility fields (<50% score) - de-emphasized
 */
export type ImportanceTier = 'primary' | 'secondary' | 'tertiary'

/**
 * Represents a single signal that contributed to the importance score.
 * Similar to semantic SignalMatch but for importance scoring.
 */
export interface ImportanceSignalMatch {
  /** Signal identifier (e.g., 'namePattern', 'visualRichness', 'dataPresence', 'position') */
  name: string
  /** Whether this signal matched */
  matched: boolean
  /** Maximum possible weight for this signal (0.0-1.0) */
  weight: number
  /** Actual score contributed (weighted contribution) */
  contribution: number
}

/**
 * Result of importance scoring for a single field.
 */
export interface ImportanceScore {
  /** The determined importance tier */
  tier: ImportanceTier
  /** Overall importance score (0.0-1.0) */
  score: number
  /** Individual signals that contributed to the score */
  signals: ImportanceSignalMatch[]
}

/**
 * Input information for importance scoring.
 * Contains all data needed to evaluate a field's importance.
 */
export interface FieldInfo {
  /** JSON path to the field (e.g., 'user.name', 'items[0].price') */
  path: string
  /** Field name (last segment of path) */
  name: string
  /** Detected semantic category from Phase 12 (may be null) */
  semanticCategory: SemanticCategory | null
  /** Sample values for data presence analysis */
  sampleValues: unknown[]
  /** Zero-based position in the original field list */
  position: number
  /** Total number of fields in the schema */
  totalFields: number
}

/**
 * Result of grouping analysis.
 */
export interface GroupingResult {
  /** Detected field groups (prefix-based and semantic) */
  groups: FieldGroup[]
  /** Fields that don't belong to any group */
  ungrouped: FieldInfo[]
}

/**
 * A group of related fields (prefix-based or semantic).
 */
export type FieldGroup = PrefixGroup | SemanticCluster

/**
 * Prefix-based group (e.g., billing_*, contact_*).
 */
export interface PrefixGroup {
  /** Group type discriminator */
  type: 'prefix'
  /** The common prefix (includes separator, e.g., 'billing_', 'user.') */
  prefix: string
  /** Human-readable label for the group (e.g., 'Billing', 'User') */
  label: string
  /** Fields in this group */
  fields: FieldInfo[]
}

/**
 * Semantic cluster group (e.g., email+phone+address → "Contact").
 */
export interface SemanticCluster {
  /** Group type discriminator */
  type: 'semantic'
  /** Human-readable label for the cluster (e.g., 'Contact', 'Identity') */
  label: string
  /** Semantic categories that define this cluster */
  categories: SemanticCategory[]
  /** Fields in this cluster */
  fields: FieldInfo[]
}

/**
 * Combined analysis result: importance scores and grouping.
 */
export interface AnalysisResult {
  /** Field path → importance score mapping */
  importance: Map<string, ImportanceScore>
  /** Detected field groupings */
  grouping: GroupingResult
}
