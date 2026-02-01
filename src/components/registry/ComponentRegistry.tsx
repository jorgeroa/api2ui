import type { TypeSignature } from '../../types/schema'
import type { RendererProps } from '../../types/components'
import { TableRenderer } from '../renderers/TableRenderer'
import { DetailRenderer } from '../renderers/DetailRenderer'
import { PrimitiveRenderer } from '../renderers/PrimitiveRenderer'
import { JsonFallback } from '../renderers/JsonFallback'

type RendererComponent = React.ComponentType<RendererProps>

interface RegistryEntry {
  match: (schema: TypeSignature) => boolean
  component: RendererComponent
}

// Registry of type matchers to components
const registry: RegistryEntry[] = [
  // Array of objects -> Table
  {
    match: (schema) =>
      schema.kind === 'array' && schema.items.kind === 'object',
    component: TableRenderer,
  },
  // Array of primitives -> List (using PrimitiveRenderer wrapper)
  {
    match: (schema) =>
      schema.kind === 'array' && schema.items.kind === 'primitive',
    component: PrimitiveRenderer,
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
 * Get the appropriate renderer component for a type signature.
 * Falls back to JsonFallback for any unmatched types.
 */
export function getComponent(typeSignature: TypeSignature): RendererComponent {
  for (const entry of registry) {
    if (entry.match(typeSignature)) {
      return entry.component
    }
  }

  // Fallback for unknown types
  return JsonFallback
}
