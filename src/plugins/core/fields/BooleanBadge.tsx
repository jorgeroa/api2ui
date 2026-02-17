import type { FieldRenderProps } from '../../../types/plugins'

/** True/False badge with color coding */
export function BooleanBadge({ value }: FieldRenderProps) {
  const bool = Boolean(value)
  return (
    <span
      className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
        bool ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
      }`}
    >
      {String(bool)}
    </span>
  )
}
