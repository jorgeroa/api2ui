import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import type { FieldRenderProps } from '../../../types/plugins'

const COLORS = ['#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#8b5cf6', '#ec4899']

/** Detect category and value keys from array of objects */
function detectKeys(data: Record<string, unknown>[]): { catKey: string; valKeys: string[] } | null {
  if (data.length === 0) return null
  const first = data[0]!
  const keys = Object.keys(first)

  const catKey = keys.find((k) => typeof first[k] === 'string')
  if (!catKey) return null

  const valKeys = keys.filter((k) => k !== catKey && typeof first[k] === 'number')
  if (valKeys.length === 0) return null

  return { catKey, valKeys }
}

/** Bar chart for categorical + numeric data */
export function BarChartPlugin({ value }: FieldRenderProps) {
  if (!Array.isArray(value) || value.length < 1) {
    return <span className="text-gray-500 text-sm">Insufficient data for chart</span>
  }

  const isObjectArray = value.every((v) => v && typeof v === 'object' && !Array.isArray(v))
  if (!isObjectArray) {
    return <span className="text-gray-500 text-sm">Expected array of objects</span>
  }

  const detected = detectKeys(value as Record<string, unknown>[])
  if (!detected) {
    return <span className="text-gray-500 text-sm">No chartable fields detected</span>
  }

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={value as Record<string, unknown>[]}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey={detected.catKey}
            tick={{ fontSize: 11 }}
            tickFormatter={(v) => typeof v === 'string' && v.length > 12 ? v.slice(0, 12) + '...' : v}
          />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip />
          {detected.valKeys.map((key, i) => (
            <Bar
              key={key}
              dataKey={key}
              fill={COLORS[i % COLORS.length]}
              radius={[4, 4, 0, 0]}
              isAnimationActive={false}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
