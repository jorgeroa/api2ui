import { LineChart, Line, ResponsiveContainer } from 'recharts'
import type { FieldRenderProps } from '../../../types/plugins'

/** Inline mini line chart for numeric arrays */
export function Sparkline({ value }: FieldRenderProps) {
  if (!Array.isArray(value)) {
    return <span className="text-gray-500 text-sm">{JSON.stringify(value)}</span>
  }

  const numbers = value
    .map((v) => (typeof v === 'number' ? v : parseFloat(String(v))))
    .filter((n) => !isNaN(n))

  if (numbers.length < 2) {
    return <span className="text-gray-500 text-sm">{JSON.stringify(value)}</span>
  }

  const data = numbers.map((v, i) => ({ i, v }))
  const min = Math.min(...numbers)
  const max = Math.max(...numbers)
  const last = numbers[numbers.length - 1]!
  const first = numbers[0]!
  const trend = last >= first ? '#22c55e' : '#ef4444'

  return (
    <div className="inline-flex items-center gap-2">
      <div className="w-24 h-8">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <Line
              type="monotone"
              dataKey="v"
              stroke={trend}
              strokeWidth={1.5}
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <span className="text-xs text-gray-500">
        {min.toLocaleString()} – {max.toLocaleString()}
      </span>
    </div>
  )
}
