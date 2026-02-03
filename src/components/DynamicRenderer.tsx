import { useState } from 'react'
import type { TypeSignature } from '../types/schema'
import { getComponent } from './registry/ComponentRegistry'
import { JsonFallback } from './renderers/JsonFallback'
import { useConfigStore } from '../store/configStore'
import { ComponentPicker } from './config/ComponentPicker'
import { ViewModeBadge } from './config/ViewModeBadge'
import { OnboardingTooltip } from './config/OnboardingTooltip'

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
  return [getDefaultTypeName(schema)]
}

export function DynamicRenderer({
  data,
  schema,
  path = '$',
  depth = 0,
}: DynamicRendererProps) {
  const { fieldConfigs, setFieldComponentType } = useConfigStore()
  const [showPicker, setShowPicker] = useState(false)
  const [showBadge, setShowBadge] = useState(false)

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

  // Determine component types for badge
  const defaultType = getDefaultTypeName(schema)
  const currentType = override || defaultType
  const availableTypes = getAvailableTypes(schema)

  // Only show badge on top-level renderers (depth === 0) to avoid visual clutter
  const canShowBadge = depth === 0

  return (
    <div
      className="relative"
      onMouseEnter={canShowBadge ? () => setShowBadge(true) : undefined}
      onMouseLeave={canShowBadge ? () => setShowBadge(false) : undefined}
    >
      {showBadge && canShowBadge && (
        <ViewModeBadge
          currentType={currentType}
          availableTypes={availableTypes}
          onSelect={(type) => {
            setFieldComponentType(path, type)
          }}
        />
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
      {depth === 0 && data != null && <OnboardingTooltip />}
    </div>
  )
}
