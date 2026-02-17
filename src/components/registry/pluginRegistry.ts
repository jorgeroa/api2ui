/**
 * Plugin registry for field-level components.
 * Maps semantic categories → default plugins and provides compatibility queries.
 * Complements ComponentRegistry.tsx which handles layout-level components.
 */

import type { FieldPlugin, PluginSemanticCategory } from '../../types/plugins'
import type { DataType, PluginSource } from '../../types/plugins'
import type { SemanticCategory } from '../../services/semantic/types'

/**
 * Registry that manages all field-level plugins (core, community, premium).
 * Plugins register themselves on app init. The registry resolves which plugin
 * should render a field based on semantic category and data type.
 */
export class PluginRegistry {
  private plugins: Map<string, FieldPlugin> = new Map()
  private customCategories: Map<string, PluginSemanticCategory> = new Map()

  /** Default mapping: semantic category → plugin ID */
  private defaults: Map<string, string> = new Map()

  /**
   * Register a plugin. Also registers any custom semantic categories it declares.
   */
  register(plugin: FieldPlugin): void {
    if (this.plugins.has(plugin.id)) {
      console.warn(`[PluginRegistry] Overwriting plugin: ${plugin.id}`)
    }
    this.plugins.set(plugin.id, plugin)

    // Register custom categories declared by the plugin
    if (plugin.customCategories) {
      for (const category of plugin.customCategories) {
        this.customCategories.set(category.id, category)
      }
    }
  }

  /**
   * Set the default plugin for a semantic category.
   * Called during core plugin registration to establish defaults.
   */
  setDefault(semanticCategory: string, pluginId: string): void {
    this.defaults.set(semanticCategory, pluginId)
  }

  /**
   * Get the default plugin for a semantic category.
   * Returns null if no default is set or the plugin isn't registered.
   */
  getDefault(semanticCategory: string): FieldPlugin | null {
    const pluginId = this.defaults.get(semanticCategory)
    if (!pluginId) return null
    return this.plugins.get(pluginId) ?? null
  }

  /**
   * Get all plugins compatible with a data type and optional semantic category.
   * Returns plugins sorted by relevance: semantic match first, then data type match.
   */
  getCompatible(dataType: DataType, semanticCategory?: SemanticCategory | string): FieldPlugin[] {
    const results: FieldPlugin[] = []

    for (const plugin of this.plugins.values()) {
      // Check data type compatibility
      if (!plugin.accepts.dataTypes.includes(dataType)) continue

      // If a semantic category is specified, prefer plugins that declare it
      if (semanticCategory && plugin.accepts.semanticHints?.includes(semanticCategory as SemanticCategory)) {
        results.unshift(plugin) // semantic match goes to front
      } else {
        results.push(plugin)
      }
    }

    return results
  }

  /**
   * Get a specific plugin by ID.
   */
  get(id: string): FieldPlugin | null {
    return this.plugins.get(id) ?? null
  }

  /**
   * List all registered plugins, optionally filtered by source or tags.
   */
  list(filter?: { source?: PluginSource; tags?: string[] }): FieldPlugin[] {
    let results = Array.from(this.plugins.values())

    if (filter?.source) {
      results = results.filter((p) => p.source === filter.source)
    }

    if (filter?.tags && filter.tags.length > 0) {
      const tagSet = new Set(filter.tags)
      results = results.filter((p) => p.tags?.some((t) => tagSet.has(t)))
    }

    return results
  }

  /**
   * Get all plugin-declared custom categories.
   * These are fed into the scoring pipeline for Tier 2 (regex/keyword) detection.
   */
  getCustomCategories(): PluginSemanticCategory[] {
    return Array.from(this.customCategories.values())
  }

  /**
   * Get the total number of registered plugins.
   */
  get size(): number {
    return this.plugins.size
  }
}

/** Singleton registry instance */
export const registry = new PluginRegistry()
