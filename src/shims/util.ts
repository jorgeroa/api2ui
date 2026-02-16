// Browser shim for Node.js `util` module.
// @apidevtools/swagger-parser uses `util.format` and `util.inherits` which are
// Node-only. Without this shim, Vite externalizes the module and floods the
// browser console with "Module has been externalized" warnings on every call
// during OpenAPI spec dereferencing. Aliased in vite.config.ts.
export function format(fmt: string, ...args: unknown[]): string {
  let i = 0
  return fmt.replace(/%[sdj%]/g, (match) => {
    if (match === '%%') return '%'
    if (i >= args.length) return match
    return String(args[i++])
  })
}

export function inherits(
  ctor: { prototype: object; super_?: unknown },
  superCtor: { prototype: object },
) {
  ctor.super_ = superCtor
  ctor.prototype = Object.create(superCtor.prototype, {
    constructor: { value: ctor, writable: true, configurable: true },
  })
}

export default { format, inherits }
