/**
 * Tests for shareable link encoding and decoding.
 */

import { describe, test, expect } from 'vitest'
import {
  encodeShareableState,
  decodeShareableState,
} from './encoder'
import type { ShareableState } from './encoder'

describe('encodeShareableState', () => {
  test('encodes minimal state (apiUrl only)', () => {
    const state: ShareableState = { apiUrl: 'https://api.example.com/users' }
    const hash = encodeShareableState(state)
    expect(hash).toMatch(/^share=/)
    expect(hash.length).toBeGreaterThan(10)
  })

  test('encodes state with all fields', () => {
    const state: ShareableState = {
      apiUrl: 'https://api.example.com/users',
      operationIndex: 2,
      fieldConfigs: {
        '$.name': { visible: true, label: 'User Name', order: 0 },
        '$.email': { visible: false, order: 1 },
      },
      theme: 'dark',
      styleOverrides: { '--color-primary': '#ff0000' },
      layouts: { '/users': 'sidebar' },
    }
    const hash = encodeShareableState(state)
    expect(hash).toMatch(/^share=/)
  })

  test('omits default values to minimize size', () => {
    const minimal: ShareableState = { apiUrl: 'https://example.com' }
    const withDefaults: ShareableState = {
      apiUrl: 'https://example.com',
      operationIndex: 0,  // default
      theme: 'light',     // default
      fieldConfigs: {},    // empty
      styleOverrides: {},  // empty
      layouts: {},         // empty
    }
    const minHash = encodeShareableState(minimal)
    const defHash = encodeShareableState(withDefaults)
    // Both should produce the same hash (defaults stripped)
    expect(minHash).toBe(defHash)
  })
})

describe('decodeShareableState', () => {
  test('decodes minimal state', () => {
    const original: ShareableState = { apiUrl: 'https://api.example.com/users' }
    const hash = encodeShareableState(original)
    const decoded = decodeShareableState(hash)
    expect(decoded).not.toBeNull()
    expect(decoded!.apiUrl).toBe('https://api.example.com/users')
  })

  test('decodes full state roundtrip', () => {
    const original: ShareableState = {
      apiUrl: 'https://api.example.com/users',
      operationIndex: 3,
      fieldConfigs: {
        '$.name': { visible: true, label: 'Name', order: 0 },
        '$.email': { visible: false, order: 1 },
      },
      theme: 'dark',
      styleOverrides: { '--color-primary': '#ff0000' },
      layouts: { '/users': 'split' },
    }
    const hash = encodeShareableState(original)
    const decoded = decodeShareableState(hash)
    expect(decoded).toEqual(original)
  })

  test('handles hash with leading #', () => {
    const state: ShareableState = { apiUrl: 'https://example.com' }
    const hash = '#' + encodeShareableState(state)
    const decoded = decodeShareableState(hash)
    expect(decoded).not.toBeNull()
    expect(decoded!.apiUrl).toBe('https://example.com')
  })

  test('returns null for non-share hash', () => {
    expect(decodeShareableState('#some-anchor')).toBeNull()
    expect(decodeShareableState('')).toBeNull()
    expect(decodeShareableState('#')).toBeNull()
  })

  test('returns null for invalid base64', () => {
    expect(decodeShareableState('#share=!!!invalid')).toBeNull()
  })

  test('returns null for valid base64 but invalid JSON', () => {
    // Base64 of "not json"
    const b64 = btoa('not json').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
    expect(decodeShareableState(`#share=${b64}`)).toBeNull()
  })

  test('returns null for missing apiUrl', () => {
    // Base64 of JSON without the 'u' field
    const payload = JSON.stringify({ v: 1 })
    const b64 = btoa(payload).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
    expect(decodeShareableState(`#share=${b64}`)).toBeNull()
  })

  test('returns null for empty share value', () => {
    expect(decodeShareableState('#share=')).toBeNull()
  })
})

describe('special characters', () => {
  test('handles URLs with query parameters', () => {
    const state: ShareableState = {
      apiUrl: 'https://api.example.com/search?q=hello+world&limit=10',
    }
    const hash = encodeShareableState(state)
    const decoded = decodeShareableState(hash)
    expect(decoded!.apiUrl).toBe('https://api.example.com/search?q=hello+world&limit=10')
  })

  test('handles Unicode field labels', () => {
    const state: ShareableState = {
      apiUrl: 'https://example.com',
      fieldConfigs: {
        '$.nombre': { visible: true, label: 'Nombre del usuario', order: 0 },
        '$.dirección': { visible: true, label: 'Dirección', order: 1 },
      },
    }
    const hash = encodeShareableState(state)
    const decoded = decodeShareableState(hash)
    expect(decoded!.fieldConfigs!['$.nombre']!.label).toBe('Nombre del usuario')
    expect(decoded!.fieldConfigs!['$.dirección']!.label).toBe('Dirección')
  })

  test('handles URLs with special characters', () => {
    const state: ShareableState = {
      apiUrl: 'https://api.example.com/v1/users?filter[name]=John%20Doe&sort=-created_at',
    }
    const hash = encodeShareableState(state)
    const decoded = decodeShareableState(hash)
    expect(decoded!.apiUrl).toBe(state.apiUrl)
  })
})

describe('size considerations', () => {
  test('minimal state produces short hash', () => {
    const state: ShareableState = { apiUrl: 'https://example.com/api' }
    const hash = encodeShareableState(state)
    // Should be well under 200 chars
    expect(hash.length).toBeLessThan(200)
  })

  test('complex state stays under practical URL limits', () => {
    const state: ShareableState = {
      apiUrl: 'https://api.example.com/v1/long-endpoint-name/with/multiple/segments',
      operationIndex: 5,
      fieldConfigs: Object.fromEntries(
        Array.from({ length: 20 }, (_, i) => [
          `$.field${i}`,
          { visible: i % 3 !== 0, label: `Field ${i}`, componentType: 'text', order: i },
        ])
      ),
      theme: 'dark',
      styleOverrides: {
        '--color-primary': '#3b82f6',
        '--color-background': '#1f2937',
        '--font-family': 'Inter, sans-serif',
      },
      layouts: { '/users': 'sidebar', '/products': 'split' },
    }
    const hash = encodeShareableState(state)
    // Hash fragments have no server-side limit. 4000 chars is practical
    // for sharing via most messaging platforms.
    expect(hash.length).toBeLessThan(4000)
  })
})
