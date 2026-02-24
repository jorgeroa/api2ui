/**
 * Public API for field importance and grouping analysis.
 * This is the main entry point for the analysis module.
 */

import type { FieldInfo, AnalysisResult } from './types'
import { calculateImportance } from './importance'
import { analyzeGrouping } from './grouping'
import { ANALYSIS_CONFIG } from './config'

/**
 * Analyze fields using importance scoring and grouping detection.
 * This is the main public API that combines both analysis approaches.
 *
 * Algorithm:
 * 1. Calculate importance score for each field
 * 2. Run grouping analysis (prefix + semantic clustering)
 * 3. Return combined result
 *
 * @param fields - All fields to analyze
 * @param config - Optional configuration (defaults to ANALYSIS_CONFIG)
 * @returns Analysis result with importance Map and grouping result
 */
export function analyzeFields(
  fields: FieldInfo[],
  config = ANALYSIS_CONFIG
): AnalysisResult {
  // Step 1: Calculate importance scores for all fields
  const importance = new Map<string, import('./types').ImportanceScore>()
  for (const field of fields) {
    const score = calculateImportance(field, config.importance)
    importance.set(field.path, score)
  }

  // Step 2: Run grouping analysis
  const grouping = analyzeGrouping(fields, config.grouping)

  // Step 3: Return combined result
  return {
    importance,
    grouping,
  }
}

// Re-export types
export type {
  ImportanceTier,
  ImportanceScore,
  ImportanceSignalMatch,
  FieldInfo,
  GroupingResult,
  FieldGroup,
  PrefixGroup,
  SemanticCluster,
  AnalysisResult,
} from './types'

// Re-export config
export {
  ANALYSIS_CONFIG,
  IMPORTANCE_CONFIG,
  GROUPING_CONFIG,
} from './config'

// Re-export core functions
export { calculateImportance, isMetadataField } from './importance'
export { detectPrefixGroups, detectSemanticClusters, analyzeGrouping } from './grouping'
