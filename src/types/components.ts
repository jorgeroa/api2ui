import type { TypeSignature } from './schema'
import type { ImportanceScore } from '../services/analysis/types'

/** Available component types for rendering */
export type ComponentType =
  | 'table' | 'card-list' | 'list' | 'gallery' | 'timeline' | 'stats'
  | 'detail' | 'hero' | 'tabs' | 'split'
  | 'primitive' | 'primitive-list' | 'chips' | 'inline' | 'grid'
  | 'text' | 'number' | 'boolean' | 'date' | 'badge'
  | 'rating' | 'currency' | 'code' | 'email' | 'color'
  | 'json'

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
  /** Optional importance scores for tier-aware field filtering */
  importance?: Map<string, ImportanceScore>
}
