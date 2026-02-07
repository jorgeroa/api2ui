import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useConfigStore } from '../../store/configStore'

interface DraggableFieldProps {
  id: string
  children: React.ReactNode
  disabled?: boolean
}

/** Grip icon - 6 dots in 2 columns */
function GripIcon() {
  return (
    <svg
      className="w-4 h-4 text-gray-400 hover:text-gray-600"
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

export function DraggableField({ id, children, disabled }: DraggableFieldProps) {
  const { mode } = useConfigStore()
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

  // Only show drag handle in Configure mode
  const isConfigureMode = mode === 'configure'

  return (
    <div ref={setNodeRef} style={style} className="relative">
      {isConfigureMode && !disabled && (
        <button
          {...attributes}
          {...listeners}
          className="absolute left-0 top-1/2 -translate-y-1/2 -ml-4 cursor-grab active:cursor-grabbing focus:outline-none focus:ring-2 focus:ring-blue-500 rounded p-0.5"
          aria-label="Drag to reorder"
        >
          <GripIcon />
        </button>
      )}
      {children}
    </div>
  )
}

/** Presentational component for drag overlay - no hooks, just visual */
export function FieldPreview({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-white border-2 border-blue-500 rounded shadow-lg opacity-90">
      {children}
    </div>
  )
}
