import type { ReactNode } from 'react'
import { useConfigStore } from '../../store/configStore'
import { EditableLabel } from './EditableLabel'

interface FieldControlsProps {
  fieldPath: string
  fieldName: string
  isVisible: boolean
  customLabel: string | undefined
  children: ReactNode
}

export function FieldControls({
  fieldPath,
  fieldName,
  isVisible,
  customLabel,
  children,
}: FieldControlsProps) {
  const { mode, toggleFieldVisibility, setFieldLabel } = useConfigStore()

  const isConfigureMode = mode === 'configure'

  // View mode: render children only
  if (!isConfigureMode) {
    return <>{children}</>
  }

  // Configure mode: render children + overlay controls
  const handleToggleVisibility = () => {
    toggleFieldVisibility(fieldPath)
  }

  const handleLabelChange = (newLabel: string) => {
    setFieldLabel(fieldPath, newLabel)
  }

  // Format the display label
  const displayLabel = customLabel || fieldName

  return (
    <div className="relative group">
      {/* Content with conditional dimming */}
      <div className={isVisible ? '' : 'opacity-50'}>
        {children}
      </div>

      {/* Overlay controls on hover */}
      <div className="absolute top-0 right-0 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 px-2 py-1 rounded shadow-md">
        {/* Eye icon toggle */}
        <button
          onClick={handleToggleVisibility}
          className="text-gray-600 hover:text-blue-600 transition-colors"
          aria-label={isVisible ? 'Hide field' : 'Show field'}
          title={isVisible ? 'Hide field' : 'Show field'}
        >
          {isVisible ? (
            // Open eye icon
            <svg
              className="w-5 h-5"
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
              className="w-5 h-5"
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

        {/* Hidden badge */}
        {!isVisible && (
          <span className="text-xs font-medium text-red-600 bg-red-100 px-2 py-0.5 rounded">
            Hidden
          </span>
        )}
      </div>

      {/* Editable label overlay (shown below controls) */}
      <div className="absolute top-full left-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white px-2 py-1 rounded shadow-md text-sm">
        <EditableLabel
          value={displayLabel}
          originalName={fieldName}
          fieldPath={fieldPath}
          onChange={handleLabelChange}
        />
      </div>
    </div>
  )
}
