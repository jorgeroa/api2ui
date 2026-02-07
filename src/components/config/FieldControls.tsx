import type { ReactNode } from 'react'
import { useConfigStore } from '../../store/configStore'

interface FieldControlsProps {
  fieldPath: string
  fieldName?: string // Kept for backward compatibility
  isVisible: boolean
  customLabel?: string // Kept for backward compatibility
  children: ReactNode
}

export function FieldControls({
  fieldPath,
  isVisible,
  children,
}: FieldControlsProps) {
  const { mode, toggleFieldVisibility } = useConfigStore()

  const isConfigureMode = mode === 'configure'

  // View mode: render children only
  if (!isConfigureMode) {
    return <>{children}</>
  }

  // Configure mode: render children + controls
  const handleToggleVisibility = () => {
    toggleFieldVisibility(fieldPath)
  }

  return (
    <div className="group relative">
      {/* Eye icon positioned absolutely - doesn't affect content layout */}
      <button
        onClick={handleToggleVisibility}
        className="absolute -left-8 top-0.5 w-4 h-4 text-gray-400 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-all"
        aria-label={isVisible ? 'Hide field' : 'Show field'}
        title={isVisible ? 'Hide field' : 'Show field'}
      >
        {isVisible ? (
          // Open eye icon
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
            />
          </svg>
        ) : (
          // Crossed-out eye icon
          <svg
            className="w-4 h-4 text-red-400"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
            />
          </svg>
        )}
      </button>

      {/* Content with conditional dimming and strikethrough when hidden */}
      <div className={isVisible ? '' : 'opacity-50 line-through decoration-red-300'}>
        {children}
      </div>
    </div>
  )
}
