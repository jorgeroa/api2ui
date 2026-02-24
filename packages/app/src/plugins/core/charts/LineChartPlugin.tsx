import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import type { FieldRenderProps } from '../../../types/plugins'

const COLORS = ['#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#8b5cf6', '#ec4899']

/** Detect x/y keys from array of objects */
function detectKeys(data: Record<string, unknown>[]): { xKey: string; yKeys: string[] } | null {
  if (data.length === 0) return null
  const first = data[0]!
  const keys = Object.keys(first)

  // Find date/string key for x-axis
  const xKey = keys.find((k) => {
    const v = first[k]
    if (typeof v === 'string') {
      return !isNaN(Date.parse(v)) || /^(date|time|month|year|day|week|period|label|name|category)/i.test(k)
    }
    return false
  }) || keys.find((k) => typeof first[k] === 'string')

  if (!xKey) return null

  // All numeric keys are y-axis candidates
  const yKeys = keys.filter((k) => k !== xKey && typeof first[k] === 'number')
  if (yKeys.length === 0) return null

  return { xKey, yKeys }
}

/** Line chart for time-series or x/y data */
export function LineChartPlugin({ value }: FieldRenderProps) {
  if (!Array.isArray(value) || value.length < 2) {
    return <span className="text-gray-500 text-sm">Insufficient data for chart</span>
  }

  const isObjectArray = value.every((v) => v && typeof v === 'object' && !Array.isArray(v))

  if (isObjectArray) {
    const detected = detectKeys(value as Record<string, unknown>[])
    if (!detected) {
      return <span className="text-gray-500 text-sm">No chartable fields detected</span>
    }

    return (
      <div className="w-full h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={value as Record<string, unknown>[]}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey={detected.xKey}
              tick={{ fontSize: 11 }}
              tickFormatter={(v) => typeof v === 'string' && v.length > 10 ? v.slice(0, 10) : v}
            />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            {detected.yKeys.map((key, i) => (
              <Line
                key={key}
                type="monotone"
                dataKey={key}
                stroke={COLORS[i % COLORS.length]}
                strokeWidth={2}
                dot={{ r: 2 }}
                isAnimationActive={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    )
  }

  // Simple numeric array
  const numbers = value.map((v, i) => ({ i, v: typeof v === 'number' ? v : parseFloat(String(v)) }))
    .filter((d) => !isNaN(d.v))

  if (numbers.length < 2) {
    return <span className="text-gray-500 text-sm">Insufficient numeric data</span>
  }

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={numbers}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="i" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip />
          <Line type="monotone" dataKey="v" stroke="#3b82f6" strokeWidth={2} dot={{ r: 2 }} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
