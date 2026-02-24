import { useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useConfigStore } from '../../store/configStore'

interface DraggableFieldProps {
  id: string
  children: React.ReactNode
  disabled?: boolean
  /** Field path for visibility toggle */
  fieldPath?: string
  /** Current visibility state */
  isVisible?: boolean
  /** True for nested/collapsible content (Disclosure) - affects icon alignment */
  nested?: boolean
}

/** Grip icon - 6 dots in 2 columns */
function GripIcon() {
  return (
    <svg
      className="w-4 h-4"
      fill="currentColor"
      viewBox="0 0 16 16"
    >
      <circle cx="4" cy="3" r="1.5" />
      <circle cx="4" cy="8" r="1.5" />
      <circle cx="4" cy="13" r="1.5" />
      <circle cx="12" cy="3" r="1.5" />
      <circle cx="12" cy="8" r="1.5" />
      <circle cx="12" cy="13" r="1.5" />
    </svg>
  )
}

/** Eye icon for visibility */
function EyeIcon({ visible }: { visible: boolean }) {
  if (visible) {
    return (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
      </svg>
    )
  }
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
  )
}

export function DraggableField({ id, children, disabled, fieldPath, isVisible = true, nested = false }: DraggableFieldProps) {
  const [isHovered, setIsHovered] = useState(false)
  const { mode, toggleFieldVisibility } = useConfigStore()
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const isConfigureMode = mode === 'configure'

  // View mode: simple wrapper
  if (!isConfigureMode) {
    return <div ref={setNodeRef} style={style}>{children}</div>
  }

  const handleToggleVisibility = () => {
    if (fieldPath) {
      toggleFieldVisibility(fieldPath)
    }
  }

  // Configure mode: inline flex with controls
  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-start gap-1"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Control buttons - show/hide based on JS hover state */}
      {/* pt-1 aligns icons with text that has py-1 padding in primitive fields */}
      {/* nested content (Disclosure) already uses flex items-center, no padding needed */}
      <div
        data-drag-controls
        className={`flex items-center gap-0.5 shrink-0 transition-opacity ${
          nested ? '' : 'pt-1.5'
        } ${isHovered ? 'opacity-100' : 'opacity-0'}`}
      >
        {/* Drag handle */}
        {!disabled && (
          <button
            {...attributes}
            {...listeners}
            className="p-0.5 text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing rounded hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring"
            aria-label="Drag to reorder"
          >
            <GripIcon />
          </button>
        )}
        {/* Visibility toggle */}
        {fieldPath && (
          <button
            onClick={handleToggleVisibility}
            className={`p-0.5 rounded hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring ${
              isVisible ? 'text-muted-foreground hover:text-primary' : 'text-red-400 hover:text-red-600'
            }`}
            aria-label={isVisible ? 'Hide field' : 'Show field'}
            title={isVisible ? 'Hide field' : 'Show field'}
          >
            <EyeIcon visible={isVisible} />
          </button>
        )}
      </div>
      {/* Content with conditional dimming when hidden */}
      <div className={`flex-1 min-w-0 ${isVisible ? '' : 'opacity-50'}`}>
        {children}
      </div>
    </div>
  )
}

/** Presentational component for drag overlay - no hooks, just visual */
export function FieldPreview({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-background border-2 border-primary rounded shadow-lg opacity-90">
      {children}
    </div>
  )
}
