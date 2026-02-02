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

  const handleBlur = () => {
    commitEdit()
  }

  // View mode or not editing: render as plain text
  if (!isConfigureMode || !isEditing) {
    return (
      <span className="inline-flex flex-col gap-0.5">
        <span
          className={`${isConfigureMode ? 'cursor-pointer hover:text-blue-600 group' : ''}`}
          onClick={handleClick}
        >
          {value}
          {isConfigureMode && (
            <svg
              className="inline-block w-3 h-3 ml-1 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
              />
            </svg>
          )}
        </span>
        {hasCustomLabel && (
          <span className="text-xs text-gray-400">
            (was: {originalName})
          </span>
        )}
      </span>
    )
  }

  // Edit mode: contentEditable
  return (
    <div
      ref={editableRef}
      contentEditable
      suppressContentEditableWarning
      role="textbox"
      aria-label={`Edit label for ${fieldPath}`}
      aria-multiline="false"
      className="inline-block px-2 py-1 border-2 border-blue-500 rounded bg-white focus:outline-none focus:ring-2 focus:ring-blue-300"
      onInput={handleInput}
      onKeyDown={handleKeyDown}
      onBlur={handleBlur}
    >
      {draftValue}
    </div>
  )
}
