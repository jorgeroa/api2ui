import { Badge } from '@/components/ui/badge'
import { Check, X } from 'lucide-react'

interface StatusBadgeProps {
  value: string | boolean
}

export function StatusBadge({ value }: StatusBadgeProps) {
  // Handle boolean values
  if (typeof value === 'boolean') {
    return value ? (
      <Badge variant="success">
        <Check className="size-3" />
        True
      </Badge>
    ) : (
      <Badge variant="secondary">
        <X className="size-3" />
        False
      </Badge>
    )
  }

  // Handle string values
  const normalized = value.toLowerCase().trim()

  // Determine variant based on status pattern
  let variant: 'success' | 'destructive' | 'warning' | 'secondary' = 'secondary'

  // Success states
  if (/^(active|success|published|verified|approved|complete|completed|enabled|paid|delivered|open|live|available|done)$/i.test(normalized)) {
    variant = 'success'
  }
  // Error/failure states
  else if (/^(error|failed|deleted|banned|rejected|cancelled|canceled|inactive|disabled|closed|expired|denied|blocked)$/i.test(normalized)) {
    variant = 'destructive'
  }
  // In-progress/pending states
  else if (/^(pending|processing|review|in.?review|scheduled|syncing|indexing|draft|paused|waiting|suspended|on.?hold)$/i.test(normalized)) {
    variant = 'warning'
  }

  return <Badge variant={variant}>{value}</Badge>
}
