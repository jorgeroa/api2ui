/**
 * Plugin system types for the component registry.
 * Defines the FieldPlugin interface that all components (core, community, premium) implement.
 */

import type { ReactNode, ComponentType as ReactComponentType } from 'react'
import type { TypeSignature, SemanticMetadata } from './schema'
import type { SemanticCategory } from '../services/semantic/types'

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

/** Data types a plugin can accept */
export const DataType = {
  String: 'string',
  Number: 'number',
  Boolean: 'boolean',
  Date: 'date',
  Object: 'object',
  Array: 'array',
} as const
export type DataType = typeof DataType[keyof typeof DataType]

/** Source tier of a plugin */
export const PluginSource = {
  Core: 'core',
  Community: 'community',
  Premium: 'premium',
} as const
export type PluginSource = typeof PluginSource[keyof typeof PluginSource]

// ---------------------------------------------------------------------------
// Plugin-declared semantic category (Tier 2 detection — regex/keyword-based)
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Field context & render props
// ---------------------------------------------------------------------------

/** Context passed to plugin validation and rendering */
export interface FieldContext {
  /** Raw field name, e.g. 'price' */
  fieldName: string
  /** Full JSON path, e.g. '$.products[0].price' */
  fieldPath: string
  /** The parent object containing this field (for sibling inspection) */
  parentObject?: Record<string, unknown>
}

/** Props passed to every plugin component when rendering */
export interface FieldRenderProps {
  /** The actual data value */
  value: unknown
  /** Raw field name */
  fieldName: string
  /** Full JSON path */
  fieldPath: string
  /** Type signature from schema inference */
  schema: TypeSignature
  /** Semantic detection result (if available) */
  semantics?: SemanticMetadata
  /** Contextual data for sibling-aware rendering */
  context?: {
    parentObject?: Record<string, unknown>
    siblingFields?: Map<string, unknown>
  }
}

// ---------------------------------------------------------------------------
// FieldPlugin — the core plugin interface
// ---------------------------------------------------------------------------

/**
 * The core plugin interface. Every component — core, community, or premium —
 * implements this interface. Core plugins are statically imported; external
 * plugins are loaded via React.lazy() + dynamic import().
 */
export interface FieldPlugin {
  /** Unique ID: 'core/star-rating', '@user/fancy-gauge' */
  id: string
  /** Display name: 'Star Rating' */
  name: string
  /** Description shown in picker tooltip */
  description: string
  /** Picker thumbnail (emoji string or React node) */
  icon?: string | ReactNode

  /** What data this plugin can render */
  accepts: {
    /** Compatible data types */
    dataTypes: DataType[]
    /** Preferred core semantic categories (maps to existing detection) */
    semanticHints?: SemanticCategory[]
    /** Optional runtime validator for fine-grained compatibility checks */
    validate?: (value: unknown, context: FieldContext) => boolean
  }

  /** The React component that renders the field */
  component: ReactComponentType<FieldRenderProps>

  /** Plugin source tier */
  source: PluginSource
  /** SemVer version string */
  version: string
  /** Plugin author */
  author?: string
  /** Searchable tags: ['chart', 'analytics', 'map'] */
  tags?: string[]

  /** Plugin-declared semantic categories (Tier 2 detection) */
  customCategories?: PluginSemanticCategory[]
}
