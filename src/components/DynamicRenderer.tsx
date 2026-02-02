import type { TypeSignature } from '../types/schema'
import { getComponent } from './registry/ComponentRegistry'
import { JsonFallback } from './renderers/JsonFallback'
import { useConfigStore } from '../store/configStore'

interface DynamicRendererProps {
  data: unknown
  schema: TypeSignature
  path?: string
  depth?: number
}

const MAX_DEPTH = 5

export function DynamicRenderer({
  data,
  schema,
  path = '$',
  depth = 0,
}: DynamicRendererProps) {
  const { fieldConfigs, mode } = useConfigStore()

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

  return (
    <div className="relative">
      {isConfigureMode && override && (
        <div className="absolute top-0 right-0 z-10 bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-bl font-medium">
          {override}
        </div>
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
