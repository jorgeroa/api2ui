interface FormattedDateProps {
  value: string | number | Date
}

export function FormattedDate({ value }: FormattedDateProps) {
  // Parse value to Date
  let date: Date
  if (value instanceof Date) {
    date = value
  } else if (typeof value === 'string') {
    date = new Date(value)
  } else if (typeof value === 'number') {
    date = new Date(value)
  } else {
    date = new Date(NaN)
  }

  // Check if date is valid
  if (isNaN(date.getTime())) {
    return <span className="text-muted-foreground italic">Invalid date</span>
  }

  // Detect time presence - check if original value is string with 'T' separator
  const hasTime = typeof value === 'string' && value.includes('T')

  // Base formatting options - always show year per user decision
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }

  // Add time if present
  if (hasTime) {
    options.hour = '2-digit'
    options.minute = '2-digit'
  }

  // Format with Intl.DateTimeFormat
  const formatted = new Intl.DateTimeFormat(navigator.language, options).format(date)

  // Generate title - use original string if available, otherwise ISO string
  const title = typeof value === 'string' ? value : date.toISOString()

  return <span title={title}>{formatted}</span>
}
