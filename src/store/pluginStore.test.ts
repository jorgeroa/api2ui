/**
 * Unit tests for the plugin store (Zustand + persist).
 * Uses getState() directly — no hooks needed.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createMockManifest } from '@/test/factories/pluginFactory'

// Provide a working localStorage before the store is imported
const storage = new Map<string, string>()
const localStorageMock: Storage = {
  getItem: (key: string) => storage.get(key) ?? null,
  setItem: (key: string, value: string) => { storage.set(key, value) },
  removeItem: (key: string) => { storage.delete(key) },
  clear: () => storage.clear(),
  get length() { return storage.size },
  key: (index: number) => [...storage.keys()][index] ?? null,
}
Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock, writable: true })

// Import store after localStorage is set up
const { usePluginStore } = await import('./pluginStore')

function getStore() {
  return usePluginStore.getState()
}

beforeEach(() => {
  getStore().clearAll()
  storage.clear()
})

// ============================================================================
// installPlugin
// ============================================================================
describe('pluginStore.installPlugin', () => {
  it('adds a new plugin', () => {
    getStore().installPlugin(createMockManifest({ id: 'a' }))
    expect(getStore().installed).toHaveLength(1)
    expect(getStore().installed[0].id).toBe('a')
  })

  it('replaces existing plugin (upsert)', () => {
    getStore().installPlugin(createMockManifest({ id: 'a', version: '1.0.0' }))
    getStore().installPlugin(createMockManifest({ id: 'a', version: '2.0.0' }))
    expect(getStore().installed).toHaveLength(1)
    expect(getStore().installed[0].version).toBe('2.0.0')
  })

  it('preserves other plugins on upsert', () => {
    getStore().installPlugin(createMockManifest({ id: 'a' }))
    getStore().installPlugin(createMockManifest({ id: 'b' }))
    getStore().installPlugin(createMockManifest({ id: 'a', version: '2.0.0' }))
    expect(getStore().installed).toHaveLength(2)
    expect(getStore().installed.find((m) => m.id === 'b')).toBeDefined()
  })
})

// ============================================================================
// removePlugin
// ============================================================================
describe('pluginStore.removePlugin', () => {
  it('removes by ID', () => {
    getStore().installPlugin(createMockManifest({ id: 'a' }))
    getStore().installPlugin(createMockManifest({ id: 'b' }))
    getStore().removePlugin('a')
    expect(getStore().installed).toHaveLength(1)
    expect(getStore().installed[0].id).toBe('b')
  })

  it('clears load error too', () => {
    getStore().installPlugin(createMockManifest({ id: 'a' }))
    getStore().setLoadError('a', 'something broke')
    getStore().removePlugin('a')
    expect(getStore().loadErrors).not.toHaveProperty('a')
  })

  it('is a no-op for unknown ID', () => {
    getStore().installPlugin(createMockManifest({ id: 'a' }))
    getStore().removePlugin('nonexistent')
    expect(getStore().installed).toHaveLength(1)
  })
})

// ============================================================================
// togglePlugin
// ============================================================================
describe('pluginStore.togglePlugin', () => {
  it('disables an enabled plugin', () => {
    getStore().installPlugin(createMockManifest({ id: 'a', enabled: true }))
    getStore().togglePlugin('a')
    expect(getStore().installed[0].enabled).toBe(false)
  })

  it('enables a disabled plugin', () => {
    getStore().installPlugin(createMockManifest({ id: 'a', enabled: false }))
    getStore().togglePlugin('a')
    expect(getStore().installed[0].enabled).toBe(true)
  })
})

// ============================================================================
// updatePlugin
// ============================================================================
describe('pluginStore.updatePlugin', () => {
  it('applies partial update', () => {
    getStore().installPlugin(createMockManifest({ id: 'a', version: '1.0.0', name: 'Old' }))
    getStore().updatePlugin('a', { version: '2.0.0' })
    const plugin = getStore().installed[0]
    expect(plugin.version).toBe('2.0.0')
    expect(plugin.name).toBe('Old') // unchanged
  })

  it('preserves unchanged fields', () => {
    getStore().installPlugin(createMockManifest({ id: 'a', source: 'npm', package: 'api2ui-plugin-test' }))
    getStore().updatePlugin('a', { version: '3.0.0' })
    expect(getStore().installed[0].package).toBe('api2ui-plugin-test')
  })

  it('is a no-op for unknown ID', () => {
    getStore().installPlugin(createMockManifest({ id: 'a' }))
    getStore().updatePlugin('nonexistent', { version: '9.9.9' })
    expect(getStore().installed).toHaveLength(1)
    expect(getStore().installed[0].version).toBe('1.0.0')
  })
})

// ============================================================================
// setLoadError / clearLoadError
// ============================================================================
describe('pluginStore.setLoadError / clearLoadError', () => {
  it('records and clears errors', () => {
    getStore().setLoadError('a', 'Failed to load')
    expect(getStore().loadErrors['a']).toBe('Failed to load')
    getStore().clearLoadError('a')
    expect(getStore().loadErrors).not.toHaveProperty('a')
  })
})

// ============================================================================
// clearAll
// ============================================================================
describe('pluginStore.clearAll', () => {
  it('resets to empty state', () => {
    getStore().installPlugin(createMockManifest({ id: 'a' }))
    getStore().setLoadError('a', 'err')
    getStore().clearAll()
    expect(getStore().installed).toEqual([])
    expect(getStore().loadErrors).toEqual({})
  })
})

// ============================================================================
// Persistence
// ============================================================================
describe('pluginStore persistence', () => {
  it('installed survives store recreation', () => {
    getStore().installPlugin(createMockManifest({ id: 'a' }))

    // The partialize config only persists `installed`, not `loadErrors`.
    // Zustand persist writes to localStorage synchronously.
    const stored = JSON.parse(localStorage.getItem('api2ui-plugins') || '{}')
    expect(stored.state?.installed).toHaveLength(1)
    expect(stored.state?.installed[0].id).toBe('a')
  })

  it('loadErrors are NOT persisted', () => {
    getStore().setLoadError('a', 'boom')
    const stored = JSON.parse(localStorage.getItem('api2ui-plugins') || '{}')
    expect(stored.state?.loadErrors).toBeUndefined()
  })
})
