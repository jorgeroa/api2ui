/**
 * Unit tests for PluginRegistry.
 * Each test creates a fresh instance to avoid shared state.
 */

import { describe, it, expect, vi } from 'vitest'
import { PluginRegistry } from './pluginRegistry'
import { DataType, PluginSource } from '@/types/plugins'
import { createMockPlugin } from '@/test/factories/pluginFactory'

function freshRegistry() {
  return new PluginRegistry()
}

// ============================================================================
// register
// ============================================================================
describe('PluginRegistry.register', () => {
  it('registers and retrieves a plugin by ID', () => {
    const reg = freshRegistry()
    const plugin = createMockPlugin({ id: 'test/a' })
    reg.register(plugin)
    expect(reg.get('test/a')).toBe(plugin)
  })

  it('overwrites existing plugin with warning', () => {
    const reg = freshRegistry()
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const p1 = createMockPlugin({ id: 'test/a', name: 'First' })
    const p2 = createMockPlugin({ id: 'test/a', name: 'Second' })
    reg.register(p1)
    reg.register(p2)
    expect(reg.get('test/a')?.name).toBe('Second')
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('Overwriting'))
    warnSpy.mockRestore()
  })

  it('registers custom categories declared by the plugin', () => {
    const reg = freshRegistry()
    const plugin = createMockPlugin({
      id: 'test/custom',
      customCategories: [
        {
          id: '@test/gauge',
          name: 'Gauge',
          description: 'A gauge category',
          namePatterns: [/gauge/i],
          validate: () => true,
        },
      ],
    })
    reg.register(plugin)
    const categories = reg.getCustomCategories()
    expect(categories).toHaveLength(1)
    expect(categories[0].id).toBe('@test/gauge')
  })
})

// ============================================================================
// get
// ============================================================================
describe('PluginRegistry.get', () => {
  it('returns null for unknown ID', () => {
    const reg = freshRegistry()
    expect(reg.get('nonexistent')).toBeNull()
  })

  it('returns plugin for known ID', () => {
    const reg = freshRegistry()
    const plugin = createMockPlugin({ id: 'test/known' })
    reg.register(plugin)
    expect(reg.get('test/known')).toBe(plugin)
  })
})

// ============================================================================
// setDefault / getDefault
// ============================================================================
describe('PluginRegistry.setDefault / getDefault', () => {
  it('sets and retrieves default plugin for a category', () => {
    const reg = freshRegistry()
    const plugin = createMockPlugin({ id: 'test/rating' })
    reg.register(plugin)
    reg.setDefault('rating', 'test/rating')
    expect(reg.getDefault('rating')).toBe(plugin)
  })

  it('returns null when no default is set', () => {
    const reg = freshRegistry()
    expect(reg.getDefault('rating')).toBeNull()
  })

  it('returns null when default plugin is not registered', () => {
    const reg = freshRegistry()
    reg.setDefault('rating', 'nonexistent')
    expect(reg.getDefault('rating')).toBeNull()
  })
})

// ============================================================================
// getCompatible
// ============================================================================
describe('PluginRegistry.getCompatible', () => {
  it('filters by dataType', () => {
    const reg = freshRegistry()
    const strPlugin = createMockPlugin({
      id: 'test/str',
      accepts: { dataTypes: [DataType.String] },
    })
    const numPlugin = createMockPlugin({
      id: 'test/num',
      accepts: { dataTypes: [DataType.Number] },
    })
    reg.register(strPlugin)
    reg.register(numPlugin)
    const results = reg.getCompatible(DataType.String)
    expect(results).toEqual([strPlugin])
  })

  it('prioritizes semanticHint matches', () => {
    const reg = freshRegistry()
    const generic = createMockPlugin({
      id: 'test/generic',
      accepts: { dataTypes: [DataType.Number] },
    })
    const ratingPlugin = createMockPlugin({
      id: 'test/rating',
      accepts: {
        dataTypes: [DataType.Number],
        semanticHints: ['rating' as any],
      },
    })
    reg.register(generic)
    reg.register(ratingPlugin)
    const results = reg.getCompatible(DataType.Number, 'rating')
    expect(results[0]).toBe(ratingPlugin)
    expect(results).toContain(generic)
  })

  it('returns empty for no match', () => {
    const reg = freshRegistry()
    reg.register(createMockPlugin({ id: 'test/str', accepts: { dataTypes: [DataType.String] } }))
    expect(reg.getCompatible(DataType.Boolean)).toEqual([])
  })
})

// ============================================================================
// list
// ============================================================================
describe('PluginRegistry.list', () => {
  it('returns all plugins when no filter', () => {
    const reg = freshRegistry()
    reg.register(createMockPlugin({ id: 'a' }))
    reg.register(createMockPlugin({ id: 'b' }))
    expect(reg.list()).toHaveLength(2)
  })

  it('filters by source', () => {
    const reg = freshRegistry()
    reg.register(createMockPlugin({ id: 'a', source: PluginSource.Core }))
    reg.register(createMockPlugin({ id: 'b', source: PluginSource.Community }))
    expect(reg.list({ source: PluginSource.Core })).toHaveLength(1)
  })

  it('filters by tags', () => {
    const reg = freshRegistry()
    reg.register(createMockPlugin({ id: 'a', tags: ['chart', 'viz'] }))
    reg.register(createMockPlugin({ id: 'b', tags: ['table'] }))
    expect(reg.list({ tags: ['chart'] })).toHaveLength(1)
  })

  it('combines source and tag filters', () => {
    const reg = freshRegistry()
    reg.register(createMockPlugin({ id: 'a', source: PluginSource.Core, tags: ['chart'] }))
    reg.register(createMockPlugin({ id: 'b', source: PluginSource.Community, tags: ['chart'] }))
    reg.register(createMockPlugin({ id: 'c', source: PluginSource.Core, tags: ['table'] }))
    expect(reg.list({ source: PluginSource.Core, tags: ['chart'] })).toHaveLength(1)
  })

  it('returns empty for no match', () => {
    const reg = freshRegistry()
    reg.register(createMockPlugin({ id: 'a', tags: ['chart'] }))
    expect(reg.list({ tags: ['nonexistent'] })).toEqual([])
  })
})

// ============================================================================
// getCustomCategories
// ============================================================================
describe('PluginRegistry.getCustomCategories', () => {
  it('returns plugin-declared categories', () => {
    const reg = freshRegistry()
    reg.register(
      createMockPlugin({
        id: 'test/custom',
        customCategories: [
          { id: '@a/cat', name: 'Cat A', description: 'desc', namePatterns: [/a/], validate: () => true },
          { id: '@b/cat', name: 'Cat B', description: 'desc', namePatterns: [/b/], validate: () => true },
        ],
      }),
    )
    expect(reg.getCustomCategories()).toHaveLength(2)
  })

  it('handles plugins without custom categories', () => {
    const reg = freshRegistry()
    reg.register(createMockPlugin({ id: 'test/plain' }))
    expect(reg.getCustomCategories()).toEqual([])
  })
})

// ============================================================================
// size
// ============================================================================
describe('PluginRegistry.size', () => {
  it('is 0 initially', () => {
    expect(freshRegistry().size).toBe(0)
  })

  it('reflects correct count after registrations', () => {
    const reg = freshRegistry()
    reg.register(createMockPlugin({ id: 'a' }))
    reg.register(createMockPlugin({ id: 'b' }))
    reg.register(createMockPlugin({ id: 'c' }))
    expect(reg.size).toBe(3)
  })
})
