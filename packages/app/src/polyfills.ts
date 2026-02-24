/**
 * Browser polyfills required by dependencies.
 *
 * Buffer: Required by @apidevtools/swagger-parser which uses Node.js
 * HTTP resolver internally. Also used by the Vite CORS proxy middleware
 * to handle streaming responses. This polyfill must be loaded before
 * any code that imports swagger-parser.
 */
import { Buffer } from 'buffer'
;(globalThis as unknown as Record<string, unknown>).Buffer = Buffer
