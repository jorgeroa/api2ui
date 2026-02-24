import type { TypeSignature } from './schema'
import type { ImportanceScore } from '../analysis/types'

/** Available component types for rendering */
export const ComponentType = {
  // Layout components (object/array level)
  Table: 'table',
  CardList: 'card-list',
  List: 'list',
  Gallery: 'gallery',
  Timeline: 'timeline',
  Stats: 'stats',
  Detail: 'detail',
  Hero: 'hero',
  Tabs: 'tabs',
  Split: 'split',
  // Collection components
  Primitive: 'primitive',
  PrimitiveList: 'primitive-list',
  Chips: 'chips',
  Inline: 'inline',
  Grid: 'grid',
  // Field-level components
  Text: 'text',
  Number: 'number',
  Boolean: 'boolean',
  Date: 'date',
  Badge: 'badge',
  Rating: 'rating',
  Currency: 'currency',
  Code: 'code',
  Email: 'email',
  Color: 'color',
  Json: 'json',
} as const
export type ComponentType = typeof ComponentType[keyof typeof ComponentType]

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
