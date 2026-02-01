import type { TypeSignature, UnifiedSchema } from '../../types/schema'
import type { ComponentType, ComponentMapping } from '../../types/components'

/**
 * Get the default component type for a type signature.
 */
export function getDefaultComponent(typeSignature: TypeSignature): ComponentType {
  // Stub implementation
  return 'text'
}

/**
 * Map a schema to component mappings.
 * Creates a mapping for each path in the schema.
 */
export function mapToComponents(schema: UnifiedSchema): ComponentMapping[] {
  // Stub implementation
  return []
}
