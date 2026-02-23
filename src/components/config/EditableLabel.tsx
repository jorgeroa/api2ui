import { useState, useRef, useEffect } from 'react'
import { useConfigStore } from '../../store/configStore'

interface EditableLabelProps {
  value: string
  originalName: string
  fieldPath: string
  onChange: (newLabel: string) => void
}

export function EditableLabel({
  value,
  originalName,
  fieldPath,
  onChange,
}: EditableLabelProps) {
  const { mode } = useConfigStore()
  const [isEditing, setIsEditing] = useState(false)
  const [draftValue, setDraftValue] = useState(value)
  const editableRef = useRef<HTMLDivElement>(null)

  const isConfigureMode = mode === 'configure'
  const hasCustomLabel = value !== originalName

  // Reset draft when value changes externally
  useEffect(() => {
    setDraftValue(value)
  }, [value])

  // Focus on enter edit mode
  useEffect(() => {
    if (isEditing && editableRef.current) {
      editableRef.current.focus()
      // Select all text
      const range = document.createRange()
      range.selectNodeContents(editableRef.current)
      const selection = window.getSelection()
      selection?.removeAllRanges()
      selection?.addRange(range)
    }
  }, [isEditing])

  const handleClick = () => {
    if (isConfigureMode && !isEditing) {
      setIsEditing(true)
    }
  }

  const commitEdit = () => {
    if (isEditing) {
      const trimmed = draftValue.trim()
      if (trimmed && trimmed !== value) {
        onChange(trimmed)
      }
      setIsEditing(false)
    }
  }

  const cancelEdit = () => {
    setDraftValue(value)
    setIsEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      commitEdit()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      cancelEdit()
    }
  }

  const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
    setDraftValue(e.currentTarget.textContent || '')
  }

  // View mode or not editing: render as plain text (click to edit in configure mode)
  if (!isConfigureMode || !isEditing) {
    return (
      <span className="inline-flex flex-col gap-0.5">
        <span
          className={`${isConfigureMode ? 'cursor-text hover:text-primary hover:underline hover:decoration-dotted' : ''}`}
          onClick={handleClick}
          title={isConfigureMode ? 'Click to edit' : undefined}
        >
          {value}
        </span>
        {hasCustomLabel && (
          <span className="text-xs text-muted-foreground">
            (was: {originalName})
          </span>
        )}
      </span>
    )
  }

  // Edit mode: contentEditable with accept/cancel buttons
  return (
    <span className="inline-flex items-center gap-1">
      <div
        ref={editableRef}
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-label={`Edit label for ${fieldPath}`}
        aria-multiline="false"
        className="inline-block px-2 py-1 border-2 border-primary rounded bg-background focus:outline-none focus:ring-2 focus-visible:ring-ring/50 min-w-15"
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        onBlur={(e) => {
          // Don't commit on blur if clicking the cancel button
          if (e.relatedTarget?.closest('[data-cancel-edit]')) {
            return
          }
          commitEdit()
        }}
      >
        {draftValue}
      </div>
      {/* Accept button */}
      <button
        type="button"
        onClick={commitEdit}
        className="p-1 text-green-600 hover:text-green-700 hover:bg-green-50 rounded transition-colors"
        title="Save (Enter)"
        aria-label="Save changes"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </button>
      {/* Cancel button */}
      <button
        type="button"
        data-cancel-edit
        onClick={cancelEdit}
        className="p-1 text-red-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
        title="Cancel (Escape)"
        aria-label="Cancel changes"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </span>
  )
}
