/**
 * Plugin manifest and configuration types for external plugin loading.
 * Supports npm packages, CDN URLs, and local file paths.
 */

/**
 * Describes an installable plugin package.
 * Each package can export one or more FieldPlugin instances.
 */
export interface PluginManifest {
  /** Unique plugin package ID, e.g. '@maps/mapbox-pin', 'premium/animated-gauge' */
  id: string
  /** Display name for the plugin package */
  name: string
  /** How the plugin is loaded */
  source: 'npm' | 'url' | 'local'
  /** npm package name (when source = 'npm'), e.g. 'api2aux-plugin-mapbox' */
  package?: string
  /** CDN or remote URL (when source = 'url') */
  url?: string
  /** Local file path (when source = 'local') */
  path?: string
  /** Plugin version (semver) */
  version: string
  /** Whether this plugin is currently enabled */
  enabled: boolean
}

/**
 * Persisted plugin configuration.
 * Stored in localStorage alongside other config state.
 */
export interface PluginConfig {
  /** Installed external plugins (core plugins are always available) */
  installed: PluginManifest[]
  /** User preference: semantic category → preferred plugin ID */
  preferences: Record<string, string>
}

/** Default empty plugin configuration */
export const DEFAULT_PLUGIN_CONFIG: PluginConfig = {
  installed: [],
  preferences: {},
}
