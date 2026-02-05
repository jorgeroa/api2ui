import type { RendererProps } from '../../types/components'
import { PrimitiveRenderer } from './PrimitiveRenderer'
import { DynamicRenderer } from '../DynamicRenderer'
import { isImageUrl } from '../../utils/imageDetection'
import { formatLabel } from '../../utils/formatLabel'

/** Detect primary fields for the hero title */
function isPrimaryField(fieldName: string): boolean {
  const nameLower = fieldName.toLowerCase()
  const primaryExact = ['name', 'title', 'label', 'heading', 'subject']
  if (primaryExact.includes(nameLower)) return true
  const primarySuffixes = ['_name', '_title', '_label', '-name', '-title', '-label', 'Name', 'Title']
  return primarySuffixes.some(suffix => fieldName.endsWith(suffix))
}

/** Detect subtitle/description fields */
function isSubtitleField(fieldName: string): boolean {
  return /description|bio|summary|subtitle|about|tagline/i.test(fieldName)
}

/** Renders a single object as a hero/profile layout */
export function HeroRenderer({ data, schema, path, depth }: RendererProps) {
  if (schema.kind !== 'object') {
    return <div className="text-red-500">HeroRenderer expects object schema</div>
  }

  if (typeof data !== 'object' || data === null || Array.isArray(data)) {
    return <div className="text-red-500">HeroRenderer expects object data</div>
  }

  const obj = data as Record<string, unknown>
  const allFields = Array.from(schema.fields.entries())

  if (allFields.length === 0) {
    return <div className="text-gray-500 italic">Empty object</div>
  }

  // Categorize fields
  const imageField = allFields.find(([name, def]) =>
    def.type.kind === 'primitive' && typeof obj[name] === 'string' && isImageUrl(obj[name] as string)
  )

  const titleField = allFields.find(([name]) => isPrimaryField(name))
  const subtitleField = allFields.find(([name, def]) =>
    def.type.kind === 'primitive' &&
    name !== titleField?.[0] &&
    name !== imageField?.[0] &&
    isSubtitleField(name)
  )

  const numberFields = allFields.filter(([name, def]) =>
    def.type.kind === 'primitive' &&
    def.type.type === 'number' &&
    name !== titleField?.[0] &&
    name !== imageField?.[0]
  )

  const usedFieldNames = new Set([
    imageField?.[0],
    titleField?.[0],
    subtitleField?.[0],
    ...numberFields.map(([n]) => n),
  ].filter(Boolean) as string[])

  const remainingPrimitives = allFields.filter(([name, def]) =>
    def.type.kind === 'primitive' && !usedFieldNames.has(name)
  )

  const nestedFields = allFields.filter(([, def]) =>
    def.type.kind !== 'primitive'
  )

  const title = titleField ? String(obj[titleField[0]] ?? 'Untitled') : 'Untitled'
  const subtitle = subtitleField ? String(obj[subtitleField[0]] ?? '') : ''

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      {/* Hero header */}
      <div className="flex items-center gap-6 p-6 bg-gray-50">
        {imageField && (
          <img
            src={obj[imageField[0]] as string}
            alt={title}
            loading="lazy"
            className="w-24 h-24 rounded-full object-cover border-2 border-white shadow shrink-0"
            onError={(e) => { e.currentTarget.style.display = 'none' }}
          />
        )}
        <div className="min-w-0">
          <h2 className="text-2xl font-bold text-text truncate">{title}</h2>
          {subtitle && (
            <p className="text-gray-600 mt-1 line-clamp-2">{subtitle}</p>
          )}
        </div>
      </div>

      {/* Stats row */}
      {numberFields.length > 0 && (
        <div
          className="grid gap-4 p-4 border-t border-border bg-white"
          style={{ gridTemplateColumns: `repeat(${Math.min(numberFields.length, 5)}, 1fr)` }}
        >
          {numberFields.slice(0, 5).map(([name]) => (
            <div key={name} className="text-center">
              <div className="text-2xl font-bold text-text">
                {typeof obj[name] === 'number' ? (obj[name] as number).toLocaleString() : '--'}
              </div>
              <div className="text-xs text-gray-500 mt-0.5">{formatLabel(name)}</div>
            </div>
          ))}
        </div>
      )}

      {/* Remaining primitive fields */}
      {remainingPrimitives.length > 0 && (
        <div className="p-4 border-t border-border space-y-2">
          {remainingPrimitives.map(([name, def]) => (
            <div key={name} className="grid grid-cols-[auto_1fr] gap-x-4 text-sm">
              <span className="font-medium text-gray-600">{formatLabel(name)}:</span>
              <PrimitiveRenderer
                data={obj[name]}
                schema={def.type}
                path={`${path}.${name}`}
                depth={depth + 1}
              />
            </div>
          ))}
        </div>
      )}

      {/* Nested objects/arrays */}
      {nestedFields.map(([name, def]) => (
        <div key={name} className="border-t border-border p-4">
          <h3 className="text-sm font-medium text-gray-600 mb-2">{formatLabel(name)}</h3>
          <DynamicRenderer
            data={obj[name]}
            schema={def.type}
            path={`${path}.${name}`}
            depth={depth + 1}
          />
        </div>
      ))}
    </div>
  )
}
