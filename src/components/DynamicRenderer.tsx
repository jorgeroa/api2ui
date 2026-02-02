import { useState } from 'react'
import type { TypeSignature } from '../types/schema'
import { getComponent } from './registry/ComponentRegistry'
import { JsonFallback } from './renderers/JsonFallback'
import { useConfigStore } from '../store/configStore'
import { ComponentPicker } from './config/ComponentPicker'

interface DynamicRendererProps {
  data: unknown
  schema: TypeSignature
  path?: string
  depth?: number
}

const MAX_DEPTH = 5

/** Derive the default component type name from schema shape */
function getDefaultTypeName(schema: TypeSignature): string {
  if (schema.kind === 'array' && schema.items.kind === 'object') return 'table'
  if (schema.kind === 'array' && schema.items.kind === 'primitive') return 'primitive-list'
  if (schema.kind === 'object') return 'detail'
  if (schema.kind === 'primitive') return 'primitive'
  return 'json'
}

/** Get the list of alternative component types for a given schema */
function getAvailableTypes(schema: TypeSignature): string[] {
  if (schema.kind === 'array' && schema.items.kind === 'object') {
    return ['table', 'card-list', 'list', 'json']
  }
  if (schema.kind === 'object') {
    return ['detail', 'json']
  }
  return []
}

export function DynamicRenderer({
  data,
  schema,
  path = '$',
  depth = 0,
}: DynamicRendererProps) {
  const { fieldConfigs, mode, setFieldComponentType } = useConfigStore()
  const [showPicker, setShowPicker] = useState(false)

  // Guard against excessive depth
  if (depth > MAX_DEPTH) {
    return (
      <JsonFallback
        data={data}
        schema={schema}
        path={path}
        depth={depth}
      />
    )
  }

  // Look up component override for this path
  const config = fieldConfigs[path]
  const override = config?.componentType

  // Get the appropriate component from the registry
  const Component = getComponent(schema, override)

  // In Configure mode, show component type badge/indicator
  const isConfigureMode = mode === 'configure'
  const defaultType = getDefaultTypeName(schema)
  const currentType = override || defaultType
  const availableTypes = getAvailableTypes(schema)
  const showBadge = isConfigureMode && availableTypes.length > 1

  return (
    <div className="relative">
      {showBadge && (
        <button
          onClick={() => setShowPicker(true)}
          className="absolute top-0 right-0 z-10 bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-bl font-medium hover:bg-blue-200 transition-colors cursor-pointer"
        >
          {currentType} ▾
        </button>
      )}
      {showPicker && (
        <ComponentPicker
          currentType={currentType}
          availableTypes={availableTypes}
          fieldPath={path}
          sampleData={data}
          sampleSchema={schema}
          onSelect={(type) => {
            setFieldComponentType(path, type)
            setShowPicker(false)
          }}
          onClose={() => setShowPicker(false)}
        />
      )}
      <Component
        data={data}
        schema={schema}
        path={path}
        depth={depth}
      />
    </div>
  )
}
