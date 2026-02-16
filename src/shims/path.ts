// Browser shim for Node.js `path` module.
// @apidevtools/swagger-parser uses `path.win32`, `path.posix`, and path utilities
// which are Node-only. Without this shim, Vite externalizes the module and floods
// the browser console with "Module has been externalized" warnings on every call
// during OpenAPI spec dereferencing. Aliased in vite.config.ts.

const posix = {
  sep: '/',
  resolve(...segments: string[]) {
    let resolved = ''
    for (let i = segments.length - 1; i >= 0; i--) {
      const seg = segments[i]!
      if (!seg) continue
      resolved = resolved ? seg + '/' + resolved : seg
      if (seg.startsWith('/')) break
    }
    return resolved || '/'
  },
  join(...segments: string[]) {
    return segments.filter(Boolean).join('/')
  },
  basename(p: string) {
    return p.split('/').pop() || ''
  },
  dirname(p: string) {
    const parts = p.split('/')
    parts.pop()
    return parts.join('/') || '/'
  },
  extname(p: string) {
    const base = posix.basename(p)
    const idx = base.lastIndexOf('.')
    return idx > 0 ? base.slice(idx) : ''
  },
  isAbsolute(p: string) {
    return p.startsWith('/')
  },
}

// swagger-parser accesses path.win32 and path.posix for convertPathToPosix
const win32 = {
  sep: '\\',
}

export { posix, win32 }
export const sep = '/'
export const resolve = posix.resolve
export const join = posix.join
export const basename = posix.basename
export const dirname = posix.dirname
export const extname = posix.extname
export const isAbsolute = posix.isAbsolute

export default { posix, win32, sep, resolve, join, basename, dirname, extname, isAbsolute }
