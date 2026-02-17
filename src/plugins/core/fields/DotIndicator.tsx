import type { FieldRenderProps } from '../../../types/plugins'

/** Color mapping for status values */
const statusColors: Record<string, string> = {
  // Green — success/active
  active: 'bg-green-500', success: 'bg-green-500', published: 'bg-green-500',
  verified: 'bg-green-500', approved: 'bg-green-500', enabled: 'bg-green-500',
  completed: 'bg-green-500', complete: 'bg-green-500', paid: 'bg-green-500',
  delivered: 'bg-green-500', open: 'bg-green-500', live: 'bg-green-500',
  available: 'bg-green-500', done: 'bg-green-500',
  // Yellow — pending/warning
  pending: 'bg-yellow-500', processing: 'bg-yellow-500', review: 'bg-yellow-500',
  scheduled: 'bg-yellow-500', syncing: 'bg-yellow-500', draft: 'bg-yellow-500',
  paused: 'bg-yellow-500', waiting: 'bg-yellow-500',
  // Red — error/blocked
  error: 'bg-red-500', failed: 'bg-red-500', deleted: 'bg-red-500',
  banned: 'bg-red-500', rejected: 'bg-red-500', cancelled: 'bg-red-500',
  canceled: 'bg-red-500', expired: 'bg-red-500', denied: 'bg-red-500',
  blocked: 'bg-red-500',
  // Gray — inactive/disabled
  inactive: 'bg-gray-400', disabled: 'bg-gray-400', closed: 'bg-gray-400',
  suspended: 'bg-gray-400',
}

/** Small colored dot + text — compact status indicator */
export function DotIndicator({ value }: FieldRenderProps) {
  const str = String(value ?? '')
  const normalized = str.toLowerCase().trim()
  const dotColor = statusColors[normalized] || 'bg-gray-400'

  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`w-2 h-2 rounded-full shrink-0 ${dotColor}`} />
      <span className="text-sm">{str}</span>
    </span>
  )
}
