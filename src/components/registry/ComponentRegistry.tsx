import type { TypeSignature } from '../../types/schema'
import type { RendererProps } from '../../types/components'
import { TableRenderer } from '../renderers/TableRenderer'
import { CardListRenderer } from '../renderers/CardListRenderer'
import { ListRenderer } from '../renderers/ListRenderer'
import { DetailRenderer } from '../renderers/DetailRenderer'
import { PrimitiveRenderer } from '../renderers/PrimitiveRenderer'
import { PrimitiveListRenderer } from '../renderers/PrimitiveListRenderer'
import { JsonFallback } from '../renderers/JsonFallback'

type RendererComponent = React.ComponentType<RendererProps>

interface RegistryEntry {
  match: (schema: TypeSignature) => boolean
  component: RendererComponent
}

// Registry of type matchers to components
const registry: RegistryEntry[] = [
  // Array of objects -> Table (default)
  {
    match: (schema) =>
      schema.kind === 'array' && schema.items.kind === 'object',
    component: TableRenderer,
  },
  // Array of primitives -> List
  {
    match: (schema) =>
      schema.kind === 'array' && schema.items.kind === 'primitive',
    component: PrimitiveListRenderer,
  },
  // Object -> Detail view
  {
    match: (schema) => schema.kind === 'object',
    component: DetailRenderer,
  },
  // Primitive -> PrimitiveRenderer
  {
    match: (schema) => schema.kind === 'primitive',
    component: PrimitiveRenderer,
  },
]

/**
 * Map component type names to components.
 * Used for component override lookups.
 */
export function getComponentByType(type: string): RendererComponent | undefined {
  const typeMap: Record<string, RendererComponent> = {
    'table': TableRenderer,
    'card-list': CardListRenderer,
    'list': ListRenderer,
    'json': JsonFallback,
    'detail': DetailRenderer,
    'primitive': PrimitiveRenderer,
    'primitive-list': PrimitiveListRenderer,
  }

  return typeMap[type]
}

/**
 * Get the appropriate renderer component for a type signature.
 * Falls back to JsonFallback for any unmatched types.
 *
 * @param typeSignature - The schema type signature to match
 * @param override - Optional component type override (e.g., 'card-list', 'list', 'link', 'image')
 */
export function getComponent(
  typeSignature: TypeSignature,
  override?: string
): RendererComponent {
  // If override is provided, try to use it first
  if (override) {
    const overrideComponent = getComponentByType(override)
    if (overrideComponent) {
      return overrideComponent
    }
  }

  // Fall back to default matching
  for (const entry of registry) {
    if (entry.match(typeSignature)) {
      return entry.component
    }
  }

  // Fallback for unknown types
  return JsonFallback
}
