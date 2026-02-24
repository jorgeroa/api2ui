import type { FieldRenderProps } from '../../../types/plugins'

/** Relative time display: "3 days ago", "in 2 hours" */
export function RelativeTime({ value }: FieldRenderProps) {
  const str = String(value ?? '')
  const date = new Date(str)

  if (isNaN(date.getTime())) {
    return <span className="text-muted-foreground">{str}</span>
  }

  const now = new Date()
  const diffMs = date.getTime() - now.getTime()
  const absDiffSec = Math.abs(diffMs / 1000)

  let unit: Intl.RelativeTimeFormatUnit
  let amount: number

  if (absDiffSec < 60) {
    unit = 'second'
    amount = Math.round(diffMs / 1000)
  } else if (absDiffSec < 3600) {
    unit = 'minute'
    amount = Math.round(diffMs / 60000)
  } else if (absDiffSec < 86400) {
    unit = 'hour'
    amount = Math.round(diffMs / 3600000)
  } else if (absDiffSec < 2592000) {
    unit = 'day'
    amount = Math.round(diffMs / 86400000)
  } else if (absDiffSec < 31536000) {
    unit = 'month'
    amount = Math.round(diffMs / 2592000000)
  } else {
    unit = 'year'
    amount = Math.round(diffMs / 31536000000)
  }

  const formatted = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' }).format(amount, unit)

  return <span title={date.toLocaleString()}>{formatted}</span>
}
