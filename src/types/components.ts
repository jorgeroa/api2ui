import type { TypeSignature } from './schema'

/** Available component types for rendering */
export type ComponentType = 'table' | 'detail' | 'card-list' | 'list' | 'text' | 'number' | 'boolean' | 'date' | 'json' | 'badge'

/** Mapping from a schema path to a component */
export interface ComponentMapping {
  path: string
  componentType: ComponentType
  typeSignature: TypeSignature
}

/** Props passed to every dynamic renderer component */
export interface RendererProps {
  data: unknown
  schema: TypeSignature
  path: string
  depth: number
}
