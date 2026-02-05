import type { TypeSignature } from './schema'

/** A single entry in the page-mode navigation stack */
export interface NavStackEntry {
  data: unknown
  schema: TypeSignature
  label: string
  path: string
}

/** Navigation mode: page replaces view inline, dialog opens modal */
export type DrilldownMode = 'page' | 'dialog'
