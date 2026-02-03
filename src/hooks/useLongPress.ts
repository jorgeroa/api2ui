import { useRef, useCallback } from 'react'

interface LongPressHandlers {
  onTouchStart: (e: React.TouchEvent) => void
  onTouchEnd: () => void
  onTouchMove: () => void
}

/**
 * Custom hook for mobile long-press detection.
 * Returns touch event handlers that trigger a callback after a sustained press.
 * Cancels on move (to avoid conflict with scrolling) or lift.
 */
export function useLongPress(
  callback: (e: React.TouchEvent) => void,
  duration: number = 800
): LongPressHandlers {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const eventRef = useRef<React.TouchEvent | null>(null)

  const clear = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    eventRef.current = null
  }, [])

  const onTouchStart = useCallback(
    (e: React.TouchEvent) => {
      eventRef.current = e
      timerRef.current = setTimeout(() => {
        if (eventRef.current) {
          callback(eventRef.current)
        }
        timerRef.current = null
      }, duration)
    },
    [callback, duration]
  )

  const onTouchEnd = useCallback(() => {
    clear()
  }, [clear])

  const onTouchMove = useCallback(() => {
    clear()
  }, [clear])

  return { onTouchStart, onTouchEnd, onTouchMove }
}
