import { Tab, TabGroup, TabList, TabPanel, TabPanels } from '@headlessui/react'
import type { RendererProps } from '../../types/components'
import { PrimitiveRenderer } from './PrimitiveRenderer'
import { DynamicRenderer } from '../DynamicRenderer'
import { formatLabel } from '../../utils/formatLabel'

/** Renders a single object with primitive summary header and tabbed nested sections */
export function TabsRenderer({ data, schema, path, depth }: RendererProps) {
  if (schema.kind !== 'object') {
    return <div className="text-red-500">TabsRenderer expects object schema</div>
  }

  if (typeof data !== 'object' || data === null || Array.isArray(data)) {
    return <div className="text-red-500">TabsRenderer expects object data</div>
  }

  const obj = data as Record<string, unknown>
  const allFields = Array.from(schema.fields.entries())

  if (allFields.length === 0) {
    return <div className="text-gray-500 italic">Empty object</div>
  }

  const primitiveFields = allFields.filter(([, def]) => def.type.kind === 'primitive')
  const nestedFields = allFields.filter(([, def]) => def.type.kind !== 'primitive')

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      {/* Summary header — primitive fields */}
      {primitiveFields.length > 0 && (
        <div className="p-4 bg-gray-50 border-b border-border grid grid-cols-2 md:grid-cols-3 gap-3">
          {primitiveFields.map(([name, def]) => (
            <div key={name}>
              <div className="text-xs text-gray-500 font-medium">{formatLabel(name)}</div>
              <div className="mt-0.5">
                <PrimitiveRenderer
                  data={obj[name]}
                  schema={def.type}
                  path={`${path}.${name}`}
                  depth={depth + 1}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tabs for nested fields */}
      {nestedFields.length > 0 ? (
        <TabGroup>
          <TabList className="flex border-b border-border bg-white">
            {nestedFields.map(([name]) => (
              <Tab
                key={name}
                className="px-4 py-2.5 text-sm font-medium border-b-2 border-transparent data-[selected]:border-blue-500 data-[selected]:text-blue-600 text-gray-600 hover:text-gray-800 outline-none cursor-pointer"
              >
                {formatLabel(name)}
              </Tab>
            ))}
          </TabList>
          <TabPanels className="p-4">
            {nestedFields.map(([name, def]) => (
              <TabPanel key={name}>
                <DynamicRenderer
                  data={obj[name]}
                  schema={def.type}
                  path={`${path}.${name}`}
                  depth={depth + 1}
                />
              </TabPanel>
            ))}
          </TabPanels>
        </TabGroup>
      ) : (
        // No nested fields — just show primitives in the header
        primitiveFields.length === 0 && (
          <div className="p-4 text-gray-500 italic">No nested data to display in tabs</div>
        )
      )}
    </div>
  )
}
