/**
 * Configuration for field importance scoring and grouping analysis.
 * All weights, thresholds, patterns, and rules for the analysis layer.
 */

import type { SemanticCategory } from '../semantic/types'

/**
 * Complete analysis configuration.
 * User decisions: All weights locked, thresholds at 80%/50%, minimum 8+ fields for grouping.
 */
export const ANALYSIS_CONFIG = {
  importance: {
    /**
     * Weights for importance scoring signals.
     * User decision: namePattern 40%, visualRichness 25%, dataPresence 20%, position 15%
     * MUST sum to 1.0
     */
    weights: {
      namePattern: 0.40,
      visualRichness: 0.25,
      dataPresence: 0.20,
      position: 0.15,
    },
    /**
     * Tier thresholds for importance classification.
     * User decision: >= 80% is primary, 50-79% is secondary, <50% is tertiary
     */
    tierThresholds: {
      primary: 0.80,
      secondary: 0.50,
    },
    /**
     * Metadata field patterns (forced to tertiary regardless of score).
     * User decision: id, _prefixed, foreign keys, internal timestamps are metadata.
     */
    metadataPatterns: [
      /^id$/i,                          // Exact 'id' field
      /^_/,                             // Internal fields (_prefixed)
      /^[a-z]+_id$/i,                   // Foreign key IDs (user_id, post_id, product_id)
      /^(created|updated|deleted)_at$/i, // Internal timestamps
      /^(created|updated|deleted)_date$/i, // Internal dates
    ],
    /**
     * Primary indicator patterns (name patterns that boost importance).
     * User decision: name, title, headline are primary indicators.
     * Matches fields containing these terms (e.g., product_title, user_name).
     */
    primaryIndicators: [
      /(name|title|headline|heading|label|summary)/i,
    ],
  },
  grouping: {
    /**
     * Minimum fields before grouping analysis is performed.
     * User decision: 8+ fields required.
     */
    minFieldsForGrouping: 8,
    /**
     * Minimum fields per group.
     * User decision: 3+ fields required for a valid group.
     */
    minFieldsPerGroup: 3,
    /**
     * Suffixes to strip from group labels.
     * Claude's discretion: Common parameter suffixes that don't add meaning.
     */
    suffixesToStrip: [
      'info',
      'details',
      'data',
      'config',
      'settings',
      'options',
      'params',
      'parameters',
    ],
    /**
     * Semantic cluster rules for grouping related fields.
     * User decision: Four core clusters (Contact, Identity, Pricing, Temporal).
     */
    semanticClusters: [
      {
        name: 'Contact',
        categories: ['email', 'phone', 'address'] as SemanticCategory[],
        minFields: 2,
      },
      {
        name: 'Identity',
        categories: ['name', 'email', 'avatar'] as SemanticCategory[],
        minFields: 2,
      },
      {
        name: 'Pricing',
        categories: ['price', 'currency_code', 'quantity'] as SemanticCategory[],
        minFields: 2,
      },
      {
        name: 'Temporal',
        categories: ['date', 'timestamp'] as SemanticCategory[],
        minFields: 2,
      },
    ],
  },
} as const

/**
 * Typed importance configuration subset.
 */
export const IMPORTANCE_CONFIG = ANALYSIS_CONFIG.importance

/**
 * Typed grouping configuration subset.
 */
export const GROUPING_CONFIG = ANALYSIS_CONFIG.grouping
