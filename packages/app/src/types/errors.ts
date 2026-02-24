/** Error kinds for discriminated error handling */
export const ErrorKind = {
  Cors: 'cors',
  Network: 'network',
  Api: 'api',
  Parse: 'parse',
  Auth: 'auth',
  Unknown: 'unknown',
} as const
export type ErrorKind = typeof ErrorKind[keyof typeof ErrorKind]

/** Base interface all app errors implement */
export interface AppError {
  kind: ErrorKind
  message: string
  suggestion: string
}
