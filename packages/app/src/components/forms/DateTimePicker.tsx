import { useState } from 'react'
import { format } from 'date-fns'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface DateTimePickerProps {
  value: string  // ISO date string or empty
  onChange: (value: string) => void
  includeTime?: boolean  // Show time input when true
  placeholder?: string
  required?: boolean
}

export function DateTimePicker({
  value,
  onChange,
  includeTime = false,
  placeholder = 'Pick a date',
  required = false,
}: DateTimePickerProps) {
  // Parse value to Date object
  const date = value ? new Date(value) : undefined
  const [open, setOpen] = useState(false)

  const handleDateSelect = (selectedDate: Date | undefined) => {
    if (!selectedDate) {
      onChange('')
      return
    }

    if (includeTime && date) {
      // Preserve existing time when changing date
      selectedDate.setHours(date.getHours())
      selectedDate.setMinutes(date.getMinutes())
    }

    // Format as ISO string
    onChange(selectedDate.toISOString())
    if (!includeTime) {
      setOpen(false)
    }
  }

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!date) {
      // Create new date with selected time
      const now = new Date()
      const [hours, minutes] = e.target.value.split(':').map(Number)
      now.setHours(hours ?? 0, minutes ?? 0, 0, 0)
      onChange(now.toISOString())
      return
    }

    const [hours, minutes] = e.target.value.split(':').map(Number)
    const newDate = new Date(date)
    newDate.setHours(hours ?? 0, minutes ?? 0)
    onChange(newDate.toISOString())
  }

  // Format time for input value
  const timeValue = date
    ? `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
    : ''

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              'w-full justify-start text-left font-normal',
              !date && 'text-muted-foreground'
            )}
          >
            <svg
              className="mr-2 h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            {date ? format(date, includeTime ? 'PPP p' : 'PPP') : placeholder}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={date}
            onSelect={handleDateSelect}
            initialFocus
          />
        </PopoverContent>
      </Popover>

      {includeTime && (
        <input
          type="time"
          value={timeValue}
          onChange={handleTimeChange}
          required={required}
          className="w-full px-3 py-2 border border-input rounded-md focus:ring-2 focus-visible:ring-ring/50 focus:border-input"
        />
      )}
    </div>
  )
}
