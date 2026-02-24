import type { FieldRenderProps } from '../../../types/plugins'

/** Large number abbreviation: 1.2K, 3.4M, 1.5B */
export function CompactNumber({ value }: FieldRenderProps) {
  const num = typeof value === 'number' ? value : parseFloat(String(value ?? '0'))
  if (isNaN(num)) return <span className="text-muted-foreground italic">—</span>

  const formatted = new Intl.NumberFormat(undefined, {
    notation: 'compact',
    compactDisplay: 'short',
    maximumFractionDigits: 1,
  }).format(num)

  return <span className="tabular-nums" title={num.toLocaleString()}>{formatted}</span>
}
