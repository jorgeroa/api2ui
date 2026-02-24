/**
 * Unit tests for the plugin loader.
 * Tests pure helpers directly and mocks dynamic import() for loadPlugin.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { extractPlugins, isFieldPlugin, loadPlugin, unloadPlugin, loadAndRegisterPlugins } from './loader'
import { createMockPlugin, createMockManifest } from '@/test/factories/pluginFactory'
import { PluginRegistry } from '@/components/registry/pluginRegistry'

// Mock the registry module so loadAndRegisterPlugins uses our spy
vi.mock('@/components/registry/pluginRegistry', async () => {
  const { PluginRegistry } = await vi.importActual<typeof import('@/components/registry/pluginRegistry')>(
    '@/components/registry/pluginRegistry',
  )
  const instance = new PluginRegistry()
  return { PluginRegistry, registry: instance }
})

// Get reference to the mocked registry
const { registry } = await import('@/components/registry/pluginRegistry')

beforeEach(() => {
  vi.restoreAllMocks()
})

// ============================================================================
// extractPlugins (pure function — no import() mocking needed)
// ============================================================================
describe('extractPlugins', () => {
  it('extracts from named `plugins` export (array)', () => {
    const p = createMockPlugin({ id: 'a' })
    const result = extractPlugins({ plugins: [p] })
    expect(result).toEqual([p])
  })

  it('extracts from `default` export (array)', () => {
    const p = createMockPlugin({ id: 'a' })
    const result = extractPlugins({ default: [p] })
    expect(result).toEqual([p])
  })

  it('extracts from `default` export (single plugin)', () => {
    const p = createMockPlugin({ id: 'a' })
    const result = extractPlugins({ default: p })
    expect(result).toEqual([p])
  })

  it('scans all exports as fallback', () => {
    const p1 = createMockPlugin({ id: 'a' })
    const p2 = createMockPlugin({ id: 'b' })
    const result = extractPlugins({ myPlugin: p1, otherPlugin: p2 })
    expect(result).toHaveLength(2)
    expect(result).toContain(p1)
    expect(result).toContain(p2)
  })

  it('returns empty for module with no valid plugins', () => {
    const result = extractPlugins({ foo: 'bar', baz: 42 })
    expect(result).toEqual([])
  })

  it('filters out non-plugin objects from mixed arrays', () => {
    const p = createMockPlugin({ id: 'a' })
    const result = extractPlugins({ plugins: [p, 'not a plugin', null, { id: 'bad' }] })
    expect(result).toEqual([p])
  })
})

// ============================================================================
// isFieldPlugin (pure function)
// ============================================================================
describe('isFieldPlugin', () => {
  it('accepts valid plugin object', () => {
    expect(isFieldPlugin(createMockPlugin())).toBe(true)
  })

  it('rejects missing id', () => {
    const p = createMockPlugin()
    const { id: _, ...noId } = p
    expect(isFieldPlugin(noId)).toBe(false)
  })

  it('rejects missing name', () => {
    const p = createMockPlugin()
    const { name: _, ...noName } = p
    expect(isFieldPlugin(noName)).toBe(false)
  })

  it('rejects missing component', () => {
    const p = createMockPlugin()
    const { component: _, ...noComponent } = p
    expect(isFieldPlugin(noComponent)).toBe(false)
  })

  it('rejects missing accepts', () => {
    const p = createMockPlugin()
    const { accepts: _, ...noAccepts } = p
    expect(isFieldPlugin(noAccepts)).toBe(false)
  })

  it('rejects null', () => {
    expect(isFieldPlugin(null)).toBe(false)
  })

  it('rejects undefined', () => {
    expect(isFieldPlugin(undefined)).toBe(false)
  })

  it('rejects primitives', () => {
    expect(isFieldPlugin('string')).toBe(false)
    expect(isFieldPlugin(42)).toBe(false)
    expect(isFieldPlugin(true)).toBe(false)
  })
})

// ============================================================================
// loadPlugin (mocks dynamic import)
// ============================================================================
describe('loadPlugin', () => {
  // Ensure each test gets a clean module cache by unloading after each test
  beforeEach(() => {
    unloadPlugin('test-npm')
    unloadPlugin('test-url')
    unloadPlugin('test-local')
  })

  it('returns error for npm without package', async () => {
    const manifest = createMockManifest({ id: 'test-npm', source: 'npm', package: undefined })
    const result = await loadPlugin(manifest)
    expect(result.error).toBe('No package name specified')
    expect(result.plugins).toEqual([])
  })

  it('returns error for url without url', async () => {
    const manifest = createMockManifest({ id: 'test-url', source: 'url', url: undefined })
    const result = await loadPlugin(manifest)
    expect(result.error).toBe('No URL specified')
    expect(result.plugins).toEqual([])
  })

  it('returns error for local without path', async () => {
    const manifest = createMockManifest({ id: 'test-local', source: 'local', path: undefined })
    const result = await loadPlugin(manifest)
    expect(result.error).toBe('No path specified')
    expect(result.plugins).toEqual([])
  })

  it('returns error for unknown source', async () => {
    const manifest = createMockManifest({ id: 'test-npm', source: 'ftp' as any })
    const result = await loadPlugin(manifest)
    expect(result.error).toContain('Unknown source')
    expect(result.plugins).toEqual([])
  })
})

// ============================================================================
// loadAndRegisterPlugins
// ============================================================================
describe('loadAndRegisterPlugins', () => {
  it('skips disabled manifests', async () => {
    const enabled = createMockManifest({ id: 'en', enabled: true, source: 'npm', package: undefined })
    const disabled = createMockManifest({ id: 'dis', enabled: false, source: 'npm', package: undefined })

    const results = await loadAndRegisterPlugins([enabled, disabled])
    // Only the enabled one should have been attempted
    expect(results).toHaveLength(1)
    expect(results[0].manifest.id).toBe('en')
  })

  it('does not register plugins that errored', async () => {
    const registerSpy = vi.spyOn(registry, 'register')
    const manifest = createMockManifest({ id: 'err', source: 'npm', package: undefined })

    await loadAndRegisterPlugins([manifest])
    expect(registerSpy).not.toHaveBeenCalled()
    registerSpy.mockRestore()
  })
})
