import { useState } from 'react'
import type { KeyboardEvent } from 'react'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'

interface TagInputProps {
  value: string[]
  onChange: (tags: string[]) => void
  maxItems?: number
  placeholder?: string
}

export function TagInput({
  value,
  onChange,
  maxItems,
  placeholder = 'Type and press Enter or comma',
}: TagInputProps) {
  const [inputValue, setInputValue] = useState('')
  const [error, setError] = useState<string | null>(null)

  const addTag = (tag: string) => {
    const trimmed = tag.trim()
    if (!trimmed) return

    // Check for duplicate (case-insensitive per pitfall #6)
    if (value.map(t => t.toLowerCase()).includes(trimmed.toLowerCase())) {
      setError('Duplicate tag')
      setTimeout(() => setError(null), 2000)
      return
    }

    // Check maxItems
    if (maxItems && value.length >= maxItems) {
      setError(`Maximum ${maxItems} tags allowed`)
      setTimeout(() => setError(null), 2000)
      return
    }

    onChange([...value, trimmed])
    setInputValue('')
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addTag(inputValue)
    }
    // Allow backspace to remove last tag when input is empty
    if (e.key === 'Backspace' && inputValue === '' && value.length > 0) {
      e.preventDefault()
      onChange(value.slice(0, -1))
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    // If comma typed, add tag instead of including comma in value
    if (newValue.includes(',')) {
      const parts = newValue.split(',')
      const toAdd = parts[0] ?? ''
      addTag(toAdd)
      // Set remaining text (after comma) as new input value
      setInputValue(parts.slice(1).join(','))
    } else {
      setInputValue(newValue)
    }
  }

  const removeTag = (index: number) => {
    onChange(value.filter((_, i) => i !== index))
  }

  return (
    <div>
      {/* Tags display */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {value.map((tag, index) => (
            <Badge key={index} variant="secondary" className="gap-1">
              {tag}
              <button
                type="button"
                onClick={() => removeTag(index)}
                className="ml-0.5 rounded-full hover:bg-gray-300 p-0.5"
                aria-label={`Remove ${tag}`}
              >
                <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Input field */}
      <Input
        value={inputValue}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={error ? 'border-red-500' : ''}
      />

      {/* Error message */}
      {error && (
        <p className="text-sm text-red-500 mt-1 animate-pulse">{error}</p>
      )}

      {/* Hint */}
      <p className="text-xs text-gray-500 mt-1">
        Press Enter or comma to add
        {maxItems && ` (max ${maxItems})`}
      </p>
    </div>
  )
}
