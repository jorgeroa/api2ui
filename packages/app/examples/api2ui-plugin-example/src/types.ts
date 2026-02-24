/**
 * Minimal inlined types for standalone plugin development.
 * These mirror the core api2ui plugin types so the template has zero
 * dependency on the api2ui source tree.
 *
 * For full type definitions, see: src/types/plugins.ts in the api2ui repo.
 */

import type { ComponentType } from 'react'

/** Data types a plugin can accept */
export const DataType = {
  String: 'string',
  Number: 'number',
  Boolean: 'boolean',
  Date: 'date',
  Object: 'object',
  Array: 'array',
} as const
export type DataType = (typeof DataType)[keyof typeof DataType]

/** Source tier of a plugin */
export const PluginSource = {
  Core: 'core',
  Community: 'community',
  Premium: 'premium',
} as const
export type PluginSource = (typeof PluginSource)[keyof typeof PluginSource]

/** Props passed to every plugin component when rendering */
export interface FieldRenderProps {
  value: unknown
  fieldName: string
  fieldPath: string
  schema: Record<string, unknown>
  semantics?: Record<string, unknown>
  context?: {
    parentObject?: Record<string, unknown>
    siblingFields?: Map<string, unknown>
  }
}

/** Context passed to plugin validation */
export interface FieldContext {
  fieldName: string
  fieldPath: string
  parentObject?: Record<string, unknown>
}

/** A semantic category declared by a plugin for custom field detection */
export interface PluginSemanticCategory {
  id: string
  name: string
  description: string
  namePatterns: RegExp[]
  nameKeywords?: string[]
  validate: (value: unknown, context: FieldContext) => boolean
}

/** The core plugin interface — every plugin must implement this */
export interface FieldPlugin {
  id: string
  name: string
  description: string
  icon?: string
  accepts: {
    dataTypes: DataType[]
    semanticHints?: string[]
    validate?: (value: unknown, context: FieldContext) => boolean
  }
  component: ComponentType<FieldRenderProps>
  source: PluginSource
  version: string
  author?: string
  tags?: string[]
  customCategories?: PluginSemanticCategory[]
}
