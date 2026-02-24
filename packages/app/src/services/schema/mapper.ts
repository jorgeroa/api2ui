import type { TypeSignature, UnifiedSchema } from '../../types/schema'
import type { ComponentType, ComponentMapping } from '../../types/components'

/**
 * Get the default component type for a type signature.
 */
export function getDefaultComponent(typeSignature: TypeSignature): ComponentType {
  switch (typeSignature.kind) {
    case 'array':
      // Array of objects -> table, array of primitives -> list
      return typeSignature.items.kind === 'object' ? 'table' : 'list'

    case 'object':
      return 'detail'

    case 'primitive':
      switch (typeSignature.type) {
        case 'string':
          return 'text'
        case 'number':
          return 'number'
        case 'boolean':
          return 'boolean'
        case 'date':
          return 'date'
        case 'null':
          return 'text'
        case 'unknown':
          return 'json'
      }
  }
}

/**
 * Map a schema to component mappings.
 * Creates a mapping for each path in the schema.
 */
export function mapToComponents(schema: UnifiedSchema): ComponentMapping[] {
  const mappings: ComponentMapping[] = []

  // Add root mapping
  const rootComponent = getDefaultComponent(schema.rootType)
  mappings.push({
    path: '$',
    componentType: rootComponent,
    typeSignature: schema.rootType
  })

  // Recursively add field mappings
  addFieldMappings(mappings, schema.rootType, '$')

  return mappings
}

/**
 * Recursively add field mappings to the list.
 */
function addFieldMappings(
  mappings: ComponentMapping[],
  typeSignature: TypeSignature,
  currentPath: string
): void {
  if (typeSignature.kind === 'array') {
    // For arrays, traverse into the item type
    addFieldMappings(mappings, typeSignature.items, currentPath)
  } else if (typeSignature.kind === 'object') {
    // For objects, add mappings for each field
    for (const [fieldName, fieldDef] of typeSignature.fields.entries()) {
      const fieldPath = `${currentPath}.${fieldName}`
      const componentType = getDefaultComponent(fieldDef.type)

      mappings.push({
        path: fieldPath,
        componentType,
        typeSignature: fieldDef.type
      })

      // Recurse into nested structures
      addFieldMappings(mappings, fieldDef.type, fieldPath)
    }
  }
  // Primitives don't have nested fields
}
