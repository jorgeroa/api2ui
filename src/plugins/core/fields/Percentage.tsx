import type { FieldRenderProps } from '../../../types/plugins'

/** Number rendered as percentage — auto-detects 0-1 vs 0-100 range */
export function Percentage({ value }: FieldRenderProps) {
  const num = typeof value === 'number' ? value : parseFloat(String(value ?? '0'))
  if (isNaN(num)) return <span className="text-gray-400 italic">—</span>

  // If value is 0-1, multiply by 100
  const pct = num > 0 && num <= 1 ? num * 100 : num
  const formatted = pct % 1 === 0 ? pct.toFixed(0) : pct.toFixed(1)

  return <span className="tabular-nums">{formatted}%</span>
}
