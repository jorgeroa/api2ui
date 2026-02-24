/**
 * Plugin-related types extracted for the semantic-analysis package.
 * These are the subset of plugin types needed by the detection engine,
 * without any React dependencies.
 */

/** Context passed to plugin validators */
export interface FieldContext {
  /** Raw field name, e.g. 'price' */
  fieldName: string
  /** Full JSON path, e.g. '$.products[0].price' */
  fieldPath: string
  /** The parent object containing this field (for sibling inspection) */
  parentObject?: Record<string, unknown>
}

/**
 * A semantic category declared by a plugin for custom field detection.
 * Plugin-declared categories use regex/keyword name matching (not embeddings)
 * and compete alongside core categories in the scoring pipeline.
 */
export interface PluginSemanticCategory {
  /** Namespaced ID, e.g. '@maps/geo', '@viz/time-series' */
  id: string
  /** Human-readable name, e.g. 'Geographic Coordinates' */
  name: string
  /** Description shown in the ComponentPicker */
  description: string
  /** Regex patterns for matching field names */
  namePatterns: RegExp[]
  /** Additional keywords for matching, e.g. ['latitude', 'lng', 'koordinaten'] */
  nameKeywords?: string[]
  /** Runtime value shape validator */
  validate: (value: unknown, context: FieldContext) => boolean
}
