/**
 * URL state serialization for shareable links.
 *
 * Encodes app state into a hash fragment and decodes it back.
 * Uses Base64-encoded JSON in the URL hash so no server is needed.
 */

import type { FieldConfig, ThemePreset, StyleOverrides } from '../../types/config'
import type { LayoutMode } from '../../store/layoutStore'

/** State that can be encoded in a shareable URL. Only `apiUrl` is required. */
export interface ShareableState {
  /** The API URL to fetch */
  apiUrl: string
  /** Selected OpenAPI operation index (0-based) */
  operationIndex?: number
  /** Field visibility, labels, component overrides */
  fieldConfigs?: Record<string, FieldConfig>
  /** Global theme preset */
  theme?: ThemePreset
  /** CSS variable overrides */
  styleOverrides?: StyleOverrides
  /** Layout preferences per endpoint */
  layouts?: Record<string, LayoutMode>
}

/** Version tag for forward compatibility. */
const SHARE_VERSION = 1

/** Internal wire format with version tag. */
interface SharePayload {
  v: number
  u: string                                // apiUrl
  o?: number                               // operationIndex
  f?: Record<string, FieldConfig>          // fieldConfigs
  t?: ThemePreset                          // theme
  s?: StyleOverrides                       // styleOverrides
  l?: Record<string, LayoutMode>           // layouts
}

// ---------------------------------------------------------------------------
// Encoding helpers
// ---------------------------------------------------------------------------

/** Encode a UTF-8 string to URL-safe Base64. */
function toBase64Url(str: string): string {
  const bytes = new TextEncoder().encode(str)
  let binary = ''
  for (const b of bytes) binary += String.fromCharCode(b)
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

/** Decode a URL-safe Base64 string back to UTF-8. */
function fromBase64Url(b64: string): string {
  // Restore standard Base64 chars
  let standard = b64.replace(/-/g, '+').replace(/_/g, '/')
  // Re-add padding
  while (standard.length % 4 !== 0) standard += '='
  const binary = atob(standard)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return new TextDecoder().decode(bytes)
}

/** Strip default/empty values to minimize payload size. */
function compact(state: ShareableState): SharePayload {
  const payload: SharePayload = { v: SHARE_VERSION, u: state.apiUrl }

  if (state.operationIndex !== undefined && state.operationIndex !== 0) {
    payload.o = state.operationIndex
  }
  if (state.fieldConfigs && Object.keys(state.fieldConfigs).length > 0) {
    payload.f = state.fieldConfigs
  }
  if (state.theme && state.theme !== 'light') {
    payload.t = state.theme
  }
  if (state.styleOverrides && Object.keys(state.styleOverrides).length > 0) {
    payload.s = state.styleOverrides
  }
  if (state.layouts && Object.keys(state.layouts).length > 0) {
    payload.l = state.layouts
  }

  return payload
}

/** Expand a compact payload back to full ShareableState. */
function expand(payload: SharePayload): ShareableState {
  const state: ShareableState = { apiUrl: payload.u }
  if (payload.o !== undefined) state.operationIndex = payload.o
  if (payload.f) state.fieldConfigs = payload.f
  if (payload.t) state.theme = payload.t
  if (payload.s) state.styleOverrides = payload.s
  if (payload.l) state.layouts = payload.l
  return state
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Encode shareable state into a hash fragment string (without the `#`).
 *
 * @example
 *   const hash = encodeShareableState({ apiUrl: 'https://api.example.com/users' })
 *   // → "share=eyJ2IjoxLCJ1Ijo..."
 *   window.location.hash = hash
 */
export function encodeShareableState(state: ShareableState): string {
  const payload = compact(state)
  const json = JSON.stringify(payload)
  return `share=${toBase64Url(json)}`
}

/**
 * Decode a hash fragment string back to ShareableState.
 * Returns null if the hash doesn't contain a valid share payload.
 *
 * @param hash - The hash string (with or without leading `#`)
 */
export function decodeShareableState(hash: string): ShareableState | null {
  const cleaned = hash.startsWith('#') ? hash.slice(1) : hash
  if (!cleaned.startsWith('share=')) return null

  const encoded = cleaned.slice('share='.length)
  if (!encoded) return null

  try {
    const json = fromBase64Url(encoded)
    const payload = JSON.parse(json) as SharePayload

    // Version check
    if (typeof payload.v !== 'number' || payload.v < 1) return null
    // Must have an API URL
    if (typeof payload.u !== 'string' || !payload.u) return null

    return expand(payload)
  } catch {
    return null
  }
}

/**
 * Build a full shareable URL from the current page URL and state.
 */
export function buildShareableUrl(state: ShareableState): string {
  const base = `${window.location.origin}${window.location.pathname}`
  const hash = encodeShareableState(state)
  return `${base}#${hash}`
}

/**
 * Check whether the current URL hash contains a share payload.
 */
export function hasSharePayload(): boolean {
  return window.location.hash.startsWith('#share=')
}
