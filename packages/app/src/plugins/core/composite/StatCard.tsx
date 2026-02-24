import type { FieldRenderProps } from '../../../types/plugins'

/** Big number + label KPI stat card */
export function StatCard({ value, fieldName }: FieldRenderProps) {
  const numValue = typeof value === 'number' ? value : typeof value === 'string' ? parseFloat(value) : NaN

  if (isNaN(numValue)) {
    return <span className="text-gray-500 text-sm">{JSON.stringify(value)}</span>
  }

  const formatted = numValue >= 1000
    ? new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(numValue)
    : numValue.toLocaleString()

  const label = fieldName
    .replace(/([A-Z])/g, ' $1')
    .replace(/[_-]/g, ' ')
    .trim()

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 min-w-[120px]">
      <div className="text-2xl font-bold text-gray-900">{formatted}</div>
      <div className="text-xs text-gray-500 mt-1 capitalize">{label}</div>
    </div>
  )
}
