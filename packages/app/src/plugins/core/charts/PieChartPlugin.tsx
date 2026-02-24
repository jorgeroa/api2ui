import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import type { FieldRenderProps } from '../../../types/plugins'

const COLORS = ['#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316']

/** Detect label and value keys from array of objects */
function detectKeys(data: Record<string, unknown>[]): { labelKey: string; valueKey: string } | null {
  if (data.length === 0) return null
  const first = data[0]!
  const keys = Object.keys(first)

  const labelKey = keys.find((k) => typeof first[k] === 'string')
  if (!labelKey) return null

  const valueKey = keys.find((k) => k !== labelKey && typeof first[k] === 'number')
  if (!valueKey) return null

  return { labelKey, valueKey }
}

/** Pie chart for category + number data (best with <= 8 items) */
export function PieChartPlugin({ value }: FieldRenderProps) {
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

  // Limit to 8 slices for readability
  const chartData = (value as Record<string, unknown>[]).slice(0, 8)

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            dataKey={detected.valueKey}
            nameKey={detected.labelKey}
            cx="50%"
            cy="50%"
            outerRadius={80}
            isAnimationActive={false}
            label={({ name, percent }: { name?: string; percent?: number }) => `${name ?? ''} ${((percent ?? 0) * 100).toFixed(0)}%`}
            labelLine={{ strokeWidth: 1 }}
          >
            {chartData.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
