import type { FieldRenderProps } from '../../../types/plugins'
import { Progress } from '../../../components/ui/progress'

/** Horizontal progress bar for 0-100 or 0-1 values */
export function ProgressBar({ value }: FieldRenderProps) {
  const num = typeof value === 'number' ? value : parseFloat(String(value ?? '0'))
  if (isNaN(num)) return <span className="text-muted-foreground italic">—</span>

  // Normalize: if value is 0-1, treat as percentage
  const pct = num > 0 && num <= 1 ? num * 100 : Math.min(100, Math.max(0, num))

  return (
    <span className="inline-flex items-center gap-2 min-w-[120px]">
      <Progress value={pct} className="h-2 flex-1" />
      <span className="text-xs text-muted-foreground tabular-nums w-10 text-right">{Math.round(pct)}%</span>
    </span>
  )
}
