/**
 * Plugin loader — loads external plugins via dynamic import.
 *
 * Supports three loading strategies:
 * - npm: Loads from node_modules (for installed npm packages)
 * - url:  Loads from a CDN or remote URL
 * - local: Loads from a local file path (dev/testing)
 *
 * Plugin packages follow the naming convention `api2ui-plugin-*`
 * and export a `plugins` array of FieldPlugin instances.
 */

import type { FieldPlugin } from '../../types/plugins'
import type { PluginManifest } from '../../types/pluginManifest'
import { registry } from '../../components/registry/pluginRegistry'

/** Result of loading a plugin package */
export interface PluginLoadResult {
  manifest: PluginManifest
  plugins: FieldPlugin[]
  error?: string
}

/** Cache of loaded plugin modules to avoid re-importing */
const loadedModules = new Map<string, FieldPlugin[]>()

/**
 * Load a single plugin package from its manifest.
 * Returns the loaded FieldPlugin instances, or an error if loading fails.
 */
export async function loadPlugin(manifest: PluginManifest): Promise<PluginLoadResult> {
  // Return cached if already loaded
  if (loadedModules.has(manifest.id)) {
    return { manifest, plugins: loadedModules.get(manifest.id)! }
  }

  try {
    let module: Record<string, unknown>

    switch (manifest.source) {
      case 'npm': {
        if (!manifest.package) {
          return { manifest, plugins: [], error: 'No package name specified' }
        }
        // Dynamic import from node_modules — Vite handles this at build time
        module = await import(/* @vite-ignore */ manifest.package)
        break
      }
      case 'url': {
        if (!manifest.url) {
          return { manifest, plugins: [], error: 'No URL specified' }
        }
        // Dynamic import from URL — browser native ES module loading
        module = await import(/* @vite-ignore */ manifest.url)
        break
      }
      case 'local': {
        if (!manifest.path) {
          return { manifest, plugins: [], error: 'No path specified' }
        }
        module = await import(/* @vite-ignore */ manifest.path)
        break
      }
      default:
        return { manifest, plugins: [], error: `Unknown source: ${manifest.source}` }
    }

    // Extract plugins from the module
    const plugins = extractPlugins(module)
    if (plugins.length === 0) {
      return { manifest, plugins: [], error: 'No valid plugins found in module. Expected a `plugins` export of FieldPlugin[].' }
    }

    // Cache and return
    loadedModules.set(manifest.id, plugins)
    return { manifest, plugins }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error(`[PluginLoader] Failed to load plugin "${manifest.id}":`, err)
    return { manifest, plugins: [], error: message }
  }
}

/**
 * Load multiple plugins and register them with the registry.
 * Skips disabled manifests. Returns results for all attempted loads.
 */
export async function loadAndRegisterPlugins(
  manifests: PluginManifest[],
): Promise<PluginLoadResult[]> {
  const enabledManifests = manifests.filter((m) => m.enabled)
  const results = await Promise.allSettled(enabledManifests.map(loadPlugin))

  const loadResults: PluginLoadResult[] = []

  for (const result of results) {
    if (result.status === 'fulfilled') {
      const loadResult = result.value
      loadResults.push(loadResult)

      // Register successfully loaded plugins
      if (!loadResult.error) {
        for (const plugin of loadResult.plugins) {
          registry.register(plugin)
        }
      }
    } else {
      // Promise rejection — shouldn't happen since loadPlugin catches errors
      console.error('[PluginLoader] Unexpected rejection:', result.reason)
    }
  }

  return loadResults
}

/**
 * Unload a plugin package — removes its plugins from the registry.
 * Note: The module itself remains cached in the browser's module cache.
 */
export function unloadPlugin(manifestId: string): void {
  const plugins = loadedModules.get(manifestId)
  if (plugins) {
    // The current registry doesn't support unregister — this is a known limitation.
    // For now, removing from our cache prevents re-registration on next load.
    loadedModules.delete(manifestId)
  }
}

/**
 * Extract FieldPlugin instances from a loaded module.
 * Looks for: `plugins` (array), `default` (array or single), or any exported FieldPlugin.
 */
function extractPlugins(module: Record<string, unknown>): FieldPlugin[] {
  // Preferred: named `plugins` export
  if (Array.isArray(module.plugins)) {
    return module.plugins.filter(isFieldPlugin)
  }

  // Fallback: default export
  if (module.default) {
    if (Array.isArray(module.default)) {
      return (module.default as unknown[]).filter(isFieldPlugin)
    }
    if (isFieldPlugin(module.default)) {
      return [module.default]
    }
  }

  // Last resort: scan all exports
  const found: FieldPlugin[] = []
  for (const value of Object.values(module)) {
    if (isFieldPlugin(value)) {
      found.push(value)
    }
  }
  return found
}

/** Runtime check that a value looks like a FieldPlugin */
function isFieldPlugin(value: unknown): value is FieldPlugin {
  if (!value || typeof value !== 'object') return false
  const obj = value as Record<string, unknown>
  return (
    typeof obj.id === 'string' &&
    typeof obj.name === 'string' &&
    typeof obj.component === 'function' &&
    obj.accepts != null &&
    typeof obj.accepts === 'object'
  )
}
