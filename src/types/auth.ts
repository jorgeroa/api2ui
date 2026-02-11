/** Authentication type identifiers */
export type AuthType = 'bearer' | 'basic' | 'apiKey' | 'queryParam'

/** Base credential interface with shared fields */
interface BaseCredential {
  /** Discriminant for credential type */
  type: AuthType
  /** User-defined nickname for this credential (e.g., "Production API key") */
  label: string
}

/** Bearer token authentication (Authorization: Bearer {token}) */
export interface BearerCredential extends BaseCredential {
  type: 'bearer'
  token: string
}

/** Basic authentication (Authorization: Basic base64(username:password)) */
export interface BasicCredential extends BaseCredential {
  type: 'basic'
  username: string
  password: string
}

/** API key in custom header */
export interface ApiKeyCredential extends BaseCredential {
  type: 'apiKey'
  headerName: string
  value: string
}

/** API key in query parameter */
export interface QueryParamCredential extends BaseCredential {
  type: 'queryParam'
  paramName: string
  value: string
}

/** Discriminated union of all credential types */
export type Credential =
  | BearerCredential
  | BasicCredential
  | ApiKeyCredential
  | QueryParamCredential

/** Authentication status for tracking per-API auth state */
export type AuthStatus = 'untested' | 'success' | 'failed'

/** Per-origin credential storage and active selection */
export interface ApiCredentials {
  /** One credential slot per auth type (null if not configured) */
  credentials: Record<AuthType, Credential | null>
  /** Currently active credential type (null if none selected) */
  activeType: AuthType | null
}
