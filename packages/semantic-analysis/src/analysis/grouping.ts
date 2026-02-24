/**
 * Field grouping detection algorithms.
 * Detects logical field groups using prefix matching and semantic clustering.
 */

import type { FieldInfo, PrefixGroup, SemanticCluster, GroupingResult } from './types'
import { GROUPING_CONFIG } from './config'

/**
 * Format group label from prefix.
 * Removes trailing separator, strips common suffixes, converts to title case.
 *
 * Examples:
 * - billing_ -> "Billing"
 * - shipping_address_ -> "Shipping Address"
 * - contact_info_ -> "Contact" (info suffix stripped)
 * - user_details_ -> "User" (details suffix stripped)
 *
 * @param prefix - Raw prefix string (e.g., 'billing_', 'user.')
 * @returns Formatted title case label
 */
function formatGroupLabel(prefix: string): string {
  // Remove trailing separator (_, .)
  let label = prefix.replace(/[_.]$/, '')

  // Split by separators for multi-word processing
  const words = label.split(/[_.]/)

  // Strip common suffixes from config
  const suffixes = GROUPING_CONFIG.suffixesToStrip as readonly string[]
  const lastWord = words[words.length - 1]?.toLowerCase() || ''
  if (suffixes.includes(lastWord as any)) {
    words.pop()
  }

  // Convert to title case: capitalize each word
  return words
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

/**
 * Detect prefix-based groups (e.g., billing_*, shipping_*, contact_*).
 *
 * Algorithm:
 * 1. Return empty if fields.length < minFieldsForGrouping (8)
 * 2. Build prefix map: extract prefix up to last _ or .
 * 3. Filter to prefixes with >= minFieldsPerGroup (3) fields
 * 4. Return array of PrefixGroup with formatted labels
 *
 * @param fields - All fields to analyze
 * @param config - Grouping configuration (defaults to GROUPING_CONFIG)
 * @returns Array of detected prefix groups
 */
export function detectPrefixGroups(
  fields: FieldInfo[],
  config = GROUPING_CONFIG
): PrefixGroup[] {
  // Early return if not enough fields for grouping
  if (fields.length < config.minFieldsForGrouping) {
    return []
  }

  // Build prefix map
  const prefixMap = new Map<string, FieldInfo[]>()
  for (const field of fields) {
    // Extract prefix up to last _ or .
    const lastSeparatorIndex = Math.max(
      field.name.lastIndexOf('_'),
      field.name.lastIndexOf('.')
    )

    if (lastSeparatorIndex > 0) {
      // Include separator in prefix
      const prefix = field.name.substring(0, lastSeparatorIndex + 1)
      const existing = prefixMap.get(prefix) || []
      existing.push(field)
      prefixMap.set(prefix, existing)
    }
  }

  // Filter to prefixes with >= minFieldsPerGroup fields
  const groups: PrefixGroup[] = []
  prefixMap.forEach((groupFields, prefix) => {
    if (groupFields.length >= config.minFieldsPerGroup) {
      groups.push({
        type: 'prefix',
        prefix,
        label: formatGroupLabel(prefix),
        fields: groupFields,
      })
    }
  })

  return groups
}

/**
 * Detect semantic clusters (e.g., email+phone+address -> "Contact").
 *
 * Algorithm:
 * 1. Return empty if fields.length < minFieldsForGrouping (8)
 * 2. For each rule in config.semanticClusters:
 *    - Filter fields where semanticCategory is in rule.categories
 *    - If matching fields >= rule.minFields, create cluster
 * 3. Return array of SemanticCluster
 *
 * Semantic cluster rules:
 * - Contact: ['email', 'phone', 'address'], minFields: 2
 * - Identity: ['name', 'email', 'avatar'], minFields: 2
 * - Pricing: ['price', 'currency_code', 'quantity'], minFields: 2
 * - Temporal: ['date', 'timestamp'], minFields: 2
 *
 * @param fields - Fields to analyze
 * @param config - Grouping configuration (defaults to GROUPING_CONFIG)
 * @returns Array of detected semantic clusters
 */
export function detectSemanticClusters(
  fields: FieldInfo[],
  config = GROUPING_CONFIG
): SemanticCluster[] {
  // Early return if not enough fields for grouping
  if (fields.length < config.minFieldsForGrouping) {
    return []
  }

  const clusters: SemanticCluster[] = []

  for (const rule of config.semanticClusters) {
    // Filter fields where semanticCategory is in rule.categories
    const matchingFields = fields.filter(
      field => field.semanticCategory && rule.categories.includes(field.semanticCategory)
    )

    // Create cluster if minimum fields met
    if (matchingFields.length >= rule.minFields) {
      clusters.push({
        type: 'semantic',
        label: rule.name,
        categories: rule.categories,
        fields: matchingFields,
      })
    }
  }

  return clusters
}

/**
 * Analyze field grouping using hybrid approach (prefix + semantic).
 *
 * Algorithm:
 * 1. Return { groups: [], ungrouped: fields } if fields.length < minFieldsForGrouping
 * 2. Run prefix grouping first, track which fields are grouped
 * 3. Run semantic clustering on remaining (non-prefix-grouped) fields to avoid conflicts
 * 4. Calculate ungrouped = fields not in any group
 * 5. ORPHAN CHECK (CRITICAL): If ungrouped.length is 1 or 2 AND some fields are grouped,
 *    return { groups: [], ungrouped: fields } - skip grouping entirely
 * 6. Return { groups: [...prefixGroups, ...semanticClusters], ungrouped }
 *
 * @param fields - All fields to analyze
 * @param config - Grouping configuration (defaults to GROUPING_CONFIG)
 * @returns Grouping result with groups and ungrouped fields
 */
export function analyzeGrouping(
  fields: FieldInfo[],
  config = GROUPING_CONFIG
): GroupingResult {
  // Early return if not enough fields for grouping
  if (fields.length < config.minFieldsForGrouping) {
    return {
      groups: [],
      ungrouped: fields,
    }
  }

  // Step 1: Run prefix grouping first
  const prefixGroups = detectPrefixGroups(fields, config)

  // Track which fields are in prefix groups
  const prefixGroupedPaths = new Set<string>()
  for (const group of prefixGroups) {
    for (const field of group.fields) {
      prefixGroupedPaths.add(field.path)
    }
  }

  // Step 2: Run semantic clustering on remaining fields (avoid conflicts)
  const remainingFields = fields.filter(field => !prefixGroupedPaths.has(field.path))
  const semanticClusters = detectSemanticClusters(remainingFields, config)

  // Track which fields are in semantic clusters
  const semanticGroupedPaths = new Set<string>()
  for (const cluster of semanticClusters) {
    for (const field of cluster.fields) {
      semanticGroupedPaths.add(field.path)
    }
  }

  // Step 3: Calculate ungrouped fields
  const ungrouped = fields.filter(
    field => !prefixGroupedPaths.has(field.path) && !semanticGroupedPaths.has(field.path)
  )

  // Step 4: ORPHAN CHECK (CRITICAL)
  // If 1-2 fields would be orphaned AND some fields are grouped, skip grouping entirely
  const totalGroups = prefixGroups.length + semanticClusters.length
  if ((ungrouped.length === 1 || ungrouped.length === 2) && totalGroups > 0) {
    return {
      groups: [],
      ungrouped: fields,
    }
  }

  // Step 5: Return combined result
  return {
    groups: [...prefixGroups, ...semanticClusters],
    ungrouped,
  }
}
