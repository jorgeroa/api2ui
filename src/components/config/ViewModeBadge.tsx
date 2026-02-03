import { useState, useEffect, useRef, useCallback } from 'react'

interface ViewModeBadgeProps {
  currentType: string
  availableTypes: string[]
  onSelect: (type: string) => void
}

const AUTO_CONFIRM_DELAY = 2000

/**
 * ViewModeBadge displays a pill showing the current component type.
 * Clicking cycles through available alternatives with auto-confirm after ~2s.
 * Appears dimmed/disabled when no alternatives exist.
 */
export function ViewModeBadge({
  currentType,
  availableTypes,
  onSelect,
}: ViewModeBadgeProps) {
  const [tempSelection, setTempSelection] = useState(currentType)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const hasAlternatives = availableTypes.length > 1

  // Sync tempSelection when currentType changes externally
  useEffect(() => {
    setTempSelection(currentType)
  }, [currentType])

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current)
      }
    }
  }, [])

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()

      if (!hasAlternatives) return

      const currentIndex = availableTypes.indexOf(tempSelection)
      const nextIndex = (currentIndex + 1) % availableTypes.length
      const nextType = availableTypes[nextIndex]!
      setTempSelection(nextType)

      // Reset/start auto-confirm timer
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current)
      }
      timerRef.current = setTimeout(() => {
        onSelect(nextType)
        timerRef.current = null
      }, AUTO_CONFIRM_DELAY)
    },
    [hasAlternatives, availableTypes, tempSelection, onSelect]
  )

  const isPending = tempSelection !== currentType
  const displayName = tempSelection.charAt(0).toUpperCase() + tempSelection.slice(1)

  return (
    <span
      role="button"
      tabIndex={hasAlternatives ? 0 : undefined}
      onClick={handleClick}
      className={`absolute top-2 right-2 z-10 bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-medium transition-all select-none ${
        hasAlternatives
          ? 'hover:bg-blue-200 cursor-pointer'
          : 'opacity-50 cursor-not-allowed'
      }${isPending ? ' ring-2 ring-blue-300 animate-pulse' : ''}`}
    >
      {displayName}{hasAlternatives ? ' \u25BE' : ''}
    </span>
  )
}
