/** Error kinds for discriminated error handling */
export type ErrorKind = 'cors' | 'network' | 'api' | 'parse' | 'unknown'

/** Base interface all app errors implement */
export interface AppError {
  kind: ErrorKind
  message: string
  suggestion: string
}
